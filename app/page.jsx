import Link from "next/link";

const features = [
  {
    title: "Real-time decisions",
    copy: "Return approve, block, or challenge decisions before checkout latency becomes a product problem.",
    stat: "< 400ms"
  },
  {
    title: "Explainable reasons",
    copy: "Every response includes readable signals, confidence, and next best action for risk and ops teams.",
    stat: "5 reasons"
  },
  {
    title: "Soft challenge flow",
    copy: "Route uncertain sessions into low-friction verification instead of rejecting good customers.",
    stat: "adaptive"
  }
];

const code = `const decision = await realcheck.decide({
  user_id: "usr_9281",
  amount: 248.90,
  currency: "USD",
  payment_method: "card",
  device: request.device,
  signals: request.riskSignals
});

if (decision.action === "challenge") {
  return startSoftChallenge(decision.reason_codes);
}`;

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--text-primary)]">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 lg:px-8">
        <Link href="/" className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
          RealCheck Sentinel
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-[var(--text-muted)] md:flex">
          <Link href="#platform" className="transition hover:text-[var(--text-secondary)]">
            Platform
          </Link>
          <Link href="#ai" className="transition hover:text-[var(--text-secondary)]">
            AI engine
          </Link>
          <Link href="#integrations" className="transition hover:text-[var(--text-secondary)]">
            Integrations
          </Link>
        </nav>

        <Link href="/demo" className="button-secondary text-[0.75rem]">
          Live demo
        </Link>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-5 pb-16 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-14 lg:px-8 lg:pt-16">
        <div>
          <div className="mb-5 inline-flex border border-[var(--border)] bg-[var(--panel-1)] px-3 py-2 text-[0.625rem] font-medium uppercase tracking-[0.16em] text-[var(--primary)]">
            Adaptive fraud decisioning
          </div>

          <h1 className="max-w-2xl text-5xl font-semibold leading-[0.98] tracking-[-0.06em] text-white md:text-6xl">
            Stop blocking real customers.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-[var(--text-secondary)] md:text-lg">
            RealCheck surfaces explainable fraud intelligence for payment processors and fintech teams that need instant risk decisions without losing velocity.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/demo" className="button-primary">
              Run fraud check
            </Link>
            <span className="text-sm text-[var(--text-dim)]">API-first. No black box declines.</span>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 text-[0.6875rem] uppercase tracking-[0.08em] text-[var(--text-muted)]">
            <span className="status-pill success">Verified risk model</span>
            <span className="status-pill warning">Low-latency challenge</span>
            <span className="status-pill info">PCI-aware rules</span>
          </div>
        </div>

        <div className="surface-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 text-[0.6875rem] text-[var(--text-muted)]">
            <span>realcheck.js</span>
            <span className="text-[var(--primary)]">POST /v1/decisions</span>
          </div>
          <pre className="overflow-x-auto p-5 text-sm leading-7 text-[var(--text-secondary)]">
            <code>{code}</code>
          </pre>
        </div>
      </section>

      <section id="platform" className="mx-auto grid w-full max-w-7xl gap-4 px-5 pb-24 md:grid-cols-3 lg:px-8">
        {features.map((feature) => (
          <article key={feature.title} className="metric-card p-5">
            <div className="mb-8 text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--primary)]">{feature.stat}</div>
            <h2 className="text-xl font-semibold text-white">{feature.title}</h2>
            <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">{feature.copy}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
