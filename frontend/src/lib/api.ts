const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.toString() ?? "http://localhost:4000/api";

export type AuthResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
};

export type GmailAccount = {
  id: string;
  emailAddress: string | null;
  accessScope: string;
  lastSyncedAt: string | null;
};

export type FollowUpItem = {
  id: string;
  conversationId: string;
  subject: string;
  contactName: string | null;
  contactEmail: string;
  status: "new" | "waiting" | "overdue" | "closed";
  priority: "high" | "medium" | "low";
  followUpReason: string;
  suggestedDraft: string;
  actionStatus: "open" | "done" | "ignored" | "snoozed";
  remindAt: string | null;
  lastMessageAt: string;
};

export type DraftRecord = {
  id: string;
  followUpId: string;
  tone: string;
  content: string;
  createdAt: string;
};

async function request<T>(path: string, options: RequestInit = {}, token?: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  const data = (await response.json().catch(() => null)) as
    | T
    | {
        error?: string;
      }
    | null;

  if (!response.ok) {
    throw new Error(data && typeof data === "object" && "error" in data ? data.error ?? "Request failed." : "Request failed.");
  }

  return data as T;
}

export const api = {
  register(input: { fullName: string; email: string; password: string }) {
    return request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  login(input: { email: string; password: string }) {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  me(token: string) {
    return request<{ user: AuthResponse["user"] }>("/auth/me", {}, token);
  },
  getGmailConnectUrl(token: string, redirectUri: string) {
    return request<{ url: string; state: string; mode: "mock" | "live" }>(
      `/integrations/gmail/connect-url?redirectUri=${encodeURIComponent(redirectUri)}`,
      {},
      token,
    );
  },
  completeGmailCallback(
    token: string,
    input: { code: string; state: string; redirectUri: string },
  ) {
    return request<{ accountId: string; emailAddress: string | null; mode: "mock" | "live" }>(
      "/integrations/gmail/callback",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
      token,
    );
  },
  listGmailAccounts(token: string) {
    return request<{ items: GmailAccount[] }>("/integrations/gmail/accounts", {}, token);
  },
  syncGmail(token: string, accountId: string) {
    return request<{ accountId: string; emailAddress: string; syncedThreads: number; syncedMessages: number }>(
      "/integrations/gmail/sync",
      {
        method: "POST",
        body: JSON.stringify({ accountId, maxResults: 10 }),
      },
      token,
    );
  },
  refreshFollowUps(token: string) {
    return request<{ items: FollowUpItem[] }>(
      "/follow-ups/refresh",
      {
        method: "POST",
        body: JSON.stringify({}),
      },
      token,
    );
  },
  listFollowUps(token: string) {
    return request<{ items: FollowUpItem[] }>("/follow-ups", {}, token);
  },
  updateFollowUpStatus(
    token: string,
    followUpId: string,
    input: { status: "OPEN" | "DONE" | "IGNORED" | "SNOOZED"; remindAt?: string },
  ) {
    return request<{ items: FollowUpItem[] }>(
      `/follow-ups/${followUpId}/status`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
      token,
    );
  },
  generateDraft(token: string, followUpId: string, tone: "friendly" | "professional" | "direct") {
    return request<{ draft: DraftRecord }>(
      `/follow-ups/${followUpId}/drafts`,
      {
        method: "POST",
        body: JSON.stringify({ tone }),
      },
      token,
    );
  },
  listDrafts(token: string, followUpId: string) {
    return request<{ items: DraftRecord[] }>(`/follow-ups/${followUpId}/drafts`, {}, token);
  },
  updateDraft(token: string, draftId: string, content: string) {
    return request<{ draft: DraftRecord }>(
      `/drafts/${draftId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ content }),
      },
      token,
    );
  },
};
