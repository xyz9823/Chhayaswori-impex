import React from 'react';
import { X, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { CartItemData, SiteSettingsData } from '../types/store.ts';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItemData[];
  settings: SiteSettingsData | null;
  onUpdateQuantity: (productId: number, variantId: number, qty: number) => void;
  onRemoveItem: (productId: number, variantId: number) => void;
  onCheckout: () => void;
  onOpenProduct: (slug: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  settings,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onOpenProduct,
}) => {
  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const freeThreshold = settings?.freeDeliveryThreshold ?? 2500;
  const amountForFree = Math.max(0, freeThreshold - subtotal);
  const freeProgress = Math.min(100, Math.round((subtotal / freeThreshold) * 100));

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
    >
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-neutral-200 flex flex-col justify-between shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-neutral-950" />
              <h2
                id="cart-drawer-title"
                className="text-base font-display font-bold uppercase tracking-wider text-neutral-950"
              >
                Shopping Bag ({items.reduce((s, i) => s + i.quantity, 0)})
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close cart"
              className="p-1.5 text-neutral-500 hover:text-neutral-950 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Delivery Bar */}
          <div className="bg-[#F9F9F8] px-6 py-3 border-b border-neutral-200 text-xs text-neutral-700">
            {amountForFree > 0 ? (
              <p>
                Add{' '}
                <strong className="font-mono text-neutral-950">
                  Rs. {amountForFree.toLocaleString()}
                </strong>{' '}
                more for <strong>FREE DELIVERY</strong> across Nepal.
              </p>
            ) : (
              <p className="text-emerald-700 font-semibold">
                ✓ You have qualified for FREE DELIVERY!
              </p>
            )}
            <div className="w-full bg-neutral-200 h-1 mt-2 overflow-hidden">
              <div
                className="bg-neutral-950 h-full transition-all duration-300"
                style={{ width: `${freeProgress}%` }}
              />
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 divide-y divide-neutral-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <ShoppingBag className="w-12 h-12 stroke-[1.25] text-neutral-300 mb-3" />
                <p className="text-sm font-semibold text-neutral-950">
                  Your shopping bag is empty.
                </p>
                <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                  Discover our comfort slippers, shoes, and handcrafted sandals.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-6 px-6 py-2.5 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="py-4 flex gap-4"
                >
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    onClick={() => {
                      onClose();
                      onOpenProduct(item.productSlug);
                    }}
                    className="w-20 h-20 object-cover bg-neutral-100 border border-neutral-200 shrink-0 cursor-pointer"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3
                        onClick={() => {
                          onClose();
                          onOpenProduct(item.productSlug);
                        }}
                        className="text-xs font-semibold text-neutral-950 cursor-pointer hover:underline line-clamp-1"
                      >
                        {item.productName}
                      </h3>
                      <p className="text-[11px] text-neutral-500 mt-0.5 font-mono">
                        Size: {item.size} · Color: {item.color}
                      </p>
                      <p className="text-xs font-mono font-semibold text-neutral-950 mt-1">
                        Rs. {item.unitPrice.toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-neutral-200">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(
                              item.productId,
                              item.variantId,
                              item.quantity - 1
                            )
                          }
                          className="px-2 py-1 text-xs hover:bg-neutral-100 font-mono"
                        >
                          -
                        </button>
                        <span className="px-2.5 py-1 text-xs font-mono tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(
                              item.productId,
                              item.variantId,
                              Math.min(item.availableStock, item.quantity + 1)
                            )
                          }
                          disabled={item.quantity >= item.availableStock}
                          className="px-2 py-1 text-xs hover:bg-neutral-100 font-mono disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onRemoveItem(item.productId, item.variantId)
                        }
                        aria-label="Remove item"
                        className="text-neutral-400 hover:text-red-600 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Subtotal & Checkout */}
          {items.length > 0 && (
            <div className="p-6 border-t border-neutral-200 bg-[#F9F9F8] space-y-3">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-semibold uppercase tracking-wider text-neutral-700 text-xs">
                  Estimated Subtotal
                </span>
                <span className="text-base font-mono font-bold text-neutral-950 tabular-nums">
                  Rs. {subtotal.toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Delivery and discount coupons calculated during checkout.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCheckout();
                }}
                className="w-full py-3.5 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-[0.2em] hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
