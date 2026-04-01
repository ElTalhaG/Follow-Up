import { createHmac, randomBytes } from "node:crypto";
import { prisma } from "../database/prisma.js";
import { AuthError } from "../auth/service.js";

type GmailTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  id_token?: string;
};

type GmailProfile = {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
};

type GmailHeader = {
  name: string;
  value: string;
};

type GmailMessagePayload = {
  headers?: GmailHeader[];
};

type GmailMessage = {
  id: string;
  threadId: string;
  internalDate?: string;
  snippet?: string;
  labelIds?: string[];
  payload?: GmailMessagePayload;
};

type GmailThread = {
  id: string;
  messages?: GmailMessage[];
};

type SyncResult = {
  accountId: string;
  emailAddress: string;
  syncedThreads: number;
  syncedMessages: number;
};

type GmailAccountRecord = {
  id: string;
  userId: string;
  provider: string;
  providerAccountId: string;
  emailAddress: string | null;
  accessScope: string;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
  connectedAt: Date;
  lastSyncedAt: Date | null;
};

const GMAIL_SCOPE =
  "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email";

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new AuthError(`${name} is not configured.`, 500);
  }

  return value;
}

function getOptionalEnv(name: string) {
  return process.env[name]?.trim();
}

function isMockModeEnabled() {
  return getOptionalEnv("GMAIL_MOCK_MODE") === "true";
}

function getGmailConfig() {
  return {
    clientId: getRequiredEnv("GMAIL_CLIENT_ID"),
    clientSecret: getRequiredEnv("GMAIL_CLIENT_SECRET"),
  };
}

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decodeBase64Url<T>(value: string) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
}

function sign(value: string) {
  const secret = getRequiredEnv("AUTH_SECRET");
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function createState(userId: string, redirectUri: string) {
  const payload = {
    userId,
    redirectUri,
    nonce: randomBytes(8).toString("hex"),
    exp: Date.now() + 1000 * 60 * 10,
  };

  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function verifyState(state: string, redirectUri: string) {
  const [encodedPayload, signature] = state.split(".");

  if (!encodedPayload || !signature) {
    throw new AuthError("OAuth state is invalid.", 400);
  }

  const expectedSignature = sign(encodedPayload);

  if (signature !== expectedSignature) {
    throw new AuthError("OAuth state signature is invalid.", 400);
  }

  const payload = decodeBase64Url<{
    userId: string;
    redirectUri: string;
    exp: number;
  }>(encodedPayload);

  if (payload.exp < Date.now()) {
    throw new AuthError("OAuth state has expired.", 400);
  }

  if (payload.redirectUri !== redirectUri) {
    throw new AuthError("OAuth redirect URI mismatch.", 400);
  }

  return payload;
}

function getHeaderValue(message: GmailMessage, headerName: string) {
  return (
    message.payload?.headers?.find(
      (header) => header.name.toLowerCase() === headerName.toLowerCase(),
    )?.value ?? null
  );
}

function parseEmailAddress(fromHeader: string | null) {
  if (!fromHeader) {
    return null;
  }

  const match = fromHeader.match(/<([^>]+)>/);

  return (match?.[1] ?? fromHeader).trim().toLowerCase();
}

function parseContactName(fromHeader: string | null) {
  if (!fromHeader) {
    return null;
  }

  const name = fromHeader.replace(/<[^>]+>/, "").replace(/"/g, "").trim();

  return name || null;
}

function getDirection(message: GmailMessage, accountEmailAddress: string) {
  const fromHeader = parseEmailAddress(getHeaderValue(message, "From"));

  return fromHeader === accountEmailAddress.toLowerCase() ? "OUTBOUND" : "INBOUND";
}

function getConversationStatus(lastInboundAt: Date | null, lastOutboundAt: Date | null) {
  if (lastInboundAt && (!lastOutboundAt || lastInboundAt > lastOutboundAt)) {
    return "OVERDUE" as const;
  }

  if (lastOutboundAt) {
    return "WAITING" as const;
  }

  return "NEW" as const;
}

async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const { clientId, clientSecret } = getGmailConfig();

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new AuthError("Failed to exchange Gmail authorization code.", 502);
  }

  return (await response.json()) as GmailTokenResponse;
}

async function refreshAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = getGmailConfig();

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new AuthError("Failed to refresh Gmail access token.", 502);
  }

  return (await response.json()) as GmailTokenResponse;
}

async function gmailRequest<T>(path: string, accessToken: string) {
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new AuthError(`Gmail request failed for ${path}.`, 502);
  }

  return (await response.json()) as T;
}

async function fetchProfile(accessToken: string) {
  return gmailRequest<GmailProfile>("/users/me/profile", accessToken);
}

