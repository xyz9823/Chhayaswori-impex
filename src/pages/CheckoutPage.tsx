import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Check,
  Truck,
  ArrowRight,
  AlertCircle,
  Building,
  CreditCard,
  Banknote,
  Upload,
} from 'lucide-react';
import {
  CartItemData,
  SiteSettingsData,
  UserAddress,
  UserProfile,
} from '../types/store.ts';

interface CheckoutPageProps {
  items: CartItemData[];
  userProfile: UserProfile | null;
  savedAddresses: UserAddress[];
  settings: SiteSettingsData | null;
  onOpenPhoneModal: () => void;
  onSaveAddress: (addr: any) => Promise<UserAddress>;
  onValidateCoupon: (
    code: string,
    subtotal: number,
    categories: string[]
  ) => Promise<{ coupon: any; discountAmount: number }>;
  onPlaceOrder: (payload: any) => Promise<{ orderNumber: string }>;
  onOrderSuccess: (orderNumber: string) => void;
  onNavigateHome: () => void;
  onUploadProof: (file: File) => Promise<string>;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  items,
  userProfile,
  savedAddresses,
  settings,
  onOpenPhoneModal,
  onSaveAddress,
  onValidateCoupon,
  onPlaceOrder,
  onOrderSuccess,
  onNavigateHome,
  onUploadProof,
}) => {
  const [customerName, setCustomerName] = useState(userProfile?.fullName || '');
  const [customerPhone, setCustomerPhone] = useState(userProfile?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(userProfile?.email || '');

  // Address fields
  const [selectedAddressId, setSelectedAddressId] = useState<number | 'new'>(
    savedAddresses.length > 0 ? savedAddresses[0].id : 'new'
  );
  const [province, setProvince] = useState('Bagmati Province');
  const [district, setDistrict] = useState('Kathmandu');
  const [municipality, setMunicipality] = useState('Kageshwori Manohara');
  const [area, setArea] = useState('Suncity');
  const [streetAddress, setStreetAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [saveAsDefault, setSaveAsDefault] = useState(false);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState<boolean>(false);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ESEWA' | 'BANK_TRANSFER'>('COD');
  const [bankTxnRef, setBankTxnRef] = useState('');
  const [bankProofUrl, setBankProofUrl] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);

  const [placingOrder, setPlacingOrder] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      if (!customerName) setCustomerName(userProfile.fullName);
      if (!customerPhone) setCustomerPhone(userProfile.phone);
      if (!customerEmail) setCustomerEmail(userProfile.email);
    }
  }, [userProfile]);

  useEffect(() => {
    if (selectedAddressId !== 'new') {
      const match = savedAddresses.find((a) => a.id === selectedAddressId);
      if (match) {
        setProvince(match.province);
        setDistrict(match.district);
        setMunicipality(match.municipality);
        setArea(match.area);
        setStreetAddress(match.streetAddress);
        setLandmark(match.landmark);
      }
    }
  }, [selectedAddressId, savedAddresses]);

  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const freeThreshold = settings?.freeDeliveryThreshold ?? 2500;
  const isKathmandu = district.trim().toLowerCase().includes('kathmandu');
  const afterDiscount = Math.max(0, subtotal - discountAmount);

  let deliveryFee = isKathmandu
    ? (settings?.deliveryFeeKathmandu ?? 120)
    : (settings?.deliveryFeeOutside ?? 220);

  if (afterDiscount >= freeThreshold) {
    deliveryFee = 0;
  }

  const grandTotal = afterDiscount + deliveryFee;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setValidatingCoupon(true);
    setCouponError(null);
    try {
      const res = await onValidateCoupon(couponInput.trim(), subtotal, []);
      setAppliedCoupon(res.coupon);
      setDiscountAmount(res.discountAmount);
    } catch (err: any) {
      setCouponError(err.message || 'Invalid coupon.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProof(true);
    try {
      const url = await onUploadProof(file);
      setBankProofUrl(url);
    } catch (err: any) {
      setCheckoutError(err.message || 'Proof upload failed.');
    } finally {
      setUploadingProof(false);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

    // 1. Mandatory Phone verification check (Section 24)
    if (!userProfile?.phoneVerified) {
      onOpenPhoneModal();
      return;
    }

    if (!streetAddress.trim()) {
      setCheckoutError('Please provide your street address for delivery.');
      return;
    }

    setPlacingOrder(true);
    try {
      if (selectedAddressId === 'new' && saveAsDefault) {
        await onSaveAddress({
          fullName: customerName,
          phone: customerPhone,
          province,
          district,
          municipality,
          area,
          streetAddress,
          landmark,
          isDefault: true,
        });
      }

      const orderResult = await onPlaceOrder({
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        province: province.trim(),
        district: district.trim(),
        municipality: municipality.trim(),
        area: area.trim(),
        streetAddress: streetAddress.trim(),
        landmark: landmark.trim(),
        deliveryNote: deliveryNote.trim(),
        couponCode: appliedCoupon?.code || undefined,
        paymentMethod,
        bankTransactionReference: bankTxnRef,
        bankProofImageUrl: bankProofUrl,
      });

      onOrderSuccess(orderResult.orderNumber);
    } catch (err: any) {
      setCheckoutError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-display font-bold uppercase">
          Your Shopping Bag is Empty
        </h2>
        <p className="text-xs text-neutral-500 mt-2">
          Add footwear products before checking out.
        </p>
        <button
          type="button"
          onClick={onNavigateHome}
          className="mt-6 px-6 py-3 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider"
        >
          Return to Storefront
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="pb-6 mb-8 border-b border-neutral-200">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 block mb-1">
          CHHAYASWORI IMPEX CHECKOUT
        </span>
        <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase text-neutral-950">
          Order Review & Secure Checkout
        </h1>
      </div>

      {checkoutError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{checkoutError}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Contact, Delivery & Payment */}
        <div className="lg:col-span-7 space-y-8">
          {/* SECTION 1: CONTACT & PHONE VERIFICATION */}
          <section className="bg-white border border-neutral-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-950">
                1. Customer & Phone Verification
              </h2>
              {userProfile?.phoneVerified ? (
                <span className="text-xs text-emerald-700 font-medium inline-flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Phone Verified
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onOpenPhoneModal}
                  className="text-xs text-amber-700 font-semibold underline"
                >
                  Verify Phone (Required)
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block uppercase tracking-wider font-semibold text-neutral-800 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-2.5 border border-neutral-300 focus:border-neutral-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider font-semibold text-neutral-800 mb-1">
                  Nepal Mobile Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="98XXXXXXXX"
                    className="w-full p-2.5 font-mono border border-neutral-300 focus:border-neutral-950 focus:outline-none"
                  />
                  {!userProfile?.phoneVerified && (
                    <button
                      type="button"
                      onClick={onOpenPhoneModal}
                      className="px-3 py-2 bg-neutral-950 text-white text-[11px] font-semibold uppercase tracking-wider shrink-0"
                    >
                      Verify
                    </button>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block uppercase tracking-wider font-semibold text-neutral-800 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full p-2.5 border border-neutral-300 focus:border-neutral-950 focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* SECTION 2: DELIVERY ADDRESS */}
          <section className="bg-white border border-neutral-200 p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-950 pb-3 border-b border-neutral-100">
              2. Delivery Address in Nepal
            </h2>

            {savedAddresses.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-2">
                  Select Saved Address
                </label>
                <select
                  value={selectedAddressId}
                  onChange={(e) =>
                    setSelectedAddressId(
                      e.target.value === 'new' ? 'new' : Number(e.target.value)
                    )
                  }
                  className="w-full p-2.5 text-xs border border-neutral-300 bg-white"
                >
                  {savedAddresses.map((addr) => (
                    <option key={addr.id} value={addr.id}>
                      {addr.label} — {addr.streetAddress}, {addr.area}, {addr.district}
                    </option>
                  ))}
                  <option value="new">+ Enter a New Address</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block uppercase tracking-wider font-semibold text-neutral-800 mb-1">
                  Province
                </label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full p-2.5 border border-neutral-300 bg-white"
                >
                  <option value="Bagmati Province">Bagmati Province</option>
                  <option value="Koshi Province">Koshi Province</option>
                  <option value="Madhesh Province">Madhesh Province</option>
                  <option value="Gandaki Province">Gandaki Province</option>
                  <option value="Lumbini Province">Lumbini Province</option>
                  <option value="Karnali Province">Karnali Province</option>
                  <option value="Sudurpashchim Province">Sudurpashchim Province</option>
                </select>
              </div>

              <div>
                <label className="block uppercase tracking-wider font-semibold text-neutral-800 mb-1">
                  District
                </label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Kathmandu, Lalitpur, Bhaktapur"
                  className="w-full p-2.5 border border-neutral-300 focus:border-neutral-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider font-semibold text-neutral-800 mb-1">
                  Municipality / City
                </label>
                <input
                  type="text"
                  required
                  value={municipality}
                  onChange={(e) => setMunicipality(e.target.value)}
                  placeholder="e.g. Kageshwori Manohara"
                  className="w-full p-2.5 border border-neutral-300 focus:border-neutral-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider font-semibold text-neutral-800 mb-1">
                  Area / Neighborhood
                </label>
                <input
                  type="text"
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Suncity, Pepsicola, Thamel"
                  className="w-full p-2.5 border border-neutral-300 focus:border-neutral-950 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block uppercase tracking-wider font-semibold text-neutral-800 mb-1">
                  Street Address / House No.
                </label>
                <input
                  type="text"
                  required
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="e.g. House #14, Main Road, Nearby Suncity Towers"
                  className="w-full p-2.5 border border-neutral-300 focus:border-neutral-950 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block uppercase tracking-wider font-semibold text-neutral-800 mb-1">
                  Nearest Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Nearby Big Mart, Suncity"
                  className="w-full p-2.5 border border-neutral-300 focus:border-neutral-950 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block uppercase tracking-wider font-semibold text-neutral-800 mb-1">
                  Delivery Instructions / Note (Optional)
                </label>
                <input
                  type="text"
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  placeholder="e.g. Please call before arriving"
                  className="w-full p-2.5 border border-neutral-300 focus:border-neutral-950 focus:outline-none"
                />
              </div>
            </div>

            {selectedAddressId === 'new' && (
              <label className="flex items-center gap-2 pt-2 text-xs text-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAsDefault}
                  onChange={(e) => setSaveAsDefault(e.target.checked)}
                  className="accent-neutral-950"
                />
                <span>Save this address to my account</span>
              </label>
            )}
          </section>

          {/* SECTION 3: PAYMENT METHOD (With Test Simulation Support) */}
          <section className="bg-white border border-neutral-200 p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-950 pb-3 border-b border-neutral-100">
              3. Payment Selection (Nepal NPR)
            </h2>

            <div className="space-y-3">
              {/* Cash on Delivery */}
              <label
                className={`flex items-start gap-3 p-4 border cursor-pointer transition-colors ${
                  paymentMethod === 'COD'
                    ? 'border-neutral-950 bg-[#F9F9F8]'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="mt-0.5 accent-neutral-950"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-neutral-950" />
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-950">
                      Cash on Delivery (COD)
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Pay in cash when your footwear order is delivered to your doorstep.
                  </p>
                </div>
              </label>

              {/* eSewa Test Simulation Mode */}
              <label
                className={`flex items-start gap-3 p-4 border cursor-pointer transition-colors ${
                  paymentMethod === 'ESEWA'
                    ? 'border-neutral-950 bg-[#F9F9F8]'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="ESEWA"
                  checked={paymentMethod === 'ESEWA'}
                  onChange={() => setPaymentMethod('ESEWA')}
                  className="mt-0.5 accent-neutral-950"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-neutral-950" />
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-950">
                      eSewa (Test Simulation Mode)
                    </span>
                    <span className="text-[10px] bg-neutral-950 text-white font-mono uppercase px-1.5 py-0.5">
                      DEV/TEST ONLY
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Simulate instant test payment. No real money or merchant credentials required.
                  </p>
                </div>
              </label>

              {/* Bank Transfer */}
              <label
                className={`flex items-start gap-3 p-4 border cursor-pointer transition-colors ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'border-neutral-950 bg-[#F9F9F8]'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="BANK_TRANSFER"
                  checked={paymentMethod === 'BANK_TRANSFER'}
                  onChange={() => setPaymentMethod('BANK_TRANSFER')}
                  className="mt-0.5 accent-neutral-950"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-neutral-950" />
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-950">
                      Direct Bank Transfer
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Transfer directly to Chhayaswori Impex bank account and submit your reference.
                  </p>

                  {paymentMethod === 'BANK_TRANSFER' && (
                    <div className="mt-4 pt-4 border-t border-neutral-200 space-y-3">
                      <div className="bg-white p-3 border border-neutral-200 text-xs font-mono space-y-1">
                        <p><strong>Bank:</strong> {settings?.bankName || 'Nepal Investment Mega Bank'}</p>
                        <p><strong>Account Name:</strong> {settings?.bankAccountName || 'CHHAYASWORI IMPEX'}</p>
                        <p><strong>Account No:</strong> {settings?.bankAccountNumber || 'Configure in Admin'}</p>
                        <p><strong>Branch:</strong> {settings?.bankBranch || 'Suncity, Kathmandu'}</p>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-800 mb-1">
                          Bank Transaction Reference ID
                        </label>
                        <input
                          type="text"
                          value={bankTxnRef}
                          onChange={(e) => setBankTxnRef(e.target.value)}
                          placeholder="e.g. TXN-8941038"
                          className="w-full p-2 text-xs font-mono border border-neutral-300 focus:border-neutral-950 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-800 mb-1">
                          Attach Payment Voucher / Screenshot
                        </label>
                        <label className="inline-flex items-center gap-2 px-3 py-2 border border-neutral-300 bg-white text-xs cursor-pointer hover:border-neutral-950">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploadingProof ? 'Uploading...' : 'Upload Slip Image'}</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleProofUpload}
                            className="hidden"
                          />
                        </label>
                        {bankProofUrl && (
                          <p className="text-[11px] text-emerald-700 mt-1">
                            ✓ Proof uploaded successfully.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </section>
        </div>

        {/* Right Column: Order Summary & Placement */}
        <div className="lg:col-span-5">
          <div className="bg-[#F9F9F8] border border-neutral-200 p-6 space-y-6 sticky top-24">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-950 pb-3 border-b border-neutral-200">
              Order Items ({items.reduce((s, i) => s + i.quantity, 0)})
            </h2>

            {/* Item list */}
            <div className="max-h-60 overflow-y-auto divide-y divide-neutral-200 pr-1">
              {items.map((item) => (
                <div key={`${item.productId}-${item.variantId}`} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-12 h-12 object-cover bg-neutral-200 shrink-0"
                    />
                    <div>
                      <p className="font-semibold text-neutral-950 line-clamp-1">{item.productName}</p>
                      <p className="text-neutral-500 font-mono text-[11px]">
                        Size: {item.size} · {item.color} · Qty: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono font-semibold text-neutral-950 whitespace-nowrap">
                    Rs. {(item.unitPrice * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon Code Input */}
            <div className="pt-4 border-t border-neutral-200">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-800 block mb-2">
                Discount Coupon
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="e.g. WELCOME10"
                  className="flex-1 p-2 text-xs font-mono uppercase border border-neutral-300 focus:border-neutral-950 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={validatingCoupon || !couponInput.trim()}
                  className="px-4 py-2 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
              {appliedCoupon && (
                <p className="text-xs text-emerald-700 font-medium mt-1.5">
                  Coupon {appliedCoupon.code} applied (-Rs. {discountAmount.toLocaleString()})
                </p>
              )}
              {couponError && (
                <p className="text-xs text-red-600 mt-1.5">{couponError}</p>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-4 border-t border-neutral-200 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">Rs. {subtotal.toLocaleString()}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Coupon Discount</span>
                  <span className="font-mono tabular-nums">-Rs. {discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-600">
                <span>Delivery Fee ({isKathmandu ? 'Kathmandu Valley' : 'Outside Kathmandu'})</span>
                <span className="font-mono tabular-nums">
                  {deliveryFee === 0 ? 'FREE' : `Rs. ${deliveryFee.toLocaleString()}`}
                </span>
              </div>
              <div className="pt-3 border-t border-neutral-300 flex justify-between text-base font-display font-bold text-neutral-950">
                <span>Total Amount (NPR)</span>
                <span className="font-mono tabular-nums">Rs. {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Place Order CTA */}
            <button
              type="submit"
              disabled={placingOrder}
              className="w-full py-4 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-[0.2em] hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {placingOrder ? (
                <span>Validating & Placing Order...</span>
              ) : (
                <>
                  <span>Confirm Order</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-[11px] text-neutral-500 space-y-1">
              <p>• Delivery within 1–2 business days inside Kathmandu Valley.</p>
              <p>• Phone verification is required to prevent accidental duplicates.</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
