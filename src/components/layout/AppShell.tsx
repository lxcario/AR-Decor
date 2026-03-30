import type { ReactNode } from "react";
import { CircleUserRound, House, LayoutGrid, ScanSearch } from "lucide-react";
import { motion } from "motion/react";
import { Link, useLocation } from "react-router-dom";
import { routes } from "../../app/routes";
import { featuredProduct } from "../../data";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const showBottomNavigation =
    location.pathname === routes.home || location.pathname === routes.guide;

  return (
    <div className="min-h-screen bg-[#f8f8f7] text-neutral-900">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(85,61,39,0.12),_transparent_38%),radial-gradient(circle_at_bottom,_rgba(165,132,97,0.08),_transparent_32%)]" />
      <div className="relative mx-auto min-h-screen max-w-md overflow-hidden bg-[#f8f8f7] shadow-[0_32px_120px_rgba(18,18,18,0.08)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(255,250,245,0.95),rgba(248,248,247,0))]" />
        <div className="pointer-events-none absolute inset-x-8 top-10 h-44 rounded-full bg-[radial-gradient(circle,_rgba(122,91,62,0.12),_transparent_70%)] blur-3xl" />
        {children}
      </div>
      {showBottomNavigation ? <BottomNavigation /> : null}
    </div>
  );
}

function BottomNavigation() {
  const location = useLocation();
  const activeKey =
    location.pathname === routes.guide
      ? "studio"
      : location.hash === "#discover"
        ? "browse"
        : "home";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+0.85rem)]">
      <nav className="pointer-events-auto w-full max-w-md px-5">
        <div className="relative rounded-[34px] border border-neutral-200/60 bg-[#f6f0e7]/88 p-2.5 shadow-[0_24px_80px_rgba(32,24,18,0.14)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-12 -top-4 h-10 rounded-full bg-[radial-gradient(circle,_rgba(120,92,66,0.18),_transparent_70%)] blur-2xl" />
          <div className="grid grid-cols-[1fr_1fr_88px_1fr] items-end gap-1">
            <BottomNavigationLink
              to={routes.home}
              label="Home"
              icon={House}
              isActive={activeKey === "home"}
            />
            <BottomNavigationLink
              to={{ pathname: routes.home, hash: "#discover" }}
              label="Browse"
              icon={LayoutGrid}
              isActive={activeKey === "browse"}
            />

            <div className="flex justify-center">
              <Link
                to={routes.arView(featuredProduct.slug)}
                className="-mt-7 inline-flex h-[84px] w-[84px] flex-col items-center justify-center rounded-full bg-neutral-950 text-white shadow-[0_20px_48px_rgba(18,18,18,0.24)] transition-all duration-200 active:scale-95"
              >
                <ScanSearch size={20} />
                <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em]">AR</span>
              </Link>
            </div>

            <BottomNavigationLink
              to={routes.guide}
              label="Studio"
              icon={CircleUserRound}
              isActive={activeKey === "studio"}
            />
          </div>
        </div>
      </nav>
    </div>
  );
}

interface BottomNavigationLinkProps {
  icon: typeof House;
  isActive: boolean;
  label: string;
  to: string | { hash?: string; pathname: string };
}

function BottomNavigationLink({
  icon: Icon,
  isActive,
  label,
  to,
}: BottomNavigationLinkProps) {
  return (
    <Link
      to={to}
      className="relative inline-flex min-h-[66px] flex-col items-center justify-center gap-1 overflow-hidden rounded-[24px] px-2.5 py-3 text-neutral-500 transition-all duration-200 active:scale-95"
    >
      {isActive ? (
        <motion.span
          layoutId="bottom-nav-surface"
          className="absolute inset-0 rounded-[24px] bg-white shadow-[0_10px_28px_rgba(32,24,18,0.08)]"
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        />
      ) : null}
      <span
        className={`relative h-1 w-6 rounded-full ${
          isActive ? "bg-neutral-950" : "bg-transparent"
        }`}
      />
      <span className="relative">
        <Icon size={18} className={isActive ? "text-neutral-950" : "text-neutral-500"} />
      </span>
      <span
        className={`relative text-[11px] font-medium uppercase tracking-[0.16em] ${
          isActive ? "text-neutral-950" : "text-neutral-500"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}
