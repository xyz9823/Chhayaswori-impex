import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  Star,
  Heart,
  ShoppingBag,
  Check,
  Truck,
  RotateCcw,
  ShieldCheck,
  ZoomIn,
  Upload,
} from 'lucide-react';
import {
  CatalogProduct,
  SiteSettingsData,
  UserProfile,
} from '../types/store.ts';
import { ResilientImage } from '../components/ResilientImage.tsx';
import { ProductCard } from '../components/ProductCard.tsx';

interface ProductDetailPageProps {
  product: CatalogProduct;
  allProducts: CatalogProduct[];
  recentlyViewedSlugs: string[];
  settings: SiteSettingsData | null;
  userProfile: UserProfile | null;
  isWishlisted: boolean;
  onToggleWishlist: (productId: number, e: React.MouseEvent) => void;
  onAddToCart: (product: CatalogProduct, variantId: number, quantity: number) => void;
  onBuyNow: (product: CatalogProduct, variantId: number, quantity: number) => void;
  onQuickView: (product: CatalogProduct, e: React.MouseEvent) => void;
  onOpenProduct: (slug: string) => void;
  onNavigateShop: (categorySlug?: string) => void;
  onNavigateHome: () => void;
  onSubmitReview: (payload: {
    productId: number;
    rating: number;
    comment: string;
    imageUrl?: string;
  }) => Promise<void>;
  onUploadImage: (
    bucket: 'review-images',
    file: File
  ) => Promise<string>;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  allProducts,
  recentlyViewedSlugs,
  settings,
  userProfile,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
  onQuickView,
  onOpenProduct,
  onNavigateShop,
  onNavigateHome,
  onSubmitReview,
  onUploadImage,
}) => {
  const [selectedImage, setSelectedImage] = useState<string>(product.primaryImage);
  const [zoomActive, setZoomActive] = useState<boolean>(false);
  const [zoomPos, setZoomPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [addedFeedback, setAddedFeedback] = useState<boolean>(false);

  // Review form state
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [reviewImageUrl, setReviewImageUrl] = useState<string>('');
  const [uploadingReviewImg, setUploadingReviewImg] = useState<boolean>(false);
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);

  useEffect(() => {
    setSelectedImage(product.primaryImage);
    if (product.variants.length > 0) {
      const firstAvail =
        product.variants.find((v) => v.stock > 0) || product.variants[0];
      setSelectedColor(firstAvail.color);
      setSelectedSize(firstAvail.size);
      setQuantity(1);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product]);

  const colors = Array.from(new Set(product.variants.map((v) => v.color)));
  const variantsForColor = product.variants.filter(
    (v) => v.color === selectedColor
  );
  const activeVariant =
    variantsForColor.find((v) => v.size === selectedSize) ||
    variantsForColor[0] ||
    product.variants[0];

  const stock = activeVariant ? activeVariant.stock : 0;
  const activePrice = activeVariant?.priceOverride || product.price;

  const relatedProducts = allProducts
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.categorySlug === product.categorySlug ||
          p.productType === product.productType ||
          p.gender === product.gender)
    )
    .slice(0, 4);

  const recentlyViewedProducts = recentlyViewedSlugs
    .filter((slug) => slug !== product.slug)
    .map((slug) => allProducts.find((p) => p.slug === slug))
    .filter((p): p is CatalogProduct => Boolean(p))
    .slice(0, 4);

  const handleReviewFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReviewImg(true);
    try {
      const url = await onUploadImage('review-images', file);
      setReviewImageUrl(url);
    } catch (err: any) {
      setReviewMessage(err.message || 'Image upload failed.');
    } finally {
      setUploadingReviewImg(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmittingReview(true);
    setReviewMessage(null);
    try {
      await onSubmitReview({
        productId: product.id,
        rating,
        comment,
        imageUrl: reviewImageUrl,
      });
      setComment('');
      setReviewImageUrl('');
      setReviewMessage('Thank you! Your review has been published.');
    } catch (err: any) {
      setReviewMessage(err.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // JSON-LD Product Schema for SEO (Section 44)
  const productSchema = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: [product.primaryImage],
    description: product.shortDescription,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'CHHAYASWORI IMPEX',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'NPR',
      price: activePrice,
      availability:
        stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.ratingAvg,
      reviewCount: Math.max(1, product.reviewCount),
    },
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      {/* 45. BREADCRUMBS (Home / Gender / ProductType / Product) */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mb-8"
      >
        <button
          type="button"
          onClick={onNavigateHome}
          className="hover:text-neutral-950"
        >
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button
          type="button"
          onClick={() => onNavigateShop(product.gender.toLowerCase())}
          className="hover:text-neutral-950"
        >
          {product.gender}
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button
          type="button"
          onClick={() => onNavigateShop(product.productType.toLowerCase())}
          className="hover:text-neutral-950"
        >
          {product.productType}
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-neutral-950 font-medium">{product.name}</span>
      </nav>

      {/* 17. CONTIGUOUS PURCHASE MODULE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        {/* LEFT: Image Gallery & Zoom */}
        <div className="lg:col-span-7 space-y-4">
          <div
            onMouseEnter={() => setZoomActive(true)}
            onMouseLeave={() => setZoomActive(false)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              setZoomPos({ x, y });
            }}
            className="relative aspect-[4/3] w-full bg-[#F9F9F8] border border-neutral-200 overflow-hidden cursor-zoom-in"
          >
            <ResilientImage
              src={selectedImage}
              alt={product.name}
              priority
              className={`w-full h-full object-cover transition-transform duration-200 ${
                zoomActive ? 'scale-150' : 'scale-100'
              }`}
            />
            {zoomActive && (
              <style>{`
                .cursor-zoom-in img {
                  transform-origin: ${zoomPos.x}% ${zoomPos.y}%;
                }
              `}</style>
            )}
            <div className="absolute bottom-3 right-3 bg-white/90 border border-neutral-200 px-2.5 py-1 text-[11px] text-neutral-600 flex items-center gap-1 pointer-events-none">
              <ZoomIn className="w-3.5 h-3.5" /> Hover to Zoom
            </div>
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setSelectedImage(img.imageUrl)}
                  className={`w-20 h-20 border shrink-0 bg-[#F9F9F8] overflow-hidden ${
                    selectedImage === img.imageUrl
                      ? 'border-neutral-950 ring-1 ring-neutral-950'
                      : 'border-neutral-200 opacity-75 hover:opacity-100'
                  }`}
                >
                  <ResilientImage
                    src={img.imageUrl}
                    alt={img.altText || product.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Product Purchase Controls */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-500 uppercase tracking-wider mb-2">
              <span>
                {product.brand} · {product.gender} · {product.productType}
              </span>
              <span className="font-mono">SKU: {activeVariant?.sku || product.sku}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-display font-bold text-neutral-950 leading-tight">
              {product.name}
            </h1>

            {/* Rating & Price */}
            <div className="mt-4 flex items-center justify-between pb-5 border-b border-neutral-200">
              <div className="flex items-baseline gap-3 font-mono tabular-nums">
                <span className="text-2xl font-bold text-neutral-950">
                  Rs. {activePrice.toLocaleString()}
                </span>
                {product.compareAtPrice && product.compareAtPrice > activePrice && (
                  <>
                    <span className="text-sm text-neutral-400 line-through">
                      Rs. {product.compareAtPrice.toLocaleString()}
                    </span>
                    <span className="text-xs font-semibold bg-neutral-950 text-white px-2 py-0.5">
                      SAVE {product.discountPercent}%
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs font-mono">
                <Star className="w-4 h-4 fill-neutral-950 text-neutral-950" />
                <span className="font-semibold">{product.ratingAvg.toFixed(1)}</span>
                <span className="text-neutral-500">
                  ({product.reviews?.length || product.reviewCount} reviews)
                </span>
              </div>
            </div>

            <p className="mt-4 text-sm text-neutral-600 leading-relaxed">
              {product.shortDescription}
            </p>

            {/* Color Selector */}
            <div className="mt-6">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-950 mb-2.5">
                Color: <span className="font-normal text-neutral-600">{selectedColor}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => {
                  const sample = product.variants.find((v) => v.color === color);
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setSelectedColor(color);
                        const nextVars = product.variants.filter(
                          (v) => v.color === color
                        );
                        const avail =
                          nextVars.find((v) => v.stock > 0) || nextVars[0];
                        if (avail) setSelectedSize(avail.size);
                      }}
                      className={`px-3.5 py-2 text-xs font-medium border flex items-center gap-2 transition-colors ${
                        selectedColor === color
                          ? 'border-neutral-950 bg-neutral-950 text-white'
                          : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-950'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-neutral-300"
                        style={{ backgroundColor: sample?.colorHex || '#111' }}
                      />
                      <span>{color}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Selector (Shows OUT OF STOCK and disables selection if unavailable) */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs mb-2.5">
                <span className="font-semibold uppercase tracking-wider text-neutral-950">
                  Select Size
                </span>
                <span
                  className={`font-mono text-xs ${
                    stock > 0 ? 'text-emerald-700 font-medium' : 'text-red-600 font-semibold'
                  }`}
                >
                  {stock > 0
                    ? `${stock} unit(s) available in Size ${selectedSize}`
                    : 'OUT OF STOCK'}
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {variantsForColor.map((v) => {
                  const isUnavailable = v.stock <= 0;
                  const isSelected = selectedSize === v.size;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={isUnavailable}
                      onClick={() => {
                        setSelectedSize(v.size);
                        setQuantity(1);
                      }}
                      className={`py-2.5 px-2 border font-mono text-xs flex flex-col items-center justify-center transition-colors ${
                        isUnavailable
                          ? 'border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed'
                          : isSelected
                          ? 'border-neutral-950 bg-neutral-950 text-white font-bold'
                          : 'border-neutral-200 bg-white text-neutral-900 hover:border-neutral-950'
                      }`}
                    >
                      <span className={isUnavailable ? 'line-through' : ''}>
                        {v.size}
                      </span>
                      {isUnavailable && (
                        <span className="text-[9px] uppercase tracking-tighter text-red-600 font-sans font-semibold mt-0.5">
                          OUT OF STOCK
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity & Primary CTAs */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-neutral-300">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3.5 py-3 text-sm font-mono hover:bg-neutral-100"
                  >
                    -
                  </button>
                  <span className="px-4 py-3 text-sm font-mono tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((q) => Math.min(Math.max(1, stock), q + 1))
                    }
                    className="px-3.5 py-3 text-sm font-mono hover:bg-neutral-100"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  disabled={stock <= 0}
                  onClick={() => {
                    if (!activeVariant || stock <= 0) return;
                    onAddToCart(product, activeVariant.id, quantity);
                    setAddedFeedback(true);
                    setTimeout(() => setAddedFeedback(false), 1800);
                  }}
                  className={`flex-1 py-3.5 px-6 text-xs font-semibold uppercase tracking-[0.18em] flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
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
                      <Check className="w-4 h-4" /> Added to Bag
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" /> Add to Cart
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => onToggleWishlist(product.id, e)}
                  aria-label="Toggle Wishlist"
                  className="p-3.5 border border-neutral-300 hover:border-neutral-950 transition-colors"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isWishlisted ? 'fill-neutral-950 text-neutral-950' : ''
                    }`}
                  />
                </button>
              </div>

              <button
                type="button"
                disabled={stock <= 0}
                onClick={() => {
                  if (!activeVariant || stock <= 0) return;
                  onBuyNow(product, activeVariant.id, quantity);
                }}
                className={`w-full py-3.5 text-xs font-semibold uppercase tracking-[0.2em] border transition-colors ${
                  stock <= 0
                    ? 'border-neutral-200 text-neutral-400 cursor-not-allowed'
                    : 'border-neutral-950 text-neutral-950 hover:bg-neutral-950 hover:text-white'
                }`}
              >
                Buy Now — Express Checkout
              </button>
            </div>

            {/* Delivery & Return Information */}
            <div className="mt-6 pt-6 border-t border-neutral-200 space-y-2.5 text-xs text-neutral-600">
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-neutral-950 shrink-0" />
                <span>
                  Kathmandu Delivery: <strong>Rs. {settings?.deliveryFeeKathmandu ?? 120}</strong> ·
                  Outside Valley: <strong>Rs. {settings?.deliveryFeeOutside ?? 220}</strong> ·
                  Free above <strong>Rs. {(settings?.freeDeliveryThreshold ?? 2500).toLocaleString()}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <RotateCcw className="w-4 h-4 text-neutral-950 shrink-0" />
                <span>
                  {settings?.returnPeriodDays ?? 7}-day return eligibility on unused
                  footwear in original packaging
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-neutral-950 shrink-0" />
                <span>
                  Cash on Delivery, Bank Transfer, eSewa & Fonepay options
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DESCRIPTION, FEATURES & MATERIAL */}
      <div className="mt-16 pt-12 border-t border-neutral-200 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-lg font-display font-bold uppercase text-neutral-950">
            Product Architecture & Description
          </h2>
          <p className="text-sm text-neutral-700 leading-relaxed">
            {product.fullDescription || product.shortDescription}
          </p>
          <div className="pt-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-950 block">
              Material Specification
            </span>
            <p className="text-sm text-neutral-600 mt-1">{product.material}</p>
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#F9F9F8] border border-neutral-200 p-6">
          <h3 className="text-sm font-display font-bold uppercase text-neutral-950 mb-4">
            Key Comfort Features
          </h3>
          <ul className="space-y-2.5 text-sm text-neutral-700">
            {(product.features || []).map((feat, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-neutral-950 shrink-0 mt-0.5" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 32. VERIFIED CUSTOMER REVIEWS */}
      <div className="mt-16 pt-12 border-t border-neutral-200 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7">
          <h2 className="text-lg font-display font-bold uppercase text-neutral-950 mb-6">
            Customer Reviews ({product.reviews?.length || 0})
          </h2>

          {!product.reviews || product.reviews.length === 0 ? (
            <p className="text-sm text-neutral-500 border border-neutral-200 p-6 bg-[#F9F9F8]">
              No reviews yet for this style. Be the first customer to review!
            </p>
          ) : (
            <div className="space-y-4">
              {product.reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="border border-neutral-200 p-5 bg-white space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-neutral-950">
                        {rev.customerName}
                      </span>
                      {rev.isVerifiedPurchase && (
                        <span className="text-[11px] text-emerald-700 font-medium">
                          · Verified Purchase
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-3.5 h-3.5 fill-neutral-950 text-neutral-950"
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-neutral-700 leading-relaxed">
                    {rev.comment}
                  </p>
                  {rev.imageUrl && (
                    <img
                      src={rev.imageUrl}
                      alt="Customer review attachment"
                      className="w-24 h-24 object-cover border border-neutral-200 mt-2"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Write a Review */}
        <div className="lg:col-span-5 border border-neutral-200 p-6 bg-[#F9F9F8]">
          <h3 className="text-sm font-display font-bold uppercase text-neutral-950 mb-2">
            Write a Customer Review
          </h3>
          {!userProfile ? (
            <p className="text-xs text-neutral-600 leading-relaxed">
              Please sign in via your Customer Account to submit a verified
              product review.
            </p>
          ) : (
            <form onSubmit={handleReviewSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                  Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setRating(num)}
                      className={`px-3 py-1.5 text-xs font-mono border ${
                        rating === num
                          ? 'bg-neutral-950 text-white border-neutral-950'
                          : 'bg-white text-neutral-700 border-neutral-300'
                      }`}
                    >
                      {num} ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                  Your Review
                </label>
                <textarea
                  rows={3}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share how the size, comfort, and cushioning felt..."
                  className="w-full p-3 text-xs bg-white border border-neutral-300 focus:border-neutral-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                  Optional Photo
                </label>
                <label className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-neutral-300 text-xs cursor-pointer hover:border-neutral-950">
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {uploadingReviewImg ? 'Uploading...' : 'Attach Photo'}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleReviewFileChange}
                    className="hidden"
                  />
                </label>
                {reviewImageUrl && (
                  <p className="text-[11px] text-emerald-700 mt-1">
                    Photo attached ready for submission.
                  </p>
                )}
              </div>

              {reviewMessage && (
                <p className="text-xs font-medium text-neutral-900">
                  {reviewMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-3 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-widest hover:bg-neutral-800"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 59. RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <div className="mt-16 pt-12 border-t border-neutral-200">
          <h2 className="text-xl font-display font-bold uppercase text-neutral-950 mb-6">
            Recommended For You
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rp) => (
              <ProductCard
                key={`rel-${rp.uuid}`}
                product={rp}
                isWishlisted={false}
                onToggleWishlist={onToggleWishlist}
                onQuickView={onQuickView}
                onOpenProduct={onOpenProduct}
              />
            ))}
          </div>
        </div>
      )}

      {/* 58. RECENTLY VIEWED */}
      {recentlyViewedProducts.length > 0 && (
        <div className="mt-16 pt-12 border-t border-neutral-200">
          <h2 className="text-xl font-display font-bold uppercase text-neutral-950 mb-6">
            Recently Viewed
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentlyViewedProducts.map((rvp) => (
              <ProductCard
                key={`rv-${rvp.uuid}`}
                product={rvp}
                isWishlisted={false}
                onToggleWishlist={onToggleWishlist}
                onQuickView={onQuickView}
                onOpenProduct={onOpenProduct}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
