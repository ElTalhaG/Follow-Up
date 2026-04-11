import { AuthError } from "../auth/service.js";
import { trackLaunchEvent } from "../launch/metrics.js";

export type BillingPlanId = "solo" | "studio";

type BillingPlan = {
  id: BillingPlanId;
  name: string;
  priceMonthly: number;
  currency: "USD";
  ctaLabel: string;
  summary: string;
  seats: string;
  features: string[];
};

const BILLING_PLANS: BillingPlan[] = [
  {
    id: "solo",
    name: "Solo",
    priceMonthly: 19,
    currency: "USD",
    ctaLabel: "Start solo trial",
    summary: "For freelancers who want one Gmail workspace and a tight follow-up loop.",
    seats: "1 inbox",
    features: [
      "1 Gmail account",
      "Unlimited follow-up scans",
      "AI drafts in three tones",
      "Reminders and weekly impact summary",
    ],
  },
  {
    id: "studio",
    name: "Studio",
    priceMonthly: 49,
    currency: "USD",
    ctaLabel: "Start studio trial",
    summary: "For tiny agencies coordinating missed leads without a heavy CRM rollout.",
    seats: "Up to 3 inboxes",
    features: [
      "Shared inbox coverage",
      "Lead notes and priority views",
      "Draft history and reminder queue",
      "Concierge onboarding for founding users",
    ],
  },
];

function getStripeBillingMode() {
  return process.env.STRIPE_PAYMENT_LINK_MODE === "live" ? "live" : "mock";
}

function getPlanPaymentLink(planId: BillingPlanId) {
  if (planId === "solo") {
    return process.env.STRIPE_SOLO_PAYMENT_LINK?.trim() ?? "";
  }

  return process.env.STRIPE_STUDIO_PAYMENT_LINK?.trim() ?? "";
}

export function listBillingPlans() {
  return {
    mode: getStripeBillingMode(),
    trialDays: Number(process.env.TRIAL_DAYS ?? 14),
    plans: BILLING_PLANS,
  };
}

export async function createCheckoutLink(planId: string) {
  const normalized = String(planId).toLowerCase() as BillingPlanId;
  const plan = BILLING_PLANS.find((item) => item.id === normalized);

  if (!plan) {
    throw new AuthError("plan must be solo or studio.", 400);
  }

  const link = getPlanPaymentLink(plan.id);

  await trackLaunchEvent({
    eventType: "checkout_clicked",
    planId: plan.id,
    source: "pricing-card",
  });

  if (link) {
    return {
      mode: getStripeBillingMode(),
      url: link,
      plan,
    };
  }

  return {
    mode: "mock" as const,
    url: `https://example.com/followup/${plan.id}-checkout`,
    plan,
  };
}
