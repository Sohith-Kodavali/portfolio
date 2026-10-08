import Link from "next/link";
import Nav from "@/components/Nav";

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="shell flex min-h-screen flex-col justify-center">
        <span className="t-eyebrow">Error 404</span>
        <h1 className="t-display t-huge mt-6 max-w-[18ch]">
          You’ve drifted off the{' '}
          <span className="text-accent">map.</span>
        </h1>
        <p className="t-lead mt-8 max-w-[46ch] text-muted">
          This page doesn’t exist — or it hasn’t been built yet. Either way, the way back is
          simple.
        </p>
        <div className="mt-12 flex items-center gap-4">
          <Link
            href="/"
            className="rounded-full bg-accent px-6 py-3.5 text-sm font-medium text-ink"
            data-cursor="Home"
          >
            Return home
          </Link>
          <Link
            href="/#work"
            className="rounded-full border border-line px-6 py-3.5 text-sm transition-colors hover:border-bone"
            data-cursor="Work"
          >
            See the work
          </Link>
        </div>
      </main>
    </>
  );
}
