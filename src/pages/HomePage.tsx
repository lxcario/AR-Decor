import { startTransition, useDeferredValue, useState } from "react";
import { ArrowRight, Search, SlidersHorizontal, Sparkles, Star } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Link } from "react-router-dom";
import { routes } from "../app/routes";
import { categories, featuredProduct, products, trendingProducts } from "../data";
import { formatUsd } from "../lib/currency";
import type { ProductCategoryId } from "../types/app";

type HomeCategoryFilter = "all" | ProductCategoryId;

const browseCategories = [
  {
    id: "all" as const,
    label: "All Rooms",
    description: "An editor's mix of signature silhouettes, quiet stone, and quiet light.",
    coverImage: featuredProduct.heroImage.src,
    accentLabel: "Curated edit",
  },
  ...categories,
];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

export function HomePage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<HomeCategoryFilter>("all");
  const deferredQuery = useDeferredValue(query);

  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const isFiltering = activeCategory !== "all" || normalizedQuery.length > 0;
  const visibleProducts = (isFiltering ? products : trendingProducts).filter((product) => {
    const matchesCategory =
      activeCategory === "all" || product.categoryId === activeCategory;

    if (!matchesCategory) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const searchableContent = [
      product.name,
      product.collection,
      product.shortDescription,
      product.designer,
      product.materials.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    return searchableContent.includes(normalizedQuery);
  });

  const heroProduct = visibleProducts[0] ?? featuredProduct;
  const activeCategoryMeta =
    browseCategories.find((category) => category.id === activeCategory) ?? browseCategories[0];
  const categoryLeadProduct =
    activeCategory === "all"
      ? heroProduct
      : products.find((product) => product.categoryId === activeCategory) ?? heroProduct;
  const leadProduct = visibleProducts[0] ?? null;
  const secondaryProducts = visibleProducts.slice(1, 5);
  const resultLabel = visibleProducts.length === 1 ? "piece" : "pieces";
  const todayLabel = dateFormatter.format(new Date());

  const clearFilters = () => {
    startTransition(() => {
      setActiveCategory("all");
      setQuery("");
    });
  };

  return (
    <main className="min-h-screen px-5 pb-40 pt-[calc(1.5rem+env(safe-area-inset-top))]">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">{todayLabel}</p>
            <h1 className="mt-3 max-w-[10ch] font-display text-[3.35rem] leading-[0.92] text-neutral-950">
              Rooms that settle the eye.
            </h1>
            <p className="mt-4 max-w-xs text-sm leading-6 text-neutral-600">
              A softer, more editorial way to browse pieces before placing them in your room.
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white text-sm font-semibold text-neutral-900 shadow-sm">
            AD
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3 rounded-full border border-neutral-100 bg-neutral-50 px-4 py-3">
            <Search size={18} className="text-neutral-400" />
            <input
              value={query}
              onChange={(event) => {
                const nextValue = event.target.value;
                startTransition(() => setQuery(nextValue));
              }}
              placeholder="Search boucle, travertine, walnut..."
              className="flex-1 bg-transparent text-[15px] text-neutral-900 outline-none placeholder:text-neutral-400"
            />
            <button
              type="button"
              onClick={clearFilters}
              disabled={!isFiltering}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-brand-accent transition-all duration-200 active:scale-95 disabled:cursor-default disabled:opacity-45 disabled:active:scale-100"
            >
              <SlidersHorizontal size={14} />
              <span>Reset</span>
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4 rounded-3xl border border-neutral-100 bg-neutral-50 px-4 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">Current edit</p>
              <p className="mt-1 text-sm font-medium text-neutral-900">
                {isFiltering ? "A narrowed selection shaped by your room mood." : "A premium living edit for slower, quieter spaces."}
              </p>
            </div>
            <div className="rounded-full bg-neutral-950 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-white">
              {visibleProducts.length} {resultLabel}
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="mt-7"
      >
        <article className="overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-950 text-white shadow-xl">
          <div className="relative min-h-[430px]">
            <img
              src={heroProduct.heroImage.src}
              alt={heroProduct.heroImage.alt}
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(with-transparent)] bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-x-5 top-5 flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-accent/90 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-white shadow-sm overflow-hidden backdrop-blur-md">
                <Sparkles size={13} />
                <span>Editor’s placement pick</span>
              </div>
              <div className="rounded-full bg-black/40 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-white backdrop-blur-md border border-white/20">
                {formatUsd(heroProduct.priceUsd)}
              </div>
            </div>
            <div className="absolute inset-x-5 bottom-5">
              <div className="rounded-3xl border border-white/20 bg-black/40 backdrop-blur-md p-5 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">{heroProduct.collection}</p>
                    <h2 className="mt-3 max-w-[11ch] font-display text-[2.8rem] leading-[0.94] text-white">
                      {heroProduct.name}
                    </h2>
                    <p className="mt-3 max-w-xs text-sm leading-6 text-white/72">{heroProduct.shortDescription}</p>
                  </div>
                  <Link
                    to={routes.product(heroProduct.slug)}
                    className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/16 bg-white/10 text-white transition-all duration-200 active:scale-95"
                    aria-label={`Open ${heroProduct.name}`}
                  >
                    <ArrowRight size={18} />
                  </Link>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link
                    to={routes.arView(heroProduct.slug)}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-neutral-950 transition-all duration-200 active:scale-95"
                  >
                    See in your room
                    <ArrowRight size={16} />
                  </Link>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-white/76">
                    <Star size={12} fill="currentColor" strokeWidth={0} />
                    <span>{heroProduct.rating.toFixed(1)} rating</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </motion.section>

      <section id="discover" className="mt-8 scroll-mt-24">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">Room stories</p>
            <h2 className="mt-2 font-display text-3xl leading-tight text-neutral-950">Filter by mood, not menus.</h2>
          </div>
          <p className="text-sm text-neutral-500">Swipe the rail</p>
        </div>

        <div className="hide-scrollbar -mx-5 mt-4 overflow-x-auto px-5 pb-2">
          <div className="flex w-max gap-3">
            {browseCategories.map((category, index) => {
              const isActive = activeCategory === category.id;

              return (
                <motion.button
                  key={category.id}
                  type="button"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  onClick={() => {
                    startTransition(() => setActiveCategory(category.id));
                  }}
                  aria-pressed={isActive}
                  className={`inline-flex items-center gap-3 rounded-full border px-4 py-3 text-left transition-all duration-200 active:scale-95 ${
                    isActive
                      ? "border-brand-primary bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                      : "border-neutral-200 bg-white text-neutral-900 shadow-sm"
                  }`}
                >
                  <span className="h-10 w-10 overflow-hidden rounded-full border border-neutral-100 bg-neutral-50">
                    <img
                      src={category.coverImage}
                      alt={`${category.label} preview`}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{category.label}</span>
                    <span className={`block text-[11px] uppercase tracking-[0.16em] ${isActive ? "text-white/62" : "text-neutral-500"}`}>
                      {category.accentLabel}
                    </span>
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.article
            key={activeCategoryMeta.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-lg"
          >
            <div className="relative h-56">
              <img
                src={activeCategoryMeta.coverImage}
                alt={`${activeCategoryMeta.label} room story`}
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute inset-x-5 top-5 flex items-center justify-between gap-3">
                <div className="rounded-full border border-white/20 bg-black/30 backdrop-blur-md px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-white/90">
                  {activeCategoryMeta.accentLabel}
                </div>
                <div className="rounded-full border border-white/20 bg-brand-accent/80 backdrop-blur-md px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white">
                  {activeCategoryMeta.label}
                </div>
              </div>
              <div className="absolute inset-x-5 bottom-5 text-white">
                <h3 className="max-w-[11ch] font-display text-[2.4rem] leading-[0.94]">{activeCategoryMeta.label}</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-white/72">{activeCategoryMeta.description}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Leading piece</p>
                <p className="mt-2 text-lg font-medium text-neutral-950">{categoryLeadProduct.name}</p>
                <p className="mt-1 text-sm text-neutral-500">{formatUsd(categoryLeadProduct.priceUsd)}</p>
              </div>
              <Link
                to={routes.product(categoryLeadProduct.slug)}
                className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition-all duration-200 active:scale-95"
              >
                Open piece
                <ArrowRight size={16} />
              </Link>
            </div>
          </motion.article>
        </AnimatePresence>
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">
              {isFiltering ? "Filtered selection" : "Collected this week"}
            </p>
            <h2 className="mt-2 font-display text-3xl leading-tight text-neutral-950">
              {isFiltering ? "Pieces shaped by your edit" : "A sharper layout for discovery"}
            </h2>
          </div>
          <p className="text-sm text-neutral-500">{visibleProducts.length} {resultLabel}</p>
        </div>

        <AnimatePresence mode="wait">
          {leadProduct ? (
            <motion.div className="mt-4 grid grid-cols-2 gap-4">
              <motion.div
                key={leadProduct.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="col-span-2"
              >
                <Link
                  to={routes.product(leadProduct.slug)}
                  className="group block overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-sm transition-all duration-200 active:scale-95"
                >
                  <div className="relative min-h-[270px]">
                    <img
                      src={leadProduct.heroImage.src}
                      alt={leadProduct.heroImage.alt}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,16,16,0.86),rgba(16,16,16,0.18)_62%)]" />
                    <div className="relative flex h-full flex-col justify-between p-5 text-white">
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full border border-white/20 bg-black/40 backdrop-blur-md px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/90">
                          {leadProduct.badge ?? leadProduct.collection}
                        </span>
                        <span className="rounded-full bg-brand-accent/90 border border-white/10 backdrop-blur-md px-3 py-1.5 text-[11px] font-medium tracking-wide text-white">
                          {formatUsd(leadProduct.priceUsd)}
                        </span>
                      </div>
                      <div className="max-w-[60%]">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-white/58">{leadProduct.collection}</p>
                        <h3 className="mt-3 font-display text-[2.4rem] leading-[0.96] text-white">{leadProduct.name}</h3>
                        <p className="mt-3 text-sm leading-6 text-white/72">{leadProduct.shortDescription}</p>
                        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-950">
                          View details
                          <ArrowRight size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>

              {secondaryProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: index * 0.04, duration: 0.2 }}
                >
                  <Link
                    to={routes.product(product.slug)}
                    className="group block h-full overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-sm transition-all duration-200 active:scale-95"
                  >
                    <div className="relative">
                      <img
                        src={product.heroImage.src}
                        alt={product.heroImage.alt}
                        referrerPolicy="no-referrer"
                        className="aspect-[0.8] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
                        <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-700 shadow-sm">
                          {product.collection}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-black/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-medium text-white border border-white/10">
                          <Star size={12} fill="currentColor" strokeWidth={0} />
                          {product.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3 p-4 bg-neutral-50/50">
                      <div>
                        <h3 className="text-base font-medium leading-snug text-neutral-950">{product.name}</h3>
                        <p className="mt-2 text-sm leading-6 text-neutral-600">{product.shortDescription}</p>
                      </div>
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-neutral-950">{formatUsd(product.priceUsd)}</p>
                          <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">{product.designer}</p>
                        </div>
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200/70 bg-[#fcfbf8] text-neutral-500">
                          <ArrowRight size={16} />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 rounded-[34px] border border-neutral-200/60 bg-white/90 p-6 text-center shadow-[0_18px_60px_rgba(32,24,18,0.05)]"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">No matches yet</p>
              <h3 className="mt-3 font-display text-3xl text-neutral-950">Try a calmer search.</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-600">
                Clear the filters to return to the curated edit, then refine again with a different material or room mood.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition-all duration-200 active:scale-95"
              >
                Reset catalog
                <ArrowRight size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}
