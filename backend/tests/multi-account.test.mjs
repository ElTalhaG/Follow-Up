import test from "node:test";
import assert from "node:assert/strict";
import { loadBackendModules, resetDatabase } from "./helpers.mjs";

test("multiple Gmail accounts can be listed and synced for the same user", async () => {
  resetDatabase();
  const { prisma, listGmailAccounts, syncGmailAccount } = await loadBackendModules();

  await prisma.account.create({
    data: {
      userId: "user_1",
      provider: "gmail",
      providerAccountId: "mock_gmail_account_secondary",
      emailAddress: "second.freelancer@example.com",
      accessScope: "read-only",
      accessToken: "mock_access_token_2",
      refreshToken: "mock_refresh_token_2",
      tokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const accounts = await listGmailAccounts("user_1");
  assert.equal(accounts.length, 2);

  const secondaryAccount = accounts.find(
    (account) => account.emailAddress === "second.freelancer@example.com",
  );
  assert.ok(secondaryAccount);

  const result = await syncGmailAccount("user_1", secondaryAccount.id, 5);
  assert.equal(result.syncedThreads > 0, true);

  const syncedConversations = await prisma.conversation.findMany({
    where: {
      accountId: secondaryAccount.id,
    },
  });
  assert.equal(syncedConversations.length > 0, true);
});
