import type { ARCatalogProduct } from "../types/app";
import { formatCurrency } from "../lib/currency";

interface CatalogCardProps {
  product: ARCatalogProduct;
  onSelect: (product: ARCatalogProduct) => void;
  isSelected?: boolean;
}

export function CatalogCard({ product, onSelect, isSelected = false }: CatalogCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      aria-pressed={isSelected}
      className={`w-full overflow-hidden rounded-[24px] border bg-white/92 text-left shadow-[0_18px_50px_rgba(18,18,18,0.05)] transition-all duration-[var(--duration-fast)] active:scale-95 ${
        isSelected ? "border-brand-accent" : "border-black/8"
      }`}
    >
      <img
        src={product.assets.poster}
        alt={product.name}
        referrerPolicy="no-referrer"
        loading="lazy"
        className="aspect-[0.95] w-full object-cover"
      />
      <div className="space-y-2 p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-content-secondary">{product.brand}</p>
        <div>
          <h3 className="text-base font-semibold text-content-primary">{product.name}</h3>
          <p className="mt-1 text-sm text-content-secondary">{formatCurrency(product.price, product.currency)}</p>
        </div>
      </div>
    </button>
  );
}