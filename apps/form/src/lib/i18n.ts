/**
 * Lightweight, hand-rolled i18n for the feedback form's static UI chrome (ADR 0021).
 *
 * Deliberately NOT next-intl / i18next: the active language is client state (the
 * customer's switcher choice), not a routed locale, and a library built around locale
 * routing + server resolution would re-introduce the dynamic-render problem we reject.
 *
 * This module is the single seam — every chrome string flows through `messages[locale]`.
 * The `satisfies Record<Locale, Messages>` makes a missing translation a `type-check`
 * failure (our only working gate), so a half-localized language cannot ship. When a new
 * language is added, add its code to SUPPORTED_LOCALES + an endonym + a full messages
 * entry, and the build refuses to compile until every key is filled.
 */

/** The languages the form ships content-complete chrome for. Add a code here only
 *  once its `messages` entry and endonym exist. Phase 1: en + de (ADR 0021). */
export const SUPPORTED_LOCALES = ["en", "de"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Native-name (endonym) — used as the switcher's accessible label. */
export const LANGUAGE_ENDONYMS: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
};

/**
 * Localized fallback welcome — used by form-data when a business hasn't authored a
 * welcome in the active language (welcome is excluded from the dashboard's auto-translate).
 * Right-language-generic beats wrong-language-custom: we never fall back to the welcome
 * authored in a *different* language (ADR 0021).
 */
export const DEFAULT_WELCOME: Record<Locale, string> = {
  en: "Thanks for visiting! We'd love your feedback.",
  de: "Danke für deinen Besuch! Wir freuen uns über dein Feedback.",
};

export interface Messages {
  // step 1
  tapToRate: string;
  rateAria: (star: number) => string;
  // shared
  back: string;
  // step 2
  lovePrompt: string;
  improvePrompt: string;
  morePlaceholder: string;
  next: string;
  // step 3 editor
  reviewReady: string;
  reviewReadySub: string;
  drafting: string;
  generateAnother: string;
  maxVersions: string;
  regenError: string;
  howWritten: string;
  versionOf: (current: number, total: number) => string;
  prevVersion: string;
  nextVersion: string;
  draftFallback: string;
  // action buttons
  postToGoogle: string;
  sendPrivately: string;
  // handoff
  backToEdit: string;
  copyFailedTitle: string;
  copyFailedSub: string;
  copiedTitle: string;
  copiedSub: string;
  addPhotos: string;
  copyReviewText: string;
  openGoogleReviews: string;
  // done
  privateThankYou: string;
  appRatingThanks: string;
  appRatingPrompt: string;
  appRatingAria: (value: number) => string;
  // "How this was written" info sheet
  infoTitle: string;
  infoAria: string;
  infoIntro: string;
  infoYourRating: string;
  infoFooter: string;
  infoClose: string;
  bandLowMood: string;
  bandLowDesc: string;
  bandMidMood: string;
  bandMidDesc: string;
  bandHighMood: string;
  bandHighDesc: string;
  // paste coachmark
  pasteLabel: string;
  pastePlaceholder: string;
}

