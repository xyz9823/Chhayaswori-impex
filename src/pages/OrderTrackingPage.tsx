import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  Building,
  Upload,
  ArrowRight,
} from 'lucide-react';
import { OrderRecord } from '../types/store.ts';

interface OrderTrackingPageProps {
  initialOrderNumber?: string;
  onUploadProof?: (file: File) => Promise<string>;
  onSubmitProof?: (orderId: number, ref: string, url: string) => Promise<any>;
}

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({
  initialOrderNumber = '',
  onUploadProof,
  onSubmitProof,
}) => {
  const [orderQuery, setOrderQuery] = useState(initialOrderNumber);
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bank proof submission
  const [bankRef, setBankRef] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofSuccess, setProofSuccess] = useState(false);

  const fetchOrder = async (num: string) => {
    if (!num.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/track/${num.trim()}`);
      if (!res.ok) {
        throw new Error('Order not found. Please verify your order number.');
      }
      const data = await res.json();
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Unable to locate order.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderNumber) {
      setOrderQuery(initialOrderNumber);
      fetchOrder(initialOrderNumber);
    }
  }, [initialOrderNumber]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(orderQuery);
  };

  const handleProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !onSubmitProof || !bankRef.trim()) return;
    setSubmittingProof(true);
    try {
      const updated = await onSubmitProof(order.id, bankRef.trim(), proofUrl);
      setOrder(updated);
      setProofSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit payment reference.');
    } finally {
      setSubmittingProof(false);
    }
  };

  const statusTimeline = [
    'Pending',
    'Confirmed',
    'Processing',
    'Packed',
    'Shipped',
    'Out for Delivery',
    'Delivered',
  ];

  const getStepState = (stepName: string) => {
    if (!order) return 'PENDING';
    if (order.orderStatus === 'Cancelled') return 'CANCELLED';

    const currentIdx = statusTimeline.indexOf(order.orderStatus);
    const stepIdx = statusTimeline.indexOf(stepName);

    if (currentIdx === -1) {
      return stepName === 'Pending' ? 'CURRENT' : 'PENDING';
    }

    if (stepIdx < currentIdx) return 'COMPLETED';
    if (stepIdx === currentIdx) return 'CURRENT';
    return 'PENDING';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <div className="text-center max-w-xl mx-auto mb-10">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 block mb-1">
          Real-time Footwear Tracking
        </span>
        <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase text-neutral-950">
          Track Your Order
        </h1>
        <p className="text-xs text-neutral-600 mt-2">
          Enter your order reference number (e.g. CHX-XXXXXX-XX) to follow preparation and dispatch status.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mt-6 flex gap-2">
          <input
            type="text"
            required
            value={orderQuery}
            onChange={(e) => setOrderQuery(e.target.value)}
            placeholder="Enter Order Number (e.g. CHX-123456-78)"
            className="flex-1 p-3 text-xs font-mono uppercase border border-neutral-300 focus:border-neutral-950 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs text-center max-w-xl mx-auto mb-8">
          {error}
        </div>
      )}

      {order && (
        <div className="border border-neutral-200 bg-white p-6 sm:p-8 space-y-8">
          {/* Header Summary */}
          <div className="flex flex-wrap items-baseline justify-between gap-4 pb-6 border-b border-neutral-200">
            <div>
              <span className="text-xs text-neutral-500 uppercase tracking-wider block">Order Reference</span>
              <h2 className="text-xl font-mono font-bold text-neutral-950">
                #{order.orderNumber}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-neutral-500 uppercase tracking-wider block">Current Status</span>
              <span className="text-sm font-semibold uppercase tracking-wider bg-neutral-950 text-white px-3 py-1">
                {order.orderStatus}
              </span>
            </div>
          </div>

          {/* 70. ORDER TRACKING TIMELINE */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-950 mb-6">
              Fulfillment Journey
            </h3>
            <div className="relative">
              <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-0.5 bg-neutral-200 -translate-y-1/2 z-0" />
              <div className="grid grid-cols-2 sm:grid-cols-7 gap-4 relative z-10">
                {statusTimeline.map((step) => {
                  const state = getStepState(step);
                  return (
                    <div key={step} className="flex flex-col items-center text-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                          state === 'COMPLETED'
                            ? 'bg-neutral-950 border-neutral-950 text-white'
                            : state === 'CURRENT'
                            ? 'bg-white border-neutral-950 text-neutral-950 ring-4 ring-neutral-100'
                            : 'bg-white border-neutral-300 text-neutral-400'
                        }`}
                      >
                        {state === 'COMPLETED' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : state === 'CURRENT' ? (
                          <Clock className="w-4 h-4 animate-pulse" />
                        ) : (
                          <span className="text-[10px] font-mono font-bold">•</span>
                        )}
                      </div>
                      <span
                        className={`text-[11px] uppercase tracking-wider mt-2 ${
                          state === 'CURRENT'
                            ? 'font-bold text-neutral-950'
                            : state === 'COMPLETED'
                            ? 'font-semibold text-neutral-800'
                            : 'text-neutral-400'
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bank Transfer Submission Form (If Payment Pending) */}
          {order.paymentMethod === 'BANK_TRANSFER' &&
            order.paymentStatus !== 'Paid' &&
            onSubmitProof && (
              <div className="p-6 bg-[#F9F9F8] border border-neutral-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-950 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Bank Transfer Reference Submission
                </h4>
                <p className="text-xs text-neutral-600">
                  Please submit your bank payment reference number or upload your transaction slip so store staff can verify your payment.
                </p>

                {proofSuccess ? (
                  <p className="text-xs text-emerald-700 font-semibold">
                    ✓ Payment reference submitted for admin verification.
                  </p>
                ) : (
                  <form onSubmit={handleProofSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-800 mb-1">
                          Transaction Reference Number
                        </label>
                        <input
                          type="text"
                          required
                          value={bankRef}
                          onChange={(e) => setBankRef(e.target.value)}
                          placeholder="e.g. TXN-940128"
                          className="w-full p-2.5 text-xs font-mono border border-neutral-300 focus:border-neutral-950 focus:outline-none"
                        />
                      </div>

                      {onUploadProof && (
                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-800 mb-1">
                            Upload Voucher Image (Optional)
                          </label>
                          <label className="inline-flex items-center gap-2 px-3 py-2.5 border border-neutral-300 bg-white text-xs cursor-pointer hover:border-neutral-950 w-full">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{uploading ? 'Uploading...' : 'Choose File'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const f = e.target.files?.[0];
                                if (!f) return;
                                setUploading(true);
                                try {
                                  const url = await onUploadProof(f);
                                  setProofUrl(url);
                                } finally {
                                  setUploading(false);
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={submittingProof || !bankRef.trim()}
                      className="px-6 py-2.5 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 disabled:opacity-50"
                    >
                      {submittingProof ? 'Submitting...' : 'Submit Reference'}
                    </button>
                  </form>
                )}
              </div>
            )}

          {/* Items & Shipping Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-200">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-950 mb-3">
                Purchased Footwear
              </h4>
              <div className="divide-y divide-neutral-100 text-xs">
                {order.items.map((it) => (
                  <div key={it.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-neutral-950">{it.productName}</p>
                      <p className="text-neutral-500 font-mono text-[11px]">
                        Size {it.size} · {it.color} · Qty {it.quantity}
                      </p>
                    </div>
                    <span className="font-mono font-semibold">
                      Rs. {it.lineTotal.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-950 mb-3">
                Destination Address
              </h4>
              <div className="text-xs text-neutral-700 space-y-1">
                <p><strong>Recipient:</strong> {order.customerName}</p>
                <p><strong>Phone:</strong> {order.customerPhone}</p>
                <p>
                  <strong>Address:</strong> {order.streetAddress}, {order.area},{' '}
                  {order.municipality}, {order.district}
                </p>
                {order.landmark && <p><strong>Landmark:</strong> {order.landmark}</p>}
                <p className="pt-2 font-mono">
                  <strong>Total Paid / Due:</strong> Rs. {order.grandTotal.toLocaleString()} ({order.paymentMethod})
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
