import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { ArrowRight, Check, Sparkles, Target, FileText, Map } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      throw redirect({ to: "/app" });
    }
  },
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "InsightFlow — Validate ideas, analyze feedback, prioritize what to build" },
      {
        name: "description",
        content:
          "Analyze real user feedback or pressure-test a new idea. InsightFlow tells you what to prioritize next; the bug to fix, the upgrade to ship, or the feature to build.",
      },
      { property: "og:title", content: "InsightFlow — Decide what to fix, upgrade, or build next" },
      {
        property: "og:description",
        content:
          "From scattered reviews to unbuilt ideas — InsightFlow scores every pain point, validates with market context, and turns it into a prioritized roadmap.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@500;600;700&display=swap",
      },
    ],
  }),
});

function useReveal() {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const els = ref.current?.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!els || !els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-revealed");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
}

function LandingPage() {
  const ref = useReveal();

  return (
    <div ref={ref} className="min-h-screen bg-background text-foreground">
      <style>{`
        [data-reveal]{opacity:0;transform:translateY(16px);transition:opacity .7s ease,transform .7s ease}
        [data-reveal].is-revealed{opacity:1;transform:none}
      `}</style>

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-base font-semibold text-foreground">
            InsightFlow
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-md px-3 py-2 text-sm text-foreground-muted transition-colors hover:text-foreground"
            >
              Log in
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover btn-glow"
            >
              Start Now
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="hero-beam" aria-hidden />
        <div className="hero-grid absolute inset-0 -z-10" aria-hidden />
        <div className="mx-auto max-w-4xl px-6 pb-20 pt-20 text-center sm:pt-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-foreground-muted backdrop-blur">
            <Sparkles className="h-3 w-3 text-primary" />
            AI-powered product intelligence
          </div>

          <h1
            className="font-display mt-6 text-foreground"
            style={{ fontSize: "clamp(34px, 6vw, 64px)", lineHeight: 1.05 }}
          >
            Stop guessing what to build next.
            <br />
            <span className="text-gradient-brand">Start deciding with evidence.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-[680px] text-[16px] leading-7 text-foreground-muted">
            Analyze real user feedback or pressure-test a new idea. InsightFlow tells you
            what to prioritize next; the bug to fix, the upgrade to ship, or the feature
            to build.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover btn-glow sm:w-auto"
            >
              Start Now <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-12 w-full items-center justify-center rounded-md border border-border bg-surface px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:w-auto"
            >
              See how it works
            </a>
          </div>

          <p className="mt-5 text-[13px] text-foreground-muted">
            Used by founders, product teams, and SMB owners who ship faster.
          </p>

          {/* Hero visual mock */}
          <div data-reveal className="mt-14">
            <div className="card-halo mx-auto max-w-3xl overflow-hidden rounded-xl border border-border bg-surface text-left">
              <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
                <span className="ml-3 font-display text-[11px] text-foreground-muted">
                  insightflow / analyze
                </span>
              </div>
              <div className="grid gap-4 p-5 sm:grid-cols-5">
                <div className="sm:col-span-3 space-y-2.5">
                  <div className="text-[11px] uppercase tracking-wider text-foreground-muted">
                    Top pain points
                  </div>
                  {[
                    { t: "Onboarding takes too long", s: 92 },
                    { t: "Mobile sync is unreliable", s: 81 },
                    { t: "Pricing page is confusing", s: 67 },
                  ].map((r) => (
                    <div
                      key={r.t}
                      className="flex items-center justify-between rounded-md border border-border bg-background/60 px-3 py-2.5"
                    >
                      <span className="text-sm text-foreground">{r.t}</span>
                      <span className="font-display text-xs text-primary">{r.s}</span>
                    </div>
                  ))}
                </div>
                <div className="sm:col-span-2">
                  <div className="text-[11px] uppercase tracking-wider text-foreground-muted">
                    Market context
                  </div>
                  <div className="mt-2 rounded-md border border-border border-l-4 border-l-success bg-background/60 p-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-success">
                      <Check className="h-3.5 w-3.5" /> Market validates
                    </div>
                    <p className="mt-1.5 text-xs leading-5 text-foreground-muted">
                      3 competitors shipped onboarding redesigns this quarter. Reviews
                      cite the same friction.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto max-w-5xl px-6 py-10 text-center">
          <p className="text-[13px] text-foreground-muted">
            Built for teams that are close to their customers and ready to move fast
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {["Startup founders", "SaaS Product teams", "Indie hackers", "SMB owners"].map(
              (p) => (
                <span
                  key={p}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground-muted"
                >
                  {p}
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-12 md:grid-cols-2">
          <div data-reveal>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              The problem
            </div>
            <h2 className="font-display mt-3 text-3xl text-foreground" style={{ lineHeight: 1.15 }}>
              Your users and the market keep telling you what to build. You just can't hear them.
            </h2>
            <div className="mt-5 space-y-4 text-[15px] leading-7 text-foreground-muted">
              <p>
                Feedback lives everywhere; reviews, Reddit threads, support tickets,
                competitor comparisons. By the time you've read it all and built a case for
                what to prioritize, another quarter has passed.
              </p>
              <p>
                And when you're validating a brand-new idea, it's even worse; most teams
                build from a hunch instead of from evidence already sitting in the problem
                space. Loudest voice wins. Not the most validated insight.
              </p>
            </div>
          </div>

          <div data-reveal>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              The solution
            </div>
            <h2 className="font-display mt-3 text-3xl text-foreground" style={{ lineHeight: 1.15 }}>
              One workflow. From raw feedback to team-ready roadmap.
            </h2>
            <div className="mt-5 space-y-4">
              {[
                {
                  t: "Analyze user feedback at scale",
                  d: "Paste reviews, upload a doc, or let InsightFlow research the web. Every pain point scored by frequency, severity, and business impact.",
                },
                {
                  t: "Validate new ideas before you build",
                  d: "Describe your idea and who it's for. InsightFlow surfaces the real, recurring pain points in that space so you know if it's worth shipping.",
                },
                {
                  t: "Cross-check with market context",
                  d: "Pulls competitor signals, industry trends, and recent news to support; or challenge, what your users (or the market) are saying.",
                },
                {
                  t: "Prioritize bugs, upgrades, and new features",
                  d: "Get a clear verdict on what to fix, what to upgrade, and what to build next packaged into a quarterly roadmap and team-ready PRD.",
                },
              ].map((f) => (
                <div
                  key={f.t}
                  className="rounded-md border border-border border-l-2 border-l-primary bg-surface/60 p-4"
                >
                  <div className="text-sm font-medium text-foreground">{f.t}</div>
                  <p className="mt-1 text-sm leading-6 text-foreground-muted">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            How it works
          </div>
          <h2 className="font-display mt-3 text-3xl text-foreground sm:text-4xl">
            From signal to shipped in three steps.
          </h2>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                n: "01",
                t: "Feed it feedback or an idea",
                d: "Paste reviews, upload a document, or research the web. Or switch to Idea Validation and describe an unbuilt idea with its target audience.",
              },
              {
                n: "02",
                t: "Get instant intelligence",
                d: "Every pain point scored by impact and validated against live market data — so you see what's actually worth solving, not just what's loudest.",
              },
              {
                n: "03",
                t: "Prioritize and ship",
                d: "Decide what to fix, upgrade, or build next. Generate a full roadmap, PRD, epics, and user stories in one click. Export and start the sprint.",
              },
            ].map((s) => (
              <div
                key={s.n}
                data-reveal
                className="rounded-xl border border-border bg-background p-7 text-left"
              >
                <div
                  className="font-display text-5xl"
                  style={{ color: "color-mix(in oklab, var(--color-primary) 30%, transparent)" }}
                >
                  {s.n}
                </div>
                <div className="mt-4 text-base font-medium text-foreground">{s.t}</div>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="space-y-24">
          {[
            {
              tag: "Feedback & idea analysis",
              title: "Every customer signal, scored and ranked.",
              body: "Whether you're analyzing reviews for an existing product or pressure-testing a new idea against public signal, InsightFlow categorizes the pain points and scores each by frequency, severity, and impact on your goals.",
              icon: <Target className="h-5 w-5 text-primary" />,
              mock: (
                <div className="space-y-2">
                  {[
                    { t: "Search returns wrong results", s: 88 },
                    { t: "No bulk export option", s: 74 },
                    { t: "Notifications too noisy", s: 61 },
                  ].map((r) => (
                    <div
                      key={r.t}
                      className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2"
                    >
                      <span className="text-xs text-foreground">{r.t}</span>
                      <span className="font-display text-xs text-primary">{r.s}</span>
                    </div>
                  ))}
                </div>
              ),
            },
            {
              tag: "Market context",
              title: "Know if the market agrees with your users.",
              body: "Your users might be right; or they might be outliers. InsightFlow researches your competitive landscape, pulls recent news, and delivers a verdict.",
              icon: <Map className="h-5 w-5 text-primary" />,
              mock: (
                <div className="rounded-md border border-border border-l-4 border-l-success bg-background p-4">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-success">
                    <Check className="h-3.5 w-3.5" /> Market validates
                  </div>
                  <p className="mt-2 text-xs leading-5 text-foreground-muted">
                    Recent G2 reviews of 4 direct competitors flag the same search-quality
                    issue. 2 shipped fixes in Q2.
                  </p>
                </div>
              ),
            },
            {
              tag: "Prioritization & roadmap",
              title: "Decide what to fix, upgrade, or build, then ship it.",
              body: "InsightFlow tells you which bugs are worth fixing now, which upgrades will move the needle, and which new features are validated by real demand; then packages it into a full quarterly roadmap with epics, user stories, acceptance criteria, and effort estimates.",
              icon: <FileText className="h-5 w-5 text-primary" />,
              mock: (
                <div className="space-y-2">
                  <div className="rounded-md border border-border bg-background p-3">
                    <div className="text-[11px] uppercase tracking-wider text-foreground-muted">
                      Q3 · Sprint 1
                    </div>
                    <div className="mt-1 text-xs text-foreground">Onboarding redesign</div>
                  </div>
                  <div className="rounded-md border border-border bg-background p-3">
                    <div className="text-[11px] uppercase tracking-wider text-foreground-muted">
                      Q3 · Sprint 2
                    </div>
                    <div className="mt-1 text-xs text-foreground">Mobile sync rebuild</div>
                  </div>
                </div>
              ),
            },
          ].map((row, i) => (
            <div
              key={row.tag}
              data-reveal
              className={`grid items-center gap-10 md:grid-cols-2 ${i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}
            >
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                  {row.icon} {row.tag}
                </div>
                <h3 className="font-display mt-4 text-2xl text-foreground sm:text-3xl" style={{ lineHeight: 1.2 }}>
                  {row.title}
                </h3>
                <p className="mt-3 text-[15px] leading-7 text-foreground-muted">{row.body}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface/60 p-5 card-halo">
                {row.mock}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Who it's for */}
      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="text-center">
            <h2 className="font-display text-3xl text-foreground sm:text-4xl">
              Built for anyone who builds for customers.
            </h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {[
              {
                t: "Startup founders",
                d: "Validate the idea before you write a line of code, then keep prioritizing with real evidence as customers start showing up.",
              },
              {
                t: "SaaS Product teams",
                d: "Stop spending 8 hours synthesizing feedback manually. Walk into every roadmap review with evidence on what to fix, upgrade, or build not opinions.",
              },
              {
                t: "Indie hackers & solo builders",
                d: "Pressure-test your next idea against what people are actually complaining about online. Skip months building something nobody asked for.",
              },
              {
                t: "SMB owners",
                d: "Your customers leave signals in reviews and forums every day. InsightFlow reads them and tells you exactly what to fix, upgrade, or build next.",
              },
            ].map((p) => (
              <div
                key={p.t}
                className="rounded-xl border border-border bg-background p-6"
              >
                <div className="text-base font-medium text-foreground">{p.t}</div>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative isolate overflow-hidden">
        <div className="hero-beam" aria-hidden />
        <div className="mx-auto max-w-3xl px-6 py-28 text-center">
          <h2 className="font-display text-foreground" style={{ fontSize: "clamp(28px, 5vw, 44px)", lineHeight: 1.15 }}>
            Your next great product decision
            <br />
            <span className="text-gradient-brand">is already in your users' voice or the market's.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-7 text-foreground-muted">
            InsightFlow finds it, scores it, and tells you whether to fix, upgrade, or build.
          </p>
          <div className="mt-8">
            <Link
              to="/login"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-7 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover btn-glow"
            >
              Start Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-4 text-xs text-foreground-muted">
            Takes 2 minutes to set up. Your first analysis is free.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3">
          <div>
            <div className="text-base font-semibold text-foreground">InsightFlow</div>
            <p className="mt-2 text-sm text-foreground-muted">Turn feedback and ideas into decisions.</p>
            <p className="mt-4 text-xs text-foreground-muted">© 2026 InsightFlow</p>
          </div>
          <div className="text-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Product
            </div>
            <ul className="mt-3 space-y-2">
              <li>
                <a href="#how-it-works" className="text-foreground-muted hover:text-foreground">
                  How it works
                </a>
              </li>
              <li>
                <Link to="/login" className="text-foreground-muted hover:text-foreground">
                  Sign up
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-foreground-muted hover:text-foreground">
                  Log in
                </Link>
              </li>
            </ul>
          </div>
          <div className="text-sm sm:text-right">
            <p className="text-foreground-muted leading-relaxed">
              {"\n"}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
