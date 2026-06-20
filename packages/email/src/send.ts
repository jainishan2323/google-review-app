import { createElement } from "react";
import { render } from "@react-email/render";
import { Resend } from "resend";
import {
  PrivateFeedbackAlertEmail,
  type PrivateFeedbackAlertProps,
} from "./templates/private-feedback-alert";

export interface SendPrivateFeedbackAlertInput extends PrivateFeedbackAlertProps {
  /** Owner's verified email (the recipient). */
  to: string;
}

/**
 * Renders and sends the private-feedback alert email (ADR 0018). Best-effort:
 * callers run this inside `after()` and swallow errors so a send failure never
 * affects the customer's feedback submission. No-ops (with a warning) when the
 * Resend env isn't configured, so dev/preview without keys doesn't throw.
 */
export async function sendPrivateFeedbackAlert({
  to,
  ...props
}: SendPrivateFeedbackAlertInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ALERT_FROM_EMAIL;
  if (!apiKey || !from) {
    console.warn(
      "[@repo/email] RESEND_API_KEY or ALERT_FROM_EMAIL not set — skipping send",
    );
    return;
  }

  const element = createElement(PrivateFeedbackAlertEmail, props);
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    subject: `New private feedback for ${props.businessName} — ${props.rating}★`,
    html,
    text,
  });

  if (error) throw new Error(`Resend send failed: ${error.message}`);
}
