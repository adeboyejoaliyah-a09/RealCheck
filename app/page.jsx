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
    <main className="min-h-screen bg-realblack text-zinc-100">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6">
        <Link href="/" className="text-sm font-semibold uppercase tracking-[0.28em] text-white">
          RealCheck
        </Link>
        <Link
          href="/demo"
          className="border border-realindigo px-4 py-2 text-sm text-indigo-200 transition hover:bg-realindigo hover:text-white"
        >
          Live demo
        </Link>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-12 px-5 pb-16 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-24">
        <div>
          <div className="mb-5 inline-flex border border-realline bg-realpanel px-3 py-2 text-xs uppercase tracking-[0.22em] text-indigo-200">
            Adaptive fraud decisioning
          </div>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-normal text-white md:text-7xl">
            Stop blocking real customers.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-300 md:text-lg">
            RealCheck gives fintechs and payment processors explainable, adaptive fraud decisions that separate risky behavior from legitimate urgency.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/demo"
              className="bg-realindigo px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Run fraud check
            </Link>
            <span className="text-sm text-zinc-500">API-first. No black box declines.</span>
          </div>
        </div>

        <div className="border border-realline bg-[#0d0d14]">
          <div className="flex items-center justify-between border-b border-realline px-4 py-3 text-xs text-zinc-500">
            <span>realcheck.js</span>
            <span className="text-indigo-300">POST /v1/decisions</span>
          </div>
          <pre className="overflow-x-auto p-5 text-sm leading-7 text-zinc-200">
            <code>{code}</code>
          </pre>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-5 pb-24 md:grid-cols-3">
        {features.map((feature) => (
          <article key={feature.title} className="border border-realline bg-realpanel p-5">
            <div className="mb-8 text-xs uppercase tracking-[0.22em] text-indigo-300">{feature.stat}</div>
            <h2 className="text-xl font-semibold text-white">{feature.title}</h2>
            <p className="mt-4 text-sm leading-6 text-zinc-400">{feature.copy}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
