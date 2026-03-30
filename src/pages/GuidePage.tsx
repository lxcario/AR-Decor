import {
  ArrowRight,
  Camera,
  Compass,
  House,
  Package,
  Ruler,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { routes } from "../app/routes";
import { categories, featuredProduct, products } from "../data";
import { formatUsd } from "../lib/currency";

const guideSteps = [
  {
    title: "Browse the premium catalog",
    description: "Start on the home screen, filter by room mood, and open the piece that feels right for your space.",
    icon: Package,
  },
  {
    title: "Scan and place in AR",
    description: "Allow camera access, let the floor scan settle, then drag the preview until it feels anchored.",
    icon: Camera,
  },
  {
    title: "Refine for scale and styling",
    description: "Adjust the preview size, compare from a few angles, and return to the detail page when it clicks.",
    icon: Ruler,
  },
];

const roomPrep = [
  "Give the camera a clear view of the floor and nearby walls.",
  "Use daylight or warm lamp light for cleaner edge detection.",
  "Keep one real furniture piece in frame so the scale feels grounded.",
];

export function GuidePage() {
  return (
    <main className="min-h-screen px-5 pb-40 pt-[calc(1.5rem+env(safe-area-inset-top))]">
      <section className="rounded-[36px] border border-neutral-200/60 bg-white/90 p-6 shadow-[0_20px_80px_rgba(18,18,18,0.05)] backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">Studio notes</p>
            <h1 className="mt-3 max-w-[11ch] font-display text-[3.05rem] leading-[0.94] text-neutral-950">
              The calm side of AR shopping.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-neutral-600">
              This screen is now purely about browsing, room prep, and placement confidence. No extra AI tooling, just the flow that matters.
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200/70 bg-[#fcfbf8] text-sm font-semibold text-neutral-900">
            AD
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-[24px] border border-neutral-200/60 bg-[#fcfbf8] p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Catalog</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-950">{products.length}</p>
            <p className="mt-1 text-xs text-neutral-500">AR-ready pieces</p>
          </div>
          <div className="rounded-[24px] border border-neutral-200/60 bg-[#fcfbf8] p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Rooms</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-950">{categories.length}</p>
            <p className="mt-1 text-xs text-neutral-500">curated moods</p>
          </div>
          <div className="rounded-[24px] border border-neutral-200/60 bg-[#fcfbf8] p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Focus</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-950">AR</p>
            <p className="mt-1 text-xs text-neutral-500">placement only</p>
          </div>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-[36px] rounded-bl-[68px] border border-neutral-200/60 bg-neutral-950 text-white shadow-[0_24px_80px_rgba(18,18,18,0.12)]">
        <div className="relative min-h-[420px]">
          <img
            src={featuredProduct.heroImage.src}
            alt={featuredProduct.heroImage.alt}
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,16,16,0.1),rgba(16,16,16,0.86))]" />
          <div className="absolute inset-x-5 top-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-white/80 backdrop-blur-xl">
            <Sparkles size={13} />
            <span>Featured placement</span>
          </div>
          <div className="absolute inset-x-5 bottom-5 rounded-[30px] border border-white/15 bg-black/28 p-5 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/58">Quick launch</p>
                <h2 className="mt-3 max-w-[11ch] font-display text-[2.35rem] leading-[0.96] text-white">
                  {featuredProduct.name}
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-white/70">{featuredProduct.shortDescription}</p>
              </div>
              <div className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/78">
                {formatUsd(featuredProduct.priceUsd)}
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Link
                to={routes.arView(featuredProduct.slug)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-medium text-neutral-950 transition-all duration-200 active:scale-95"
              >
                Start AR
                <ArrowRight size={16} />
              </Link>
              <Link
                to={routes.product(featuredProduct.slug)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-white transition-all duration-200 active:scale-95"
              >
                View product
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 space-y-3">
        {guideSteps.map(({ title, description, icon: Icon }, index) => (
          <article
            key={title}
            className="rounded-[30px] border border-neutral-200/60 bg-white/88 p-5 shadow-[0_18px_60px_rgba(18,18,18,0.04)]"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-white">
                <Icon size={18} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">Step 0{index + 1}</p>
                <h2 className="mt-2 text-lg font-medium text-neutral-950">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-neutral-600">{description}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-4">
        <article className="rounded-[34px] border border-neutral-200/60 bg-white/90 p-6 shadow-[0_18px_60px_rgba(18,18,18,0.05)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-950 text-white">
              <Compass size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">Before you scan</p>
              <h2 className="mt-1 font-display text-3xl leading-tight text-neutral-950">
                Prep the room like a stylist would.
              </h2>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {roomPrep.map((tip) => (
              <div key={tip} className="flex gap-3">
                <div className="mt-1.5 h-2 w-2 rounded-full bg-neutral-950" />
                <p className="text-sm leading-6 text-neutral-600">{tip}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[34px] border border-neutral-200/60 bg-white/90 p-6 shadow-[0_18px_60px_rgba(18,18,18,0.05)]">
          <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">Quick links</p>
          <h2 className="mt-2 font-display text-3xl leading-tight text-neutral-950">
            Jump straight back into the flow.
          </h2>
          <div className="mt-5 grid gap-3">
            <Link
              to={routes.home}
              className="inline-flex items-center justify-between rounded-[24px] border border-neutral-200/70 bg-[#fcfbf8] px-5 py-4 text-sm font-medium text-neutral-950 transition-all duration-200 active:scale-95"
            >
              <span className="inline-flex items-center gap-3">
                <House size={18} />
                Home catalog
              </span>
              <ArrowRight size={16} />
            </Link>
            <Link
              to={routes.product(featuredProduct.slug)}
              className="inline-flex items-center justify-between rounded-[24px] border border-neutral-200/70 bg-[#fcfbf8] px-5 py-4 text-sm font-medium text-neutral-950 transition-all duration-200 active:scale-95"
            >
              <span className="inline-flex items-center gap-3">
                <Package size={18} />
                Featured product detail
              </span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
