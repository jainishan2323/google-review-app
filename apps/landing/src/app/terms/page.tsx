import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Jugnoo",
  description: "Terms and conditions for using Jugnoo.",
};

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: May 2025 · Governed by German law
        </p>

        <div className="mt-10 space-y-10 text-sm leading-relaxed text-foreground/90">

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">1. Provider</h2>
            <p>
              Jugnoo is operated by:
            </p>
            <div className="mt-3 rounded-lg border border-border bg-muted/30 p-4">
              <p className="font-medium">[YOUR FULL NAME OR COMPANY NAME]</p>
              <p className="mt-1 text-muted-foreground">[Street, House Number]</p>
              <p className="text-muted-foreground">[Postcode, City], Germany</p>
              <p className="mt-2 text-muted-foreground">
                Email: <a href="mailto:jugnoo@olbaid.de" className="underline hover:text-foreground">jugnoo@olbaid.de</a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">2. Scope of Service</h2>
            <p>
              Jugnoo provides a Software-as-a-Service (SaaS) platform that enables restaurant and
              hospitality businesses to collect customer feedback via QR codes, manage and analyse Google
              reviews, and draft AI-assisted replies. The service is intended for business customers
              (Unternehmer, § 14 BGB) only, not consumers.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">3. Account Registration</h2>
            <p>
              To use the dashboard, you must create an account using a valid Google account. You are
              responsible for maintaining the confidentiality of your credentials and for all activity
              that occurs under your account. You must provide accurate and complete information and
              keep it up to date. You must be at least 18 years old and have the authority to bind your
              business to these Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">4. Google Account Access</h2>
            <p>
              By connecting your Google Business Profile, you authorise Jugnoo to access your Google
              reviews and post replies on your behalf using the permissions you grant via Google OAuth.
              You may revoke this access at any time via your{" "}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Google Account permissions
              </a>
              . Jugnoo does not store your Google password. Our use of Google data is governed by
              the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Google API Services User Data Policy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">5. AI-Generated Content</h2>
            <p>
              Jugnoo uses AI to generate review text on behalf of customers and draft replies on
              behalf of business owners. You acknowledge that:
            </p>
            <ul className="mt-3 space-y-1.5 pl-4">
              {[
                "AI-generated content is a draft and should be reviewed before posting.",
                "You are solely responsible for any content posted to Google under your account.",
                "You must not post AI-generated reviews that are false, misleading, or violate Google's review policies.",
                "Jugnoo does not guarantee the accuracy, tone, or appropriateness of AI-generated content.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">6. Subscription and Payment</h2>
            <p>
              Jugnoo is offered on a subscription basis. Pricing is displayed on the website and
              confirmed at checkout. Subscriptions renew automatically unless cancelled before the
              renewal date. Invoices are issued in EUR and include applicable German VAT (Mehrwertsteuer).
            </p>
            <p className="mt-3">
              As a business customer (B2B), the statutory 14-day right of withdrawal (Widerrufsrecht)
              under § 312g BGB does not apply to SaaS subscriptions once the service has commenced,
              unless otherwise agreed in writing.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">7. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="mt-3 space-y-1.5 pl-4">
              {[
                "Use Jugnoo to generate or post fake, fabricated, or deceptive reviews.",
                "Violate Google's Terms of Service or review policies.",
                "Attempt to reverse-engineer, scrape, or otherwise misuse the service.",
                "Use the service for any unlawful purpose under German or EU law.",
                "Share account access with third parties outside your organisation.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-3">
              We reserve the right to suspend or terminate accounts in breach of these terms without
              prior notice.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">8. Availability</h2>
            <p>
              We aim for high availability but do not guarantee uninterrupted access to the service.
              Scheduled maintenance will be communicated in advance where possible. We are not liable
              for downtime caused by third-party services (including Google APIs or Vercel).
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">9. Limitation of Liability</h2>
            <p>
              To the extent permitted by German law, Jugnoo is liable only for damages caused by
              intent (Vorsatz) or gross negligence (grobe Fahrlässigkeit), or for damages resulting
              from injury to life, body, or health. Liability for slight negligence is excluded except
              for breaches of essential contractual obligations (Kardinalpflichten), in which case
              liability is limited to foreseeable, typical damages.
            </p>
            <p className="mt-3">
              Jugnoo is not liable for decisions made by you based on AI-generated content, for
              changes to Google's review policies, or for the removal or modification of reviews by
              Google.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">10. Intellectual Property</h2>
            <p>
              Jugnoo and its original content, features, and technology are owned by the provider
              and protected under applicable intellectual property law. You retain ownership of all
              review data and customer feedback data uploaded or generated through your account.
              By using the service, you grant Jugnoo a limited licence to process this data solely
              to deliver the service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">11. Termination</h2>
            <p>
              You may cancel your subscription at any time from your account settings. Cancellation
              takes effect at the end of the current billing period. Upon termination, your data will
              be deleted within 60 days. We may terminate accounts that violate these Terms immediately
              and without refund.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">12. Changes to These Terms</h2>
            <p>
              We may update these Terms with at least 14 days&apos; written notice to registered users.
              Continued use of the service after the effective date constitutes acceptance. If you do
              not accept the updated Terms, you may cancel your subscription before they take effect.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">13. Governing Law and Jurisdiction</h2>
            <p>
              These Terms are governed by the laws of the Federal Republic of Germany, excluding the
              UN Convention on Contracts for the International Sale of Goods (CISG). The exclusive
              place of jurisdiction for all disputes arising from or in connection with these Terms
              is [YOUR CITY], Germany, provided you are a merchant (Kaufmann) or legal entity under
              public law.
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
