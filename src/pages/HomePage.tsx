import React, { useState, useRef } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Truck,
  RotateCcw,
  ShieldCheck,
  PhoneCall,
  Headphones,
  Star,
  MapPin,
  Clock,
  CheckCircle2,
  Plus,
  Minus,
} from 'lucide-react';
import {
  BannerItem,
  CatalogProduct,
  CategoryItem,
  SiteSettingsData,
  StoreLocationItem,
} from '../types/store.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { ResilientImage } from '../components/ResilientImage.tsx';

interface HomePageProps {
  products: CatalogProduct[];
  categories: CategoryItem[];
  banners: BannerItem[];
  settings: SiteSettingsData | null;
  locations: StoreLocationItem[];
  wishlistIds: number[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onToggleWishlist: (productId: number, e: React.MouseEvent) => void;
  onQuickView: (product: CatalogProduct, e: React.MouseEvent) => void;
  onOpenProduct: (slug: string) => void;
  onNavigateShop: (categorySlug?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  products,
  categories,
  banners,
  settings,
  locations,
  wishlistIds,
  loading,
  error,
  onRetry,
  onToggleWishlist,
  onQuickView,
  onOpenProduct,
  onNavigateShop,
}) => {
  const [topTab, setTopTab] = useState<'ALL' | 'MEN' | 'WOMEN' | 'KIDS' | 'COMFORT'>('ALL');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const catScrollRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const newScrollRef = useRef<HTMLDivElement>(null);
  const bestScrollRef = useRef<HTMLDivElement>(null);
  const comfortScrollRef = useRef<HTMLDivElement>(null);

  const scrollRoller = (
    ref: React.RefObject<HTMLDivElement | null>,
    dir: 'left' | 'right'
  ) => {
    if (!ref.current) return;
    const distance = 360;
    ref.current.scrollBy({
      left: dir === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  const heroBanner = banners.find(
    (b) => b.placement === 'HERO' && b.isActive
  ) || {
    id: 1,
    placement: 'HERO',
    subtitle: 'NEW SEASON',
    heading: 'STEP INTO COMFORT',
    description: 'Discover footwear designed for every step.',
    ctaText: 'SHOP NOW',
    ctaLink: '/shop',
    desktopImageUrl:
      '/src/assets/images/chhayaswori_hero_editorial_1790932976025.jpg',
    mobileImageUrl:
      '/src/assets/images/chhayaswori_hero_editorial_1790932976025.jpg',
    contentPosition: 'RIGHT',
    displayOrder: 1,
    isActive: true,
  };

  const promoBanner1 = banners.find(
    (b) => b.placement === 'PROMO_1' && b.isActive
  );
  const promoBanner2 = banners.find(
    (b) => b.placement === 'PROMO_2' && b.isActive
  );

  // Derived, non-mutating product lists
  const topTabProducts = products.filter((p) => {
    if (topTab === 'ALL') return true;
    if (topTab === 'MEN') return p.gender.toLowerCase() === 'men' || p.categorySlug === 'men';
    if (topTab === 'WOMEN') return p.gender.toLowerCase() === 'women' || p.categorySlug === 'women';
    if (topTab === 'KIDS') return p.gender.toLowerCase() === 'kids' || p.categorySlug === 'kids';
    if (topTab === 'COMFORT') return p.isComfortCollection || p.categorySlug === 'comfort';
    return true;
  });

  const newArrivals = products.filter((p) => p.isNewArrival);
  const bestSellers = products.filter((p) => p.isBestSeller);
  const comfortProducts = products.filter(
    (p) => p.isComfortCollection || p.categorySlug === 'comfort'
  );

  // Collect real reviews from catalog products
  const allReviews = products
    .flatMap((p) =>
      (p.reviews || []).map((r) => ({
        ...r,
        productName: p.name,
        productSlug: p.slug,
      }))
    )
    .slice(0, 6);

  const primaryLocation = locations[0] || {
    name: 'Chhayaswori Impex — Suncity Flagship Store',
    municipality: 'Kageshwori Manohara',
    area: 'Suncity, Kathmandu',
    landmark: 'Nearby Big Mart',
    fullAddress:
      'Suncity, Kageshwori Manohara, Kathmandu, Nepal (Nearby Big Mart)',
    phone: '',
    openingHours: 'Sun – Fri: 10:00 AM – 7:30 PM | Sat: 11:00 AM – 6:00 PM',
  };

  const faqs = [
    {
      q: 'What are the delivery charges inside and outside Kathmandu Valley?',
      a: `Standard delivery inside Kathmandu Valley is Rs. ${
        settings?.deliveryFeeKathmandu ?? 120
      }, and outside Kathmandu Valley is Rs. ${
        settings?.deliveryFeeOutside ?? 220
      }. All orders above Rs. ${(
        settings?.freeDeliveryThreshold ?? 2500
      ).toLocaleString()} qualify for FREE DELIVERY.`,
    },
    {
      q: 'Why is phone number OTP verification required at checkout?',
      a: 'To guarantee genuine orders and smooth doorstep delivery across Nepal, every customer verifies their mobile number with a one-time verification code before order confirmation.',
    },
    {
      q: 'What is your return and exchange policy?',
      a:
        settings?.returnPolicyText ||
        `You can request a return within ${
          settings?.returnPeriodDays ?? 7
        } days after delivery for unused footwear in resalable condition with original packaging.`,
    },
    {
      q: 'Where is the Chhayaswori Impex store located?',
      a: 'Visit us at Kageshwori Manohara, Suncity, Kathmandu, Nepal — located nearby Big Mart.',
    },
  ];

  return (
    <div className="bg-white">
      {/* 8. WIDE PREMIUM EDITORIAL HERO SECTION */}
      <section className="border-b border-neutral-200 bg-[#F9F9F8]">
        <div className="max-w-[1360px] mx-auto grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Image Side */}
          <div
            className={`lg:col-span-7 relative min-h-[340px] sm:min-h-[460px] lg:min-h-[560px] bg-neutral-100 overflow-hidden ${
              heroBanner.contentPosition === 'LEFT' ? 'lg:order-2' : 'lg:order-1'
            }`}
          >
            <ResilientImage
              src={heroBanner.desktopImageUrl}
              alt={heroBanner.heading}
              priority
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Editorial Copy Side */}
          <div
            className={`lg:col-span-5 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-14 bg-white ${
              heroBanner.contentPosition === 'LEFT' ? 'lg:order-1' : 'lg:order-2'
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500 mb-3">
              {heroBanner.subtitle}
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-neutral-950 tracking-tight leading-[1.08] uppercase">
              {heroBanner.heading}
            </h1>
            <p className="mt-4 text-base text-neutral-600 leading-relaxed max-w-md">
              {heroBanner.description}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onNavigateShop('all')}
                className="px-8 py-4 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-[0.2em] hover:bg-neutral-800 transition-colors inline-flex items-center gap-3 whitespace-nowrap"
              >
                <span>{heroBanner.ctaText || 'SHOP NOW'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigateShop('comfort')}
                className="px-6 py-4 border border-neutral-300 text-neutral-950 text-xs font-semibold uppercase tracking-[0.18em] hover:border-neutral-950 transition-colors whitespace-nowrap"
              >
                Comfort Series
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 9. BENEFITS / SERVICE STRIP */}
      <section className="border-b border-neutral-200 bg-white">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex lg:grid lg:grid-cols-5 overflow-x-auto no-scrollbar divide-x divide-neutral-200">
            {[
              {
                icon: Truck,
                title: 'FREE DELIVERY',
                desc: `On orders above Rs. ${(
                  settings?.freeDeliveryThreshold ?? 2500
                ).toLocaleString()}`,
              },
              {
                icon: RotateCcw,
                title: 'EASY RETURNS',
                desc: `${settings?.returnPeriodDays ?? 7}-day simple return process`,
              },
              {
                icon: ShieldCheck,
                title: 'SECURE PAYMENT',
                desc: 'Trusted payment options',
              },
              {
                icon: PhoneCall,
                title: 'PHONE VERIFIED',
                desc: 'Secure OTP ordering',
              },
              {
                icon: Headphones,
                title: 'CUSTOMER SUPPORT',
                desc: "We're here to help",
              },
            ].map((b, idx) => {
              const IconComp = b.icon;
              return (
                <div
                  key={b.title}
                  className={`flex items-center gap-3.5 px-5 py-2 shrink-0 min-w-[220px] lg:min-w-0 ${
                    idx === 0 ? 'pl-0 lg:pl-4' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full border border-neutral-300 flex items-center justify-center shrink-0 text-neutral-900">
                    <IconComp className="w-4 h-4 stroke-[1.5]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-950">
                      {b.title}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">{b.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. SHOP BY CATEGORIES (Horizontal Roller with Large Rectangular Cards) */}
      <section className="py-16 md:py-20 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500 block mb-1">
              Curated Footwear Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-neutral-950 uppercase tracking-tight">
              SHOP BY CATEGORIES
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollRoller(catScrollRef, 'left')}
              aria-label="Scroll categories left"
              className="w-10 h-10 border border-neutral-300 flex items-center justify-center text-neutral-900 hover:bg-neutral-950 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollRoller(catScrollRef, 'right')}
              aria-label="Scroll categories right"
              className="w-10 h-10 border border-neutral-300 flex items-center justify-center text-neutral-900 hover:bg-neutral-950 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={catScrollRef}
          className="flex gap-6 overflow-x-auto no-scrollbar pb-2 snap-x"
        >
          {categories
            .filter((c) => c.isActive)
            .map((cat) => (
              <div
                key={cat.id}
                onClick={() => onNavigateShop(cat.slug)}
                className="group cursor-pointer shrink-0 w-[260px] sm:w-[300px] snap-start border border-neutral-200 bg-[#F9F9F8] overflow-hidden flex flex-col"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-neutral-100">
                  <ResilientImage
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-5 bg-white flex items-center justify-between border-t border-neutral-200">
                  <div>
                    <h3 className="text-base font-display font-bold uppercase tracking-wider text-neutral-950">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                      {cat.description}
                    </p>
                  </div>
                  <span className="w-8 h-8 border border-neutral-200 flex items-center justify-center group-hover:bg-neutral-950 group-hover:text-white transition-colors shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* 11. TOP PRODUCTS WITH CATEGORY TABS & HORIZONTAL ROLLER */}
      <section className="py-16 md:py-20 bg-[#F9F9F8] border-y border-neutral-200">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500 block mb-1">
                Signature Silhouettes
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-neutral-950 uppercase tracking-tight">
                TOP PRODUCTS
              </h2>
            </div>

            {/* Interactive Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(['ALL', 'MEN', 'WOMEN', 'KIDS', 'COMFORT'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setTopTab(tab)}
                  className={`px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors whitespace-nowrap ${
                    topTab === tab
                      ? 'bg-neutral-950 text-white'
                      : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-950'
                  }`}
                >
                  {tab}
                </button>
              ))}
              <div className="hidden sm:flex items-center gap-1.5 ml-2">
                <button
                  type="button"
                  onClick={() => scrollRoller(topScrollRef, 'left')}
                  aria-label="Previous top products"
                  className="w-9 h-9 bg-white border border-neutral-300 flex items-center justify-center hover:bg-neutral-950 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollRoller(topScrollRef, 'right')}
                  aria-label="Next top products"
                  className="w-9 h-9 bg-white border border-neutral-300 flex items-center justify-center hover:bg-neutral-950 hover:text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 22. LOADING / ERROR / EMPTY STATES */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="bg-white border border-neutral-200 p-4 animate-pulse"
                >
                  <div className="aspect-[4/3] bg-neutral-200 mb-4" />
                  <div className="h-3 bg-neutral-200 w-1/3 mb-2" />
                  <div className="h-4 bg-neutral-200 w-3/4 mb-4" />
                  <div className="h-4 bg-neutral-200 w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-white border border-neutral-200 p-12 text-center">
              <p className="text-sm font-medium text-neutral-900">
                Unable to load products. Please try again.
              </p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 px-5 py-2.5 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider"
              >
                Retry
              </button>
            </div>
          ) : topTabProducts.length === 0 ? (
            <div className="bg-white border border-neutral-200 p-12 text-center">
              <p className="text-sm text-neutral-600">No products found.</p>
            </div>
          ) : (
            <div
              ref={topScrollRef}
              className="flex gap-6 overflow-x-auto no-scrollbar pb-2 snap-x"
            >
              {topTabProducts.map((prod) => (
                <div
                  key={prod.uuid}
                  className="w-[280px] sm:w-[305px] shrink-0 snap-start"
                >
                  <ProductCard
                    product={prod}
                    isWishlisted={wishlistIds.includes(prod.id)}
                    onToggleWishlist={onToggleWishlist}
                    onQuickView={onQuickView}
                    onOpenProduct={onOpenProduct}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 13. PROMOTIONAL BANNER 1 */}
      {promoBanner1 && (
        <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="border border-neutral-200 bg-neutral-950 text-white grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            <div className="lg:col-span-6 p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
              <span className="text-xs font-medium uppercase tracking-[0.22em] text-neutral-400 mb-2">
                {promoBanner1.subtitle}
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold uppercase tracking-tight leading-tight">
                {promoBanner1.heading}
              </h2>
              <p className="mt-4 text-sm sm:text-base text-neutral-300 leading-relaxed max-w-md">
                {promoBanner1.description}
              </p>
              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => onNavigateShop('comfort')}
                  className="px-7 py-3.5 bg-white text-neutral-950 text-xs font-semibold uppercase tracking-[0.18em] hover:bg-neutral-200 transition-colors inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <span>{promoBanner1.ctaText || 'EXPLORE COMFORT'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="lg:col-span-6 min-h-[280px] sm:min-h-[360px] bg-neutral-900">
              <ResilientImage
                src={promoBanner1.desktopImageUrl}
                alt={promoBanner1.heading}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>
      )}

      {/* 12. NEW ARRIVALS ROLLER */}
      <section className="py-12 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500 block mb-1">
              Just Landed in Suncity
            </span>
            <h2 className="text-2xl font-display font-bold text-neutral-950 uppercase tracking-tight">
              NEW ARRIVALS
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollRoller(newScrollRef, 'left')}
              aria-label="Scroll new arrivals left"
              className="w-9 h-9 border border-neutral-300 flex items-center justify-center hover:bg-neutral-950 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollRoller(newScrollRef, 'right')}
              aria-label="Scroll new arrivals right"
              className="w-9 h-9 border border-neutral-300 flex items-center justify-center hover:bg-neutral-950 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={newScrollRef}
          className="flex gap-6 overflow-x-auto no-scrollbar pb-2 snap-x"
        >
          {(newArrivals.length > 0 ? newArrivals : products).map((prod) => (
            <div
              key={`new-${prod.uuid}`}
              className="w-[280px] sm:w-[305px] shrink-0 snap-start"
            >
              <ProductCard
                product={prod}
                isWishlisted={wishlistIds.includes(prod.id)}
                onToggleWishlist={onToggleWishlist}
                onQuickView={onQuickView}
                onOpenProduct={onOpenProduct}
              />
            </div>
          ))}
        </div>
      </section>

      {/* BEST SELLERS ROLLER */}
      <section className="py-12 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 border-t border-neutral-200">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500 block mb-1">
              Most Loved in Kathmandu
            </span>
            <h2 className="text-2xl font-display font-bold text-neutral-950 uppercase tracking-tight">
              BEST SELLERS
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollRoller(bestScrollRef, 'left')}
              aria-label="Scroll best sellers left"
              className="w-9 h-9 border border-neutral-300 flex items-center justify-center hover:bg-neutral-950 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollRoller(bestScrollRef, 'right')}
              aria-label="Scroll best sellers right"
              className="w-9 h-9 border border-neutral-300 flex items-center justify-center hover:bg-neutral-950 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={bestScrollRef}
          className="flex gap-6 overflow-x-auto no-scrollbar pb-2 snap-x"
        >
          {(bestSellers.length > 0 ? bestSellers : products).map((prod) => (
            <div
              key={`best-${prod.uuid}`}
              className="w-[280px] sm:w-[305px] shrink-0 snap-start"
            >
              <ProductCard
                product={prod}
                isWishlisted={wishlistIds.includes(prod.id)}
                onToggleWishlist={onToggleWishlist}
                onQuickView={onQuickView}
                onOpenProduct={onOpenProduct}
              />
            </div>
          ))}
        </div>
      </section>

      {/* COMFORT COLLECTION ROLLER */}
      <section className="py-16 bg-[#F9F9F8] border-y border-neutral-200">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500 block mb-1">
                Ergonomic Support & Relief
              </span>
              <h2 className="text-2xl font-display font-bold text-neutral-950 uppercase tracking-tight">
                COMFORT COLLECTION
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollRoller(comfortScrollRef, 'left')}
                aria-label="Scroll comfort collection left"
                className="w-9 h-9 bg-white border border-neutral-300 flex items-center justify-center hover:bg-neutral-950 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollRoller(comfortScrollRef, 'right')}
                aria-label="Scroll comfort collection right"
                className="w-9 h-9 bg-white border border-neutral-300 flex items-center justify-center hover:bg-neutral-950 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            ref={comfortScrollRef}
            className="flex gap-6 overflow-x-auto no-scrollbar pb-2 snap-x"
          >
            {(comfortProducts.length > 0 ? comfortProducts : products).map(
              (prod) => (
                <div
                  key={`comfort-${prod.uuid}`}
                  className="w-[280px] sm:w-[305px] shrink-0 snap-start"
                >
                  <ProductCard
                    product={prod}
                    isWishlisted={wishlistIds.includes(prod.id)}
                    onToggleWishlist={onToggleWishlist}
                    onQuickView={onQuickView}
                    onOpenProduct={onOpenProduct}
                  />
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* MEN / WOMEN / KIDS FEATURE */}
      <section className="py-16 md:py-20 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'MEN COLLECTION',
              meta: 'Sizes 40–43 · Extended 44 Available',
              slug: 'men',
              img: '/src/assets/images/product_urban_sneaker_white_1790933004110.jpg',
            },
            {
              title: 'WOMEN COLLECTION',
              meta: 'Sizes 36–40 · Featherlight Support',
              slug: 'women',
              img: '/src/assets/images/product_leather_sandal_tan_1790933017851.jpg',
            },
            {
              title: 'KIDS COLLECTION',
              meta: 'Sizes 1–9 · Flexible Growing Fit',
              slug: 'kids',
              img: '/src/assets/images/product_kids_active_shoe_1790933030289.jpg',
            },
          ].map((item) => (
            <div
              key={item.slug}
              onClick={() => onNavigateShop(item.slug)}
              className="group cursor-pointer border border-neutral-200 bg-white overflow-hidden flex flex-col"
            >
              <div className="aspect-[4/3] bg-[#F9F9F8] overflow-hidden">
                <ResilientImage
                  src={item.img}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-6 flex items-center justify-between">
                <div>
                  <span className="text-xs text-neutral-500 block mb-1">
                    {item.meta}
                  </span>
                  <h3 className="text-lg font-display font-bold text-neutral-950 uppercase">
                    {item.title}
                  </h3>
                </div>
                <span className="px-4 py-2 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider group-hover:bg-neutral-800 transition-colors">
                  Explore
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECOND PROMOTIONAL BANNER */}
      {promoBanner2 && (
        <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="border border-neutral-200 bg-[#F9F9F8] grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            <div className="lg:col-span-6 min-h-[260px] sm:min-h-[340px]">
              <ResilientImage
                src={promoBanner2.desktopImageUrl}
                alt={promoBanner2.heading}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="lg:col-span-6 p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-2">
                {promoBanner2.subtitle}
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-neutral-950 uppercase tracking-tight">
                {promoBanner2.heading}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-neutral-600 leading-relaxed max-w-md">
                {promoBanner2.description}
              </p>
              <div className="mt-7">
                <button
                  type="button"
                  onClick={() => onNavigateShop('sandals')}
                  className="px-7 py-3.5 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-[0.18em] hover:bg-neutral-800 transition-colors inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <span>{promoBanner2.ctaText || 'DISCOVER SANDALS'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CUSTOMER REVIEWS & WHY CHHAYASWORI */}
      <section className="py-16 bg-[#F9F9F8] border-y border-neutral-200">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500 block mb-1">
              Verified Customer Experiences
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-neutral-950 uppercase tracking-tight">
              CUSTOMER REVIEWS
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {allReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white border border-neutral-200 p-6 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-3.5 h-3.5 fill-neutral-950 text-neutral-950"
                        />
                      ))}
                    </div>
                    {rev.isVerifiedPurchase && (
                      <span className="text-[11px] text-emerald-700 font-medium inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verified Purchase
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-700 leading-relaxed">
                    “{rev.comment}”
                  </p>
                </div>
                <div className="pt-3 border-t border-neutral-100">
                  <p className="text-xs font-semibold text-neutral-950">
                    {rev.customerName}
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenProduct(rev.productSlug)}
                    className="text-xs text-neutral-500 hover:text-neutral-950 underline mt-0.5"
                  >
                    {rev.productName}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* WHY CHHAYASWORI IMPEX */}
          <div className="mt-16 pt-14 border-t border-neutral-200 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <span className="text-xs font-mono text-neutral-500">01.</span>
              <h3 className="text-base font-display font-bold uppercase text-neutral-950 mt-1">
                Anatomical Comfort First
              </h3>
              <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                Every shoe, slipper, and sandal is selected and tested for arch
                support, heel cushioning, and durable grip suited to Nepal’s
                walkways and homes.
              </p>
            </div>
            <div>
              <span className="text-xs font-mono text-neutral-500">02.</span>
              <h3 className="text-base font-display font-bold uppercase text-neutral-950 mt-1">
                Honest Variant Inventory
              </h3>
              <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                Real-time size and color stock tracking prevents overselling.
                If a size is in stock on our website, it is ready for dispatch
                from our Suncity store.
              </p>
            </div>
            <div>
              <span className="text-xs font-mono text-neutral-500">03.</span>
              <h3 className="text-base font-display font-bold uppercase text-neutral-950 mt-1">
                Transparent Delivery & Returns
              </h3>
              <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                Rs. {settings?.deliveryFeeKathmandu ?? 120} delivery inside
                Kathmandu Valley, free delivery above Rs.{' '}
                {(settings?.freeDeliveryThreshold ?? 2500).toLocaleString()}, and
                a clear {settings?.returnPeriodDays ?? 7}-day return policy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 41. STORE LOCATIONS & FAQ PREVIEW */}
      <section className="py-16 md:py-20 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Store Location Card */}
          <div className="lg:col-span-5 border border-neutral-200 p-8 bg-[#F9F9F8] flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 block mb-2">
                Visit Our Storefront
              </span>
              <h2 className="text-2xl font-display font-bold text-neutral-950 uppercase">
                STORE LOCATION
              </h2>
              <div className="mt-6 space-y-4 text-sm text-neutral-700">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-neutral-950 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-neutral-950">
                      {primaryLocation.municipality}
                    </p>
                    <p>{primaryLocation.area}</p>
                    <p className="text-neutral-500">{primaryLocation.landmark}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-neutral-950 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-neutral-950">
                      Opening Hours
                    </p>
                    <p className="text-neutral-600">
                      {primaryLocation.openingHours}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-neutral-200">
              <p className="text-xs text-neutral-500">
                Exact address, phone, and coordinates can be updated anytime in
                Admin Settings.
              </p>
            </div>
          </div>

          {/* FAQ Preview */}
          <div className="lg:col-span-7">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 block mb-2">
              Customer Questions
            </span>
            <h2 className="text-2xl font-display font-bold text-neutral-950 uppercase mb-6">
              FREQUENTLY ASKED QUESTIONS
            </h2>
            <div className="divide-y divide-neutral-200 border-y border-neutral-200">
              {faqs.map((f, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={f.q} className="py-4">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between text-left gap-4 py-1"
                    >
                      <span className="text-sm font-semibold text-neutral-950">
                        {f.q}
                      </span>
                      {isOpen ? (
                        <Minus className="w-4 h-4 shrink-0 text-neutral-600" />
                      ) : (
                        <Plus className="w-4 h-4 shrink-0 text-neutral-600" />
                      )}
                    </button>
                    {isOpen && (
                      <p className="mt-2 text-sm text-neutral-600 leading-relaxed pr-6">
                        {f.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
