import { lazy, Suspense, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Check,
  PackageCheck,
  Ruler,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useParams } from "react-router-dom";
import { routes } from "../app/routes";
import { BottomSheet } from "../components/BottomSheet";
import { getProductBySlug } from "../data";
import { getARProductBySlug } from "../data/ar-products";
import { formatUsd } from "../lib/currency";
import { NotFoundPage } from "./NotFoundPage";

const InlineModelViewer = lazy(() =>
  import("../components/InlineModelViewer").then(({ InlineModelViewer }) => ({
    default: InlineModelViewer,
  })),
);

function getInventoryLabel(status: string, piecesLeft?: number) {
  if (status === "limited" && piecesLeft) {
    return `${piecesLeft} pieces left`;
  }

  if (status === "made_to_order") {
    return "Made to order";
  }

  return "In stock";
}

export function ProductDetailPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const product = slug ? getProductBySlug(slug) : undefined;
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedFinishIndex, setSelectedFinishIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isPreview3DOpen, setIsPreview3DOpen] = useState(false);

  useEffect(() => {
    setActiveImageIndex(0);
    setSelectedFinishIndex(0);
    setAddedToCart(false);
    setIsPreview3DOpen(false);
  }, [product?.id]);

  if (!product) {
    return <NotFoundPage />;
  }

  const arProduct = getARProductBySlug(product.slug);
  const arDimensionsLabel = arProduct
    ? `${Math.round(arProduct.dimensionsMeters.width * 100)} × ${Math.round(arProduct.dimensionsMeters.depth * 100)} × ${Math.round(arProduct.dimensionsMeters.height * 100)} cm`
    : null;
  const galleryImages = [product.heroImage, ...product.gallery];
  const activeImage = galleryImages[activeImageIndex] ?? galleryImages[0];
  const selectedFinish = product.finishes[selectedFinishIndex] ?? product.finishes[0];
  const inventoryLabel = getInventoryLabel(product.inventory.status, product.inventory.piecesLeft);
  const savings = product.compareAtUsd ? product.compareAtUsd - product.priceUsd : 0;
  const ogImageSource = arProduct?.assets.poster ?? product.assets?.poster ?? activeImage.src;
  const absoluteOgImage = /^https?:\/\//i.test(ogImageSource)
    ? ogImageSource
    : typeof window !== "undefined"
      ? `${window.location.origin}${ogImageSource}`
      : ogImageSource;
  const dimensions = [
    { label: "Width", value: `${product.dimensions.widthIn}\"` },
    { label: "Depth", value: `${product.dimensions.depthIn}\"` },
    { label: "Height", value: `${product.dimensions.heightIn}\"` },
    {
      label: "Seat",
      value: product.dimensions.seatHeightIn ? `${product.dimensions.seatHeightIn}\"` : "N/A",
    },
  ];

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(routes.home);
  };

  const handleAddToCart = () => {
    setAddedToCart(true);
  };

  const handleOpenPreview3D = () => {
    setIsPreview3DOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>{`${product.name} | AR Decor`}</title>
        <meta name="description" content={product.description} />
        <meta property="og:title" content={product.name} />
        <meta property="og:image" content={absoluteOgImage} />
        <meta property="og:type" content="product" />
      </Helmet>
      <main className="relative min-h-screen bg-[#f8f8f7] pb-[calc(12rem+env(safe-area-inset-bottom))]">
        <div className="fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-[calc(0.9rem+env(safe-area-inset-top))]">
          <div className="flex w-full max-w-md items-center justify-between gap-3 px-1">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-neutral-950 shadow-[0_10px_30px_rgba(18,18,18,0.12)] backdrop-blur-xl transition-all duration-200 active:scale-95"
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="flex items-center gap-2 rounded-full border border-white/18 bg-white/86 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-700 shadow-[0_10px_30px_rgba(18,18,18,0.1)] backdrop-blur-xl">
              <Sparkles size={13} />
              <span>{product.collection}</span>
            </div>

            <Link
              to={routes.arView(product.slug)}
              className="inline-flex min-h-11 items-center rounded-full bg-neutral-950 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white shadow-[0_10px_30px_rgba(18,18,18,0.16)] transition-all duration-200 active:scale-95"
            >
              AR
            </Link>
          </div>
        </div>

        <section className="relative h-[68vh] min-h-[520px] overflow-hidden bg-neutral-950">
          <AnimatePresence mode="wait">
            <motion.img
              key={activeImage.id}
              src={activeImage.src}
              alt={activeImage.alt}
              referrerPolicy="no-referrer"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </AnimatePresence>

          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,18,18,0.18),rgba(18,18,18,0.18)_28%,rgba(18,18,18,0.9)_100%)]" />

          <div className="absolute right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-3">
            {galleryImages.map((image, index) => {
              const isActive = index === activeImageIndex;

              return (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  className={`relative h-16 w-14 overflow-hidden rounded-[18px] border transition-all duration-200 active:scale-95 ${
                    isActive
                      ? "border-white shadow-[0_14px_30px_rgba(0,0,0,0.22)]"
                      : "border-white/18"
                  }`}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,18,18,0.06),rgba(18,18,18,0.18))]" />
                </button>
              );
            })}
          </div>

          <div className="absolute inset-x-5 bottom-5 z-10 text-white">
            <div className="rounded-[32px] border border-white/15 bg-black/28 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/58">{product.collection}</p>
                  <h1 className="mt-3 max-w-[10ch] font-display text-[2.8rem] leading-[0.94] text-white">
                    {product.name}
                  </h1>
                  <p className="mt-3 max-w-xs text-sm leading-6 text-white/72">{product.tagline}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold tracking-tight text-white">
                    {formatUsd(product.priceUsd)}
                  </p>
                  {product.compareAtUsd ? (
                    <p className="mt-1 text-sm text-white/46 line-through">
                      {formatUsd(product.compareAtUsd)}
                    </p>
                  ) : null}
                  {savings > 0 ? (
                    <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/70">
                      Save {formatUsd(savings)}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/80">
                  <Star size={12} fill="currentColor" strokeWidth={0} />
                  <span>{product.rating.toFixed(1)} · {product.reviewCount} reviews</span>
                </div>
                <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/80">
                  {inventoryLabel}
                </div>
                <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/80">
                  {product.roomSceneLabel}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative -mt-8 rounded-t-[42px] border-t border-neutral-200/60 bg-[#f8f8f7]/98 px-5 pb-10 pt-6 shadow-[0_-24px_60px_rgba(32,24,18,0.06)] backdrop-blur-xl">
          <article className="rounded-[34px] border border-neutral-200/60 bg-white/90 p-6 shadow-[0_18px_60px_rgba(32,24,18,0.05)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">Curator’s note</p>
                <h2 className="mt-2 font-display text-3xl leading-tight text-neutral-950">
                  Designed to calm the room without flattening it.
                </h2>
              </div>
              <div className="rounded-full bg-[#f4ede4] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-700">
                {product.badge ?? "Curated"}
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-neutral-600">{product.description}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <div className="rounded-full border border-neutral-200/70 bg-[#fcfbf8] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-neutral-600">
                Designed by {product.designer}
              </div>
              <div className="rounded-full border border-neutral-200/70 bg-[#fcfbf8] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-neutral-600">
                {product.inventory.leadTimeLabel}
              </div>
              <div className="rounded-full border border-neutral-200/70 bg-[#fcfbf8] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-neutral-600">
                SKU {product.sku}
              </div>
            </div>
          </article>

          <section className="mt-5 rounded-[34px] border border-neutral-200/60 bg-white/90 p-6 shadow-[0_18px_60px_rgba(32,24,18,0.05)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">Finish selection</p>
                <h2 className="mt-2 font-display text-3xl leading-tight text-neutral-950">
                  Material choices with more presence.
                </h2>
              </div>
              <div className="rounded-full border border-neutral-200/70 bg-[#fcfbf8] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-neutral-600">
                {selectedFinish.material}
              </div>
            </div>

            <div className="hide-scrollbar -mx-5 mt-5 overflow-x-auto px-5 pb-1">
              <div className="flex w-max gap-3">
                {product.finishes.map((finish, index) => {
                  const isSelected = index === selectedFinishIndex;

                  return (
                    <button
                      key={finish.name}
                      type="button"
                      onClick={() => setSelectedFinishIndex(index)}
                      className={`w-[152px] rounded-[28px] border p-4 text-left transition-all duration-200 active:scale-95 ${
                        isSelected
                          ? "border-neutral-950 bg-neutral-950 text-white shadow-[0_18px_40px_rgba(18,18,18,0.12)]"
                          : "border-neutral-200/70 bg-[#fcfbf8] text-neutral-900"
                      }`}
                    >
                      <div
                        className="h-20 rounded-[20px] border border-black/8"
                        style={{ backgroundColor: finish.swatch }}
                      />
                      <p className="mt-4 text-sm font-medium">{finish.name}</p>
                      <p className={`mt-1 text-xs ${isSelected ? "text-white/68" : "text-neutral-500"}`}>
                        {finish.material}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 rounded-[26px] border border-neutral-200/70 bg-[#fcfbf8] p-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-10 w-10 rounded-full border border-black/8"
                  style={{ backgroundColor: selectedFinish.swatch }}
                />
                <div>
                  <p className="text-sm font-medium text-neutral-950">{selectedFinish.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-neutral-500">
                    {selectedFinish.material}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-5 grid gap-4">
            <article className="rounded-[34px] border border-neutral-200/60 bg-white/90 p-6 shadow-[0_18px_60px_rgba(32,24,18,0.05)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-950 text-white">
                  <Ruler size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">Scale</p>
                  <h2 className="mt-1 font-display text-3xl leading-tight text-neutral-950">
                    Proportioned for real rooms.
                  </h2>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {dimensions.map((dimension) => (
                  <div
                    key={dimension.label}
                    className="rounded-[24px] border border-neutral-200/70 bg-[#fcfbf8] p-4"
                  >
                    <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">{dimension.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-neutral-950">{dimension.value}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[34px] border border-neutral-200/60 bg-white/90 p-6 shadow-[0_18px_60px_rgba(32,24,18,0.05)]">
              <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">Composition</p>
              <h2 className="mt-2 font-display text-3xl leading-tight text-neutral-950">
                Materials chosen to age with the room.
              </h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {product.materials.map((material) => (
                  <div
                    key={material}
                    className="rounded-full border border-neutral-200/70 bg-[#fcfbf8] px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-neutral-600"
                  >
                    {material}
                  </div>
                ))}
              </div>
            </article>

            <section className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-[34px] border border-neutral-200/60 bg-white/90 p-6 shadow-[0_18px_60px_rgba(32,24,18,0.05)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f4ede4] text-neutral-900">
                    <PackageCheck size={18} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">Highlights</p>
                    <h2 className="mt-1 text-lg font-medium text-neutral-950">Why it earns space</h2>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {product.features.map((feature) => (
                    <div key={feature} className="flex gap-3">
                      <div className="mt-1.5 h-2 w-2 rounded-full bg-neutral-950" />
                      <p className="text-sm leading-6 text-neutral-600">{feature}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-[34px] border border-neutral-200/60 bg-white/90 p-6 shadow-[0_18px_60px_rgba(32,24,18,0.05)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f4ede4] text-neutral-900">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">Care</p>
                    <h2 className="mt-1 text-lg font-medium text-neutral-950">Keep the finish refined</h2>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {product.care.map((careItem) => (
                    <div key={careItem} className="flex gap-3">
                      <div className="mt-1.5 h-2 w-2 rounded-full bg-neutral-950" />
                      <p className="text-sm leading-6 text-neutral-600">{careItem}</p>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </section>
        </section>

        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+0.9rem)]">
          <div className="pointer-events-auto w-full max-w-md px-4">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-[32px] border border-neutral-200/70 bg-[#f6f1e8]/94 p-4 shadow-[0_24px_80px_rgba(32,24,18,0.14)] backdrop-blur-xl"
            >
              <div className="flex items-center justify-between gap-4 pb-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Selected finish</p>
                  <p className="mt-1 text-sm font-medium text-neutral-900">
                    {selectedFinish.name} · {selectedFinish.material}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Price</p>
                  <p className="mt-1 text-lg font-semibold text-neutral-950">{formatUsd(product.priceUsd)}</p>
                </div>
              </div>

              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={handleOpenPreview3D}
                  className="inline-flex items-center justify-between gap-3 rounded-[24px] border border-neutral-200/70 bg-white/78 px-5 py-4 text-left text-sm font-medium text-neutral-950 transition-all duration-200 active:scale-95"
                >
                  <span>
                    <span className="block text-sm font-medium">View in 3D</span>
                    <span className="mt-1 block text-xs uppercase tracking-[0.16em] text-neutral-500">
                      Orbit the piece before opening AR
                    </span>
                  </span>
                  <Box size={18} />
                </button>

                <div className="grid grid-cols-[116px_1fr] gap-3">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="inline-flex items-center justify-center gap-2 rounded-[24px] border border-neutral-200/70 bg-white/80 px-4 py-4 text-sm font-medium text-neutral-950 transition-all duration-200 active:scale-95"
                  >
                    {addedToCart ? <Check size={16} /> : null}
                    <span>{addedToCart ? "Added" : "Add"}</span>
                  </button>
                  <Link
                    to={routes.arView(product.slug)}
                    className="inline-flex items-center justify-between gap-3 rounded-[28px] bg-neutral-950 px-5 py-4 text-white transition-all duration-200 active:scale-95"
                  >
                    <span className="text-left">
                      <span className="block text-sm font-medium">View in Your Room</span>
                      <span className="mt-1 block text-xs uppercase tracking-[0.16em] text-white/58">
                        Place {selectedFinish.name.toLowerCase()} in your room
                      </span>
                    </span>
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <BottomSheet
        isOpen={isPreview3DOpen}
        onClose={() => setIsPreview3DOpen(false)}
        title={`${product.name} in 3D`}
        snapPoints="full"
      >
        {arProduct ? (
          <Suspense
            fallback={
              <div className="flex min-h-[420px] items-center justify-center rounded-[32px] bg-neutral-100 text-sm text-neutral-400">
                Loading 3D preview...
              </div>
            }
          >
            <div className="space-y-4 pb-4">
              <InlineModelViewer product={arProduct} className="min-h-[420px] rounded-[32px]" />
              <div className="rounded-[28px] border border-black/8 bg-white/78 p-5">
                <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Preview details</p>
                <h3 className="mt-2 text-lg font-semibold text-neutral-950">{arProduct.brand}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-600">{arProduct.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <div className="rounded-full border border-neutral-200/70 bg-[#fcfbf8] px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-neutral-600">
                    {arDimensionsLabel}
                  </div>
                  <div className="rounded-full border border-neutral-200/70 bg-[#fcfbf8] px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-neutral-600">
                    {arProduct.placement.surface} placement
                  </div>
                </div>
              </div>
            </div>
          </Suspense>
        ) : (
          <div className="rounded-[28px] border border-black/8 bg-white/80 p-6 text-center text-neutral-700">
            3D preview unavailable for this product.
          </div>
        )}
      </BottomSheet>
    </>
  );
}



