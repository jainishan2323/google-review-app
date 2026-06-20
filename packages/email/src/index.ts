// @repo/email — Jugnoo's shared transactional email surface (ADR 0018).
// Owns the Resend client, the brand <EmailLayout>, and react-email templates so
// every app/channel sends consistent mail by importing from here.
export { sendPrivateFeedbackAlert } from "./send";
export type { SendPrivateFeedbackAlertInput } from "./send";
export { PrivateFeedbackAlertEmail } from "./templates/private-feedback-alert";
export type { PrivateFeedbackAlertProps } from "./templates/private-feedback-alert";
export { EmailLayout } from "./layout";