async function fetchRecentThreads(accessToken: string, maxResults = 10) {
  const listResponse = await gmailRequest<{ threads?: Array<{ id: string }> }>(
    `/users/me/threads?maxResults=${maxResults}`,
    accessToken,
  );

  const threads = listResponse.threads ?? [];

  return Promise.all(
    threads.map((thread) =>
      gmailRequest<GmailThread>(
        `/users/me/threads/${thread.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        accessToken,
      ),
    ),
  );
}

function buildMockThreads() {
  return [
    {
      id: "mock_thread_1",
      messages: [
        {
          id: "mock_msg_1",
          threadId: "mock_thread_1",
          internalDate: String(Date.parse("2026-03-31T08:00:00.000Z")),
          snippet:
            "Hi, I saw your portfolio and wanted to ask if you have room for a landing page redesign next week.",
          payload: {
            headers: [
              { name: "From", value: "Jordan Lake <jordan@example.com>" },
              { name: "Subject", value: "Landing page redesign inquiry" },
              { name: "Date", value: "Tue, 31 Mar 2026 08:00:00 +0000" },
            ],
          },
        },
      ],
    },
    {
      id: "mock_thread_2",
      messages: [
        {
          id: "mock_msg_2",
          threadId: "mock_thread_2",
          internalDate: String(Date.parse("2026-03-29T11:00:00.000Z")),
          snippet: "Can you share retainer pricing for ongoing ad creative?",
          payload: {
            headers: [
              { name: "From", value: "Studio Finch <team@studiofinch.example>" },
              { name: "Subject", value: "Monthly retainer pricing" },
              { name: "Date", value: "Sun, 29 Mar 2026 11:00:00 +0000" },
            ],
          },
        },
        {
          id: "mock_msg_3",
          threadId: "mock_thread_2",
          internalDate: String(Date.parse("2026-03-29T12:00:00.000Z")),
          snippet: "Absolutely. I can send over two lightweight retainer options today.",
          payload: {
            headers: [
              { name: "From", value: "Alex Mercer <freelancer@example.com>" },
              { name: "Subject", value: "Re: Monthly retainer pricing" },
              { name: "Date", value: "Sun, 29 Mar 2026 12:00:00 +0000" },
            ],
          },
        },
      ],
    },
  ] satisfies GmailThread[];
}

export function getGmailConnectUrl(userId: string, redirectUri: string) {
  if (isMockModeEnabled()) {
    return {
      url: `mock-gmail://oauth?state=${createState(userId, redirectUri)}`,
      state: createState(userId, redirectUri),
      mode: "mock" as const,
    };
  }

  const { clientId } = getGmailConfig();
  const state = createState(userId, redirectUri);
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GMAIL_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);

  return {
    url: url.toString(),
    state,
    mode: "live" as const,
  };
}

