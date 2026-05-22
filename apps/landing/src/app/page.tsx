import Link from "next/link";
import {
  QrCode,
  Star,
  BarChart3,
  Zap,
  Shield,
  Mail,
  Sparkles,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { WaitlistForm } from "@/components/WaitlistForm";
import { AIReviewCard } from "@/components/AIReviewCard";
import { FireflyLogo } from "@/components/FireflyLogo";
import { cn } from "@/lib/utils";

const HOW_IT_WORKS_STEPS = [
  {
    number: "01",
    Icon: QrCode,
    title: "Scan.",
    description:
      "Place a Jugnoo card at your counter, reception, or checkout. Customers scan to open a short feedback form — no app, no account, done in under a minute.",
  },
  {
    number: "02",
    Icon: Star,
    title: "Sort.",
    description:
      "Happy customers get a ready-to-post Google review, written by our AI based on what they just told us. They just tap Post.",
  },
  {
    number: "03",
    Icon: BarChart3,
    title: "Save.",
    description:
      "Low ratings prompt customers to share their feedback with you anonymously. You hear about problems directly — before they turn into a public post.",
  },
];


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* ─── Navbar ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground"
          >
            <FireflyLogo size={28} />
            Jugnoo
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <Link
              href="#how-it-works"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              How it Works
            </Link>
            <Link
              href="#features"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="#early-access"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Get Early Access
            </Link>
          </div>

          <a
            href="#early-access"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Join Waitlist
          </a>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pb-16 pt-20 sm:pb-24 sm:pt-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Zap className="size-3" />
              AI-powered review management
            </span>

            {/* Headline */}
            <h1 className="mb-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Turn happy customers into{" "}
              <span className="text-primary">5-star Google Reviews.</span>{" "}
              Catch unhappy ones before they post.
            </h1>

            {/* Subheadline */}
            <p className="mb-10 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Happy customers get an AI-drafted Google review ready to post in
              seconds. Unhappy ones get a private, anonymous channel to share
              feedback with you — so you hear about problems before they go
              anywhere else.
            </p>

            {/* Trust badges */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {[
                { flag: "🇩🇪", label: "Data stored in Frankfurt, EU" },
                { flag: "🇪🇺", label: "GDPR compliant" },
              ].map(({ flag, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <span>{flag}</span>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Hero visual placeholder */}
        <div className="mx-auto mt-16 max-w-5xl px-4 sm:px-6">
          <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-muted to-muted/30">
            <p className="text-sm text-muted-foreground">
              [ Phone + Dashboard screenshot ]
            </p>
            <div className="absolute bottom-5 right-6 opacity-40">
              <FireflyLogo size={22} />
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="border-y border-border/40 bg-muted/30 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How it Works
            </h2>
            <p className="mt-3 text-muted-foreground">
              Three steps. Takes 60 seconds to set up.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-0">
            {HOW_IT_WORKS_STEPS.map((step, index) => (
              <div
                key={step.number}
                className={cn(
                  "relative flex flex-col items-center px-6 text-center",
                  index < HOW_IT_WORKS_STEPS.length - 1 &&
                    "md:border-r md:border-border"
                )}
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background ring-4 ring-background">
                  <step.Icon className="size-6 text-primary" />
                </div>
                <span className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {step.number}
                </span>
                <h3 className="mb-2 text-xl font-bold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features (Bento) ────────────────────────────────── */}
      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything running while you run your business
            </h2>
            <p className="mt-3 text-muted-foreground">
              More reviews from happy customers, private feedback from unhappy
              ones, and AI-drafted replies to everything in between.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Card 1 — spans 2 cols × 3 rows on desktop */}
            <AIReviewCard />

            {/* Card 2 — Active Reputation Shield */}
            <Card>
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="size-5 text-primary" />
                </div>
                <CardTitle>Active Reputation Shield</CardTitle>
                <CardDescription>
                  When a customer has a bad experience, they usually go straight
                  to Google. Jugnoo gives them a private, anonymous way to
                  share that feedback with you instead — so you hear about it
                  first and get the chance to make it right.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Card 3 — Monday Morning Pulse */}
            <Card>
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="size-5 text-primary" />
                </div>
                <CardTitle>The Monday Morning Pulse</CardTitle>
                <CardDescription>
                  Every Monday at 9am we send you a short email: what complaints
                  came in that week, any recurring issues, and how your rating
                  is tracking. No login needed.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Card 4 — 1-Click AI Replies */}
            <Card>
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Sparkles className="size-5 text-primary" />
                </div>
                <CardTitle>1-Click AI Replies</CardTitle>
                <CardDescription>
                  Replying to every review takes time you don&apos;t have. For every
                  new review, we draft a reply that sounds like you — edit it
                  if you want, or approve and send in one click.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── The Cost of Doing Nothing ───────────────────────── */}
      <section className="border-y border-border/40 bg-muted/30 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              The cost of doing nothing
            </h2>
            <p className="mt-3 text-muted-foreground">
              The numbers behind why online reputation isn&apos;t optional.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Stat 1 */}
            <Card className="text-center">
              <CardContent className="px-6 pb-8 pt-10">
                <p className="text-6xl font-extrabold tracking-tight text-destructive">
                  -9%
                </p>
                <p className="mt-5 text-sm leading-relaxed text-foreground">
                  A one-star drop in your rating leads to a 5–9% decrease in
                  total revenue.
                </p>
                <a
                  href="https://www.hbs.edu/ris/Publication%20Files/12-016_a7e4a5a2-03f9-490d-b093-8f951238dba2.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 block text-xs text-muted-foreground underline-offset-2 hover:underline"
                >
                  Source: Harvard Business School
                </a>
              </CardContent>
            </Card>

            {/* Stat 2 */}
            <Card className="text-center">
              <CardContent className="px-6 pb-8 pt-10">
                <p className="text-6xl font-extrabold tracking-tight text-foreground">
                  30
                </p>
                <p className="mt-5 text-sm leading-relaxed text-foreground">
                  The number of potential customers a business loses from just
                  one unhandled negative review.
                </p>
                <a
                  href="https://www.brightlocal.com/blog/the-impact-of-online-reviews/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 block text-xs text-muted-foreground underline-offset-2 hover:underline"
                >
                  Source: BrightLocal Consumer Survey
                </a>
              </CardContent>
            </Card>

            {/* Stat 3 */}
            <Card className="text-center">
              <CardContent className="px-6 pb-8 pt-10">
                <p className="text-6xl font-extrabold tracking-tight text-primary">
                  4.5
                </p>
                <p className="mt-5 text-sm leading-relaxed text-foreground">
                  The optimal star rating for maximum trust. Perfect 5.0 ratings
                  look fake. We help you build an authentic 4.2–4.5 profile.
                </p>
                <a
                  href="https://spiegel.medill.northwestern.edu/star-ratings-and-review-content/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 block text-xs text-muted-foreground underline-offset-2 hover:underline"
                >
                  Source: Northwestern University Spiegel Research Center
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── Early Access ─────────────────────────────────────── */}
      <section
        id="early-access"
        className="border-y border-border/40 bg-muted/30 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Be first through the door.
            </h2>
            <p className="mt-3 text-muted-foreground">
              We&apos;re onboarding our first businesses now. Drop your email and
              tell us what you&apos;re most excited to try — we&apos;ll reach out personally.
            </p>
            <div className="mt-8">
              <WaitlistForm fullWidth showMessage />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────── */}
      <footer className="py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/privacy" className="transition-colors hover:text-foreground">
                Privacy Policy
              </Link>
              <span aria-hidden>·</span>
              <Link href="/terms" className="transition-colors hover:text-foreground">
                Terms of Service
              </Link>
              <span aria-hidden>·</span>
              <Link href="/impressum" className="transition-colors hover:text-foreground">
                Impressum
              </Link>
            </div>

            <p className="order-last text-sm text-muted-foreground sm:order-none">
              &copy; {new Date().getFullYear()} Jugnoo. All rights reserved.
            </p>

            <a
              href="mailto:jugnoo@olbaid.de"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              jugnoo@olbaid.de
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
