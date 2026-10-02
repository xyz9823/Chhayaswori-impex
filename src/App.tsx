import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleAuthProvider } from './lib/firebase.ts';
import {
  BannerItem,
  CartItemData,
  CatalogProduct,
  CategoryItem,
  OrderRecord,
  ReturnRecord,
  SiteSettingsData,
  StoreLocationItem,
  UserAddress,
  UserProfile,
} from './types/store.ts';

import { StoreHeader, StoreFooter } from './components/HeaderAndFooter.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { SearchModal } from './components/SearchModal.tsx';
import { QuickViewModal } from './components/QuickViewModal.tsx';
import { PhoneVerificationModal } from './components/PhoneVerificationModal.tsx';

import { HomePage } from './pages/HomePage.tsx';
import { ShopPage } from './pages/ShopPage.tsx';
import { ProductDetailPage } from './pages/ProductDetailPage.tsx';
import { CheckoutPage } from './pages/CheckoutPage.tsx';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage.tsx';
import { OrderTrackingPage } from './pages/OrderTrackingPage.tsx';
import { AccountPage } from './pages/AccountPage.tsx';
import { ContactPage } from './pages/ContactPage.tsx';
import { AdminPage } from './pages/AdminPage.tsx';

export default function App() {
  const [activePage, setActivePage] = useState<string>('home');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeProductSlug, setActiveProductSlug] = useState<string>('');
  const [activeOrderNumber, setActiveOrderNumber] = useState<string>('');

  // Store data
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [settings, setSettings] = useState<SiteSettingsData | null>(null);
  const [locations, setLocations] = useState<StoreLocationItem[]>([]);

  // User state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userOrders, setUserOrders] = useState<OrderRecord[]>([]);
  const [userReturns, setUserReturns] = useState<ReturnRecord[]>([]);
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);
  const [userNotifications, setUserNotifications] = useState<any[]>([]);

  // Cart & Wishlist
  const [cart, setCart] = useState<CartItemData[]>(() => {
    try {
      const saved = localStorage.getItem('chhayaswori_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlistIds, setWishlistIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('chhayaswori_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [recentlyViewedSlugs, setRecentlyViewedSlugs] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('chhayaswori_recent');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<CatalogProduct | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Admin Data state
  const [adminData, setAdminData] = useState<any>(null);
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  // General loading & error
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((c) => (c === msg ? null : c));
    }, 4500);
  };

  // Save guest cart and wishlist in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('chhayaswori_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('chhayaswori_wishlist', JSON.stringify(wishlistIds));
    } catch {}
  }, [wishlistIds]);

  useEffect(() => {
    try {
      localStorage.setItem('chhayaswori_recent', JSON.stringify(recentlyViewedSlugs));
    } catch {}
  }, [recentlyViewedSlugs]);

  // Load Bootstrap Storefront Data
  const loadStoreData = useCallback(async () => {
    setLoadingCatalog(true);
    setCatalogError(null);
    try {
      const res = await fetch('/api/bootstrap');
      if (!res.ok) throw new Error('Failed to load store data');
      const data = await res.json();
      setProducts(data.products || []);
      setCategories(data.categories || []);
      setBanners(data.banners || []);
      setSettings(data.settings || null);
      setLocations(data.locations || []);
    } catch (err: any) {
      console.error('Error loading store data:', err);
      setCatalogError(err.message || 'Unable to connect to database.');
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    loadStoreData();
  }, [loadStoreData]);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          setAuthToken(token);
          const meRes = await fetch('/api/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (meRes.ok) {
            const meData = await meRes.json();
            setUserProfile(meData.profile);
            setUserOrders(meData.orders || []);
            setUserReturns(meData.returns || []);
            setUserAddresses(meData.addresses || []);
            setUserNotifications(meData.notifications || []);
            if (meData.wishlistIds) setWishlistIds(meData.wishlistIds);

            // Safe merge guest cart with account cart
            if (cart.length > 0) {
              const mergeRes = await fetch('/api/cart/merge', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ items: cart }),
              });
              if (mergeRes.ok) {
                const mergedCart = await mergeRes.json();
                setCart(mergedCart);
              }
            } else if (meData.cart && meData.cart.length > 0) {
              setCart(meData.cart);
            }
          }
        } catch (err) {
          console.error('Failed to sync authenticated user:', err);
        }
      } else {
        setAuthToken(null);
        setUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch admin dashboard data if user is admin
  const loadAdminData = useCallback(async () => {
    if (!authToken) return;
    setLoadingAdmin(true);
    try {
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdminData(data);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoadingAdmin(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (
      activePage === 'admin' &&
      (userProfile?.role === 'SUPER_ADMIN' || userProfile?.role === 'STAFF')
    ) {
      loadAdminData();
    }
  }, [activePage, userProfile, loadAdminData]);

  // Auth Handlers
  const [signingIn, setSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    if (signingIn) return;
    setSigningIn(true);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('Pending promise was never set') ||
        String(err).includes('Pending promise was never set')
      ) {
        return;
      }
      showToast(err?.message || 'Google Sign-In failed.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setAuthToken(null);
    setUserProfile(null);
    setActivePage('home');
  };

  // Cart operations
  const handleAddToCart = (product: CatalogProduct, variantId: number, quantity: number) => {
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant || variant.stock <= 0) {
      showToast('Selected size is currently out of stock.');
      return;
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.productId === product.id && item.variantId === variantId
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = Math.min(
          variant.stock,
          updated[existingIdx].quantity + quantity
        );
        updated[existingIdx] = { ...updated[existingIdx], quantity: newQty };
        return updated;
      }
      return [
        ...prev,
        {
          productId: product.id,
          variantId: variant.id,
          productName: product.name,
          productSlug: product.slug,
          productImage: product.primaryImage,
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          colorHex: variant.colorHex,
          unitPrice: variant.priceOverride || product.price,
          compareAtPrice: product.compareAtPrice,
          availableStock: variant.stock,
          quantity: Math.min(variant.stock, quantity),
        },
      ];
    });

    // If logged in, also sync to database
    if (authToken) {
      fetch('/api/cart/item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          productId: product.id,
          variantId,
          quantity,
        }),
      }).catch(console.error);
    }

    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (productId: number, variantId: number, qty: number) => {
    if (qty <= 0) {
      handleRemoveCartItem(productId, variantId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity: Math.min(item.availableStock, qty) }
          : item
      )
    );

    if (authToken) {
      fetch('/api/cart/item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ productId, variantId, quantity: qty }),
      }).catch(console.error);
    }
  };

  const handleRemoveCartItem = (productId: number, variantId: number) => {
    setCart((prev) =>
      prev.filter(
        (item) => !(item.productId === productId && item.variantId === variantId)
      )
    );

    if (authToken) {
      fetch('/api/cart/item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ productId, variantId, quantity: 0 }),
      }).catch(console.error);
    }
  };

  const handleBuyNow = (product: CatalogProduct, variantId: number, quantity: number) => {
    handleAddToCart(product, variantId, quantity);
    setIsCartOpen(false);
    setActivePage('checkout');
  };

  // Wishlist toggle
  const handleToggleWishlist = async (productId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlistIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );

    if (authToken) {
      try {
        const res = await fetch('/api/wishlist/toggle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ productId }),
        });
        if (res.ok) {
          const ids = await res.json();
          setWishlistIds(ids);
        }
      } catch (err) {
        console.error('Failed to sync wishlist:', err);
      }
    }
  };

  // Open Product Detail
  const handleOpenProduct = (slug: string) => {
    setActiveProductSlug(slug);
    setActivePage('product');
    setRecentlyViewedSlugs((prev) => [
      slug,
      ...prev.filter((s) => s !== slug),
    ].slice(0, 8));

    // Register view count in background
    fetch(`/api/products/${slug}/view`, { method: 'POST' }).catch(() => {});
  };

  // Navigation router
  const handleNavigate = (page: string, categorySlug = 'all') => {
    setActivePage(page);
    if (page === 'shop') {
      setActiveCategory(categorySlug || 'all');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeProduct = products.find((p) => p.slug === activeProductSlug) || products[0];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Universal Slim Header */}
      <StoreHeader
        settings={settings}
        activePage={activePage}
        activeCategory={activeCategory}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        wishlistCount={wishlistIds.length}
        userProfile={userProfile}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNavigate={handleNavigate}
        onOpenCartDrawer={() => setIsCartOpen(true)}
        onOpenSearchModal={() => setIsSearchOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {activePage === 'home' && (
          <HomePage
            products={products}
            categories={categories}
            banners={banners}
            settings={settings}
            locations={locations}
            wishlistIds={wishlistIds}
            loading={loadingCatalog}
            error={catalogError}
            onRetry={loadStoreData}
            onToggleWishlist={handleToggleWishlist}
            onQuickView={(p, e) => {
              e.stopPropagation();
              setQuickViewProduct(p);
            }}
            onOpenProduct={handleOpenProduct}
            onNavigateShop={(cat) => handleNavigate('shop', cat)}
          />
        )}

        {activePage === 'shop' && (
          <ShopPage
            products={products}
            categories={categories}
            initialCategorySlug={activeCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            wishlistIds={wishlistIds}
            loading={loadingCatalog}
            error={catalogError}
            onRetry={loadStoreData}
            onToggleWishlist={handleToggleWishlist}
            onQuickView={(p, e) => {
              e.stopPropagation();
              setQuickViewProduct(p);
            }}
            onOpenProduct={handleOpenProduct}
            onNavigateHome={() => handleNavigate('home')}
          />
        )}

        {activePage === 'product' && activeProduct && (
          <ProductDetailPage
            product={activeProduct}
            allProducts={products}
            recentlyViewedSlugs={recentlyViewedSlugs}
            settings={settings}
            userProfile={userProfile}
            isWishlisted={wishlistIds.includes(activeProduct.id)}
            onToggleWishlist={handleToggleWishlist}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onQuickView={(p, e) => {
              e.stopPropagation();
              setQuickViewProduct(p);
            }}
            onOpenProduct={handleOpenProduct}
            onNavigateShop={(cat) => handleNavigate('shop', cat)}
            onNavigateHome={() => handleNavigate('home')}
            onSubmitReview={async (payload) => {
              if (!authToken) {
                alert('Please sign in to submit a review.');
                return;
              }
              const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify(payload),
              });
              if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to submit review');
              }
              loadStoreData();
            }}
            onUploadImage={async (bucket, file) => {
              return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = async () => {
                  try {
                    const dataUrl = reader.result as string;
                    const res = await fetch('/api/storage/upload', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${authToken}`,
                      },
                      body: JSON.stringify({
                        bucket,
                        filename: file.name,
                        mimeType: file.type,
                        dataUrl,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error);
                    resolve(data.url);
                  } catch (e) {
                    reject(e);
                  }
                };
                reader.readAsDataURL(file);
              });
            }}
          />
        )}

        {activePage === 'checkout' && (
          <CheckoutPage
            items={cart}
            userProfile={userProfile}
            savedAddresses={userAddresses}
            settings={settings}
            onOpenPhoneModal={() => setIsPhoneModalOpen(true)}
            onSaveAddress={async (addr) => {
              if (!authToken) throw new Error('Sign in required');
              const res = await fetch('/api/addresses', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify(addr),
              });
              const saved = await res.json();
              setUserAddresses((prev) => [saved, ...prev]);
              return saved;
            }}
            onValidateCoupon={async (code, subtotal, cats) => {
              const res = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                },
                body: JSON.stringify({ code, subtotal, categories: cats }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error);
              return data;
            }}
            onPlaceOrder={async (payload) => {
              if (!authToken) {
                await handleGoogleSignIn();
                throw new Error('Please complete Google Sign-In to place your order.');
              }
              const res = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify(payload),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error);
              setCart([]);
              loadStoreData();
              return data;
            }}
            onOrderSuccess={(orderNum) => {
              setActiveOrderNumber(orderNum);
              setActivePage('confirmation');
            }}
            onNavigateHome={() => handleNavigate('home')}
            onUploadProof={async (file) => {
              return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = async () => {
                  try {
                    const dataUrl = reader.result as string;
                    const res = await fetch('/api/storage/upload', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${authToken}`,
                      },
                      body: JSON.stringify({
                        bucket: 'payment-proofs',
                        filename: file.name,
                        mimeType: file.type,
                        dataUrl,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error);
                    resolve(data.url);
                  } catch (e) {
                    reject(e);
                  }
                };
                reader.readAsDataURL(file);
              });
            }}
          />
        )}

        {activePage === 'confirmation' && (
          <OrderConfirmationPage
            orderNumber={activeOrderNumber}
            onTrackOrder={(num) => {
              setActiveOrderNumber(num);
              setActivePage('track-order');
            }}
            onContinueShopping={() => handleNavigate('shop', 'all')}
          />
        )}

        {activePage === 'track-order' && (
          <OrderTrackingPage
            initialOrderNumber={activeOrderNumber}
            onUploadProof={async (file) => {
              return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = async () => {
                  try {
                    const dataUrl = reader.result as string;
                    const res = await fetch('/api/storage/upload', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                      },
                      body: JSON.stringify({
                        bucket: 'payment-proofs',
                        filename: file.name,
                        mimeType: file.type,
                        dataUrl,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error);
                    resolve(data.url);
                  } catch (e) {
                    reject(e);
                  }
                };
                reader.readAsDataURL(file);
              });
            }}
            onSubmitProof={async (orderId, ref, url) => {
              const res = await fetch(`/api/orders/${orderId}/payment-proof`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                },
                body: JSON.stringify({ transactionReference: ref, proofImageUrl: url }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error);
              return data;
            }}
          />
        )}

        {activePage === 'account' && (
          <AccountPage
            userProfile={userProfile}
            orders={userOrders}
            returns={userReturns}
            addresses={userAddresses}
            notifications={userNotifications}
            settings={settings}
            onOpenPhoneModal={() => setIsPhoneModalOpen(true)}
            onUpdateProfile={async (name, ph) => {
              const res = await fetch('/api/me/profile', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({ fullName: name, phone: ph }),
              });
              const updated = await res.json();
              if (!res.ok) throw new Error(updated.error);
              setUserProfile(updated);
              return updated;
            }}
            onSaveAddress={async (addr) => {
              const res = await fetch('/api/addresses', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify(addr),
              });
              const saved = await res.json();
              setUserAddresses((prev) => [saved, ...prev]);
              return saved;
            }}
            onDeleteAddress={async (id) => {
              await fetch(`/api/addresses/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${authToken}` },
              });
              setUserAddresses((prev) => prev.filter((a) => a.id !== id));
            }}
            onSwitchRoleForTesting={async (role) => {
              const res = await fetch('/api/me/role-switch', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({ role }),
              });
              const updated = await res.json();
              if (!res.ok) throw new Error(updated.error);
              setUserProfile(updated);
              return updated;
            }}
            onTrackOrder={(num) => {
              setActiveOrderNumber(num);
              setActivePage('track-order');
            }}
            onOpenReturnModal={(orderId) => {
              const reason = prompt('Please specify return reason (e.g. Size exchange, Footwear defect):');
              if (!reason) return;
              fetch('/api/returns', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                  orderId,
                  reason,
                  details: 'Customer requested return through account panel',
                  conditionConfirmed: true,
                  items: [],
                }),
              })
                .then((r) => r.json())
                .then((newRet) => {
                  alert(`Return request #${newRet.returnNumber} created successfully.`);
                  setUserReturns((prev) => [newRet, ...prev]);
                })
                .catch((e) => alert(e.message));
            }}
            onSignInWithGoogle={handleGoogleSignIn}
            onSignOut={handleSignOut}
            onNavigateAdmin={() => handleNavigate('admin')}
            onNavigateShop={() => handleNavigate('shop', 'all')}
          />
        )}

        {activePage === 'contact' && (
          <ContactPage
            settings={settings}
            locations={locations}
            onSubmitMessage={async (data) => {
              const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
              });
              const saved = await res.json();
              if (!res.ok) throw new Error(saved.error);
              return saved;
            }}
          />
        )}

        {activePage === 'admin' && userProfile && (
          <AdminPage
            userProfile={userProfile}
            adminData={adminData}
            loading={loadingAdmin}
            onRefresh={loadAdminData}
            onSaveProduct={async (payload) => {
              const res = await fetch('/api/admin/products', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify(payload),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error);
              loadStoreData();
              return data;
            }}
            onArchiveProduct={async (id, isArchived) => {
              const res = await fetch(`/api/admin/products/${id}/archive`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({ isArchived }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error);
              loadStoreData();
              loadAdminData();
              return data;
            }}
            onAdjustInventory={async (variantId, stock) => {
              const res = await fetch(`/api/admin/inventory/${variantId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({ stock }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error);
              loadStoreData();
              loadAdminData();
              return data;
            }}
            onUpdateOrderStatus={async (orderId, updateData) => {
              const res = await fetch(`/api/admin/orders/${orderId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify(updateData),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error);
              loadAdminData();
              return data;
            }}
            onUpdateReturnStatus={async (returnId, status, note) => {
              const res = await fetch(`/api/admin/returns/${returnId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({ status, adminNote: note }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error);
              loadAdminData();
              return data;
            }}
            onToggleCustomerRestriction={async (uid, restricted) => {
              const res = await fetch(`/api/admin/customers/${uid}/restrict`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({ isRestricted: restricted }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error);
              loadAdminData();
              return data;
            }}
            onSaveSettings={async (newSettings) => {
              const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify(newSettings),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error);
              loadStoreData();
              return data;
            }}
            onUploadImage={async (bucket, file) => {
              return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = async () => {
                  try {
                    const dataUrl = reader.result as string;
                    const res = await fetch('/api/storage/upload', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${authToken}`,
                      },
                      body: JSON.stringify({
                        bucket,
                        filename: file.name,
                        mimeType: file.type,
                        dataUrl,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error);
                    resolve(data.url);
                  } catch (e) {
                    reject(e);
                  }
                };
                reader.readAsDataURL(file);
              });
            }}
            onNavigateHome={() => handleNavigate('home')}
          />
        )}
      </main>

      {/* Universal Editorial Footer */}
      <StoreFooter
        settings={settings}
        locations={locations}
        onNavigate={handleNavigate}
        onOpenSearchModal={() => setIsSearchOpen(true)}
        activePage={activePage}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        settings={settings}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={() => {
          setIsCartOpen(false);
          setActivePage('checkout');
        }}
        onOpenProduct={handleOpenProduct}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={products}
        onOpenProduct={handleOpenProduct}
        onViewAllSearchResults={(q) => {
          setSearchQuery(q);
          handleNavigate('shop', 'all');
        }}
      />

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
        onOpenFullProduct={handleOpenProduct}
      />

      {/* Phone OTP Verification Modal */}
      <PhoneVerificationModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        userProfile={userProfile}
        onSuccess={(updated) => setUserProfile(updated)}
        requestOtpApi={async (phone) => {
          const res = await fetch('/api/auth/otp/request', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ phone }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          return data;
        }}
        verifyOtpApi={async (phone, code) => {
          const res = await fetch('/api/auth/otp/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ phone, code }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          return data.profile;
        }}
      />

      {/* In-App Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white px-5 py-3 shadow-2xl border border-neutral-700 text-xs font-medium flex items-center gap-3 animate-fade-in">
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