export async function connectGmailAccount(
  userId: string,
  code: string,
  state: string,
  redirectUri: string,
) {
  verifyState(state, redirectUri);
  const accountDelegate = prisma.account as any;

  if (isMockModeEnabled()) {
    const account = (await accountDelegate.upsert({
      where: {
        provider_providerAccountId: {
          provider: "gmail",
          providerAccountId: "mock_gmail_account",
        },
      },
      update: {
        userId,
        emailAddress: "freelancer@example.com",
        accessScope: GMAIL_SCOPE,
        accessToken: "mock_access_token",
        refreshToken: "mock_refresh_token",
        tokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
        connectedAt: new Date(),
      },
      create: {
        userId,
        provider: "gmail",
        providerAccountId: "mock_gmail_account",
        emailAddress: "freelancer@example.com",
        accessScope: GMAIL_SCOPE,
        accessToken: "mock_access_token",
        refreshToken: "mock_refresh_token",
        tokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    })) as GmailAccountRecord;

    return {
      accountId: account.id,
      emailAddress: account.emailAddress,
      mode: "mock" as const,
    };
  }

  const tokenResponse = await exchangeCodeForTokens(code, redirectUri);
  const profile = await fetchProfile(tokenResponse.access_token);
  const account = (await accountDelegate.upsert({
    where: {
      provider_providerAccountId: {
        provider: "gmail",
        providerAccountId: profile.emailAddress.toLowerCase(),
      },
    },
    update: {
      userId,
      emailAddress: profile.emailAddress.toLowerCase(),
      accessScope: tokenResponse.scope ?? GMAIL_SCOPE,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      tokenExpiresAt: tokenResponse.expires_in
        ? new Date(Date.now() + tokenResponse.expires_in * 1000)
        : null,
      connectedAt: new Date(),
    },
    create: {
      userId,
      provider: "gmail",
      providerAccountId: profile.emailAddress.toLowerCase(),
      emailAddress: profile.emailAddress.toLowerCase(),
      accessScope: tokenResponse.scope ?? GMAIL_SCOPE,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      tokenExpiresAt: tokenResponse.expires_in
        ? new Date(Date.now() + tokenResponse.expires_in * 1000)
        : null,
    },
  })) as GmailAccountRecord;

  return {
    accountId: account.id,
    emailAddress: account.emailAddress,
    mode: "live" as const,
  };
}

async function ensureValidAccessToken(accountId: string) {
  const accountDelegate = prisma.account as any;
  const account = (await accountDelegate.findUnique({
    where: { id: accountId },
  })) as GmailAccountRecord | null;

  if (!account || account.provider !== "gmail") {
    throw new AuthError("Gmail account not found.", 404);
  }

  if (isMockModeEnabled()) {
    return {
      account,
      accessToken: "mock_access_token",
    };
  }

  if (account.accessToken && account.tokenExpiresAt && account.tokenExpiresAt > new Date()) {
    return {
      account,
      accessToken: account.accessToken,
    };
  }

  if (!account.refreshToken) {
    throw new AuthError("Gmail refresh token is missing.", 400);
  }

  const refreshedToken = await refreshAccessToken(account.refreshToken);
  const updatedAccount = (await accountDelegate.update({
    where: { id: account.id },
    data: {
      accessToken: refreshedToken.access_token,
      tokenExpiresAt: refreshedToken.expires_in
        ? new Date(Date.now() + refreshedToken.expires_in * 1000)
        : account.tokenExpiresAt,
    },
  })) as GmailAccountRecord;

  return {
    account: updatedAccount,
    accessToken: refreshedToken.access_token,
  };
}

export async function listGmailAccounts(userId: string) {
  const accountDelegate = prisma.account as any;
  const accounts = (await accountDelegate.findMany({
    where: {
      userId,
      provider: "gmail",
    },
    orderBy: {
      connectedAt: "desc",
    },
  })) as GmailAccountRecord[];

  return accounts.map((account) => ({
    id: account.id,
    emailAddress: account.emailAddress,
    accessScope: account.accessScope,
    lastSyncedAt: account.lastSyncedAt,
  }));
}

export async function syncGmailAccount(userId: string, accountId: string, maxResults = 10) {
  const { account, accessToken } = await ensureValidAccessToken(accountId);

  if (account.userId !== userId) {
    throw new AuthError("You do not have access to that Gmail account.", 403);
  }

  const emailAddress = account.emailAddress ?? "freelancer@example.com";
  const threads = isMockModeEnabled()
    ? buildMockThreads()
    : await fetchRecentThreads(accessToken, maxResults);

  let syncedMessages = 0;

  for (const thread of threads) {
    const messages = [...(thread.messages ?? [])].sort((left, right) => {
      const leftDate = Number(left.internalDate ?? 0);
      const rightDate = Number(right.internalDate ?? 0);
      return leftDate - rightDate;
    });

    if (messages.length === 0) {
      continue;
    }

    const firstMessage = messages[0];
    const lastMessage = messages[messages.length - 1];
    const inboundMessages = messages.filter(
      (message) => getDirection(message, emailAddress) === "INBOUND",
    );
    const outboundMessages = messages.filter(
      (message) => getDirection(message, emailAddress) === "OUTBOUND",
    );
    const contactEmail =
      parseEmailAddress(getHeaderValue(firstMessage, "From")) ?? "unknown@example.com";
    const contactName = parseContactName(getHeaderValue(firstMessage, "From"));
    const subject = getHeaderValue(firstMessage, "Subject") ?? "No subject";
    const lastInboundAt = inboundMessages.length
      ? new Date(Number(inboundMessages[inboundMessages.length - 1].internalDate))
      : null;
    const lastOutboundAt = outboundMessages.length
      ? new Date(Number(outboundMessages[outboundMessages.length - 1].internalDate))
      : null;

    const conversation = await prisma.conversation.upsert({
      where: {
        accountId_externalThreadId: {
          accountId: account.id,
          externalThreadId: thread.id,
        },
      },
      update: {
        subject,
        contactName,
        contactEmail,
        status: getConversationStatus(lastInboundAt, lastOutboundAt),
        lastMessageAt: new Date(Number(lastMessage.internalDate)),
        lastInboundAt,
        lastOutboundAt,
        updatedAt: new Date(),
      },
      create: {
        accountId: account.id,
        externalThreadId: thread.id,
        subject,
        contactName,
        contactEmail,
        status: getConversationStatus(lastInboundAt, lastOutboundAt),
        lastMessageAt: new Date(Number(lastMessage.internalDate)),
        lastInboundAt,
        lastOutboundAt,
      },
    });

    for (const message of messages) {
      await prisma.message.upsert({
        where: {
          externalMessageId: message.id,
        },
        update: {
          conversationId: conversation.id,
          direction: getDirection(message, emailAddress),
          senderEmail:
            parseEmailAddress(getHeaderValue(message, "From")) ?? "unknown@example.com",
          bodyExcerpt: message.snippet ?? "",
          sentAt: new Date(Number(message.internalDate)),
        },
        create: {
          conversationId: conversation.id,
          externalMessageId: message.id,
          direction: getDirection(message, emailAddress),
          senderEmail:
            parseEmailAddress(getHeaderValue(message, "From")) ?? "unknown@example.com",
          bodyExcerpt: message.snippet ?? "",
          sentAt: new Date(Number(message.internalDate)),
        },
      });

      syncedMessages += 1;
    }
  }

  await prisma.account.update({
    where: { id: account.id },
    data: {
      lastSyncedAt: new Date(),
    },
  });

  return {
    accountId: account.id,
    emailAddress,
    syncedThreads: threads.length,
    syncedMessages,
  } satisfies SyncResult;
}
