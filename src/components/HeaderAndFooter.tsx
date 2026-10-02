import React, { useState } from 'react';
import {
  Search,
  User,
  Heart,
  ShoppingBag,
  Menu,
  X,
  Download,
  WifiOff,
  MapPin,
  Phone,
  ShieldCheck,
  Home,
  Grid,
  MessageCircle,
} from 'lucide-react';
import {
  SiteSettingsData,
  StoreLocationItem,
  UserProfile,
} from '../types/store.ts';
import { BrandLogo } from './BrandLogo.tsx';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall.ts';

interface HeaderProps {
  settings: SiteSettingsData | null;
  activePage: string;
  activeCategory: string;
  cartCount: number;
  wishlistCount: number;
  userProfile: UserProfile | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNavigate: (page: string, categorySlug?: string) => void;
  onOpenCartDrawer: () => void;
  onOpenSearchModal: () => void;
}

export const StoreHeader: React.FC<HeaderProps> = ({
  settings,
  activePage,
  activeCategory,
  cartCount,
  wishlistCount,
  userProfile,
  onNavigate,
  onOpenCartDrawer,
  onOpenSearchModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const navLinks = [
    { label: 'Home', page: 'home', cat: '' },
    { label: 'Collections', page: 'shop', cat: 'all' },
    { label: 'Shoes', page: 'shop', cat: 'shoes' },
    { label: 'Slippers', page: 'shop', cat: 'slippers' },
    { label: 'Sandals', page: 'shop', cat: 'sandals' },
    { label: 'Kids', page: 'shop', cat: 'kids' },
    { label: 'Comfort', page: 'shop', cat: 'comfort' },
    { label: 'Offers', page: 'shop', cat: 'sale' },
  ];

  return (
    <>
      {/* 7. SLIM ANNOUNCEMENT BAR */}
      {settings?.announcementActive !== false && (
        <div className="bg-neutral-950 text-white text-[11px] font-medium tracking-[0.14em] uppercase py-2 px-4 text-center">
          <p className="truncate max-w-6xl mx-auto">
            {settings?.announcementText ||
              'FREE DELIVERY ON ORDERS ABOVE RS. 2,500'}
          </p>
        </div>
      )}

      {/* 6. SLIM PREMIUM STICKY HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-neutral-200">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* LEFT: Mobile Menu Toggle + Chhayaswori Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="lg:hidden p-2 -ml-2 text-neutral-900 hover:bg-neutral-100"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="text-left focus:outline-none"
            >
              <BrandLogo logoUrl={settings?.logoUrl} compact />
            </button>
          </div>

          {/* CENTER: Clean Typography Navigation */}
          <nav
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center gap-6 text-[13px] font-medium text-neutral-700"
          >
            {navLinks.map((item) => {
              const isActive =
                (item.page === 'home' && activePage === 'home') ||
                (item.page === 'shop' &&
                  activePage === 'shop' &&
                  activeCategory === item.cat);
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onNavigate(item.page, item.cat)}
                  className={`py-1 whitespace-nowrap transition-colors border-b-2 ${
                    isActive
                      ? 'border-neutral-950 text-neutral-950 font-semibold'
                      : 'border-transparent hover:text-neutral-950 hover:border-neutral-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* RIGHT: Search, Account, Wishlist, Cart & PWA Install */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* In-App PWA Install Button */}
            {!isInstalled && isInstallable && (
              <button
                type="button"
                onClick={install}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wider border border-neutral-300 text-neutral-900 hover:bg-neutral-950 hover:text-white transition-colors whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                Install App
              </button>
            )}
            {!isInstalled && !isInstallable && isIOS && (
              <button
                type="button"
                onClick={() => setShowIOSGuide(true)}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wider border border-neutral-300 text-neutral-900 hover:bg-neutral-100 whitespace-nowrap"
              >
                Install App
              </button>
            )}

            <button
              type="button"
              onClick={onOpenSearchModal}
              aria-label="Search products"
              className="p-2 text-neutral-800 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
            >
              <Search className="w-5 h-5 stroke-[1.75]" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('wishlist')}
              aria-label="Wishlist"
              className="relative p-2 text-neutral-800 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
            >
              <Heart className="w-5 h-5 stroke-[1.75]" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-neutral-950 text-white text-[10px] font-mono flex items-center justify-center rounded-full">
                  {wishlistCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenCartDrawer}
              aria-label="Shopping cart"
              className="relative p-2 text-neutral-800 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.75]" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-neutral-950 text-white text-[10px] font-mono flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onNavigate('account')}
              aria-label="Customer account"
              className="p-2 text-neutral-800 hover:text-neutral-950 hover:bg-neutral-100 transition-colors flex items-center gap-1.5"
            >
              <User className="w-5 h-5 stroke-[1.75]" />
              {userProfile && (
                <span className="hidden xl:inline text-xs font-medium max-w-[90px] truncate">
                  {userProfile.fullName || 'Account'}
                </span>
              )}
            </button>

            {(userProfile?.role === 'SUPER_ADMIN' ||
              userProfile?.role === 'STAFF') && (
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="ml-1 px-3 py-1.5 bg-neutral-950 text-white text-[11px] font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors whitespace-nowrap"
              >
                Admin
              </button>
            )}
          </div>
        </div>

        {/* Mobile Drawer Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-neutral-200 bg-white px-4 py-4 space-y-2">
            {navLinks.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate(item.page, item.cat);
                }}
                className="block w-full text-left py-2.5 px-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 border-b border-neutral-100"
              >
                {item.label}
              </button>
            ))}
            <div className="pt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('track-order');
                }}
                className="px-3 py-2 text-xs font-medium uppercase tracking-wider border border-neutral-300 text-neutral-800"
              >
                Track Order
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('contact');
                }}
                className="px-3 py-2 text-xs font-medium uppercase tracking-wider border border-neutral-300 text-neutral-800"
              >
                Contact Store
              </button>
            </div>
          </div>
        )}
      </header>

      {/* iOS PWA Install Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm bg-white p-6 border border-neutral-200">
            <h3 className="text-base font-display font-bold text-neutral-950">
              Install CHHAYASWORI IMPEX on iOS
            </h3>
            <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
              1. Tap the <strong>Share</strong> icon in your Safari toolbar.
              <br />
              2. Scroll down and tap <strong>Add to Home Screen</strong>.
            </p>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full py-2.5 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

interface FooterProps {
  settings: SiteSettingsData | null;
  locations: StoreLocationItem[];
  onNavigate: (page: string, categorySlug?: string) => void;
  onOpenSearchModal: () => void;
  activePage: string;
}

export const StoreFooter: React.FC<FooterProps> = ({
  settings,
  locations,
  onNavigate,
  onOpenSearchModal,
  activePage,
}) => {
  const isOnline = useOnlineStatus();
  const primaryLocation = locations[0] || {
    municipality: 'Kageshwori Manohara',
    area: 'Suncity, Kathmandu',
    landmark: 'Nearby Big Mart',
    fullAddress:
      'Suncity, Kageshwori Manohara, Kathmandu, Nepal (Nearby Big Mart)',
    openingHours: 'Sun – Fri: 10:00 AM – 7:30 PM | Sat: 11:00 AM – 6:00 PM',
    phone: '',
  };

  // Section 43: WhatsApp button only shown if whatsappNumber is configured (never fake a number)
  const whatsappClean = (settings?.whatsappNumber || '').replace(/[^0-9]/g, '');

  return (
    <>
      <footer className="bg-neutral-950 text-white border-t border-neutral-900 pb-20 md:pb-0">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-neutral-800">
            {/* Column 1: Brand & Tagline */}
            <div className="lg:col-span-2 space-y-4">
              <BrandLogo logoUrl={settings?.logoUrl} invert />
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                {settings?.tagline || 'Comfort for Every Step'}
              </p>
              <p className="text-sm text-neutral-400 max-w-sm leading-relaxed">
                Premium minimalist footwear designed for everyday life in Nepal.
                Explore anatomical comfort slippers, breathable walking shoes,
                and handcrafted sandals for Men, Women, and Kids.
              </p>
              <div className="pt-2 space-y-1.5 text-xs text-neutral-300">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                  <span>
                    {primaryLocation.municipality} · {primaryLocation.area} (
                    {primaryLocation.landmark})
                  </span>
                </div>
                {(settings?.phone || primaryLocation.phone) && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-neutral-400 shrink-0" />
                    <span className="font-mono">
                      {settings?.phone || primaryLocation.phone}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Shop Categories */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-white mb-4">
                Collections
              </h4>
              <ul className="space-y-2.5 text-sm text-neutral-400">
                {[
                  { label: 'Men Footwear (40–44)', slug: 'men' },
                  { label: 'Women Footwear (36–40)', slug: 'women' },
                  { label: 'Kids Collection (1–9)', slug: 'kids' },
                  { label: 'Comfort Series', slug: 'comfort' },
                  { label: 'Everyday Shoes', slug: 'shoes' },
                  { label: 'Recovery Slippers', slug: 'slippers' },
                  { label: 'Contoured Sandals', slug: 'sandals' },
                ].map((c) => (
                  <li key={c.slug}>
                    <button
                      type="button"
                      onClick={() => onNavigate('shop', c.slug)}
                      className="hover:text-white transition-colors"
                    >
                      {c.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Customer Care */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-white mb-4">
                Customer Service
              </h4>
              <ul className="space-y-2.5 text-sm text-neutral-400">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('track-order')}
                    className="hover:text-white transition-colors"
                  >
                    Track Your Order
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('account')}
                    className="hover:text-white transition-colors"
                  >
                    My Account & Returns
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('contact')}
                    className="hover:text-white transition-colors"
                  >
                    Contact & Store Locator
                  </button>
                </li>
                <li>
                  <span className="text-xs text-neutral-500 block pt-1">
                    Kathmandu Delivery: Rs.{' '}
                    {settings?.deliveryFeeKathmandu ?? 120}
                  </span>
                </li>
                <li>
                  <span className="text-xs text-neutral-500 block">
                    Outside Valley: Rs. {settings?.deliveryFeeOutside ?? 220}
                  </span>
                </li>
                <li>
                  <span className="text-xs text-neutral-300 block">
                    Free Delivery Above Rs.{' '}
                    {(settings?.freeDeliveryThreshold ?? 2500).toLocaleString()}
                  </span>
                </li>
              </ul>
            </div>

            {/* Column 4: Policies & Social */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-white mb-4">
                Store Policies
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                {settings?.returnPolicyText ||
                  'Easy 7-day return requests on unused footwear in original packaging.'}
              </p>
              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block">
                  Accepted Payments (NPR)
                </span>
                <div className="flex flex-wrap gap-1.5 text-[11px] font-mono text-neutral-300">
                  <span className="border border-neutral-800 px-2 py-1">
                    Cash on Delivery
                  </span>
                  <span className="border border-neutral-800 px-2 py-1">
                    Bank Transfer
                  </span>
                  <span className="border border-neutral-800 px-2 py-1">
                    eSewa
                  </span>
                  <span className="border border-neutral-800 px-2 py-1">
                    Fonepay
                  </span>
                </div>
              </div>

              {(settings?.instagramUrl ||
                settings?.facebookUrl ||
                settings?.tiktokUrl) && (
                <div className="mt-5 pt-4 border-t border-neutral-800 flex items-center gap-4 text-xs text-neutral-300">
                  {settings.instagramUrl && (
                    <a
                      href={settings.instagramUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      Instagram
                    </a>
                  )}
                  {settings.facebookUrl && (
                    <a
                      href={settings.facebookUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      Facebook
                    </a>
                  )}
                  {settings.tiktokUrl && (
                    <a
                      href={settings.tiktokUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      TikTok
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
            <p>
              © {new Date().getFullYear()} {settings?.storeName || 'CHHAYASWORI IMPEX'}.
              All rights reserved. Kageshwori Manohara, Suncity, Kathmandu, Nepal.
            </p>
            <div className="flex items-center gap-2 text-neutral-400">
              <ShieldCheck className="w-4 h-4" />
              <span>OTP Phone Verified Ordering · NPR Currency</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Configurable WhatsApp Floating Support Button (Hidden if not configured) */}
      {whatsappClean.length >= 10 && (
        <a
          href={`https://wa.me/${whatsappClean}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Order or chat via WhatsApp"
          className="fixed bottom-20 md:bottom-6 right-5 z-40 inline-flex items-center gap-2 bg-neutral-950 text-white border border-neutral-700 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider shadow-lg hover:bg-neutral-800 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>WhatsApp Support</span>
        </a>
      )}

      {/* Offline Mode Connectivity Indicator */}
      {!isOnline && (
        <div className="fixed bottom-20 md:bottom-6 left-5 z-50 flex items-center gap-2 bg-neutral-950 text-white border border-neutral-700 px-3.5 py-2 text-xs font-medium shadow-lg">
          <WifiOff className="w-4 h-4 text-amber-400" />
          <span>Offline Mode — Viewing cached storefront</span>
        </div>
      )}

      {/* 46. MOBILE BOTTOM NAVIGATION (Home, Shop, Search, Wishlist, Account) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-neutral-200 h-14 grid grid-cols-5"
      >
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
            activePage === 'home' ? 'text-neutral-950 font-semibold' : 'text-neutral-500'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('shop', 'all')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
            activePage === 'shop' ? 'text-neutral-950 font-semibold' : 'text-neutral-500'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Shop</span>
        </button>
        <button
          type="button"
          onClick={onOpenSearchModal}
          className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-neutral-500"
        >
          <Search className="w-4 h-4" />
          <span>Search</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('wishlist')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
            activePage === 'wishlist'
              ? 'text-neutral-950 font-semibold'
              : 'text-neutral-500'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Wishlist</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('account')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
            activePage === 'account'
              ? 'text-neutral-950 font-semibold'
              : 'text-neutral-500'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Account</span>
        </button>
      </nav>
    </>
  );
};
