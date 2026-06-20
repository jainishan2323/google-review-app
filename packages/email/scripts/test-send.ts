// Dev-only: send one real private-feedback alert so you can see it in your inbox.
//
//   RESEND_API_KEY=re_xxx \
//   ALERT_FROM_EMAIL='onboarding@resend.dev' \
//   pnpm --filter @repo/email test:send you@example.com
//
// NOTE on Resend's sandbox: until you've verified a sending domain, `from` must
// be `onboarding@resend.dev` and `to` must be the email on your Resend account.
import { sendPrivateFeedbackAlert } from "../src/send";

async function main() {
  const to = process.argv[2];
  if (!to) {
    console.error("Usage: pnpm --filter @repo/email test:send <recipient-email>");
    process.exit(1);
  }
  if (!process.env.RESEND_API_KEY || !process.env.ALERT_FROM_EMAIL) {
    console.error("Set RESEND_API_KEY and ALERT_FROM_EMAIL in the environment first.");
    process.exit(1);
  }

  await sendPrivateFeedbackAlert({
    to,
    businessName: "Cafe Luna",
    rating: 2,
    dashboardUrl: "http://localhost:3000/dashboard/feedback",
  });

  console.log(`Sent private-feedback alert to ${to}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
