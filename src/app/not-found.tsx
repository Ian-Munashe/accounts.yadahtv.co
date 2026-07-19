import Link from "next/link";
import { LuArrowLeft, LuHouse } from "react-icons/lu";

export default function NotFound() {
  return (
    <main className="bg-background flex min-h-screen items-center justify-center px-4 py-10">
      <section className="border-border bg-surface/85 w-full max-w-xl rounded-[30px] border p-8 text-center shadow-[0_25px_80px_-30px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:p-10">
        <div className="bg-accent/10 text-accent mb-6 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.26em] uppercase">
          404 error
        </div>

        <div className="text-foreground mb-4 text-7xl leading-none font-semibold tracking-[-0.08em] sm:text-8xl">
          404
        </div>

        <h1 className="font-heading text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
          Page not found
        </h1>

        <p className="text-muted mx-auto mt-3 max-w-lg text-sm leading-6 sm:text-base">
          The page you’re looking for may have moved, been removed, or never existed.
        </p>

        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="bg-accent text-accent-foreground hover:bg-accent/90 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-colors"
          >
            <LuHouse className="text-base" />
            <span>Go to homepage</span>
          </Link>

          <Link
            href="/signin"
            className="border-border text-foreground hover:bg-default inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-medium transition-colors"
          >
            <LuArrowLeft className="text-base" />
            <span>Back to sign in</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
