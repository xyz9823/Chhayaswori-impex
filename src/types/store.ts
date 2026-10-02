export interface ProductVariant {
  id: number;
  productId: number;
  sku: string;
  size: string;
  color: string;
  colorHex: string;
  stock: number;
  priceOverride?: number | null;
  isActive: boolean;
}

export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  altText: string;
  color?: string | null;
  displayOrder: number;
  isPrimary: boolean;
}

export interface ProductReview {
  id: number;
  productId: number;
  userUid: string;
  orderId?: number | null;
  customerName: string;
  rating: number;
  comment: string;
  imageUrl: string;
  isVerifiedPurchase: boolean;
  status: string;
  createdAt: string;
}

export interface CatalogProduct {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  fullDescription: string;
  categoryId?: number | null;
  categorySlug: string;
  subcategory: string;
  productType: 'Shoes' | 'Slippers' | 'Sandals' | string;
  gender: 'Men' | 'Women' | 'Kids' | 'Unisex' | string;
  brand: string;
  price: number;
  compareAtPrice?: number | null;
  discountPercent: number;
  primaryImage: string;
  material: string;
  features: string[];
  tagsList: string[];
  lowStockThreshold: number;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isComfortCollection: boolean;
  isOnSale: boolean;
  isActive: boolean;
  isArchived: boolean;
  seoTitle: string;
  seoDescription: string;
  ratingAvg: number;
  reviewCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
  variants: ProductVariant[];
  images: ProductImage[];
  reviews: ProductReview[];
  totalStock: number;
  sizes: string[];
  colors: string[];
}

export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
}

export interface BannerItem {
  id: number;
  placement: 'HERO' | 'PROMO_1' | 'PROMO_2' | string;
  subtitle: string;
  heading: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  desktopImageUrl: string;
  mobileImageUrl: string;
  contentPosition: 'LEFT' | 'RIGHT' | string;
  displayOrder: number;
  isActive: boolean;
}

export interface StoreLocationItem {
  id: number;
  name: string;
  municipality: string;
  area: string;
  landmark: string;
  fullAddress: string;
  phone: string;
  openingHours: string;
  mapCoordinates: string;
  isPrimary: boolean;
  isActive: boolean;
}

export interface SiteSettingsData {
  id: number;
  storeName: string;
  tagline: string;
  logoUrl: string;
  phone: string;
  email: string;
  whatsappNumber: string;
  deliveryFeeKathmandu: number;
  deliveryFeeOutside: number;
  freeDeliveryThreshold: number;
  returnPeriodDays: number;
  returnPolicyText: string;
  businessHours: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  announcementText: string;
  announcementActive: boolean;
  seoDefaultTitle: string;
  seoDefaultDescription: string;
  esewaConfigured: boolean;
  esewaMerchantCode: string;
  fonepayConfigured: boolean;
  fonepayMerchantCode: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankBranch: string;
}

export interface CartItemData {
  id?: number;
  productId: number;
  variantId: number;
  productName: string;
  productSlug: string;
  productImage: string;
  sku: string;
  size: string;
  color: string;
  colorHex: string;
  unitPrice: number;
  compareAtPrice?: number | null;
  availableStock: number;
  quantity: number;
}

export interface UserProfile {
  id: number;
  uid: string;
  email: string;
  fullName: string;
  phone: string;
  phoneVerified: boolean;
  role: 'CUSTOMER' | 'STAFF' | 'SUPER_ADMIN' | string;
  isRestricted: boolean;
}

export interface StaffPermissionsData {
  canManageProducts: boolean;
  canManageInventory: boolean;
  canManageOrders: boolean;
  canManageCustomers: boolean;
  canManageReturns: boolean;
  canManageCoupons: boolean;
  canManageSettings: boolean;
}

export interface UserAddress {
  id: number;
  userUid: string;
  label: string;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  municipality: string;
  area: string;
  streetAddress: string;
  landmark: string;
  isDefault: boolean;
}

export interface OrderItemRecord {
  id: number;
  orderId: number;
  productId: number;
  variantId: number;
  productName: string;
  productImage: string;
  sku: string;
  size: string;
  color: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderRecord {
  id: number;
  orderNumber: string;
  userUid: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  phoneVerified: boolean;
  province: string;
  district: string;
  municipality: string;
  area: string;
  streetAddress: string;
  landmark: string;
  deliveryNote: string;
  subtotal: number;
  discountAmount: number;
  couponCode?: string | null;
  deliveryFee: number;
  grandTotal: number;
  paymentMethod: 'COD' | 'ESEWA' | 'FONEPAY' | 'BANK_TRANSFER' | string;
  paymentStatus: string;
  orderStatus: string;
  internalNotes: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItemRecord[];
  statusHistory: Array<{
    id: number;
    status: string;
    note: string;
    createdAt: string;
  }>;
  payment?: {
    id: number;
    paymentMethod: string;
    amount: number;
    status: string;
    transactionReference: string;
    proofImageUrl: string;
    verifiedAt?: string | null;
  } | null;
}

export interface ReturnRecord {
  id: number;
  returnNumber: string;
  orderId: number;
  userUid: string;
  reason: string;
  details: string;
  conditionConfirmed: boolean;
  status: string;
  adminNote: string;
  refundAmount: number;
  createdAt: string;
}

export interface NotificationRecord {
  id: number;
  recipientUid?: string | null;
  recipientRole: string;
  type: string;
  title: string;
  message: string;
  referenceId: string;
  isRead: boolean;
  createdAt: string;
}