export const messages = {
  en: {
    tapToRate: "Tap a star to rate",
    rateAria: (star) => `Rate ${star} star${star > 1 ? "s" : ""}`,
    back: "Back",
    lovePrompt: "What did you love?",
    improvePrompt: "What can we improve?",
    morePlaceholder: "Tell us a bit more (optional)...",
    next: "Next",
    reviewReady: "Your review is ready",
    reviewReadySub: "Edit it if you'd like, then choose how to share.",
    drafting: "Drafting your review…",
    generateAnother: "Generate another version",
    maxVersions: "Maximum versions reached",
    regenError: "Couldn't generate another version — try again.",
    howWritten: "How was this written?",
    versionOf: (current, total) => `Version ${current} of ${total}`,
    prevVersion: "Previous version",
    nextVersion: "Next version",
    draftFallback: "Couldn't generate a review right now. Feel free to write your own above.",
    postToGoogle: "Copy & Post to Google",
    sendPrivately: "Send privately to the manager",
    backToEdit: "Back to edit",
    copyFailedTitle: "Almost there — copy your review",
    copyFailedSub:
      "We couldn't copy it automatically. Tap the button below (or select the text), then open Google and paste.",
    copiedTitle: "Review copied!",
    copiedSub: "On the next screen, tap the review box and hold to Paste.",
    addPhotos: "Don't forget to add photos too!",
    copyReviewText: "Copy review text",
    openGoogleReviews: "Open Google Reviews",
    privateThankYou: "Thank you! Your feedback has been sent privately to the manager.",
    appRatingThanks: "Thanks for the feedback! ✓",
    appRatingPrompt: "How was using Jugnoo?",
    appRatingAria: (value) => `Rate Jugnoo ${value} out of 5`,
    infoTitle: "How your review was written",
    infoAria: "How your review was written",
    infoIntro:
      "Your star rating sets the tone. The chips you tapped — and anything you typed — set what it talks about. AI writes the wording.",
    infoYourRating: "Your rating",
    infoFooter:
      "It only uses what you told us — it won't invent things you didn't mention. You can edit the draft, or tap “Generate another version”.",
    infoClose: "Close",
    bandLowMood: "Honest",
    bandLowDesc: "Names what fell short — direct, but not piling on.",
    bandMidMood: "Balanced",
    bandMidDesc: "A fair mix of good and not-so-good. Lands lukewarm.",
    bandHighMood: "Warm",
    bandHighDesc: "Genuinely positive, like a happy regular.",
    pasteLabel: "Paste",
    pastePlaceholder: "Share details of your experience…",
  },
  de: {
    tapToRate: "Tippe auf einen Stern zum Bewerten",
    rateAria: (star) => `Mit ${star} Stern${star > 1 ? "en" : ""} bewerten`,
    back: "Zurück",
    lovePrompt: "Was hat dir gefallen?",
    improvePrompt: "Was können wir verbessern?",
    morePlaceholder: "Erzähl uns etwas mehr (optional)...",
    next: "Weiter",
    reviewReady: "Deine Bewertung ist fertig",
    reviewReadySub: "Bearbeite sie bei Bedarf und wähle dann, wie du sie teilst.",
    drafting: "Deine Bewertung wird erstellt…",
    generateAnother: "Andere Version erstellen",
    maxVersions: "Maximale Anzahl an Versionen erreicht",
    regenError: "Konnte keine weitere Version erstellen — bitte erneut versuchen.",
    howWritten: "Wie wurde das geschrieben?",
    versionOf: (current, total) => `Version ${current} von ${total}`,
    prevVersion: "Vorherige Version",
    nextVersion: "Nächste Version",
    draftFallback:
      "Konnte gerade keine Bewertung erstellen. Du kannst oben gern deine eigene schreiben.",
    postToGoogle: "Kopieren & auf Google posten",
    sendPrivately: "Privat an die Leitung senden",
    backToEdit: "Zurück zum Bearbeiten",
    copyFailedTitle: "Fast geschafft — kopiere deine Bewertung",
    copyFailedSub:
      "Wir konnten sie nicht automatisch kopieren. Tippe auf die Schaltfläche unten (oder markiere den Text), öffne dann Google und füge ein.",
    copiedTitle: "Bewertung kopiert!",
    copiedSub: "Tippe auf dem nächsten Bildschirm in das Bewertungsfeld und halte zum Einfügen gedrückt.",
    addPhotos: "Vergiss nicht, auch Fotos hinzuzufügen!",
    copyReviewText: "Bewertungstext kopieren",
    openGoogleReviews: "Google-Bewertungen öffnen",
    privateThankYou: "Danke! Dein Feedback wurde privat an die Leitung gesendet.",
    appRatingThanks: "Danke für dein Feedback! ✓",
    appRatingPrompt: "Wie war die Nutzung von Jugnoo?",
    appRatingAria: (value) => `Jugnoo mit ${value} von 5 bewerten`,
    infoTitle: "Wie deine Bewertung geschrieben wurde",
    infoAria: "Wie deine Bewertung geschrieben wurde",
    infoIntro:
      "Deine Sternebewertung gibt den Ton vor. Die getippten Chips — und alles, was du geschrieben hast — bestimmen den Inhalt. Die KI formuliert den Text.",
    infoYourRating: "Deine Bewertung",
    infoFooter:
      "Es wird nur verwendet, was du uns mitgeteilt hast — nichts wird erfunden, was du nicht erwähnt hast. Du kannst den Entwurf bearbeiten oder auf „Andere Version erstellen“ tippen.",
    infoClose: "Schließen",
    bandLowMood: "Ehrlich",
    bandLowDesc: "Benennt, was gefehlt hat — direkt, aber ohne nachzutreten.",
    bandMidMood: "Ausgewogen",
    bandMidDesc: "Eine faire Mischung aus Gut und weniger Gut. Bleibt lauwarm.",
    bandHighMood: "Herzlich",
    bandHighDesc: "Ehrlich positiv, wie ein zufriedener Stammgast.",
    pasteLabel: "Einfügen",
    pastePlaceholder: "Teile Einzelheiten zu deiner Erfahrung…",
  },
} satisfies Record<Locale, Messages>;
