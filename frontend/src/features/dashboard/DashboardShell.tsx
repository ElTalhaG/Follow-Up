import { FormEvent, useEffect, useRef, useState } from "react";
import {
  api,
  type AnalyticsSummary,
  type AuthResponse,
  type BillingPlan,
  type ConversationItem,
  type DraftRecord,
  type FollowUpItem,
  type GmailAccount,
  type LaunchMetrics,
  type ReminderItem,
  type TaskSummary,
} from "../../lib/api";

const DEFAULT_SNOOZE_DATE = "2026-04-03T09:00";
const DEMO_AFTER_OAUTH_KEY = "followup-demo-after-oauth";

type AuthMode = "login" | "register";
type DraftsByFollowUp = Record<string, DraftRecord[]>;
type DraftEditors = Record<string, string>;
type ConversationNotes = Record<string, string>;
type WaitlistForm = {
  fullName: string;
  email: string;
  segment: string;
  notes: string;
};
type WorkspaceData = {
  followUps: FollowUpItem[];
  conversations: ConversationItem[];
  reminders: ReminderItem[];
  tasks: TaskSummary;
  analytics: AnalyticsSummary;
};

const PRICING_PLANS = [
  {
    name: "Solo",
    price: "$19",
    cadence: "/month",
    summary: "For freelancers who mainly need one inbox and a sharp daily follow-up list.",
    points: [
      "1 Gmail account",
      "Unlimited follow-up scans",
      "AI drafts in friendly, professional, and direct tones",
      "Reminder queue and weekly value summary",
    ],
    highlight: false,
  },
  {
    name: "Studio",
    price: "$49",
    cadence: "/month",
    summary: "For tiny agencies managing multiple warm leads without a full CRM rollout.",
    points: [
      "Up to 3 shared inbox accounts",
      "Priority follow-up views and lead notes",
      "Draft history, reminders, and pipeline snapshots",
      "Founding-user onboarding support",
    ],
    highlight: true,
  },
] as const;

const ROI_BULLETS = [
  "Find warm leads sitting unanswered for 24+ hours.",
  "Draft the next reply in seconds instead of context-switching across threads.",
  "Keep a lightweight pipeline without adopting a heavyweight CRM.",
];

const OUTREACH_CHANNELS = [
  "Freelance designers and developers",
  "Small marketing agencies",
  "Consultants and recruiters",
] as const;
type ActivityState =
  | "idle"
  | "auth"
  | "hydrate"
  | "connect"
  | "sync"
  | "refresh"
  | "draft"
  | "save-draft"
  | "follow-up"
  | "reminder"
  | "dismiss-reminder"
  | "notes"
  | "demo"
  | "checkout"
  | "waitlist";

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

function getActivityLabel(activity: ActivityState) {
  switch (activity) {
    case "auth":
      return "Checking your account";
    case "hydrate":
      return "Refreshing your workspace";
    case "connect":
      return "Connecting Gmail";
    case "sync":
      return "Syncing recent inbox threads";
    case "refresh":
      return "Looking for stalled leads";
    case "draft":
      return "Drafting a follow-up";
    case "save-draft":
      return "Saving your draft";
    case "follow-up":
      return "Updating follow-up status";
    case "reminder":
      return "Scheduling a reminder";
    case "dismiss-reminder":
      return "Clearing the reminder";
    case "notes":
      return "Saving conversation notes";
    case "demo":
      return "Running the demo flow";
    case "checkout":
      return "Preparing checkout";
    case "waitlist":
      return "Saving your early-access request";
    default:
      return "Working";
  }
}

