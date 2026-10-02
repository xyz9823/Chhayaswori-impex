import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Package,
  MapPin,
  Heart,
  Bell,
  RotateCcw,
  LogOut,
  Plus,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Lock,
} from 'lucide-react';
import {
  NotificationRecord,
  OrderRecord,
  ReturnRecord,
  SiteSettingsData,
  UserAddress,
  UserProfile,
} from '../types/store.ts';

interface AccountPageProps {
  userProfile: UserProfile | null;
  orders: OrderRecord[];
  returns: ReturnRecord[];
  addresses: UserAddress[];
  notifications: NotificationRecord[];
  settings: SiteSettingsData | null;
  onOpenPhoneModal: () => void;
  onUpdateProfile: (name: string, phone: string) => Promise<UserProfile>;
  onSaveAddress: (addr: any) => Promise<UserAddress>;
  onDeleteAddress: (id: number) => Promise<void>;
  onSwitchRoleForTesting: (role: string) => Promise<UserProfile>;
  onTrackOrder: (num: string) => void;
  onOpenReturnModal: (orderId: number) => void;
  onSignInWithGoogle: () => void;
  onSignOut: () => void;
  onNavigateAdmin: () => void;
  onNavigateShop: () => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({
  userProfile,
  orders,
  returns,
  addresses,
  notifications,
  settings,
  onOpenPhoneModal,
  onUpdateProfile,
  onSaveAddress,
  onDeleteAddress,
  onSwitchRoleForTesting,
  onTrackOrder,
  onOpenReturnModal,
  onSignInWithGoogle,
  onSignOut,
  onNavigateAdmin,
  onNavigateShop,
}) => {
  const [activeTab, setActiveTab] = useState<
    'ORDERS' | 'RETURNS' | 'ADDRESSES' | 'NOTIFICATIONS' | 'PROFILE' | 'DEVELOPER'
  >('ORDERS');

  const [fullName, setFullName] = useState(userProfile?.fullName || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // New address state
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newLabel, setNewLabel] = useState('Home');
  const [newRecipient, setNewRecipient] = useState(userProfile?.fullName || '');
  const [newPhone, setNewPhone] = useState(userProfile?.phone || '');
  const [newProvince, setNewProvince] = useState('Bagmati Province');
  const [newDistrict, setNewDistrict] = useState('Kathmandu');
  const [newMunicipality, setNewMunicipality] = useState('Kageshwori Manohara');
  const [newArea, setNewArea] = useState('Suncity');
  const [newStreet, setNewStreet] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [addressError, setAddressError] = useState<string | null>(null);

  if (!userProfile) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-neutral-100 flex items-center justify-center mb-4">
          <User className="w-6 h-6 text-neutral-800" />
        </div>
        <h1 className="text-xl font-display font-bold uppercase text-neutral-950">
          Customer Sign In
        </h1>
        <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
          Sign in to view your orders, verify your mobile number, track deliveries, and manage your return requests.
        </p>

        <button
          type="button"
          onClick={onSignInWithGoogle}
          className="mt-6 w-full py-3.5 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-[0.18em] hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
        >
          <span>Continue with Google Sign-In</span>
        </button>
      </div>
    );
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await onUpdateProfile(fullName, phone);
      setProfileMsg('Profile updated successfully.');
    } catch (err: any) {
      setProfileMsg(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSaveAddress({
        label: newLabel,
        fullName: newRecipient,
        phone: newPhone,
        province: newProvince,
        district: newDistrict,
        municipality: newMunicipality,
        area: newArea,
        streetAddress: newStreet,
        landmark: newLandmark,
        isDefault: addresses.length === 0,
      });
      setShowAddAddress(false);
      setNewStreet('');
      setNewLandmark('');
      setAddressError(null);
    } catch (err: any) {
      setAddressError(err.message || 'Failed to save address.');
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      {/* Account Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 block mb-1">
            Chhayaswori Customer Account
          </span>
          <h1 className="text-2xl font-display font-bold uppercase text-neutral-950">
            Welcome, {userProfile.fullName || 'Customer'}
          </h1>
          <p className="text-xs text-neutral-500 font-mono mt-0.5">
            {userProfile.email} · Role:{' '}
            <span className="font-semibold text-neutral-950 uppercase">{userProfile.role}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {(userProfile.role === 'SUPER_ADMIN' || userProfile.role === 'STAFF') && (
            <button
              type="button"
              onClick={onNavigateAdmin}
              className="px-4 py-2 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800"
            >
              Open Admin Dashboard
            </button>
          )}
          <button
            type="button"
            onClick={onSignOut}
            className="px-3.5 py-2 border border-neutral-300 text-xs font-semibold uppercase tracking-wider text-neutral-800 hover:border-neutral-950 flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-3 space-y-1">
          {[
            { id: 'ORDERS', label: 'My Orders', icon: Package, count: orders.length },
            { id: 'RETURNS', label: 'Return Requests', icon: RotateCcw, count: returns.length },
            { id: 'ADDRESSES', label: 'Saved Addresses', icon: MapPin, count: addresses.length },
            { id: 'NOTIFICATIONS', label: 'Notifications', icon: Bell, count: notifications.length },
            { id: 'PROFILE', label: 'Account Profile', icon: User },
            { id: 'DEVELOPER', label: 'Role Switcher / Test', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors text-left ${
                  activeTab === tab.id
                    ? 'bg-neutral-950 text-white'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </div>
                {tab.count !== undefined && (
                  <span className="font-mono text-[11px] opacity-75">{tab.count}</span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Content Area */}
        <main className="lg:col-span-9 bg-white border border-neutral-200 p-6 sm:p-8">
          {/* TAB 1: ORDERS */}
          {activeTab === 'ORDERS' && (
            <div className="space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-950 pb-3 border-b border-neutral-100">
                Order History ({orders.length})
              </h2>

              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-10 h-10 text-neutral-300 mx-auto mb-2 stroke-[1.5]" />
                  <p className="text-sm font-semibold text-neutral-950">No orders yet</p>
                  <p className="text-xs text-neutral-500 mt-1">Explore our footwear collections and place your first order.</p>
                  <button
                    type="button"
                    onClick={onNavigateShop}
                    className="mt-4 px-5 py-2.5 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((ord) => (
                    <div key={ord.id} className="border border-neutral-200 p-5 space-y-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-3 pb-3 border-b border-neutral-100 text-xs">
                        <div>
                          <span className="text-neutral-500 uppercase tracking-wider text-[11px]">Order #</span>
                          <span className="font-mono font-bold text-neutral-950 ml-1.5">{ord.orderNumber}</span>
                          <span className="text-neutral-400 ml-2">
                            · {new Date(ord.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-neutral-950 text-white">
                            {ord.orderStatus}
                          </span>
                          <button
                            type="button"
                            onClick={() => onTrackOrder(ord.orderNumber)}
                            className="text-neutral-950 underline font-semibold text-xs inline-flex items-center gap-1"
                          >
                            Track <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="divide-y divide-neutral-100">
                        {ord.items.map((it) => (
                          <div key={it.id} className="py-2.5 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3">
                              <img
                                src={it.productImage}
                                alt={it.productName}
                                className="w-12 h-12 object-cover bg-neutral-100 border border-neutral-200"
                              />
                              <div>
                                <p className="font-semibold text-neutral-950">{it.productName}</p>
                                <p className="text-neutral-500 font-mono text-[11px]">
                                  Size {it.size} · {it.color} · Qty {it.quantity}
                                </p>
                              </div>
                            </div>
                            <span className="font-mono font-semibold">
                              Rs. {it.lineTotal.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <span className="font-mono font-bold text-sm">
                          Total: Rs. {ord.grandTotal.toLocaleString()} ({ord.paymentMethod})
                        </span>

                        {/* Return Request Button */}
                        {ord.orderStatus === 'Delivered' && (
                          <button
                            type="button"
                            onClick={() => onOpenReturnModal(ord.id)}
                            className="px-3 py-1.5 border border-neutral-300 text-neutral-900 text-xs font-semibold uppercase tracking-wider hover:border-neutral-950"
                          >
                            Request Return
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RETURNS */}
          {activeTab === 'RETURNS' && (
            <div className="space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-950 pb-3 border-b border-neutral-100">
                Return Requests ({returns.length})
              </h2>

              {returns.length === 0 ? (
                <div className="text-center py-12">
                  <RotateCcw className="w-10 h-10 text-neutral-300 mx-auto mb-2 stroke-[1.5]" />
                  <p className="text-sm font-semibold text-neutral-950">No return requests</p>
                  <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                    Return requests can be initiated within {settings?.returnPeriodDays ?? 7} days of order delivery.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {returns.map((ret) => (
                    <div key={ret.id} className="border border-neutral-200 p-5 text-xs space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="font-mono font-bold text-neutral-950">#{ret.returnNumber}</span>
                        <span className="px-2.5 py-0.5 bg-neutral-100 text-neutral-900 font-semibold uppercase tracking-wider">
                          {ret.status}
                        </span>
                      </div>
                      <p><strong>Reason:</strong> {ret.reason}</p>
                      {ret.details && <p className="text-neutral-600">{ret.details}</p>}
                      {ret.adminNote && (
                        <div className="p-3 bg-neutral-50 border border-neutral-200 mt-2">
                          <span className="font-semibold block text-neutral-900">Store Note:</span>
                          <p className="text-neutral-600 mt-0.5">{ret.adminNote}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ADDRESSES */}
          {activeTab === 'ADDRESSES' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-950">
                  Saved Delivery Addresses ({addresses.length})
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAddAddress(!showAddAddress)}
                  className="px-3 py-1.5 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Address
                </button>
              </div>

              {showAddAddress && (
                <form onSubmit={handleAddAddressSubmit} className="p-5 border border-neutral-300 bg-[#F9F9F8] space-y-3 text-xs mb-6">
                  <h3 className="font-bold uppercase tracking-wider text-neutral-950">New Delivery Address</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block uppercase tracking-wider text-[11px] mb-1">Label (e.g. Home, Office)</label>
                      <input
                        type="text"
                        required
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        className="w-full p-2 border border-neutral-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block uppercase tracking-wider text-[11px] mb-1">Recipient Name</label>
                      <input
                        type="text"
                        required
                        value={newRecipient}
                        onChange={(e) => setNewRecipient(e.target.value)}
                        className="w-full p-2 border border-neutral-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block uppercase tracking-wider text-[11px] mb-1">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="w-full p-2 border border-neutral-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block uppercase tracking-wider text-[11px] mb-1">District</label>
                      <input
                        type="text"
                        required
                        value={newDistrict}
                        onChange={(e) => setNewDistrict(e.target.value)}
                        className="w-full p-2 border border-neutral-300 bg-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block uppercase tracking-wider text-[11px] mb-1">Street Address</label>
                      <input
                        type="text"
                        required
                        value={newStreet}
                        onChange={(e) => setNewStreet(e.target.value)}
                        className="w-full p-2 border border-neutral-300 bg-white"
                      />
                    </div>
                  </div>
                  <div className="pt-2 flex gap-2">
                    <button type="submit" className="px-4 py-2 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider">
                      Save Address
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddAddress(false)}
                      className="px-4 py-2 border border-neutral-300 text-xs uppercase"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((a) => (
                  <div key={a.id} className="border border-neutral-200 p-4 text-xs space-y-1 relative bg-white">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold uppercase tracking-wider text-neutral-950">{a.label}</span>
                      {a.isDefault && (
                        <span className="text-[10px] bg-neutral-950 text-white px-2 py-0.5 uppercase">Default</span>
                      )}
                    </div>
                    <p className="font-semibold text-neutral-800">{a.fullName} · {a.phone}</p>
                    <p className="text-neutral-600">{a.streetAddress}, {a.area}</p>
                    <p className="text-neutral-600">{a.municipality}, {a.district}</p>
                    <button
                      type="button"
                      onClick={() => onDeleteAddress(a.id)}
                      className="text-neutral-400 hover:text-red-600 pt-2 text-[11px] inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === 'NOTIFICATIONS' && (
            <div className="space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-950 pb-3 border-b border-neutral-100">
                In-App & Simulated SMS Alerts ({notifications.length})
              </h2>
              {notifications.length === 0 ? (
                <p className="text-xs text-neutral-500 py-8 text-center">No notifications.</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div key={n.id} className="border border-neutral-200 p-4 text-xs space-y-1 bg-white">
                      <div className="flex justify-between items-baseline">
                        <h4 className="font-bold text-neutral-950">{n.title}</h4>
                        <span className="text-neutral-400 text-[10px]">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-neutral-600 leading-relaxed">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PROFILE */}
          {activeTab === 'PROFILE' && (
            <div className="space-y-6 max-w-lg">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-950 pb-3 border-b border-neutral-100">
                Profile Details
              </h2>

              <form onSubmit={handleProfileSave} className="space-y-4 text-xs">
                <div>
                  <label className="block uppercase tracking-wider font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-2.5 border border-neutral-300 focus:border-neutral-950 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider font-semibold mb-1">Nepal Mobile Number</label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-2.5 font-mono border border-neutral-300 focus:border-neutral-950 focus:outline-none"
                    />
                    {!userProfile.phoneVerified && (
                      <button
                        type="button"
                        onClick={onOpenPhoneModal}
                        className="px-3 py-2 bg-neutral-950 text-white uppercase text-[11px] font-semibold shrink-0"
                      >
                        Verify OTP
                      </button>
                    )}
                  </div>
                  {userProfile.phoneVerified && (
                    <p className="text-emerald-700 text-[11px] mt-1 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Phone Verified for Instant Orders
                    </p>
                  )}
                </div>

                <div>
                  <label className="block uppercase tracking-wider font-semibold mb-1 text-neutral-500">
                    Email Address (Google Account)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={userProfile.email}
                    className="w-full p-2.5 border border-neutral-200 bg-neutral-100 text-neutral-500 cursor-not-allowed"
                  />
                </div>

                {profileMsg && <p className="text-xs text-neutral-950 font-medium">{profileMsg}</p>}

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-3 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 disabled:opacity-50"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 6: DEVELOPER ROLE SWITCHER */}
          {activeTab === 'DEVELOPER' && (
            <div className="space-y-6 max-w-lg">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-950 pb-3 border-b border-neutral-100">
                Preview Development Role Testing
              </h2>
              <div className="p-4 bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs leading-relaxed">
                <span className="font-semibold block uppercase text-[10px] text-neutral-600 mb-1">
                  DEVELOPMENT / TEST ONLY
                </span>
                You can switch between roles to test the full end-to-end customer and administrative capabilities of CHHAYASWORI IMPEX.
              </div>

              <div className="space-y-3">
                {[
                  {
                    role: 'CUSTOMER',
                    title: 'Customer Mode',
                    desc: 'Regular storefront access, cart, order placement, phone verification, and order tracking.',
                  },
                  {
                    role: 'STAFF',
                    title: 'Staff Mode',
                    desc: 'Access to Products, Inventory updates, and Order processing without super-admin settings access.',
                  },
                  {
                    role: 'SUPER_ADMIN',
                    title: 'Super Admin Mode',
                    desc: 'Full access to Store Analytics, Inventory, Staff Permissions, Payment/Fee Settings, and Banners.',
                  },
                ].map((r) => (
                  <div
                    key={r.role}
                    className={`p-4 border text-xs flex items-center justify-between gap-4 ${
                      userProfile.role === r.role
                        ? 'border-neutral-950 bg-[#F9F9F8]'
                        : 'border-neutral-200'
                    }`}
                  >
                    <div>
                      <p className="font-bold uppercase tracking-wider text-neutral-950">{r.title}</p>
                      <p className="text-neutral-500 mt-0.5">{r.desc}</p>
                    </div>
                    {userProfile.role === r.role ? (
                      <span className="px-3 py-1 bg-neutral-950 text-white font-semibold text-[10px] uppercase">
                        Active
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSwitchRoleForTesting(r.role)}
                        className="px-3 py-1 border border-neutral-300 text-neutral-900 font-semibold text-[10px] uppercase hover:border-neutral-950"
                      >
                        Switch
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
