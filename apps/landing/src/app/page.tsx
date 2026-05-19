import Link from "next/link";
import {
  QrCode,
  Star,
  BarChart3,
  Check,
  Zap,
  Shield,
  Mail,
  Sparkles,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { WaitlistForm } from "@/components/WaitlistForm";
import { cn } from "@/lib/utils";

const HOW_IT_WORKS_STEPS = [
  {
    number: "01",
    Icon: QrCode,
    title: "Scan.",
    description:
      "Customers scan a branded QR code placed at the table. No app download needed — it opens instantly in their browser.",
  },
  {
    number: "02",
    Icon: Star,
    title: "Sort.",
    description:
      "4 & 5-star experiences are routed to Google with AI-generated review text, ready to post in one tap.",
  },
  {
    number: "03",
    Icon: BarChart3,
    title: "Save.",
    description:
      "1–3 star complaints are captured privately into your operational dashboard so you can act fast — before they go public.",
  },
];

const PRICING_FEATURES = [
  "Unlimited QR Scans",
  "AI Review Generation",
  "Operational Analytics Dashboard",
  "Weekly Reports",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* ─── Navbar ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="text-base font-semibold tracking-tight text-foreground"
          >
            ReviewFlow
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
              href="#pricing"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </Link>
          </div>

          <a
            href="#waitlist"
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
              The AI-powered QR form that cures &ldquo;blank page syndrome&rdquo; for
              your customers and gives you real-time operational analytics.
            </p>

            {/* CTA */}
            <div id="waitlist" className="w-full max-w-md">
              <WaitlistForm />
            </div>
          </div>
        </div>

        {/* Hero visual placeholder */}
        <div className="mx-auto mt-16 max-w-5xl px-4 sm:px-6">
          <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-muted to-muted/30">
            <p className="text-sm text-muted-foreground">
              [ Phone + Dashboard screenshot ]
            </p>
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
              Your always-on reputation engine
            </h2>
            <p className="mt-3 text-muted-foreground">
              Not just analytics — an active system that works while you&apos;re
              serving tables.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Card 1 — spans 2 cols × 3 rows on desktop */}
            <Card className="md:col-span-2 md:row-span-3">
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="size-5 text-primary" />
                </div>
                <CardTitle className="text-lg">AI Review Generation</CardTitle>
                <CardDescription>
                  Removes the friction of the blank page. When a happy customer
                  submits their experience, our AI drafts a personalised,
                  detailed Google review for them — they just tap Post.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mt-2 rounded-xl border border-border bg-muted/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    AI-generated preview
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-foreground">
                    &ldquo;Had an amazing dinner here. The pasta was cooked to
                    perfection and our server was incredibly attentive. Will
                    definitely be coming back — highly recommend the tiramisu!&rdquo;
                  </p>
                  <div className="mt-3 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="size-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                </div>

                {/* Divider with label */}
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium text-muted-foreground">
                    and for every new review
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Reply preview */}
                <div className="mt-4 rounded-xl border border-border bg-muted/50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      AI reply — ready to send
                    </p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      <span className="size-1.5 rounded-full bg-primary" />
                      1-click approve
                    </span>
                  </div>

                  {/* Original review (compact) */}
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2">
                    <div className="mt-0.5 flex shrink-0 gap-0.5">
                      <Star className="size-3 fill-yellow-400 text-yellow-400" />
                      <Star className="size-3 fill-muted text-muted-foreground" />
                      <Star className="size-3 fill-muted text-muted-foreground" />
                      <Star className="size-3 fill-muted text-muted-foreground" />
                      <Star className="size-3 fill-muted text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      &ldquo;The wait was too long and the food arrived cold.&rdquo;
                    </p>
                  </div>

                  {/* Draft reply */}
                  <div className="mt-3 flex items-start gap-2.5">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <MessageSquare className="size-3 text-primary" />
                    </div>
                    <p className="text-sm leading-relaxed text-foreground">
                      &ldquo;Hi Maria, thank you for your honest feedback. We&apos;re
                      sorry the wait and food temperature fell short — this is
                      not the standard we set for ourselves. Please reach out
                      directly so we can make it right.&rdquo;
                    </p>
                  </div>

                  {/* Action row */}
                  <div className="mt-4 flex items-center justify-between">
                    <button className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                      Regenerate
                      <ChevronRight className="size-3" />
                    </button>
                    <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                      <MessageSquare className="size-3" />
                      Approve &amp; Send
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2 — Active Reputation Shield */}
            <Card>
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="size-5 text-primary" />
                </div>
                <CardTitle>Active Reputation Shield</CardTitle>
                <CardDescription>
                  Don&apos;t just analyze the past; protect your future. Our
                  physical QR table codes intercept unhappy customers before
                  they leave, routing 1-star complaints to your private
                  dashboard instead of your public Google profile.
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
                  Too busy to log into a dashboard? We push the insights to
                  you. Get an automated weekly email every Monday at 9:00&nbsp;AM
                  summarising intercepted complaints, trending issues, and your
                  overall review health.
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
                  Google&apos;s algorithm rewards businesses that reply quickly.
                  Our AI instantly drafts context-aware, professional replies to
                  every new review — saving you hours of tedious typing every
                  month.
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
                <p className="mt-5 text-xs text-muted-foreground">
                  Source: Harvard Business School
                </p>
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
                <p className="mt-5 text-xs text-muted-foreground">
                  Source: BrightLocal Consumer Survey
                </p>
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
                <p className="mt-5 text-xs text-muted-foreground">
                  Source: Northwestern University Spiegel Research Center
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── Pricing ─────────────────────────────────────────── */}
      <section
        id="pricing"
        className="border-y border-border/40 bg-muted/30 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple pricing
            </h2>
            <p className="mt-3 text-muted-foreground">
              One plan. Everything included. No surprises.
            </p>
          </div>

          <div className="mx-auto max-w-md">
            <Card className="ring-2 ring-primary/30">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Starter</CardTitle>
                <div className="mt-4">
                  <span className="text-5xl font-extrabold">$29</span>
                  <span className="ml-1 text-muted-foreground">/ month</span>
                </div>
                <CardDescription className="mt-2">
                  Everything you need to grow your reputation.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {PRICING_FEATURES.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Check className="size-3 text-primary" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="border-none bg-transparent pt-2">
                <WaitlistForm fullWidth />
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────── */}
      <footer className="py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="#" className="transition-colors hover:text-foreground">
                Privacy Policy
              </a>
              <span aria-hidden>·</span>
              <a href="#" className="transition-colors hover:text-foreground">
                Terms of Service
              </a>
            </div>

            <p className="order-last text-sm text-muted-foreground sm:order-none">
              &copy; {new Date().getFullYear()} ReviewFlow. All rights reserved.
            </p>

            <a
              href="mailto:support@yourdomain.com"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              support@yourdomain.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
