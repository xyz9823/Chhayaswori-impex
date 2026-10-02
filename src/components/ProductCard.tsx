import React from 'react';
import { Heart, Eye, Star } from 'lucide-react';
import { CatalogProduct } from '../types/store.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface ProductCardProps {
  product: CatalogProduct;
  isWishlisted: boolean;
  onToggleWishlist: (productId: number, e: React.MouseEvent) => void;
  onQuickView: (product: CatalogProduct, e: React.MouseEvent) => void;
  onOpenProduct: (slug: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted,
  onToggleWishlist,
  onQuickView,
  onOpenProduct,
}) => {
  const isOutOfStock = product.totalStock <= 0;

  return (
    <article
      onClick={() => onOpenProduct(product.slug)}
      className="group cursor-pointer flex flex-col bg-white border border-neutral-200/80 transition-transform duration-200 hover:-translate-y-0.5"
    >
      {/* Product Image Container (70% height dominance on neutral #F9F9F8 backdrop) */}
      <div className="relative aspect-[4/3] w-full bg-[#F9F9F8] overflow-hidden">
        <ResilientImage
          src={product.primaryImage}
          alt={product.name}
          className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
        />

        {/* Subtle status label (max 1 quiet text label, no pill sandwich) */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {isOutOfStock ? (
            <span className="bg-neutral-950 text-white text-[11px] font-medium tracking-wider uppercase px-2.5 py-1">
              OUT OF STOCK
            </span>
          ) : product.discountPercent > 0 ? (
            <span className="bg-neutral-950 text-white text-[11px] font-mono font-medium tracking-wider uppercase px-2.5 py-1">
              -{product.discountPercent}%
            </span>
          ) : product.isNewArrival ? (
            <span className="bg-white/95 text-neutral-950 text-[11px] font-medium tracking-wider uppercase px-2.5 py-1 border border-neutral-200">
              NEW
            </span>
          ) : null}
        </div>

        {/* Wishlist & Quick View Functional Affordances */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={(e) => onToggleWishlist(product.id, e)}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className="w-9 h-9 flex items-center justify-center bg-white/95 text-neutral-900 border border-neutral-200 hover:bg-neutral-950 hover:text-white transition-colors"
          >
            <Heart
              className={`w-4 h-4 ${
                isWishlisted ? 'fill-current text-neutral-950 group-hover:text-white' : ''
              }`}
            />
          </button>
          <button
            type="button"
            onClick={(e) => onQuickView(product, e)}
            aria-label={`Quick view ${product.name}`}
            className="w-9 h-9 flex items-center justify-center bg-white/95 text-neutral-900 border border-neutral-200 hover:bg-neutral-950 hover:text-white transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-2">
        <div>
          {/* Clean unboxed metadata with typographic separators */}
          <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
            <div className="flex items-center gap-1.5 truncate">
              <span className="uppercase tracking-wider">{product.gender}</span>
              <span aria-hidden="true">·</span>
              <span>{product.productType}</span>
            </div>
            <div className="flex items-center gap-1 text-neutral-700 shrink-0 font-mono text-xs">
              <Star className="w-3 h-3 fill-neutral-900 text-neutral-900" />
              <span>{product.ratingAvg.toFixed(1)}</span>
            </div>
          </div>

          <h3 className="text-[15px] font-semibold text-neutral-950 leading-snug line-clamp-1 group-hover:underline">
            {product.name}
          </h3>
        </div>

        <div className="pt-2 border-t border-neutral-100 flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-[15px] font-semibold text-neutral-950">
              Rs. {product.price.toLocaleString()}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs text-neutral-400 line-through">
                Rs. {product.compareAtPrice.toLocaleString()}
              </span>
            )}
          </div>
          <span className="text-[11px] text-neutral-500 whitespace-nowrap">
            {product.sizes.length > 0 ? `Sizes ${product.sizes[0]}–${product.sizes[product.sizes.length - 1]}` : ''}
          </span>
        </div>
      </div>
    </article>
  );
};
