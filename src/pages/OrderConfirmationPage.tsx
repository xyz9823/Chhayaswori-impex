import React, { useEffect, useState } from 'react';
import { CheckCircle2, ArrowRight, Package, MapPin, Truck } from 'lucide-react';
import { OrderRecord } from '../types/store.ts';

interface OrderConfirmationPageProps {
  orderNumber: string;
  onTrackOrder: (num: string) => void;
  onContinueShopping: () => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({
  orderNumber,
  onTrackOrder,
  onContinueShopping,
}) => {
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders/track/${orderNumber}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        }
      } catch (err) {
        console.error('Failed to load order confirmation:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [orderNumber]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 md:py-20 text-center">
      <div className="w-16 h-16 mx-auto rounded-full bg-neutral-950 text-white flex items-center justify-center mb-6">
        <CheckCircle2 className="w-8 h-8 stroke-[1.5]" />
      </div>

      <span className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500 block mb-2">
        THANK YOU FOR YOUR ORDER
      </span>
      <h1 className="text-3xl font-display font-extrabold uppercase text-neutral-950 tracking-tight">
        Order Placed Successfully
      </h1>

      <div className="mt-4 inline-block bg-[#F9F9F8] border border-neutral-200 px-6 py-2.5">
        <span className="text-xs text-neutral-500 uppercase tracking-wider block">Order Number</span>
        <span className="text-lg font-mono font-bold text-neutral-950">#{orderNumber}</span>
      </div>

      <p className="mt-4 text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
        Your footwear order has been registered in the Chhayaswori Impex inventory system. A simulated notification was dispatched to your phone number.
      </p>

      {/* Simulated Dev mode notice */}
      {order?.internalNotes?.includes('DEVELOPMENT/TEST ONLY') && (
        <div className="mt-4 max-w-md mx-auto p-3 bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs text-left">
          <span className="font-semibold block uppercase text-[10px] text-neutral-600">
            DEVELOPMENT / TEST ONLY
          </span>
          {order.internalNotes}
        </div>
      )}

      {loading ? (
        <div className="mt-10 p-8 border border-neutral-200 animate-pulse bg-[#F9F9F8]">
          <div className="h-4 bg-neutral-200 w-1/2 mx-auto mb-4" />
          <div className="h-4 bg-neutral-200 w-1/3 mx-auto" />
        </div>
      ) : order ? (
        <div className="mt-10 text-left border border-neutral-200 bg-white p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-100 text-xs">
            <div>
              <span className="text-neutral-500">Recipient:</span>{' '}
              <strong className="text-neutral-950">{order.customerName}</strong>
            </div>
            <div>
              <span className="text-neutral-500">Payment:</span>{' '}
              <strong className="text-neutral-950">{order.paymentMethod}</strong> ({order.paymentStatus})
            </div>
            <div>
              <span className="text-neutral-500">Status:</span>{' '}
              <strong className="text-neutral-950">{order.orderStatus}</strong>
            </div>
          </div>

          {/* Items summary */}
          <div className="divide-y divide-neutral-100">
            {order.items.map((it) => (
              <div key={it.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={it.productImage}
                    alt={it.productName}
                    className="w-12 h-12 object-cover bg-neutral-100 border border-neutral-200 shrink-0"
                  />
                  <div>
                    <p className="font-semibold text-neutral-950">{it.productName}</p>
                    <p className="text-neutral-500 font-mono text-[11px]">
                      Size: {it.size} · Color: {it.color} · Qty: {it.quantity}
                    </p>
                  </div>
                </div>
                <span className="font-mono font-semibold text-neutral-950">
                  Rs. {it.lineTotal.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="pt-4 border-t border-neutral-200 flex justify-between items-baseline font-mono">
            <span className="text-xs uppercase font-bold tracking-wider text-neutral-700">
              Grand Total (NPR)
            </span>
            <span className="text-lg font-bold text-neutral-950 tabular-nums">
              Rs. {order.grandTotal.toLocaleString()}
            </span>
          </div>

          {/* Delivery destination */}
          <div className="pt-4 border-t border-neutral-200 text-xs text-neutral-600 flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-neutral-950 shrink-0 mt-0.5" />
            <span>
              Shipping to: {order.streetAddress}, {order.area}, {order.municipality}, {order.district}
              {order.landmark ? ` (Landmark: ${order.landmark})` : ''}
            </span>
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => onTrackOrder(orderNumber)}
          className="px-6 py-3.5 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-[0.18em] hover:bg-neutral-800 transition-colors inline-flex items-center gap-2"
        >
          <span>Track Order Status</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onContinueShopping}
          className="px-6 py-3.5 border border-neutral-300 text-neutral-950 text-xs font-semibold uppercase tracking-[0.18em] hover:border-neutral-950 transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
};
