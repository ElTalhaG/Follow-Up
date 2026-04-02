import test from "node:test";
import assert from "node:assert/strict";
import { loadBackendModules, resetDatabase } from "./helpers.mjs";

test("drafts, reminders, and analytics return usable workflow data", async () => {
  resetDatabase();
  const {
    generateDraft,
    listDraftHistory,
    updateDraftContent,
    createConversationReminder,
    listReminders,
    dismissReminder,
    getAnalyticsSummary,
  } = await loadBackendModules();

  const createdDraft = await generateDraft("user_1", "followup_1", "professional");
  assert.equal(createdDraft.content.trim().length > 0, true);

  const updatedDraft = await updateDraftContent(
    "user_1",
    createdDraft.id,
    "Hi Maya,\n\nChecking in with a clean next step.\n\nThanks,",
  );
  assert.match(updatedDraft.content, /Checking in/);

  const history = await listDraftHistory("user_1", "followup_1");
  assert.equal(history.length > 0, true);

  const reminder = await createConversationReminder("user_1", "conv_1", {
    preset: "tomorrow",
  });
  assert.ok(reminder.id);

  const remindersBeforeDismiss = await listReminders("user_1");
  assert.equal(remindersBeforeDismiss.length > 0, true);

  await dismissReminder("user_1", reminder.id);
  const remindersAfterDismiss = await listReminders("user_1");
  assert.equal(remindersAfterDismiss.some((item) => item.id === reminder.id), false);

  const analytics = await getAnalyticsSummary("user_1");
  assert.equal(typeof analytics.weeklySummary, "string");
  assert.equal(analytics.activeLeads.length > 0, true);
  assert.equal(typeof analytics.metrics.followUpsSuggested, "number");
});
