import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { routes } from "../app/routes";

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="rounded-[32px] border border-neutral-200/60 bg-white/90 p-8 shadow-[0_20px_80px_rgba(18,18,18,0.05)] backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">Not found</p>
        <h1 className="mt-3 font-display text-4xl text-neutral-950">This room is still empty.</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          The route you opened does not exist in the current catalog scaffold.
        </p>
        <Link
          to={routes.home}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition-all duration-200 active:scale-95"
        >
          Return home
          <ArrowRight size={16} />
        </Link>
      </div>
    </main>
  );
}