function getGmailRedirectUri() {
  const configured = import.meta.env.VITE_GMAIL_REDIRECT_URI?.toString().trim();

  if (configured) {
    return configured;
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}/oauth/google/callback`;
  }

  return "http://localhost:5173/oauth/google/callback";
}

function readOAuthCallbackParams() {
  if (typeof window === "undefined" || window.location.pathname !== "/oauth/google/callback") {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");

  return {
    code,
    state,
    error,
  };
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
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [taskSummary, setTaskSummary] = useState<TaskSummary>({
    open: 0,
    done: 0,
    canceled: 0,
  });
  const [billingPlans, setBillingPlans] = useState<BillingPlan[]>([]);
  const [trialDays, setTrialDays] = useState(14);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [launchMetrics, setLaunchMetrics] = useState<LaunchMetrics | null>(null);
  const [draftHistory, setDraftHistory] = useState<DraftsByFollowUp>({});
  const [draftEditors, setDraftEditors] = useState<DraftEditors>({});
  const [conversationNotes, setConversationNotes] = useState<ConversationNotes>({});
  const [waitlistForm, setWaitlistForm] = useState<WaitlistForm>({
    fullName: "",
    email: "",
    segment: "freelancer",
    notes: "",
  });
  const [statusMessage, setStatusMessage] = useState("Sign in to unlock Gmail sync and follow-up actions.");
  const [isBusy, setIsBusy] = useState(false);
  const [activity, setActivity] = useState<ActivityState>("idle");
  const oauthCallbackHandled = useRef(false);

  const openFollowUps = followUps.filter((item) => item.actionStatus === "open");
  const snoozedFollowUps = followUps.filter((item) => item.actionStatus === "snoozed");
  const completedFollowUps = followUps.filter((item) => item.actionStatus === "done");
  const activeConversations = conversations.filter((item) => item.status !== "closed").slice(0, 4);
  const dueReminders = reminders.filter((item) => item.isDue);
  const hasConnectedInbox = accounts.length > 0;
  const hasSyncedData = conversations.length > 0;
  const hasDetectedWork = followUps.length > 0;
  const ctaLabel = session ? "Run demo flow" : "Create account and run the demo";
  const onboardingSteps = [
    {
      label: "Create your account",
      done: Boolean(session),
      helper: session ? "You are signed in." : "Register or sign in to unlock the workspace.",
    },
    {
      label: "Connect Gmail",
      done: hasConnectedInbox,
      helper: hasConnectedInbox ? "Your inbox is connected in read-only mode." : "Link Gmail to pull lead conversations.",
    },
    {
      label: "Sync your inbox",
      done: hasSyncedData,
      helper: hasSyncedData ? "Recent threads are in the workspace." : "Run one sync to import recent threads.",
    },
    {
      label: "Review flagged follow-ups",
      done: hasDetectedWork,
      helper: hasDetectedWork ? "You already have leads to review." : "Refresh follow-ups to surface missed replies.",
    },
  ];

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
    void (async () => {
      try {
        const billing = await api.listBillingPlans();
        setBillingPlans(billing.plans);
        setTrialDays(billing.trialDays);
      } catch {
        setBillingPlans(
          PRICING_PLANS.map((plan) => ({
            id: plan.name.toLowerCase() as "solo" | "studio",
            name: plan.name,
            priceMonthly: Number(plan.price.replace("$", "")),
            currency: "USD",
            ctaLabel: plan.highlight ? "Start studio trial" : "Start solo trial",
            summary: plan.summary,
            seats: plan.highlight ? "Up to 3 inboxes" : "1 inbox",
            features: [...plan.points],
          })),
        );
      }
    })();

    void (async () => {
      try {
        setLaunchMetrics(await api.getLaunchMetrics());
      } catch {
        setLaunchMetrics(null);
      }
    })();
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }

    void hydrateDashboard(session.token);
  }, [session]);

  useEffect(() => {
    if (!session || oauthCallbackHandled.current) {
      return;
    }

    const callback = readOAuthCallbackParams();

    if (!callback) {
      return;
    }

    oauthCallbackHandled.current = true;

    if (callback.error) {
      setStatusMessage(
        `Gmail connection was not completed: ${callback.error.replace(/_/g, " ")}.`,
      );
      window.history.replaceState({}, "", "/");
      return;
    }

    if (!callback.code || !callback.state) {
      setStatusMessage("Gmail callback is missing required OAuth details.");
      window.history.replaceState({}, "", "/");
      return;
    }

    const code = callback.code;
    const state = callback.state;

    void (async () => {
      try {
        setIsBusy(true);
        setActivity("connect");

        await api.completeGmailCallback(session.token, {
          code,
          state,
          redirectUri: getGmailRedirectUri(),
        });
        const shouldContinueDemo = window.sessionStorage.getItem(DEMO_AFTER_OAUTH_KEY) === "true";

        if (shouldContinueDemo) {
          window.sessionStorage.removeItem(DEMO_AFTER_OAUTH_KEY);
          const latestAccounts = await api.listGmailAccounts(session.token);
          setAccounts(latestAccounts.items);

          if (latestAccounts.items[0]) {
            await api.syncGmail(session.token, latestAccounts.items[0].id);
            const refreshed = await api.refreshFollowUps(session.token);
            const workspace = await loadWorkspaceData(session.token);
            applyWorkspaceData({
              ...workspace,
              followUps: refreshed.items,
            });
            setStatusMessage(
              `Demo ready: ${refreshed.items.length} follow-ups surfaced from your connected inbox flow.`,
            );
          } else {
            await hydrateDashboard(session.token);
            setStatusMessage("Gmail connected, but no inbox account was returned.");
          }
        } else {
          await hydrateDashboard(session.token);
          setStatusMessage("Gmail connected in read-only mode.");
        }
      } catch (error) {
        setStatusMessage(
          error instanceof Error
            ? error.message
            : "Failed to finish the Gmail connection.",
        );
      } finally {
        window.history.replaceState({}, "", "/");
        setIsBusy(false);
        setActivity("idle");
      }
    })();
  }, [session]);

  function mergeConversationNotes(items: ConversationItem[]) {
    return Object.fromEntries(items.map((item) => [item.id, item.notes ?? ""]));
  }

  function applyWorkspaceData(data: WorkspaceData) {
    setFollowUps(data.followUps);
    setConversations(data.conversations);
    setConversationNotes((current) => ({
      ...current,
      ...mergeConversationNotes(data.conversations),
    }));
    setReminders(data.reminders);
    setTaskSummary(data.tasks);
    setAnalytics(data.analytics);
  }

  async function loadWorkspaceData(token: string) {
    const [followUpsResponse, conversationsResponse, remindersResponse, analyticsResponse] =
      await Promise.all([
        api.listFollowUps(token),
        api.listConversations(token),
        api.listReminders(token),
        api.getAnalytics(token),
      ]);

    return {
      followUps: followUpsResponse.items,
      conversations: conversationsResponse.items,
      reminders: remindersResponse.items,
      tasks: remindersResponse.tasks,
      analytics: analyticsResponse,
    } satisfies WorkspaceData;
  }

  function resetWorkspace() {
    setAccounts([]);
    setConversations([]);
    setFollowUps([]);
    setReminders([]);
    setTaskSummary({ open: 0, done: 0, canceled: 0 });
    setAnalytics(null);
    setDraftHistory({});
    setDraftEditors({});
    setConversationNotes({});
  }

  async function hydrateDashboard(token: string) {
    try {
      setIsBusy(true);
      setActivity("hydrate");
      const [accountsResponse, workspace] = await Promise.all([
        api.listGmailAccounts(token),
        loadWorkspaceData(token),
      ]);

      setAccounts(accountsResponse.items);
      applyWorkspaceData(workspace);
      setStatusMessage("Dashboard synced from the real backend.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to load dashboard.");
    } finally {
      setIsBusy(false);
      setActivity("idle");
    }
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setActivity("auth");

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
      setLaunchMetrics(await api.getLaunchMetrics());
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setIsBusy(false);
      setActivity("idle");
    }
  }

  async function handleGmailConnect() {
    if (!session) {
      return;
    }

    setIsBusy(true);
    setActivity("connect");

    try {
      const redirectUri = getGmailRedirectUri();
      const connect = await api.getGmailConnectUrl(session.token, redirectUri);

      if (connect.mode === "live") {
        setStatusMessage("Redirecting to Gmail to approve read-only inbox access.");
        window.location.assign(connect.url);
        return;
      }

      await api.completeGmailCallback(session.token, {
        code: "mock-code",
        state: connect.state,
        redirectUri,
      });
      await hydrateDashboard(session.token);
      setStatusMessage("Gmail connected in read-only mode.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Failed to connect Gmail. Please retry the inbox connection.",
      );
    } finally {
      setIsBusy(false);
      setActivity("idle");
    }
  }

  async function handleSync() {
    if (!session || accounts.length === 0) {
      setStatusMessage("Connect Gmail first so there is an account to sync.");
      return;
    }

    setIsBusy(true);
    setActivity("sync");

    try {
      const syncResult = await api.syncGmail(session.token, accounts[0].id);
      const [refreshed, workspace] = await Promise.all([
        api.refreshFollowUps(session.token),
        loadWorkspaceData(session.token),
      ]);
      applyWorkspaceData({
        ...workspace,
        followUps: refreshed.items,
      });
      setStatusMessage(
        `Synced ${syncResult.syncedThreads} threads and ${syncResult.syncedMessages} messages from Gmail.`,
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Sync failed. Please reconnect Gmail or try again shortly.",
      );
    } finally {
      setIsBusy(false);
      setActivity("idle");
    }
  }

  async function handleRefreshFollowUps() {
    if (!session) {
      return;
    }

    setIsBusy(true);
    setActivity("refresh");

    try {
      const [response, workspace] = await Promise.all([
        api.refreshFollowUps(session.token),
        loadWorkspaceData(session.token),
      ]);
      applyWorkspaceData({
        ...workspace,
        followUps: response.items,
      });
      setStatusMessage(`Refreshed ${response.items.length} follow-ups.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to refresh follow-ups.");
    } finally {
      setIsBusy(false);
      setActivity("idle");
    }
  }

  async function handleGenerateDraft(followUpId: string, tone: "friendly" | "professional" | "direct") {
    if (!session) {
      return;
    }

    setIsBusy(true);
    setActivity("draft");

    try {
      await api.generateDraft(session.token, followUpId, tone);
      const history = await api.listDrafts(session.token, followUpId);
      setDraftHistory((current) => ({ ...current, [followUpId]: history.items }));
      setDraftEditors((current) => ({
        ...current,
        [followUpId]: history.items[0]?.content ?? "",
      }));
      applyWorkspaceData(await loadWorkspaceData(session.token));
      setStatusMessage(`Generated a ${tone} draft.`);
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Draft generation failed. You can still write a manual follow-up below.",
      );
    } finally {
      setIsBusy(false);
      setActivity("idle");
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
    setActivity("save-draft");

    try {
      await api.updateDraft(session.token, currentDraft.id, content);
      const history = await api.listDrafts(session.token, followUpId);
      setDraftHistory((current) => ({ ...current, [followUpId]: history.items }));
      applyWorkspaceData(await loadWorkspaceData(session.token));
      setStatusMessage("Draft edits saved.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to save draft.");
    } finally {
      setIsBusy(false);
      setActivity("idle");
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
    setActivity("follow-up");

    try {
      const response = await api.updateFollowUpStatus(session.token, followUpId, {
        status,
        remindAt: status === "SNOOZED" ? `${DEFAULT_SNOOZE_DATE}:00.000Z` : undefined,
      });
      const workspace = await loadWorkspaceData(session.token);
      applyWorkspaceData({
        ...workspace,
        followUps: response.items,
      });
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
      setActivity("idle");
    }
  }

  async function handleReminderPreset(
    conversationId: string,
    preset: "later_today" | "tomorrow" | "next_week",
  ) {
    if (!session) {
      return;
    }

    setIsBusy(true);
    setActivity("reminder");

    try {
      await api.createReminder(session.token, conversationId, { preset });
      const workspace = await loadWorkspaceData(session.token);
      applyWorkspaceData(workspace);
      setStatusMessage(
        preset === "later_today"
          ? "Reminder set for later today."
          : preset === "tomorrow"
            ? "Reminder set for tomorrow morning."
            : "Reminder set for next week.",
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to set reminder.");
    } finally {
      setIsBusy(false);
      setActivity("idle");
    }
  }

  async function handleDismissReminder(reminderId: string) {
    if (!session) {
      return;
    }

    setIsBusy(true);
    setActivity("dismiss-reminder");

    try {
      const response = await api.dismissReminder(session.token, reminderId);
      const workspace = await loadWorkspaceData(session.token);
      applyWorkspaceData({
        ...workspace,
        reminders: response.items,
        tasks: response.tasks,
      });
      setStatusMessage("Reminder dismissed.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to dismiss reminder.");
    } finally {
      setIsBusy(false);
      setActivity("idle");
    }
  }

  function signOut() {
    setSession(null);
    resetWorkspace();
    window.localStorage.removeItem("followup-session");
    setStatusMessage("Signed out.");
  }

  async function handleSaveConversationNotes(conversationId: string) {
    if (!session) {
      return;
    }

    setIsBusy(true);
    setActivity("notes");

    try {
      const response = await api.updateConversationNotes(
        session.token,
        conversationId,
        conversationNotes[conversationId] ?? "",
      );
      setConversations(response.items);
      setConversationNotes((current) => ({
        ...current,
        ...Object.fromEntries(response.items.map((item) => [item.id, item.notes ?? ""])),
      }));
      setStatusMessage("Conversation notes saved.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to save notes.");
    } finally {
      setIsBusy(false);
      setActivity("idle");
    }
  }

  async function handleRunDemo() {
    if (!session) {
      setStatusMessage("Sign in first so the demo can set up your workspace.");
      return;
    }

    setIsBusy(true);
    setActivity("demo");

    try {
      if (!accounts.length) {
        const redirectUri = getGmailRedirectUri();
        const connect = await api.getGmailConnectUrl(session.token, redirectUri);

        if (connect.mode === "live") {
          window.sessionStorage.setItem(DEMO_AFTER_OAUTH_KEY, "true");
          setStatusMessage("Redirecting to Gmail so the demo flow can finish setup.");
          window.location.assign(connect.url);
          return;
        }

        await api.completeGmailCallback(session.token, {
          code: "mock-code",
          state: connect.state,
          redirectUri,
        });
      }

      const latestAccounts = await api.listGmailAccounts(session.token);
      setAccounts(latestAccounts.items);

      if (!latestAccounts.items.length) {
        throw new Error("Demo setup could not connect a Gmail inbox.");
      }

      await api.syncGmail(session.token, latestAccounts.items[0].id);
      const refreshed = await api.refreshFollowUps(session.token);
      const workspace = await loadWorkspaceData(session.token);
      applyWorkspaceData({
        ...workspace,
        followUps: refreshed.items,
      });
      setStatusMessage(
        `Demo ready: ${refreshed.items.length} follow-ups surfaced from your connected inbox flow.`,
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Demo flow failed.");
    } finally {
      setIsBusy(false);
      setActivity("idle");
    }
  }

  async function handleCheckout(planId: "solo" | "studio") {
    setIsBusy(true);
    setActivity("checkout");

    try {
      const checkout = await api.createCheckoutLink(planId);
      setStatusMessage(
        checkout.mode === "live"
          ? `Opening ${checkout.plan.name} checkout in a new tab.`
          : `Stripe payment link not configured yet, so ${checkout.plan.name} is using a placeholder checkout URL.`,
      );
      setLaunchMetrics(await api.getLaunchMetrics());
      window.open(checkout.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to prepare checkout.");
    } finally {
      setIsBusy(false);
      setActivity("idle");
    }
  }

  async function handleJoinWaitlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setActivity("waitlist");

    try {
      const result = await api.joinWaitlist({
        ...waitlistForm,
        source: "landing-page",
      });
      setStatusMessage(
        result.alreadyJoined
          ? `${result.entry.email} is already on the founding-user list.`
          : `Added ${result.entry.email} to the founding-user list.`,
      );
      setLaunchMetrics(await api.getLaunchMetrics());
      setWaitlistForm((current) => ({
        ...current,
        notes: "",
      }));
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to join the waitlist.");
    } finally {
      setIsBusy(false);
      setActivity("idle");
    }
  }

  return (
    <main className="app-shell">
      {isBusy ? (
        <div className="loading-banner" aria-live="polite">
          <span className="loading-dot" />
          <strong>{getActivityLabel(activity)}</strong>
          <span>Followup is updating your workspace.</span>
        </div>
      ) : null}
      <section className="hero">
        <p className="eyebrow">V1 focus: Gmail follow-ups for freelancers</p>
        <h1>Never lose a warm lead in your inbox again.</h1>
        <p className="hero-copy">
          Followup flags stalled conversations, explains why they matter, and
          helps you send the next message faster.
        </p>
        <div className="hero-actions">
          <button className="primary-button" disabled={isBusy || !session} onClick={handleRunDemo}>
            {ctaLabel}
          </button>
          <p className="helper-copy">
            The fastest path: connect Gmail, sync recent threads, and surface your first missed follow-up.
          </p>
        </div>
        <div className="hero-proof-grid">
          <div className="hero-proof-card">
            <strong>For</strong>
            <p>Freelancers and tiny agencies who live in Gmail and lose money on slow follow-up.</p>
          </div>
          <div className="hero-proof-card">
            <strong>Core promise</strong>
            <p>Catch missed leads, write the next reply faster, and keep momentum without a full CRM.</p>
          </div>
          <div className="hero-proof-card">
            <strong>Expected result</strong>
            <p>Surface one useful missed opportunity fast enough that the product pays for itself.</p>
          </div>
        </div>
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
                  <button className="secondary-button" disabled={isBusy} onClick={handleGmailConnect}>
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
                          <button
                            className="ghost-button"
                            disabled={isBusy}
                            onClick={() => handleReminderPreset(conversation.conversationId, "later_today")}
                          >
                            Later today
                          </button>
                          <button
                            className="ghost-button"
                            disabled={isBusy}
                            onClick={() => handleReminderPreset(conversation.conversationId, "tomorrow")}
                          >
                            Tomorrow
                          </button>
                          <button
                            className="ghost-button"
                            disabled={isBusy}
                            onClick={() => handleReminderPreset(conversation.conversationId, "next_week")}
                          >
                            Next week
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
              <strong>Why freelancers pay for this</strong>
              <ul className="feature-list">
                {ROI_BULLETS.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
            <div className="status-card">
              <strong>Status</strong>
              <p>{statusMessage}</p>
              <div className="status-strip">
                <span className={`mini-pill ${session ? "is-done" : ""}`}>Account</span>
                <span className={`mini-pill ${hasConnectedInbox ? "is-done" : ""}`}>Inbox</span>
                <span className={`mini-pill ${hasSyncedData ? "is-done" : ""}`}>Synced</span>
                <span className={`mini-pill ${hasDetectedWork ? "is-done" : ""}`}>Flagged</span>
              </div>
            </div>
            <div className="status-card">
              <strong>Starter pricing</strong>
              <div className="pricing-grid">
                {(billingPlans.length ? billingPlans : PRICING_PLANS.map((plan) => ({
                  id: plan.name.toLowerCase() as "solo" | "studio",
                  name: plan.name,
                  priceMonthly: Number(plan.price.replace("$", "")),
                  currency: "USD" as const,
                  ctaLabel: plan.highlight ? "Start studio trial" : "Start solo trial",
                  summary: plan.summary,
                  seats: plan.highlight ? "Up to 3 inboxes" : "1 inbox",
                  features: [...plan.points],
                }))).map((plan) => (
                  <div className={`pricing-card ${plan.id === "studio" ? "featured" : ""}`} key={plan.id}>
                    <div className="pricing-head">
                      <div>
                        <h3>{plan.name}</h3>
                        <p>{plan.summary}</p>
                      </div>
                      <span className="pill subtle">{plan.id === "studio" ? "Best for first teams" : "Best for solo"}</span>
                    </div>
                    <p className="pricing-price">
                      <strong>{`$${plan.priceMonthly}`}</strong>
                      <span>/month</span>
                    </p>
                    <p className="helper-copy">{trialDays}-day free trial</p>
                    <ul className="feature-list">
                      {plan.features.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                    <button
                      className="primary-button"
                      disabled={isBusy}
                      onClick={() => handleCheckout(plan.id)}
                      type="button"
                    >
                      {plan.ctaLabel}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="status-card">
              <strong>Founding-user access</strong>
              <p>Join the early-access list to get staging access, founding pricing, and hands-on onboarding.</p>
              <form className="auth-form" onSubmit={handleJoinWaitlist}>
                <label className="field">
                  <span>Full name</span>
                  <input
                    value={waitlistForm.fullName}
                    onChange={(event) =>
                      setWaitlistForm((current) => ({ ...current, fullName: event.target.value }))
                    }
                    placeholder="Alex Mercer"
                  />
                </label>
                <label className="field">
                  <span>Email</span>
                  <input
                    value={waitlistForm.email}
                    onChange={(event) =>
                      setWaitlistForm((current) => ({ ...current, email: event.target.value }))
                    }
                    placeholder="founder@example.com"
                  />
                </label>
                <label className="field">
                  <span>Best fit</span>
                  <input
                    value={waitlistForm.segment}
                    onChange={(event) =>
                      setWaitlistForm((current) => ({ ...current, segment: event.target.value }))
                    }
                    placeholder="freelancer, agency, consultant"
                  />
                </label>
                <label className="field">
                  <span>What would you use it for?</span>
                  <input
                    value={waitlistForm.notes}
                    onChange={(event) =>
                      setWaitlistForm((current) => ({ ...current, notes: event.target.value }))
                    }
                    placeholder="I lose warm leads when my inbox gets busy."
                  />
                </label>
                <button className="primary-button" disabled={isBusy} type="submit">
                  Join founding-user waitlist
                </button>
              </form>
            </div>
            <div className="status-card">
              <strong>Launch funnel</strong>
              {!launchMetrics ? (
                <p>Launch metrics will appear here once the tracking endpoints are available.</p>
              ) : (
                <div className="analytics-stack">
                  <div className="analytics-grid">
                    <div className="analytics-stat">
                      <strong>{launchMetrics.totals.signups}</strong>
                      <span>Signups</span>
                    </div>
                    <div className="analytics-stat">
                      <strong>{launchMetrics.totals.waitlistJoins}</strong>
                      <span>Waitlist joins</span>
                    </div>
                    <div className="analytics-stat">
                      <strong>{launchMetrics.totals.checkoutClicks}</strong>
                      <span>Checkout clicks</span>
                    </div>
                  </div>
                  <div className="history-list">
                    {launchMetrics.recentEvents.slice(0, 4).map((event) => (
                      <div className="history-item" key={event.id}>
                        <strong>{event.eventType.replace(/_/g, " ")}</strong>
                        <p>
                          {event.email ?? event.planId ?? "anonymous"} · {event.source} · {formatDate(event.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="status-card">
              <strong>First buyers to target</strong>
              <ul className="feature-list">
                {OUTREACH_CHANNELS.map((channel) => (
                  <li key={channel}>{channel}</li>
                ))}
              </ul>
              <p>Sell the promise of missed-lead recovery before you add broad CRM features.</p>
            </div>
            <div className="status-card">
              <strong>Quick start</strong>
              <div className="checklist">
                {onboardingSteps.map((step) => (
                  <div className={`checklist-item ${step.done ? "done" : ""}`} key={step.label}>
                    <span className="checkmark">{step.done ? "Done" : "Next"}</span>
                    <div>
                      <strong>{step.label}</strong>
                      <p>{step.helper}</p>
                    </div>
                  </div>
                ))}
              </div>
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
              <strong>Weekly value</strong>
              {!analytics ? (
                <p>Connect Gmail and sync your inbox to see weekly impact metrics.</p>
              ) : (
                <div className="analytics-stack">
                  <p>{analytics.weeklySummary}</p>
                  <div className="analytics-grid">
                    <div className="analytics-stat">
                      <strong>{analytics.metrics.followUpsSuggested}</strong>
                      <span>Follow-ups suggested</span>
                    </div>
                    <div className="analytics-stat">
                      <strong>{analytics.metrics.followUpsSent}</strong>
                      <span>Follow-ups sent</span>
                    </div>
                    <div className="analytics-stat">
                      <strong>{analytics.metrics.remindersCompleted}</strong>
                      <span>Reminders completed</span>
                    </div>
                    <div className="analytics-stat">
                      <strong>
                        {analytics.metrics.averageReplyHours === null
                          ? "n/a"
                          : `${analytics.metrics.averageReplyHours}h`}
                      </strong>
                      <span>
                        Avg reply time
                        {analytics.metrics.responseTimeChange === "steady"
                          ? " steady"
                          : analytics.metrics.responseTimeChange === "new"
                            ? " this week"
                            : ` ${analytics.metrics.responseTimeChange}`}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="status-card">
              <strong>Pipeline snapshot</strong>
              <ul className="feature-list">
                <li>{openFollowUps.length} urgent follow-ups</li>
                <li>{activeConversations.length} active conversations</li>
                <li>{snoozedFollowUps.length} snoozed items</li>
                <li>{completedFollowUps.length} completed items</li>
                <li>{dueReminders.length} reminders due now</li>
              </ul>
            </div>
            <div className="status-card">
              <strong>Most active leads</strong>
              {!analytics?.activeLeads.length ? (
                <p>No lead activity yet. Sync Gmail to populate this list.</p>
              ) : (
                <div className="history-list">
                  {analytics.activeLeads.map((lead) => (
                    <div className="history-item" key={lead.conversationId}>
                      <div className="conversation-head compact-head">
                        <div>
                          <h3>{lead.subject}</h3>
                          <p>{lead.contactName ?? lead.contactEmail}</p>
                        </div>
                        <span className={`priority priority-${lead.status === "overdue" ? "high" : "low"}`}>
                          {lead.messageCount} msgs
                        </span>
                      </div>
                      <p className="helper-copy">Last activity {formatDate(lead.lastMessageAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="status-card">
              <strong>Active conversations</strong>
              {activeConversations.length === 0 ? (
                <p>No active conversations yet. Sync Gmail to populate this view.</p>
              ) : (
                <div className="history-list">
                  {activeConversations.map((conversation) => (
                    <div className="history-item" key={conversation.id}>
                      <div className="conversation-head compact-head">
                        <div>
                          <h3>{conversation.subject}</h3>
                          <p>{conversation.contactName ?? conversation.contactEmail}</p>
                        </div>
                        <span className={`priority priority-${conversation.needsFollowUp ? "high" : "low"}`}>
                          {conversation.status}
                        </span>
                      </div>
                      <div className="context-grid">
                        <div className="context-block">
                          <strong>Original message</strong>
                          <p>{conversation.originalMessage || "No original message available."}</p>
                        </div>
                        <div className="context-block">
                          <strong>Latest activity</strong>
                          <p>{conversation.latestMessage || "No recent message available."}</p>
                          <p className="helper-copy">
                            {conversation.latestDirection === "inbound"
                              ? "Latest direction: inbound"
                              : conversation.latestDirection === "outbound"
                                ? "Latest direction: outbound"
                                : "Latest direction unavailable"}
                          </p>
                        </div>
                      </div>
                      <p className="helper-copy">
                        {conversation.followUpReason
                          ? conversation.followUpReason
                          : `Latest activity: ${formatDate(conversation.lastMessageAt)}`}
                      </p>
                      <div className="notes-box">
                        <strong>Lead notes</strong>
                        <textarea
                          className="notes-editor"
                          value={conversationNotes[conversation.id] ?? conversation.notes ?? ""}
                          onChange={(event) =>
                            setConversationNotes((current) => ({
                              ...current,
                              [conversation.id]: event.target.value,
                            }))
                          }
                        />
                        <div className="button-row compact">
                          <button
                            className="ghost-button"
                            disabled={isBusy}
                            onClick={() => handleSaveConversationNotes(conversation.id)}
                          >
                            Save notes
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="status-card">
              <strong>Reminder queue</strong>
              {reminders.length === 0 ? (
                <p>No active reminders yet.</p>
              ) : (
                <div className="history-list">
                  {reminders.slice(0, 4).map((reminder) => (
                    <div className="history-item" key={reminder.id}>
                      <div className="conversation-head compact-head">
                        <div>
                          <h3>{reminder.subject}</h3>
                          <p>{reminder.contactName ?? reminder.contactEmail}</p>
                        </div>
                        <span className={`priority ${reminder.isDue ? "priority-high" : "priority-low"}`}>
                          {reminder.isDue ? "Due" : "Scheduled"}
                        </span>
                      </div>
                      <p className="helper-copy">Reminder: {formatDate(reminder.remindAt)}</p>
                      <div className="button-row compact">
                        <button
                          className="ghost-button"
                          disabled={isBusy}
                          onClick={() => handleDismissReminder(reminder.id)}
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="status-card">
              <strong>Task summary</strong>
              <ul className="feature-list">
                <li>{taskSummary.open} open tasks</li>
                <li>{taskSummary.done} completed tasks</li>
                <li>{taskSummary.canceled} canceled tasks</li>
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
                <li>Sets reminders and shows what is due now</li>
              </ul>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
