export type FlaggedConversation = {
  id: string;
  subject: string;
  contactName: string;
  contactEmail: string;
  status: "new" | "waiting" | "overdue" | "closed";
  priority: "high" | "medium" | "low";
  followUpReason: string;
  suggestedDraft: string;
};

const demoFlaggedConversations: FlaggedConversation[] = [
  {
    id: "conv_1",
    subject: "Branding help for a product launch",
    contactName: "Emma Rossi",
    contactEmail: "emma@example.com",
    status: "overdue",
    priority: "high",
    followUpReason: "Inbound lead sent a project question 31 hours ago without a reply.",
    suggestedDraft:
      "Hi Emma, just circling back in case my note got buried. I'd be happy to help with the launch branding and can send a quick plan with pricing options today.",
  },
  {
    id: "conv_2",
    subject: "Coaching package follow-up",
    contactName: "Aiden Brooks",
    contactEmail: "aiden@example.com",
    status: "waiting",
    priority: "medium",
    followUpReason: "Warm conversation has been inactive for 5 days after pricing was shared.",
    suggestedDraft:
      "Hi Aiden, checking in on the coaching package we discussed. If you'd like, I can recommend the simplest option based on your goals and timeline.",
  },
];

export function getDemoFlaggedConversations() {
  return demoFlaggedConversations;
}
