import { Link, useParams } from "react-router-dom";
import { routes } from "../app/routes";
import { getARProductBySlug } from "../data/ar-products";
import ARLauncher from "../components/ARLauncher";

export function ARPage() {
  const { slug } = useParams();
  const product = slug ? getARProductBySlug(slug) : undefined;

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0d0b0a] px-6 py-10 text-white">
        <div className="w-full max-w-sm rounded-[32px] border border-white/10 bg-white/8 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/54">AR Decor</p>
          <h1 className="mt-4 font-display text-4xl leading-tight text-white">Product not found</h1>
          <p className="mt-3 text-sm leading-6 text-white/68">
            We couldn't find a matching product for this AR preview.
          </p>
          <Link
            to={routes.home}
            className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-medium text-neutral-950 transition-all duration-[var(--duration-fast)] active:scale-95"
          >
            Back home
          </Link>
        </div>
      </main>
    );
  }

  return <ARLauncher product={product} />;
}
