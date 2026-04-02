import { FormEvent, useEffect, useState } from "react";
import { api, type AuthResponse, type DraftRecord, type FollowUpItem, type GmailAccount } from "../../lib/api";

const REDIRECT_URI = "http://localhost:5173/oauth/google/callback";
const DEFAULT_SNOOZE_DATE = "2026-04-03T09:00";

type AuthMode = "login" | "register";
type DraftsByFollowUp = Record<string, DraftRecord[]>;
type DraftEditors = Record<string, string>;

function formatPriority(priority: FollowUpItem["priority"]) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function formatDate(value: string | null) {
  if (!value) {
    return "No reminder set";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function DashboardShell() {
  const [authMode, setAuthMode] = useState<AuthMode>("register");
  const [authInput, setAuthInput] = useState({
    fullName: "",
    email: "freelancer@example.com",
    password: "strongpass123",
  });
  const [session, setSession] = useState<AuthResponse | null>(null);
  const [accounts, setAccounts] = useState<GmailAccount[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [draftHistory, setDraftHistory] = useState<DraftsByFollowUp>({});
  const [draftEditors, setDraftEditors] = useState<DraftEditors>({});
  const [statusMessage, setStatusMessage] = useState("Sign in to unlock Gmail sync and follow-up actions.");
  const [isBusy, setIsBusy] = useState(false);

  const openFollowUps = followUps.filter((item) => item.actionStatus === "open");
  const snoozedFollowUps = followUps.filter((item) => item.actionStatus === "snoozed");
  const completedFollowUps = followUps.filter((item) => item.actionStatus === "done");

  useEffect(() => {
    const stored = window.localStorage.getItem("followup-session");

    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as AuthResponse;
      setSession(parsed);
    } catch {
      window.localStorage.removeItem("followup-session");
    }
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }

    void hydrateDashboard(session.token);
  }, [session]);

  async function hydrateDashboard(token: string) {
    try {
      setIsBusy(true);
      const [accountsResponse, followUpsResponse] = await Promise.all([
        api.listGmailAccounts(token),
        api.listFollowUps(token),
      ]);

      setAccounts(accountsResponse.items);
      setFollowUps(followUpsResponse.items);
      setStatusMessage("Dashboard synced from the real backend.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to load dashboard.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);

    try {
      const response =
        authMode === "register"
          ? await api.register(authInput)
          : await api.login({
              email: authInput.email,
              password: authInput.password,
            });

      setSession(response);
      window.localStorage.setItem("followup-session", JSON.stringify(response));
      setStatusMessage(
        authMode === "register"
          ? "Account created. Connect Gmail to start syncing conversations."
          : "Welcome back. Your dashboard is loading.",
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleMockGmailConnect() {
    if (!session) {
      return;
    }

    setIsBusy(true);

    try {
      const connect = await api.getGmailConnectUrl(session.token, REDIRECT_URI);
      await api.completeGmailCallback(session.token, {
        code: connect.mode === "mock" ? "mock-code" : "replace-with-code",
        state: connect.state,
        redirectUri: REDIRECT_URI,
      });
      await hydrateDashboard(session.token);
      setStatusMessage("Gmail connected in read-only mode.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to connect Gmail.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSync() {
    if (!session || accounts.length === 0) {
      setStatusMessage("Connect Gmail first so there is an account to sync.");
      return;
    }

    setIsBusy(true);

    try {
      const syncResult = await api.syncGmail(session.token, accounts[0].id);
      const refreshed = await api.refreshFollowUps(session.token);
      setFollowUps(refreshed.items);
      setStatusMessage(
        `Synced ${syncResult.syncedThreads} threads and ${syncResult.syncedMessages} messages from Gmail.`,
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Sync failed.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRefreshFollowUps() {
    if (!session) {
      return;
    }

    setIsBusy(true);

    try {
      const response = await api.refreshFollowUps(session.token);
      setFollowUps(response.items);
      setStatusMessage(`Refreshed ${response.items.length} follow-ups.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to refresh follow-ups.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleGenerateDraft(followUpId: string, tone: "friendly" | "professional" | "direct") {
    if (!session) {
      return;
    }

    setIsBusy(true);

    try {
      await api.generateDraft(session.token, followUpId, tone);
      const history = await api.listDrafts(session.token, followUpId);
      setDraftHistory((current) => ({ ...current, [followUpId]: history.items }));
      setDraftEditors((current) => ({
        ...current,
        [followUpId]: history.items[0]?.content ?? "",
      }));
      const list = await api.listFollowUps(session.token);
      setFollowUps(list.items);
      setStatusMessage(`Generated a ${tone} draft.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to generate draft.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleLoadDrafts(followUpId: string) {
    if (!session) {
      return;
    }

    try {
      const history = await api.listDrafts(session.token, followUpId);
      setDraftHistory((current) => ({ ...current, [followUpId]: history.items }));
      setDraftEditors((current) => ({
        ...current,
        [followUpId]: current[followUpId] ?? history.items[0]?.content ?? "",
      }));
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to load drafts.");
    }
  }

  async function handleSaveDraft(followUpId: string) {
    if (!session) {
      return;
    }

    const currentDraft = draftHistory[followUpId]?.[0];
    const content = draftEditors[followUpId];

    if (!currentDraft || !content) {
      setStatusMessage("Generate a draft before saving edits.");
      return;
    }

    setIsBusy(true);

    try {
      await api.updateDraft(session.token, currentDraft.id, content);
      const history = await api.listDrafts(session.token, followUpId);
      setDraftHistory((current) => ({ ...current, [followUpId]: history.items }));
      const list = await api.listFollowUps(session.token);
      setFollowUps(list.items);
      setStatusMessage("Draft edits saved.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to save draft.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleFollowUpStatus(
    followUpId: string,
    status: "DONE" | "IGNORED" | "SNOOZED",
  ) {
    if (!session) {
      return;
    }

    setIsBusy(true);

    try {
      const response = await api.updateFollowUpStatus(session.token, followUpId, {
        status,
        remindAt: status === "SNOOZED" ? `${DEFAULT_SNOOZE_DATE}:00.000Z` : undefined,
      });
      setFollowUps(response.items);
      setStatusMessage(
        status === "DONE"
          ? "Marked follow-up as done."
          : status === "IGNORED"
            ? "Ignored follow-up."
            : "Snoozed follow-up until tomorrow morning.",
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to update follow-up.");
    } finally {
      setIsBusy(false);
    }
  }

  function signOut() {
    setSession(null);
    setAccounts([]);
    setFollowUps([]);
    setDraftHistory({});
    setDraftEditors({});
    window.localStorage.removeItem("followup-session");
    setStatusMessage("Signed out.");
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">V1 focus: Gmail follow-ups for freelancers</p>
        <h1>Never lose a warm lead in your inbox again.</h1>
        <p className="hero-copy">
          Followup flags stalled conversations, explains why they matter, and
          helps you send the next message faster.
        </p>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-header">
            <h2>Urgent Follow-Ups</h2>
            <span className="pill">{openFollowUps.length} open</span>
          </div>
          {!session ? (
            <form className="auth-form" onSubmit={handleAuthSubmit}>
              <div className="toggle-row">
                <button
                  className={`toggle-button ${authMode === "register" ? "active" : ""}`}
                  onClick={() => setAuthMode("register")}
                  type="button"
                >
                  Register
                </button>
                <button
                  className={`toggle-button ${authMode === "login" ? "active" : ""}`}
                  onClick={() => setAuthMode("login")}
                  type="button"
                >
                  Login
                </button>
                <span className="pill subtle">{isBusy ? "Working" : "Backend live"}</span>
              </div>
              {authMode === "register" ? (
                <label className="field">
                  <span>Full name</span>
                  <input
                    value={authInput.fullName}
                    onChange={(event) =>
                      setAuthInput((current) => ({ ...current, fullName: event.target.value }))
                    }
                    placeholder="Alex Mercer"
                  />
                </label>
              ) : null}
              <label className="field">
                <span>Email</span>
                <input
                  value={authInput.email}
                  onChange={(event) =>
                    setAuthInput((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="freelancer@example.com"
                />
              </label>
              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  value={authInput.password}
                  onChange={(event) =>
                    setAuthInput((current) => ({ ...current, password: event.target.value }))
                  }
                  placeholder="strongpass123"
                />
              </label>
              <button className="primary-button" disabled={isBusy} type="submit">
                {authMode === "register" ? "Create account" : "Sign in"}
              </button>
            </form>
          ) : (
            <div className="stack">
              <div className="toolbar">
                <div>
                  <strong>{session.user.fullName}</strong>
                  <p>{session.user.email}</p>
                </div>
                <div className="button-row">
                  <button className="secondary-button" disabled={isBusy} onClick={handleMockGmailConnect}>
                    Connect Gmail
                  </button>
                  <button className="secondary-button" disabled={isBusy} onClick={handleSync}>
                    Sync inbox
                  </button>
                  <button className="secondary-button" disabled={isBusy} onClick={handleRefreshFollowUps}>
                    Refresh follow-ups
                  </button>
                  <button className="ghost-button" onClick={signOut} type="button">
                    Sign out
                  </button>
                </div>
              </div>

              {openFollowUps.length === 0 ? (
                <div className="empty-state">
                  <strong>No open follow-ups yet.</strong>
                  <p>Connect Gmail, sync your inbox, and refresh follow-ups to see real lead activity.</p>
                </div>
              ) : (
                openFollowUps.map((conversation) => {
                  const latestDraft = draftHistory[conversation.id]?.[0];

                  return (
                    <div className="conversation-card" key={conversation.id}>
                      <div className="conversation-head">
                        <div>
                          <h3>{conversation.subject}</h3>
                          <p>{conversation.contactName ?? conversation.contactEmail}</p>
                        </div>
                        <span className={`priority priority-${conversation.priority}`}>
                          {formatPriority(conversation.priority)}
                        </span>
                      </div>
                      <p className="reason">{conversation.followUpReason}</p>
                      <div className="meta-row">
                        <span>{conversation.status}</span>
                        <span>Reminder: {formatDate(conversation.remindAt)}</span>
                      </div>
                      <div className="button-row compact">
                        <button
                          className="secondary-button"
                          disabled={isBusy}
                          onClick={() => handleGenerateDraft(conversation.id, "professional")}
                        >
                          Professional draft
                        </button>
                        <button
                          className="secondary-button"
                          disabled={isBusy}
                          onClick={() => handleGenerateDraft(conversation.id, "friendly")}
                        >
                          Friendly draft
                        </button>
                        <button
                          className="secondary-button"
                          disabled={isBusy}
                          onClick={() => handleGenerateDraft(conversation.id, "direct")}
                        >
                          Direct draft
                        </button>
                        <button
                          className="ghost-button"
                          disabled={isBusy}
                          onClick={() => handleLoadDrafts(conversation.id)}
                        >
                          Show history
                        </button>
                      </div>
                      <div className="draft-box">
                        <strong>Editable draft</strong>
                        <textarea
                          className="draft-editor"
                          value={draftEditors[conversation.id] ?? latestDraft?.content ?? conversation.suggestedDraft}
                          onChange={(event) =>
                            setDraftEditors((current) => ({
                              ...current,
                              [conversation.id]: event.target.value,
                            }))
                          }
                        />
                        <div className="button-row compact">
                          <button
                            className="primary-button"
                            disabled={isBusy}
                            onClick={() => handleSaveDraft(conversation.id)}
                          >
                            Save draft edits
                          </button>
                          <button
                            className="secondary-button"
                            disabled={isBusy}
                            onClick={() => handleFollowUpStatus(conversation.id, "DONE")}
                          >
                            Mark done
                          </button>
                          <button
                            className="secondary-button"
                            disabled={isBusy}
                            onClick={() => handleFollowUpStatus(conversation.id, "SNOOZED")}
                          >
                            Snooze
                          </button>
                          <button
                            className="ghost-button"
                            disabled={isBusy}
                            onClick={() => handleFollowUpStatus(conversation.id, "IGNORED")}
                          >
                            Ignore
                          </button>
                        </div>
                      </div>
                      {draftHistory[conversation.id]?.length ? (
                        <div className="history-list">
                          {draftHistory[conversation.id].slice(0, 3).map((draft) => (
                            <div className="history-item" key={draft.id}>
                              <strong>{draft.tone}</strong>
                              <p>{draft.content}</p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>Live Workspace</h2>
          </div>
          <div className="workspace-stack">
            <div className="status-card">
              <strong>Status</strong>
              <p>{statusMessage}</p>
            </div>
            <div className="status-card">
              <strong>Connected inboxes</strong>
              <p>{accounts.length === 0 ? "No Gmail account connected yet." : `${accounts.length} Gmail account connected.`}</p>
              {accounts.length ? (
                <ul className="feature-list">
                  {accounts.map((account) => (
                    <li key={account.id}>
                      {account.emailAddress ?? "Unknown inbox"} · last sync {formatDate(account.lastSyncedAt)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="status-card">
              <strong>Pipeline snapshot</strong>
              <ul className="feature-list">
                <li>{openFollowUps.length} urgent follow-ups</li>
                <li>{snoozedFollowUps.length} snoozed items</li>
                <li>{completedFollowUps.length} completed items</li>
              </ul>
            </div>
            <div className="status-card">
              <strong>What this screen now does</strong>
              <ul className="feature-list">
                <li>Authenticates against the real backend</li>
                <li>Connects Gmail in mock-safe read-only mode</li>
                <li>Syncs inbox threads and refreshes follow-up detection</li>
                <li>Generates, edits, and stores draft history</li>
                <li>Updates follow-up status without leaving the dashboard</li>
              </ul>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
