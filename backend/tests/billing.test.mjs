import test from "node:test";
import assert from "node:assert/strict";
import { listBillingPlans, createCheckoutLink } from "../dist/billing/service.js";

test("billing plans expose starter monetization metadata", () => {
  process.env.TRIAL_DAYS = "14";
  process.env.STRIPE_PAYMENT_LINK_MODE = "mock";

  const result = listBillingPlans();

  assert.equal(result.trialDays, 14);
  assert.equal(result.plans.length, 2);
  assert.equal(result.plans[0].id, "solo");
  assert.equal(result.plans[1].id, "studio");
});

test("checkout links can use configured payment links or safe fallback urls", () => {
  process.env.STRIPE_SOLO_PAYMENT_LINK = "https://buy.stripe.com/test_solo";
  process.env.STRIPE_PAYMENT_LINK_MODE = "live";

  const live = createCheckoutLink("solo");
  assert.equal(live.mode, "live");
  assert.equal(live.url, "https://buy.stripe.com/test_solo");

  delete process.env.STRIPE_STUDIO_PAYMENT_LINK;
  const fallback = createCheckoutLink("studio");
  assert.equal(fallback.mode, "mock");
  assert.match(fallback.url, /studio-checkout$/);
});
