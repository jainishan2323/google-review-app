import Link from "next/link";
import {
  QrCode,
  Star,
  BarChart3,
  Zap,
  Shield,
  Mail,
  Bell,
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
import { ScreenshotCarousel } from "@/components/ScreenshotCarousel";
import { cn } from "@/lib/utils";

const HOW_IT_WORKS_STEPS = [
  {
    number: "01",
    Icon: QrCode,
    title: "Scan.",
    description:
      "Put a Jugnoo card on the counter or table. Customer scans, gets a short form. No app. No signup. Takes them about a minute.",
  },
  {
    number: "02",
    Icon: Star,
    title: "Sort.",
    description:
      "If they're happy, the AI writes the Google review for them. They read it, maybe tweak a word, and tap Post.",
  },
  {
    number: "03",
    Icon: BarChart3,
    title: "Save.",
    description:
      "If something went wrong, they get a way to tell you privately. You hear about it first and can fix it before it goes anywhere.",
  },
];


const signInEnabled = process.env.NEXT_PUBLIC_SIGN_IN_ENABLED === "true";

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
            <FireflyLogo size={36} />
            <span className="leading-none">Jugnoo</span>
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

          {signInEnabled && (
            <a
              href={`${process.env.NEXT_PUBLIC_APP_URL}/login`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Sign in
            </a>
          )}
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pb-16 pt-20 sm:pt-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Zap className="size-3" />
              AI-powered review management
            </span>

            {/* Headline */}
            <h1 className="mb-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Your happy customers want to leave a{" "}
              <span className="text-primary">5-star Google review.</span>{" "}
              They just don&apos;t know what to write.
            </h1>

            {/* Subheadline */}
            <p className="mb-8 max-w-2xl text-base text-muted-foreground sm:text-lg">
              We write the review for them. They read it, tap Post, and you get
              another 5 stars. When someone had a bad time, they get a private
              way to tell you first. Before they tell everyone else.
            </p>

            {/* CTAs */}
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              {signInEnabled && (
                <a
                  href={`${process.env.NEXT_PUBLIC_APP_URL}/login`}
                  className={cn(buttonVariants({ size: "lg" }), "gap-2 px-8")}
                >
                  Get Started for Free
                </a>
              )}
              <a
                href="#early-access"
                className={cn(buttonVariants({ variant: signInEnabled ? "outline" : "default", size: "lg" }), "gap-2 px-8")}
              >
                Join Pilot Programme
              </a>
            </div>

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

      {/* ─── Screenshot Carousel ─────────────────────────────── */}
      <div className="py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="relative">
            <ScreenshotCarousel />
            <div className="absolute bottom-5 right-6 opacity-40 pointer-events-none">
              <FireflyLogo size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Features (Bento) ────────────────────────────────── */}
      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Runs in the background while you run your business
            </h2>
            <p className="mt-3 text-muted-foreground">
              More Google reviews from the happy ones, private feedback from the
              unhappy ones, and we write your replies too.
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
                <CardTitle>Catch problems before they go public</CardTitle>
                <CardDescription>
                  The customers who keep coming back care about your place. When
                  something goes wrong, they want to tell you, not post about
                  it. Jugnoo gives them a private way to do that. You hear about
                  it first, fix what needs fixing, and no one reads about it
                  online.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Card 3 — Monday Morning Pulse */}
            <Card>
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="size-5 text-primary" />
                </div>
                <CardTitle>Monday morning email</CardTitle>
                <CardDescription>
                  Every Monday at 9am you get a short email. Every complaint
                  from the past week, what kept coming up, and which way your
                  rating is heading. Read it over coffee. No login.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Card 4 — Live alerts */}
            <Card>
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Bell className="size-5 text-primary" />
                </div>
                <CardTitle>Instant alerts for low ratings</CardTitle>
                <CardDescription>
                  The moment a customer gives 1 or 2 stars, you get a
                  notification. Not the next morning. Right then, while they
                  might still be in the room. That&apos;s your window to fix it
                  before they leave and go public.
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
              Why your Google rating actually matters.
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
                  The sweet spot for trust. A perfect 5.0 looks suspicious. Aim
                  for 4.2 to 4.5 and customers believe it.
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
              We&apos;re onboarding our first customers now.
            </h2>
            <p className="mt-3 mb-6 text-muted-foreground">
              {signInEnabled
                ? "Sign in with Google below and you’re up in about 10 minutes. Or leave your email and I’ll write to you directly."
                : "Drop your email and we will write to you directly when your spot is ready."}
            </p>

            {signInEnabled && (
              <>
                {/* Primary CTA — Google sign in */}
                <div className="mt-8">
                  <a
                    href={`${process.env.NEXT_PUBLIC_APP_URL}/login`}
                    className={cn(buttonVariants({ size: "lg" }), "w-full gap-3")}
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                      <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </a>
                </div>

                {/* Divider */}
                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">or join the waitlist</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              </>
            )}

            <WaitlistForm fullWidth showMessage />
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
