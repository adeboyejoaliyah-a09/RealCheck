import Link from "next/link";
import RealCheckPrompt from "../../components/realcheck-prompt";

export const metadata = {
  title: "RealCheck Demo | Live Fraud Checker"
};

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-realblack text-zinc-100">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5">
        <Link href="/" className="text-sm font-semibold uppercase tracking-[0.28em] text-white">
          RealCheck
        </Link>
        <Link href="/" className="text-sm text-zinc-400 transition hover:text-white">
          Back
        </Link>
      </header>
      <RealCheckPrompt />
    </main>
  );
}
