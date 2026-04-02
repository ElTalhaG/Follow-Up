import test from "node:test";
import assert from "node:assert/strict";
import { loadBackendModules, resetDatabase } from "./helpers.mjs";

test("auth registration/login and Gmail sync produce follow-ups", async () => {
  resetDatabase();
  const {
    registerUser,
    loginUser,
    getGmailConnectUrl,
    connectGmailAccount,
    listGmailAccounts,
    syncGmailAccount,
    refreshFollowUps,
    listFollowUps,
  } = await loadBackendModules();

  const registered = await registerUser({
    fullName: "Casey Lane",
    email: "casey@example.com",
    password: "strongpass123",
  });
  assert.equal(registered.user.email, "casey@example.com");

  const loggedIn = await loginUser({
    email: "casey@example.com",
    password: "strongpass123",
  });
  assert.equal(loggedIn.user.id, registered.user.id);

  const connect = getGmailConnectUrl(registered.user.id, "http://localhost:5173/oauth/google/callback");
  assert.equal(connect.mode, "mock");
  assert.equal(connect.url.includes(connect.state), true);

  const connection = await connectGmailAccount(
    registered.user.id,
    "mock-code",
    connect.state,
    "http://localhost:5173/oauth/google/callback",
  );
  assert.ok(connection.accountId);

  const accounts = await listGmailAccounts(registered.user.id);
  assert.equal(accounts.length, 1);

  const syncResult = await syncGmailAccount(registered.user.id, connection.accountId, 10);
  assert.equal(syncResult.syncedThreads > 0, true);
  assert.equal(syncResult.syncedMessages > 0, true);

  const refreshed = await refreshFollowUps(registered.user.id);
  const followUps = await listFollowUps(registered.user.id);

  assert.equal(refreshed.length > 0, true);
  assert.equal(followUps.some((item) => item.actionStatus === "open"), true);
});
