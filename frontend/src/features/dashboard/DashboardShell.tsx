const flaggedConversations = [
  {
    id: "conv_1",
    subject: "Website redesign inquiry",
    contact: "Maya Jensen",
    reason: "Inbound lead has not received a reply in 31 hours.",
    priority: "High",
    draft:
      "Hi Maya, just following up in case my reply slipped past you. I'd love to help with the redesign and can share a simple next-step plan if useful.",
  },
  {
    id: "conv_2",
    subject: "Monthly retainer follow-up",
    contact: "North Studio",
    reason: "Warm conversation has been inactive for 5 days.",
    priority: "Medium",
    draft:
      "Hi team, checking back in on the monthly retainer conversation. If timing still works on your side, I can send over a scoped proposal today.",
  },
];

export function DashboardShell() {
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
            <span className="pill">2 flagged</span>
          </div>
          <div className="stack">
            {flaggedConversations.map((conversation) => (
              <div className="conversation-card" key={conversation.id}>
                <div className="conversation-head">
                  <div>
                    <h3>{conversation.subject}</h3>
                    <p>{conversation.contact}</p>
                  </div>
                  <span className="priority">{conversation.priority}</span>
                </div>
                <p className="reason">{conversation.reason}</p>
                <div className="draft-box">
                  <strong>Suggested draft</strong>
                  <p>{conversation.draft}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>What v1 includes</h2>
          </div>
          <ul className="feature-list">
            <li>Read-only Gmail sync</li>
            <li>Unanswered lead detection</li>
            <li>Reminder and snooze flow</li>
            <li>Editable AI follow-up drafts</li>
            <li>Simple conversation status tracking</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
