import React, { useState, useEffect } from 'react';
import { X, Star, Check, ShoppingBag, ArrowRight } from 'lucide-react';
import { CatalogProduct } from '../types/store.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface QuickViewModalProps {
  product: CatalogProduct | null;
  onClose: () => void;
  onAddToCart: (product: CatalogProduct, variantId: number, quantity: number) => void;
  onOpenFullProduct: (slug: string) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onOpenFullProduct,
}) => {
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  useEffect(() => {
    if (product && product.variants.length > 0) {
      const firstAvailable =
        product.variants.find((v) => v.stock > 0) || product.variants[0];
      setSelectedColor(firstAvailable.color);
      setSelectedSize(firstAvailable.size);
      setQuantity(1);
      setAddedFeedback(false);
    }
  }, [product]);

  if (!product) return null;

  const colors = Array.from(new Set(product.variants.map((v) => v.color)));
  const variantsForColor = product.variants.filter(
    (v) => v.color === selectedColor
  );
  const activeVariant =
    variantsForColor.find((v) => v.size === selectedSize) ||
    variantsForColor[0] ||
    product.variants[0];

  const stock = activeVariant ? activeVariant.stock : 0;
  const displayPrice = activeVariant?.priceOverride || product.price;

  const handleAdd = () => {
    if (!activeVariant || stock <= 0) return;
    onAddToCart(product, activeVariant.id, quantity);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quickview-title"
    >
      <div className="relative w-full max-w-3xl bg-white border border-neutral-200 overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close quick view"
          className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center bg-white border border-neutral-200 text-neutral-900 hover:bg-neutral-950 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Image Column */}
        <div className="bg-[#F9F9F8] flex items-center justify-center min-h-[280px] md:min-h-[420px]">
          <ResilientImage
            src={product.primaryImage}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Details Column */}
        <div className="p-6 md:p-8 flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-wider mb-2">
              <span>{product.gender}</span>
              <span aria-hidden="true">·</span>
              <span>{product.productType}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{product.sku}</span>
            </div>

            <h2
              id="quickview-title"
              className="text-xl md:text-2xl font-display font-bold text-neutral-950 leading-tight"
            >
              {product.name}
            </h2>

            <div className="flex items-center gap-3 mt-3">
              <span className="text-xl font-mono font-semibold text-neutral-950 tabular-nums">
                Rs. {displayPrice.toLocaleString()}
              </span>
              {product.compareAtPrice && product.compareAtPrice > displayPrice && (
                <span className="text-sm font-mono text-neutral-400 line-through tabular-nums">
                  Rs. {product.compareAtPrice.toLocaleString()}
                </span>
              )}
              <span className="ml-auto inline-flex items-center gap-1 text-xs font-mono text-neutral-700">
                <Star className="w-3.5 h-3.5 fill-neutral-950 text-neutral-950" />
                {product.ratingAvg.toFixed(1)}
              </span>
            </div>

            <p className="text-sm text-neutral-600 mt-3 leading-relaxed">
              {product.shortDescription}
            </p>

            {/* Color Selector */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs uppercase tracking-wider text-neutral-600 mb-2">
                <span>Color: <strong className="text-neutral-950">{selectedColor}</strong></span>
              </div>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => {
                  const sampleVar = product.variants.find((v) => v.color === color);
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setSelectedColor(color);
                        const nextVars = product.variants.filter((v) => v.color === color);
                        const avail = nextVars.find((v) => v.stock > 0) || nextVars[0];
                        if (avail) setSelectedSize(avail.size);
                      }}
                      className={`px-3 py-1.5 text-xs font-medium border transition-colors flex items-center gap-2 whitespace-nowrap ${
                        selectedColor === color
                          ? 'border-neutral-950 bg-neutral-950 text-white'
                          : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-neutral-300"
                        style={{ backgroundColor: sampleVar?.colorHex || '#111' }}
                      />
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Selector */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-wider text-neutral-600 mb-2">
                <span>Select Size (EU / Nepal)</span>
                <span className="font-mono text-[11px]">
                  {stock > 0 ? `${stock} in stock` : 'OUT OF STOCK'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {variantsForColor.map((v) => {
                  const unavailable = v.stock <= 0;
                  const isSelected = selectedSize === v.size;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={unavailable}
                      onClick={() => setSelectedSize(v.size)}
                      className={`py-2 px-2 text-xs font-mono border transition-colors flex flex-col items-center justify-center ${
                        unavailable
                          ? 'border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed line-through'
                          : isSelected
                          ? 'border-neutral-950 bg-neutral-950 text-white font-semibold'
                          : 'border-neutral-200 bg-white text-neutral-900 hover:border-neutral-950'
                      }`}
                    >
                      <span>{v.size}</span>
                      {unavailable && (
                        <span className="text-[9px] uppercase tracking-tighter no-underline">
                          Out
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-neutral-200 flex flex-col gap-2.5">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-neutral-300">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-2.5 text-sm font-mono hover:bg-neutral-100"
                >
                  -
                </button>
                <span className="px-3 py-2.5 text-sm font-mono tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(Math.max(1, stock), q + 1))
                  }
                  className="px-3 py-2.5 text-sm font-mono hover:bg-neutral-100"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                disabled={stock <= 0}
                onClick={handleAdd}
                className={`flex-1 py-3 px-5 text-xs font-semibold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${
                  stock <= 0
                    ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                    : addedFeedback
                    ? 'bg-emerald-700 text-white'
                    : 'bg-neutral-950 text-white hover:bg-neutral-800'
                }`}
              >
                {stock <= 0 ? (
                  'OUT OF STOCK'
                ) : addedFeedback ? (
                  <>
                    <Check className="w-4 h-4" /> Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" /> Add to Cart
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFullProduct(product.slug);
              }}
              className="w-full py-2.5 text-xs font-medium uppercase tracking-widest text-neutral-700 hover:text-neutral-950 flex items-center justify-center gap-1.5"
            >
              View Full Product Details <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
