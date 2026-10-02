import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  RotateCcw,
  Users,
  Shield,
  Tag,
  MessageSquare,
  Settings,
  Plus,
  Search,
  Upload,
  Check,
  X,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  CatalogProduct,
  CategoryItem,
  OrderRecord,
  ReturnRecord,
  SiteSettingsData,
  UserProfile,
} from '../types/store.ts';

interface AdminPageProps {
  userProfile: UserProfile;
  adminData: any;
  loading: boolean;
  onRefresh: () => void;
  onSaveProduct: (payload: any) => Promise<any>;
  onArchiveProduct: (id: number, isArchived: boolean) => Promise<any>;
  onAdjustInventory: (variantId: number, stock: number) => Promise<any>;
  onUpdateOrderStatus: (orderId: number, data: any) => Promise<any>;
  onUpdateReturnStatus: (returnId: number, status: string, note: string) => Promise<any>;
  onToggleCustomerRestriction: (uid: string, restricted: boolean) => Promise<any>;
  onSaveSettings: (settings: any) => Promise<any>;
  onUploadImage: (bucket: 'product-images' | 'brand-assets', file: File) => Promise<string>;
  onNavigateHome: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  userProfile,
  adminData,
  loading,
  onRefresh,
  onSaveProduct,
  onArchiveProduct,
  onAdjustInventory,
  onUpdateOrderStatus,
  onUpdateReturnStatus,
  onToggleCustomerRestriction,
  onSaveSettings,
  onUploadImage,
  onNavigateHome,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'OVERVIEW'
    | 'PRODUCTS'
    | 'INVENTORY'
    | 'ORDERS'
    | 'RETURNS'
    | 'CUSTOMERS'
    | 'SETTINGS'
  >('OVERVIEW');

  // Product modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodCat, setProdCat] = useState('men');
  const [prodType, setProdType] = useState('Shoes');
  const [prodGender, setProdGender] = useState('Men');
  const [prodPrice, setProdPrice] = useState(2500);
  const [prodComparePrice, setProdComparePrice] = useState<number | ''>('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodMaterial, setProdMaterial] = useState('EVA Foam Sole');
  const [prodImg, setProdImg] = useState('');
  const [prodVariants, setProdVariants] = useState<Array<{ size: string; color: string; stock: number }>>([
    { size: '40', color: 'Black', stock: 5 },
    { size: '41', color: 'Black', stock: 5 },
    { size: '42', color: 'Black', stock: 5 },
  ]);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [savingProd, setSavingProd] = useState(false);
  const [prodError, setProdError] = useState<string | null>(null);

  // Settings state
  const [settingsForm, setSettingsForm] = useState<any>(adminData?.storeConfig?.settings || {});
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);

