// Feature flags read from NEXT_PUBLIC_* env so the same value is available on the
// server (route handlers) and the client (buttons). Mirrors NEXT_PUBLIC_CARDS_STUDIO.

// Master kill-switch for posting AI/manual replies to Google. Default OFF: until this
// is "true", the modal's "Post to Google" button is disabled AND the reply route 403s,
// so a live Google connection can't be posted to by accident. Flip to enable both.
export const REVIEW_REPLY_POSTING_ENABLED =
  process.env.NEXT_PUBLIC_REVIEW_REPLY_POSTING === "true";
