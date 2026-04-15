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

export type ConversationItem = {
  id: string;
  subject: string;
  contactName: string | null;
  contactEmail: string;
  notes: string | null;
  status: "new" | "waiting" | "overdue" | "closed";
  needsFollowUp: boolean;
  followUpReason: string | null;
  lastMessageAt: string;
  lastInboundAt: string | null;
  lastOutboundAt: string | null;
  originalMessage: string;
  latestMessage: string;
  latestDirection: "inbound" | "outbound" | "unknown";
};

export type ReminderItem = {
  id: string;
  conversationId: string;
  subject: string;
  contactName: string | null;
  contactEmail: string;
  remindAt: string;
  isDue: boolean;
  status: "active" | "dismissed" | "sent";
};

export type TaskSummary = {
  open: number;
  done: number;
  canceled: number;
};

export type AnalyticsSummary = {
  metrics: {
    followUpsSuggested: number;
    followUpsSent: number;
    remindersCompleted: number;
    averageReplyHours: number | null;
    responseTimeChange: "faster" | "slower" | "steady" | "new";
    responseTimeDeltaHours: number | null;
  };
  weeklySummary: string;
  activeLeads: Array<{
    conversationId: string;
    subject: string;
    contactName: string | null;
    contactEmail: string;
    status: "new" | "waiting" | "overdue" | "closed";
    messageCount: number;
    lastMessageAt: string;
  }>;
};

export type BillingPlan = {
  id: "solo" | "studio";
  name: string;
  priceMonthly: number;
  currency: "USD";
  ctaLabel: string;
  summary: string;
  seats: string;
  features: string[];
};

export type WaitlistEntry = {
  id: string;
  email: string;
  fullName: string | null;
  segment: string | null;
  notes: string | null;
  nextAction: string | null;
  followUpAt: string | null;
  source: string;
  status: string;
  lastContactedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LaunchMetrics = {
  totals: {
    signups: number;
    waitlistJoins: number;
    checkoutClicks: number;
  };
  recentEvents: Array<{
    id: string;
    eventType: string;
    email: string | null;
    userId: string | null;
    planId: string | null;
    source: string;
    createdAt: string;
  }>;
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
  listConversations(token: string) {
    return request<{ items: ConversationItem[] }>("/conversations", {}, token);
  },
  updateConversationNotes(token: string, conversationId: string, notes: string) {
    return request<{ items: ConversationItem[] }>(
      `/conversations/${conversationId}/notes`,
      {
        method: "PATCH",
        body: JSON.stringify({ notes }),
      },
      token,
    );
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
  listReminders(token: string) {
    return request<{ items: ReminderItem[]; tasks: TaskSummary }>("/reminders", {}, token);
  },
  getAnalytics(token: string) {
    return request<AnalyticsSummary>("/analytics", {}, token);
  },
  createReminder(
    token: string,
    conversationId: string,
    input: { preset?: "later_today" | "tomorrow" | "next_week"; remindAt?: string },
  ) {
    return request<{ reminder: { id: string; conversationId: string; remindAt: string; status: string } }>(
      `/conversations/${conversationId}/reminders`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
      token,
    );
  },
  dismissReminder(token: string, reminderId: string) {
    return request<{ items: ReminderItem[]; tasks: TaskSummary }>(
      `/reminders/${reminderId}/dismiss`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
      token,
    );
  },
  listBillingPlans() {
    return request<{ mode: "mock" | "live"; trialDays: number; plans: BillingPlan[] }>("/billing/plans");
  },
  createCheckoutLink(planId: "solo" | "studio") {
    return request<{ mode: "mock" | "live"; url: string; plan: BillingPlan }>(
      "/billing/checkout-link",
      {
        method: "POST",
        body: JSON.stringify({ planId }),
      },
    );
  },
  joinWaitlist(input: {
    email: string;
    fullName?: string;
    segment?: string;
    notes?: string;
    source?: string;
  }) {
    return request<{ entry: WaitlistEntry; alreadyJoined: boolean }>(
      "/launch/waitlist",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
  },
  listWaitlistEntries(limit = 8) {
    return request<{ items: WaitlistEntry[] }>(`/launch/waitlist?limit=${limit}`);
  },
  updateWaitlistEntry(entryId: string, input: { status?: string; notes?: string }) {
    return request<{ entry: WaitlistEntry }>(`/launch/waitlist/${entryId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
  updateWaitlistEntryPlan(
    entryId: string,
    input: { nextAction?: string; followUpAt?: string | null; notes?: string },
  ) {
    return request<{ entry: WaitlistEntry }>(`/launch/waitlist/${entryId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
  getLaunchMetrics() {
    return request<LaunchMetrics>("/launch/metrics");
  },
};