  // Search/Filters in tables
  const [orderSearch, setOrderSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  if (loading || !adminData) {
    return (
      <div className="max-w-[1360px] mx-auto px-4 py-20 text-center">
        <p className="text-xs uppercase tracking-widest text-neutral-500 animate-pulse">
          Loading Admin Operations & Real Database Telemetry...
        </p>
      </div>
    );
  }

  const { analytics, products, orders, customers, returns } = adminData;

  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setProdName('');
    setProdSku(`CHX-${Date.now().toString().slice(-4)}`);
    setProdCat('men');
    setProdType('Shoes');
    setProdGender('Men');
    setProdPrice(2500);
    setProdComparePrice('');
    setProdDesc('');
    setProdMaterial('EVA Foam Sole');
    setProdImg('/src/assets/images/product_urban_sneaker_white_1790933004110.jpg');
    setProdVariants([
      { size: '40', color: 'Black', stock: 5 },
      { size: '41', color: 'Black', stock: 5 },
      { size: '42', color: 'Black', stock: 5 },
      { size: '43', color: 'Black', stock: 5 },
    ]);
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (p: CatalogProduct) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdSku(p.sku);
    setProdCat(p.categorySlug);
    setProdType(p.productType);
    setProdGender(p.gender);
    setProdPrice(p.price);
    setProdComparePrice(p.compareAtPrice || '');
    setProdDesc(p.shortDescription);
    setProdMaterial(p.material);
    setProdImg(p.primaryImage);
    setProdVariants(
      p.variants.map((v) => ({
        size: v.size,
        color: v.color,
        stock: v.stock,
      }))
    );
    setShowProductModal(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProd(true);
    try {
      await onSaveProduct({
        id: editingProduct?.id,
        name: prodName,
        sku: prodSku,
        categorySlug: prodCat,
        productType: prodType,
        gender: prodGender,
        price: Number(prodPrice),
        compareAtPrice: prodComparePrice ? Number(prodComparePrice) : null,
        shortDescription: prodDesc,
        fullDescription: prodDesc,
        material: prodMaterial,
        primaryImage: prodImg,
        variants: prodVariants,
        features: ['Ergonomic arch support', 'Anti-skid sole'],
        tagsList: [prodName.toLowerCase(), prodCat, prodType.toLowerCase()],
      });
      setShowProductModal(false);
      setProdError(null);
      onRefresh();
    } catch (err: any) {
      setProdError(err.message || 'Failed to save product.');
    } finally {
      setSavingProd(false);
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMsg(null);
    try {
      await onSaveSettings(settingsForm);
      setSettingsMsg('Store settings updated successfully.');
      onRefresh();
    } catch (err: any) {
      setSettingsMsg(err.message || 'Failed to update settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredOrders = (orders || []).filter((o: OrderRecord) => {
    if (!orderSearch) return true;
    const q = orderSearch.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.includes(q) ||
      o.orderStatus.toLowerCase().includes(q)
    );
  });

  const filteredProducts = (products || []).filter((p: CatalogProduct) => {
    if (!productSearch) return true;
    const q = productSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 block">
            CHHAYASWORI IMPEX MANAGEMENT
          </span>
          <h1 className="text-2xl font-display font-bold uppercase text-neutral-950">
            Store Operations Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateHome}
            className="px-4 py-2 border border-neutral-300 text-xs font-semibold uppercase tracking-wider text-neutral-800 hover:border-neutral-950"
          >
            Storefront
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="px-4 py-2 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-4 border-b border-neutral-200 text-xs font-semibold uppercase tracking-wider">
        {[
          { id: 'OVERVIEW', label: 'Overview Analytics', icon: LayoutDashboard },
          { id: 'PRODUCTS', label: `Products (${products.length})`, icon: Package },
          { id: 'INVENTORY', label: 'Inventory & Stocks', icon: Boxes },
          { id: 'ORDERS', label: `Orders (${orders.length})`, icon: ShoppingBag },
          { id: 'RETURNS', label: `Returns (${returns.length})`, icon: RotateCcw },
          { id: 'CUSTOMERS', label: `Customers (${customers.length})`, icon: Users },
          { id: 'SETTINGS', label: 'Store Settings', icon: Settings },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2.5 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === t.id
                  ? 'bg-neutral-950 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        {/* TAB 1: OVERVIEW ANALYTICS */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 border border-neutral-200 bg-white">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
                  Total Order Value
                </span>
                <span className="text-xl sm:text-2xl font-mono font-bold text-neutral-950 mt-1 block">
                  Rs. {analytics.totalRevenue.toLocaleString()}
                </span>
                <span className="text-[11px] text-neutral-400 mt-1 block font-mono">
                  Paid: Rs. {analytics.paidRevenue.toLocaleString()}
                </span>
              </div>

              <div className="p-5 border border-neutral-200 bg-white">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
                  Total Orders
                </span>
                <span className="text-xl sm:text-2xl font-mono font-bold text-neutral-950 mt-1 block">
                  {analytics.totalOrders}
                </span>
                <span className="text-[11px] text-amber-700 mt-1 block font-mono">
                  Pending: {analytics.pendingOrdersCount}
                </span>
              </div>

              <div className="p-5 border border-neutral-200 bg-white">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
                  Average Order Value
                </span>
                <span className="text-xl sm:text-2xl font-mono font-bold text-neutral-950 mt-1 block">
                  Rs. {analytics.averageOrderValue.toLocaleString()}
                </span>
                <span className="text-[11px] text-neutral-400 mt-1 block font-mono">
                  AOV (NPR)
                </span>
              </div>

              <div className="p-5 border border-neutral-200 bg-white">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
                  Low Stock Variants
                </span>
                <span className="text-xl sm:text-2xl font-mono font-bold text-red-600 mt-1 block">
                  {analytics.lowStockCount}
                </span>
                <span className="text-[11px] text-neutral-400 mt-1 block font-mono">
                  Threshold: 5 units
                </span>
              </div>
            </div>

            {/* Low stock table */}
            {analytics.lowStockVariants.length > 0 && (
              <div className="border border-neutral-200 bg-white p-6 space-y-4">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    Low Stock Attention Needed ({analytics.lowStockVariants.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F9F9F8] border-b border-neutral-200 text-neutral-500 font-semibold uppercase">
                      <tr>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Variant SKU</th>
                        <th className="p-3">Size</th>
                        <th className="p-3">Color</th>
                        <th className="p-3 font-mono">Remaining Stock</th>
                        <th className="p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {analytics.lowStockVariants.map((lv: any) => (
                        <tr key={lv.id}>
                          <td className="p-3 font-semibold text-neutral-950">{lv.productName}</td>
                          <td className="p-3 font-mono text-neutral-600">{lv.sku}</td>
                          <td className="p-3 font-mono">{lv.size}</td>
                          <td className="p-3">{lv.color}</td>
                          <td className="p-3 font-mono font-bold text-red-600">{lv.stock}</td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => {
                                const newStock = prompt(
                                  `Enter new stock quantity for ${lv.productName} (Size ${lv.size}):`,
                                  String(lv.stock + 10)
                                );
                                if (newStock !== null) {
                                  onAdjustInventory(lv.id, Number(newStock));
                                }
                              }}
                              className="px-2.5 py-1 bg-neutral-950 text-white font-semibold text-[10px] uppercase hover:bg-neutral-800"
                            >
                              Restock
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PRODUCTS */}
        {activeTab === 'PRODUCTS' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products or SKU..."
                  className="w-full pl-9 pr-4 py-2 border border-neutral-300 text-xs focus:border-neutral-950 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleOpenNewProduct}
                className="px-4 py-2 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 inline-flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" /> Add New Footwear
              </button>
            </div>

            <div className="border border-neutral-200 bg-white overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F9F9F8] border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 font-mono">Price</th>
                    <th className="p-3 font-mono">Total Stock</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredProducts.map((p: CatalogProduct) => (
                    <tr key={p.uuid} className="hover:bg-neutral-50">
                      <td className="p-3 flex items-center gap-3">
                        <img
                          src={p.primaryImage}
                          alt={p.name}
                          className="w-10 h-10 object-cover bg-neutral-100 border border-neutral-200 shrink-0"
                        />
                        <div>
                          <p className="font-semibold text-neutral-950 line-clamp-1">{p.name}</p>
                          <p className="text-neutral-400 text-[10px] font-mono">
                            Sizes {p.sizes.join(', ')}
                          </p>
                        </div>
                      </td>
                      <td className="p-3 font-mono">{p.sku}</td>
                      <td className="p-3 uppercase text-[11px]">{p.categorySlug}</td>
                      <td className="p-3">{p.productType}</td>
                      <td className="p-3 font-mono font-semibold">Rs. {p.price.toLocaleString()}</td>
                      <td className="p-3 font-mono">{p.totalStock}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            p.isArchived
                              ? 'bg-neutral-200 text-neutral-600'
                              : p.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {p.isArchived ? 'Archived' : p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditProduct(p)}
                          className="px-2 py-1 border border-neutral-300 text-neutral-800 hover:border-neutral-950 text-[11px]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onArchiveProduct(p.id, !p.isArchived)}
                          className="px-2 py-1 text-neutral-500 hover:text-red-700 text-[11px]"
                        >
                          {p.isArchived ? 'Restore' : 'Archive'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: INVENTORY */}
        {activeTab === 'INVENTORY' && (
          <div className="space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-950 pb-3 border-b border-neutral-100">
              Variant Inventory Management
            </h2>

            <div className="border border-neutral-200 bg-white overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F9F9F8] border-b border-neutral-200 text-neutral-500 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3">Variant SKU</th>
                    <th className="p-3">Size</th>
                    <th className="p-3">Color</th>
                    <th className="p-3 font-mono">Current Stock</th>
                    <th className="p-3">Quick Stock Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {products.flatMap((p: CatalogProduct) =>
                    p.variants.map((v) => (
                      <tr key={v.id} className="hover:bg-neutral-50">
                        <td className="p-3 font-semibold text-neutral-950">{p.name}</td>
                        <td className="p-3 font-mono text-neutral-600">{v.sku}</td>
                        <td className="p-3 font-mono">{v.size}</td>
                        <td className="p-3">{v.color}</td>
                        <td className="p-3 font-mono font-bold">{v.stock}</td>
                        <td className="p-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onAdjustInventory(v.id, Math.max(0, v.stock - 1))}
                            className="w-6 h-6 border border-neutral-300 hover:bg-neutral-100 text-xs font-mono"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => onAdjustInventory(v.id, v.stock + 1)}
                            className="w-6 h-6 border border-neutral-300 hover:bg-neutral-100 text-xs font-mono"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const s = prompt(`Enter new stock for ${p.name} (${v.color} / ${v.size}):`, String(v.stock));
                              if (s !== null) onAdjustInventory(v.id, Number(s));
                            }}
                            className="ml-2 text-neutral-600 underline text-[11px]"
                          >
                            Set Exact
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: ORDERS */}
        {activeTab === 'ORDERS' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search order #, customer, phone..."
                  className="w-full pl-9 pr-4 py-2 border border-neutral-300 text-xs focus:border-neutral-950 focus:outline-none"
                />
              </div>
            </div>

            <div className="border border-neutral-200 bg-white overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F9F9F8] border-b border-neutral-200 text-neutral-500 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Order #</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3 font-mono">Total</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredOrders.map((o: OrderRecord) => (
                    <tr key={o.id} className="hover:bg-neutral-50">
                      <td className="p-3 font-mono font-bold text-neutral-950">{o.orderNumber}</td>
                      <td className="p-3">{o.customerName}</td>
                      <td className="p-3 font-mono">{o.customerPhone}</td>
                      <td className="p-3 font-mono font-semibold">Rs. {o.grandTotal.toLocaleString()}</td>
                      <td className="p-3">
                        <span className="font-mono">{o.paymentMethod}</span> ({o.paymentStatus})
                      </td>
                      <td className="p-3">
                        <select
                          value={o.orderStatus}
                          onChange={(e) => onUpdateOrderStatus(o.id, { orderStatus: e.target.value })}
                          className="p-1 border border-neutral-300 bg-white text-xs font-semibold"
                        >
                          {[
                            'Pending',
                            'Payment Pending',
                            'Confirmed',
                            'Processing',
                            'Packed',
                            'Shipped',
                            'Out for Delivery',
                            'Delivered',
                            'Cancelled',
                          ].map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        {o.paymentStatus !== 'Paid' && (
                          <button
                            type="button"
                            onClick={() => onUpdateOrderStatus(o.id, { paymentStatus: 'Paid' })}
                            className="px-2 py-1 bg-emerald-800 text-white text-[10px] font-semibold uppercase"
                          >
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: RETURNS */}
        {activeTab === 'RETURNS' && (
          <div className="space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-950 pb-3 border-b border-neutral-100">
              Customer Return Requests ({returns.length})
            </h2>

            <div className="border border-neutral-200 bg-white overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F9F9F8] border-b border-neutral-200 text-neutral-500 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Return #</th>
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {returns.map((r: ReturnRecord) => (
                    <tr key={r.id} className="hover:bg-neutral-50">
                      <td className="p-3 font-mono font-bold text-neutral-950">#{r.returnNumber}</td>
                      <td className="p-3 font-mono">Order #{r.orderId}</td>
                      <td className="p-3">{r.reason}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-neutral-100 uppercase font-semibold text-[10px]">
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            const note = prompt('Enter admin note for approval:', 'Return approved for replacement.');
                            if (note !== null) onUpdateReturnStatus(r.id, 'Approved', note);
                          }}
                          className="px-2 py-1 bg-neutral-950 text-white text-[10px] uppercase font-semibold"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const note = prompt('Enter admin rejection reason:');
                            if (note !== null) onUpdateReturnStatus(r.id, 'Rejected', note);
                          }}
                          className="px-2 py-1 border border-neutral-300 text-neutral-700 text-[10px] uppercase"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: CUSTOMERS */}
        {activeTab === 'CUSTOMERS' && (
          <div className="space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-950 pb-3 border-b border-neutral-100">
              Customer Accounts ({customers.length})
            </h2>

            <div className="border border-neutral-200 bg-white overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F9F9F8] border-b border-neutral-200 text-neutral-500 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3 font-mono">Orders</th>
                    <th className="p-3 font-mono">Total Spent</th>
                    <th className="p-3">Role</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {customers.map((c: any) => (
                    <tr key={c.uid} className="hover:bg-neutral-50">
                      <td className="p-3 font-semibold text-neutral-950">{c.fullName || c.email}</td>
                      <td className="p-3 font-mono">{c.phone || 'Not set'}</td>
                      <td className="p-3 font-mono">{c.totalOrders}</td>
                      <td className="p-3 font-mono font-semibold">Rs. {c.totalSpent.toLocaleString()}</td>
                      <td className="p-3 uppercase font-mono text-[10px]">{c.role}</td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => onToggleCustomerRestriction(c.uid, !c.isRestricted)}
                          className={`px-2 py-1 text-[10px] uppercase font-semibold ${
                            c.isRestricted ? 'bg-red-700 text-white' : 'border border-neutral-300 text-neutral-700'
                          }`}
                        >
                          {c.isRestricted ? 'Restricted' : 'Active'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: SETTINGS */}
        {activeTab === 'SETTINGS' && (
          <form onSubmit={handleSettingsSubmit} className="space-y-6 max-w-2xl bg-white border border-neutral-200 p-6 sm:p-8 text-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-950 pb-3 border-b border-neutral-100">
              Store & Delivery Settings
            </h2>

            {settingsMsg && (
              <div className="p-3 bg-neutral-100 border border-neutral-300 text-neutral-900 font-medium">
                {settingsMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block uppercase tracking-wider font-semibold mb-1">Store Name</label>
                <input
                  type="text"
                  value={settingsForm.storeName || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                  className="w-full p-2 border border-neutral-300"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider font-semibold mb-1">Brand Tagline</label>
                <input
                  type="text"
                  value={settingsForm.tagline || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                  className="w-full p-2 border border-neutral-300"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider font-semibold mb-1">Kathmandu Delivery Fee (NPR)</label>
                <input
                  type="number"
                  value={settingsForm.deliveryFeeKathmandu ?? 120}
                  onChange={(e) => setSettingsForm({ ...settingsForm, deliveryFeeKathmandu: Number(e.target.value) })}
                  className="w-full p-2 border border-neutral-300 font-mono"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider font-semibold mb-1">Outside Valley Delivery (NPR)</label>
                <input
                  type="number"
                  value={settingsForm.deliveryFeeOutside ?? 220}
                  onChange={(e) => setSettingsForm({ ...settingsForm, deliveryFeeOutside: Number(e.target.value) })}
                  className="w-full p-2 border border-neutral-300 font-mono"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider font-semibold mb-1">Free Delivery Threshold (NPR)</label>
                <input
                  type="number"
                  value={settingsForm.freeDeliveryThreshold ?? 2500}
                  onChange={(e) => setSettingsForm({ ...settingsForm, freeDeliveryThreshold: Number(e.target.value) })}
                  className="w-full p-2 border border-neutral-300 font-mono"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider font-semibold mb-1">Return Window (Days)</label>
                <input
                  type="number"
                  value={settingsForm.returnPeriodDays ?? 7}
                  onChange={(e) => setSettingsForm({ ...settingsForm, returnPeriodDays: Number(e.target.value) })}
                  className="w-full p-2 border border-neutral-300 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block uppercase tracking-wider font-semibold mb-1">Top Announcement Bar Text</label>
                <input
                  type="text"
                  value={settingsForm.announcementText || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, announcementText: e.target.value })}
                  className="w-full p-2 border border-neutral-300"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block uppercase tracking-wider font-semibold mb-1">WhatsApp Support Number (Nepal)</label>
                <input
                  type="tel"
                  value={settingsForm.whatsappNumber || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                  placeholder="e.g. 9841000000"
                  className="w-full p-2 border border-neutral-300 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="px-6 py-3 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 disabled:opacity-50"
            >
              {savingSettings ? 'Saving Settings...' : 'Save Store Settings'}
            </button>
          </form>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white border border-neutral-200 p-6 sm:p-8 my-8">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-950">
                {editingProduct ? 'Edit Footwear Product' : 'Add New Footwear Product'}
              </h3>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="text-neutral-400 hover:text-neutral-950"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="mt-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase tracking-wider font-semibold mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="w-full p-2 border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block uppercase tracking-wider font-semibold mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    className="w-full p-2 border border-neutral-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider font-semibold mb-1">Category</label>
                  <select
                    value={prodCat}
                    onChange={(e) => setProdCat(e.target.value)}
                    className="w-full p-2 border border-neutral-300 bg-white"
                  >
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                    <option value="kids">Kids</option>
                    <option value="comfort">Comfort</option>
                    <option value="shoes">Shoes</option>
                    <option value="slippers">Slippers</option>
                    <option value="sandals">Sandals</option>
                  </select>
                </div>

                <div>
                  <label className="block uppercase tracking-wider font-semibold mb-1">Footwear Type</label>
                  <select
                    value={prodType}
                    onChange={(e) => setProdType(e.target.value)}
                    className="w-full p-2 border border-neutral-300 bg-white"
                  >
                    <option value="Shoes">Shoes</option>
                    <option value="Slippers">Slippers</option>
                    <option value="Sandals">Sandals</option>
                  </select>
                </div>

                <div>
                  <label className="block uppercase tracking-wider font-semibold mb-1">Price (NPR)</label>
                  <input
                    type="number"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(Number(e.target.value))}
                    className="w-full p-2 border border-neutral-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider font-semibold mb-1">Compare-At Price (Optional)</label>
                  <input
                    type="number"
                    value={prodComparePrice}
                    onChange={(e) => setProdComparePrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full p-2 border border-neutral-300 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block uppercase tracking-wider font-semibold mb-1">Product Description</label>
                  <textarea
                    rows={3}
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    className="w-full p-2 border border-neutral-300"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block uppercase tracking-wider font-semibold mb-1">Product Image URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={prodImg}
                      onChange={(e) => setProdImg(e.target.value)}
                      className="flex-1 p-2 border border-neutral-300 font-mono"
                    />
                    <label className="px-3 py-2 border border-neutral-300 bg-neutral-100 cursor-pointer text-xs font-semibold uppercase hover:bg-neutral-200">
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingImg(true);
                          try {
                            const url = await onUploadImage('product-images', file);
                            setProdImg(url);
                          } finally {
                            setUploadingImg(false);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Variants Setup */}
              <div className="pt-4 border-t border-neutral-200">
                <span className="block uppercase tracking-wider font-semibold text-neutral-950 mb-2">
                  Size & Stock Variants
                </span>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {prodVariants.map((v, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <input
                        type="text"
                        value={v.size}
                        placeholder="Size"
                        onChange={(e) => {
                          const updated = [...prodVariants];
                          updated[idx].size = e.target.value;
                          setProdVariants(updated);
                        }}
                        className="w-20 p-1.5 border border-neutral-300 font-mono"
                      />
                      <input
                        type="text"
                        value={v.color}
                        placeholder="Color"
                        onChange={(e) => {
                          const updated = [...prodVariants];
                          updated[idx].color = e.target.value;
                          setProdVariants(updated);
                        }}
                        className="w-28 p-1.5 border border-neutral-300"
                      />
                      <input
                        type="number"
                        value={v.stock}
                        placeholder="Stock"
                        onChange={(e) => {
                          const updated = [...prodVariants];
                          updated[idx].stock = Number(e.target.value);
                          setProdVariants(updated);
                        }}
                        className="w-24 p-1.5 border border-neutral-300 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setProdVariants(prodVariants.filter((_, i) => i !== idx))}
                        className="text-neutral-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setProdVariants([...prodVariants, { size: '42', color: 'Black', stock: 5 }])}
                    className="text-xs text-neutral-950 underline font-semibold"
                  >
                    + Add Size Variant
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 border border-neutral-300 text-xs font-semibold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProd}
                  className="px-6 py-2 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 disabled:opacity-50"
                >
                  {savingProd ? 'Saving...' : 'Save Footwear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
