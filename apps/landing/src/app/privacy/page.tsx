import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Jugnoo",
  description: "How Jugnoo collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-base font-semibold tracking-tight text-foreground">
            Jugnoo
          </Link>
          <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            ← Back to home
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: May 2025 · Datenschutzerklärung gemäß DSGVO
        </p>

        <div className="mt-10 space-y-10 text-sm leading-relaxed text-foreground/90">

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">1. Controller (Verantwortlicher)</h2>
            <p>
              The controller responsible for data processing on this website within the meaning of the
              General Data Protection Regulation (GDPR / DSGVO) is:
            </p>
            <div className="mt-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
              <p className="font-medium">[YOUR FULL NAME OR COMPANY NAME]</p>
              <p className="mt-1 text-muted-foreground">[Street, House Number]</p>
              <p className="text-muted-foreground">[Postcode, City], Germany</p>
              <p className="mt-2 text-muted-foreground">
                Email: <a href="mailto:jugnoo@olbaid.de" className="underline hover:text-foreground">jugnoo@olbaid.de</a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">2. What Data We Collect and Why</h2>

            <h3 className="mb-2 font-medium text-foreground">2.1 Waitlist Sign-Up</h3>
            <p>
              When you submit your email address to join our waitlist, we collect and store your email
              address. The legal basis is your consent (Art. 6(1)(a) GDPR). You may withdraw consent at
              any time by emailing us. We use this data solely to notify you when Jugnoo launches
              and to send relevant product updates.
            </p>

            <h3 className="mb-2 mt-5 font-medium text-foreground">2.2 Dashboard Accounts (Business Users)</h3>
            <p>
              When you create a Jugnoo account, we collect your name, email address, and — if you
              connect your Google Business Profile — your Google account information and access tokens
              required to read your reviews and post replies on your behalf. The legal basis is the
              performance of a contract (Art. 6(1)(b) GDPR).
            </p>

            <h3 className="mb-2 mt-5 font-medium text-foreground">2.3 Google API Data</h3>
            <p>
              Jugnoo uses the Google My Business API to fetch your Google reviews and, where
              authorised by you, to post replies. Our use of data received from Google APIs complies
              with the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements. Google review data is used only to provide
              the dashboard analytics and reply features — it is not sold or used for advertising.
            </p>

            <h3 className="mb-2 mt-5 font-medium text-foreground">2.4 Customer Feedback via QR Form</h3>
            <p>
              When a restaurant customer submits feedback via a Jugnoo QR form, we collect their
              star rating and any optional free-text they provide. This data is associated with the
              business that deployed the QR code. Submissions are anonymous by default; no personal
              identification is stored unless the customer voluntarily provides it.
            </p>

            <h3 className="mb-2 mt-5 font-medium text-foreground">2.5 Server Logs</h3>
            <p>
              Our hosting provider (Vercel Inc.) automatically collects standard server log data
              including IP addresses, browser type, and pages visited. This is a legitimate interest
              (Art. 6(1)(f) GDPR) for security and availability purposes. Edge functions are
              deployed to Vercel&apos;s Frankfurt (EU) region. Vercel is certified under the
              EU–US Data Privacy Framework and appropriate Standard Contractual Clauses (SCCs)
              are in place.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">3. Data Storage &amp; Location</h2>
            <p>
              Jugnoo is built and operated in the European Union. All personal data and business
              data is stored exclusively within the EU:
            </p>
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
                <span className="mt-0.5 text-lg">🇩🇪</span>
                <div>
                  <p className="font-medium">Primary Database — Frankfurt, Germany</p>
                  <p className="mt-1 text-muted-foreground">
                    All review data, feedback, account information, and business data is stored in a
                    PostgreSQL database hosted in Frankfurt, Germany (EU). No personal data leaves
                    the European Economic Area (EEA) at the database layer.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
                <span className="mt-0.5 text-lg">🇪🇺</span>
                <div>
                  <p className="font-medium">Application Hosting — EU Region (Vercel Frankfurt)</p>
                  <p className="mt-1 text-muted-foreground">
                    Our web application is deployed to Vercel&apos;s Frankfurt region. Serverless
                    functions processing your data run within the EU.
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-4">
              We do not transfer your personal data to third countries outside the EEA except where
              strictly necessary for the service (e.g. Google OAuth authentication, which is governed
              by Google&apos;s own GDPR compliance framework). In all such cases, appropriate safeguards
              under Art. 46 GDPR (Standard Contractual Clauses) are in place.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">4. Third-Party Services</h2>
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="font-medium">Google LLC (OAuth, Business API)</p>
                <p className="mt-1 text-muted-foreground">
                  Used for authentication and review management. Privacy policy:{" "}
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">
                    policies.google.com/privacy
                  </a>
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="font-medium">Vercel Inc. (Hosting — EU Frankfurt region)</p>
                <p className="mt-1 text-muted-foreground">
                  Application hosted in Vercel&apos;s Frankfurt (EU) region. SCCs in place for any
                  transatlantic data flows. Privacy policy:{" "}
                  <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline">
                    vercel.com/legal/privacy-policy
                  </a>
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="font-medium">Resend (Transactional Email)</p>
                <p className="mt-1 text-muted-foreground">
                  Used to deliver account and digest emails. Privacy policy:{" "}
                  <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline">
                    resend.com/legal/privacy-policy
                  </a>
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">5. Data Retention</h2>
            <p>
              Waitlist email addresses are deleted within 30 days of a launch notification being sent,
              or upon request. Business account data is retained for the duration of the subscription
              and deleted within 60 days of account closure. Google review data fetched via the API is
              retained as long as needed to provide the service and deleted on account closure.
              Server logs are retained for a maximum of 30 days.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">6. Your Rights Under GDPR</h2>
            <p>You have the following rights regarding your personal data:</p>
            <ul className="mt-3 space-y-1.5 pl-4">
              {[
                "Right of access (Art. 15 GDPR) — request a copy of data we hold about you",
                "Right to rectification (Art. 16 GDPR) — correct inaccurate data",
                "Right to erasure (Art. 17 GDPR) — request deletion of your data ('right to be forgotten')",
                "Right to restriction of processing (Art. 18 GDPR)",
                "Right to data portability (Art. 20 GDPR)",
                "Right to object (Art. 21 GDPR) — object to processing based on legitimate interests",
                "Right to withdraw consent at any time, without affecting prior processing",
              ].map((right) => (
                <li key={right} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  {right}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              To exercise any right, email us at{" "}
              <a href="mailto:jugnoo@olbaid.de" className="underline hover:text-foreground">jugnoo@olbaid.de</a>.
              We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">7. Right to Lodge a Complaint</h2>
            <p>
              You have the right to lodge a complaint with a supervisory authority. The competent authority
              in Germany is the Federal Commissioner for Data Protection and Freedom of Information:
            </p>
            <div className="mt-3 rounded-lg border border-border bg-muted/30 p-4">
              <p className="font-medium">Bundesbeauftragte für den Datenschutz und die Informationsfreiheit (BfDI)</p>
              <p className="mt-1 text-muted-foreground">Graurheindorfer Str. 153, 53117 Bonn</p>
              <p className="text-muted-foreground">
                Website:{" "}
                <a href="https://www.bfdi.bund.de" target="_blank" rel="noopener noreferrer" className="underline">
                  bfdi.bund.de
                </a>
              </p>
            </div>
            <p className="mt-3 text-muted-foreground">
              Alternatively, you may contact the data protection authority of the German federal state
              in which you reside.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">8. Cookies</h2>
            <p>
              This landing page does not set any tracking or advertising cookies. The dashboard
              application uses a single session cookie strictly necessary for authentication. No
              consent is required for this cookie as it is essential for the service to function
              (§ 25 Abs. 2 TTDSG).
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">9. Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. Material changes will be communicated to
              registered users by email at least 14 days before they take effect. Continued use of
              the service after that date constitutes acceptance.
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t border-border/40 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <span aria-hidden>·</span>
            <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
            <span aria-hidden>·</span>
            <Link href="/impressum" className="hover:text-foreground">Impressum</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
