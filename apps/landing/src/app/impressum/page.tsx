import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum — Jugnoo",
  description: "Pflichtangaben gemäß § 5 TMG.",
};

export default function ImpressumPage() {
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
        <h1 className="text-3xl font-bold tracking-tight">Impressum</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pflichtangaben gemäß § 5 TMG und § 55 RStV
        </p>

        <div className="mt-10 space-y-10 text-sm leading-relaxed text-foreground/90">

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">Angaben gemäß § 5 TMG</h2>
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1">
              <p className="font-medium">[YOUR FULL NAME OR COMPANY NAME]</p>
              <p className="text-muted-foreground">[Street, House Number]</p>
              <p className="text-muted-foreground">[Postcode, City]</p>
              <p className="text-muted-foreground">Deutschland</p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">Kontakt</h2>
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1">
              <p>
                E-Mail:{" "}
                <a href="mailto:jugnoo@olbaid.de" className="underline hover:text-foreground">
                  jugnoo@olbaid.de
                </a>
              </p>
              <p className="text-muted-foreground">
                Telefon: [YOUR PHONE NUMBER] {" "}
                <span className="text-xs">(kein Support-Kanal)</span>
              </p>
            </div>
          </section>

          {/* Uncomment and fill in if you are a registered company (GmbH, UG, etc.)
          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">Handelsregister</h2>
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1">
              <p>Registergericht: Amtsgericht [CITY]</p>
              <p>Registernummer: HRB [NUMBER]</p>
              <p>Geschäftsführer: [NAME]</p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">Umsatzsteuer-ID</h2>
            <p>
              Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:{" "}
              <span className="font-medium">DE [NUMBER]</span>
            </p>
          </section>
          */}

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
            </h2>
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1">
              <p className="font-medium">[YOUR FULL NAME]</p>
              <p className="text-muted-foreground">[Street, House Number]</p>
              <p className="text-muted-foreground">[Postcode, City]</p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">Streitschlichtung</h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
              <a
                href="https://ec.europa.eu/consumers/odr/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                https://ec.europa.eu/consumers/odr/
              </a>
            </p>
            <p className="mt-3">
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen, da sich unser Angebot ausschließlich an
              Unternehmer richtet.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">Haftung für Inhalte</h2>
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten
              nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
              Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
              Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
              Tätigkeit hinweisen.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">Haftung für Links</h2>
            <p>
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
              Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
              Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der
              Seiten verantwortlich.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">Urheberrecht</h2>
            <p>
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
              dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art
              der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen
              Zustimmung des jeweiligen Autors bzw. Erstellers.
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
