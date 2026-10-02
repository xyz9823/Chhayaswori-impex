import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  doublePrecision,
  jsonb,
} from 'drizzle-orm/pg-core';

// 1. User Profiles & Roles
export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  fullName: text('full_name').notNull().default(''),
  phone: text('phone').notNull().default(''),
  phoneVerified: boolean('phone_verified').notNull().default(false),
  role: text('role').notNull().default('CUSTOMER'), // 'CUSTOMER' | 'STAFF' | 'SUPER_ADMIN'
  isRestricted: boolean('is_restricted').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(), // 'CUSTOMER' | 'STAFF' | 'SUPER_ADMIN'
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const staffPermissions = pgTable('staff_permissions', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid')
    .notNull()
    .unique()
    .references(() => profiles.uid),
  canManageProducts: boolean('can_manage_products').notNull().default(true),
  canManageInventory: boolean('can_manage_inventory').notNull().default(true),
  canManageOrders: boolean('can_manage_orders').notNull().default(true),
  canManageCustomers: boolean('can_manage_customers').notNull().default(true),
  canManageReturns: boolean('can_manage_returns').notNull().default(true),
  canManageCoupons: boolean('can_manage_coupons').notNull().default(false),
  canManageSettings: boolean('can_manage_settings').notNull().default(false),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Categories
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull().default(''),
  imageUrl: text('image_url').notNull().default(''),
  displayOrder: integer('display_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. Products
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  uuid: text('uuid').notNull().unique(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  sku: text('sku').notNull().unique(),
  shortDescription: text('short_description').notNull().default(''),
  fullDescription: text('full_description').notNull().default(''),
  categoryId: integer('category_id').references(() => categories.id),
  categorySlug: text('category_slug').notNull().default('men'),
  subcategory: text('subcategory').notNull().default('Everyday Comfort'),
  productType: text('product_type').notNull().default('Shoes'), // 'Shoes' | 'Slippers' | 'Sandals'
  gender: text('gender').notNull().default('Men'), // 'Men' | 'Women' | 'Kids' | 'Unisex'
  brand: text('brand').notNull().default('Chhayaswori Impex'),
  price: integer('price').notNull(), // in NPR (Rs.)
  compareAtPrice: integer('compare_at_price'), // Original price if discounted
  discountPercent: integer('discount_percent').notNull().default(0),
  primaryImage: text('primary_image').notNull(),
  material: text('material').notNull().default('EVA Cushioned Sole & Breathable Upper'),
  features: jsonb('features').$type<string[]>().notNull().default([]),
  tagsList: jsonb('tags_list').$type<string[]>().notNull().default([]),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(5),
  isFeatured: boolean('is_featured').notNull().default(false),
  isNewArrival: boolean('is_new_arrival').notNull().default(false),
  isBestSeller: boolean('is_best_seller').notNull().default(false),
  isComfortCollection: boolean('is_comfort_collection').notNull().default(false),
  isOnSale: boolean('is_on_sale').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  isArchived: boolean('is_archived').notNull().default(false),
  seoTitle: text('seo_title').notNull().default(''),
  seoDescription: text('seo_description').notNull().default(''),
  ratingAvg: doublePrecision('rating_avg').notNull().default(4.8),
  reviewCount: integer('review_count').notNull().default(0),
  viewsCount: integer('views_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 4. Product Variants (Size + Color with independent stock)
export const productVariants = pgTable('product_variants', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  sku: text('sku').notNull(),
  size: text('size').notNull(), // e.g., '40', '41', '37', '5'
  color: text('color').notNull(), // e.g., 'Black', 'Espresso Brown', 'Chalk White'
  colorHex: text('color_hex').notNull().default('#111111'),
  stock: integer('stock').notNull().default(0),
  priceOverride: integer('price_override'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 5. Product Images
export const productImages = pgTable('product_images', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  imageUrl: text('image_url').notNull(),
  altText: text('alt_text').notNull().default(''),
  color: text('color'),
  displayOrder: integer('display_order').notNull().default(0),
  isPrimary: boolean('is_primary').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. Tags & Product Tags
export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
});

export const productTags = pgTable('product_tags', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  tagId: integer('tag_id')
    .notNull()
    .references(() => tags.id),
});

// 7. Inventory Audit Logs
export const inventory = pgTable('inventory', {
  id: serial('id').primaryKey(),
  variantId: integer('variant_id')
    .notNull()
    .references(() => productVariants.id),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  changeAmount: integer('change_amount').notNull(),
  previousStock: integer('previous_stock').notNull(),
  newStock: integer('new_stock').notNull(),
  reason: text('reason').notNull(), // 'ORDER_PLACED' | 'ADMIN_ADJUSTMENT' | 'RETURN_RESTOCK' | 'ORDER_CANCELLED'
  referenceOrderId: integer('reference_order_id'),
  updatedByUid: text('updated_by_uid'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 8. Carts & Cart Items
export const carts = pgTable('carts', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid').notNull().unique(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const cartItems = pgTable('cart_items', {
  id: serial('id').primaryKey(),
  cartId: integer('cart_id')
    .notNull()
    .references(() => carts.id),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  variantId: integer('variant_id')
    .notNull()
    .references(() => productVariants.id),
  quantity: integer('quantity').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 9. Wishlists & Wishlist Items
export const wishlists = pgTable('wishlists', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const wishlistItems = pgTable('wishlist_items', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid').notNull(),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 10. Customer Addresses
export const addresses = pgTable('addresses', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid').notNull(),
  label: text('label').notNull().default('Home'),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  province: text('province').notNull().default('Bagmati Province'),
  district: text('district').notNull().default('Kathmandu'),
  municipality: text('municipality').notNull().default('Kageshwori Manohara'),
  area: text('area').notNull().default('Suncity'),
  streetAddress: text('street_address').notNull(),
  landmark: text('landmark').notNull().default(''),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 11. Phone OTP Verifications (Server-side only)
export const phoneOtpVerifications = pgTable('phone_otp_verifications', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid').notNull(),
  phone: text('phone').notNull(),
  otpHash: text('otp_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  verified: boolean('verified').notNull().default(false),
  attempts: integer('attempts').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 12. Orders & Order Items & Status History
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  userUid: text('user_uid').notNull(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  customerEmail: text('customer_email').notNull().default(''),
  phoneVerified: boolean('phone_verified').notNull().default(true),
  province: text('province').notNull(),
  district: text('district').notNull(),
  municipality: text('municipality').notNull(),
  area: text('area').notNull(),
  streetAddress: text('street_address').notNull(),
  landmark: text('landmark').notNull().default(''),
  deliveryNote: text('delivery_note').notNull().default(''),
  subtotal: integer('subtotal').notNull(),
  discountAmount: integer('discount_amount').notNull().default(0),
  couponCode: text('coupon_code'),
  deliveryFee: integer('delivery_fee').notNull(),
  grandTotal: integer('grand_total').notNull(),
  paymentMethod: text('payment_method').notNull(), // 'COD' | 'ESEWA' | 'FONEPAY' | 'BANK_TRANSFER'
  paymentStatus: text('payment_status').notNull().default('Pending'), // 'Pending' | 'Processing' | 'Paid' | 'Failed' | 'Cancelled' | 'Refunded'
  orderStatus: text('order_status').notNull().default('Pending'), // 'Pending' | 'Payment Pending' | 'Confirmed' | 'Processing' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Returned' | 'Refunded'
  internalNotes: text('internal_notes').notNull().default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  variantId: integer('variant_id')
    .notNull()
    .references(() => productVariants.id),
  productName: text('product_name').notNull(),
  productImage: text('product_image').notNull(),
  sku: text('sku').notNull(),
  size: text('size').notNull(),
  color: text('color').notNull(),
  unitPrice: integer('unit_price').notNull(),
  quantity: integer('quantity').notNull(),
  lineTotal: integer('line_total').notNull(),
});

export const orderStatusHistory = pgTable('order_status_history', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id),
  status: text('status').notNull(),
  note: text('note').notNull().default(''),
  changedByUid: text('changed_by_uid'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 13. Payments & Payment Transactions
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id),
  paymentMethod: text('payment_method').notNull(),
  amount: integer('amount').notNull(),
  status: text('status').notNull().default('Pending'),
  transactionReference: text('transaction_reference').notNull().default(''),
  proofImageUrl: text('proof_image_url').notNull().default(''),
  verifiedByUid: text('verified_by_uid'),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const paymentTransactions = pgTable('payment_transactions', {
  id: serial('id').primaryKey(),
  paymentId: integer('payment_id')
    .notNull()
    .references(() => payments.id),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id),
  gateway: text('gateway').notNull(),
  eventType: text('event_type').notNull(), // 'INITIATED' | 'PROOF_SUBMITTED' | 'ADMIN_VERIFIED' | 'GATEWAY_CALLBACK'
  referenceId: text('reference_id').notNull().default(''),
  rawPayload: text('raw_payload').notNull().default(''),
  status: text('status').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 14. Coupons & Coupon Usage
export const coupons = pgTable('coupons', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  description: text('description').notNull().default(''),
  discountType: text('discount_type').notNull().default('PERCENTAGE'), // 'PERCENTAGE' | 'FIXED'
  discountValue: integer('discount_value').notNull(),
  minOrderAmount: integer('min_order_amount').notNull().default(0),
  maxDiscountAmount: integer('max_discount_amount'),
  startsAt: timestamp('starts_at'),
  expiresAt: timestamp('expires_at'),
  usageLimit: integer('usage_limit'),
  usedCount: integer('used_count').notNull().default(0),
  perUserLimit: integer('per_user_limit').notNull().default(1),
  categoryRestriction: text('category_restriction'),
  productRestrictionId: integer('product_restriction_id'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const couponUsage = pgTable('coupon_usage', {
  id: serial('id').primaryKey(),
  couponId: integer('coupon_id')
    .notNull()
    .references(() => coupons.id),
  userUid: text('user_uid').notNull(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id),
  discountApplied: integer('discount_applied').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 15. Product Reviews
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  userUid: text('user_uid').notNull(),
  orderId: integer('order_id'),
  customerName: text('customer_name').notNull(),
  rating: integer('rating').notNull(), // 1 to 5
  comment: text('comment').notNull(),
  imageUrl: text('image_url').notNull().default(''),
  isVerifiedPurchase: boolean('is_verified_purchase').notNull().default(false),
  status: text('status').notNull().default('APPROVED'), // 'APPROVED' | 'PENDING' | 'HIDDEN'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 16. Returns & Return Items
export const returns = pgTable('returns', {
  id: serial('id').primaryKey(),
  returnNumber: text('return_number').notNull().unique(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id),
  userUid: text('user_uid').notNull(),
  reason: text('reason').notNull(),
  details: text('details').notNull().default(''),
  conditionConfirmed: boolean('condition_confirmed').notNull().default(true),
  status: text('status').notNull().default('Requested'), // 'Requested' | 'Under Review' | 'Approved' | 'Rejected' | 'Return Pending' | 'Received' | 'Refunded' | 'Closed'
  adminNote: text('admin_note').notNull().default(''),
  refundAmount: integer('refund_amount').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const returnItems = pgTable('return_items', {
  id: serial('id').primaryKey(),
  returnId: integer('return_id')
    .notNull()
    .references(() => returns.id),
  orderItemId: integer('order_item_id')
    .notNull()
    .references(() => orderItems.id),
  quantity: integer('quantity').notNull().default(1),
  reason: text('reason').notNull().default(''),
});

// 17. Contact Messages
export const contactMessages = pgTable('contact_messages', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull().default(''),
  message: text('message').notNull(),
  status: text('status').notNull().default('UNREAD'), // 'UNREAD' | 'READ' | 'RESOLVED'
  adminNote: text('admin_note').notNull().default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 18. Notifications
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  recipientUid: text('recipient_uid'), // null or specific userUid
  recipientRole: text('recipient_role').notNull().default('CUSTOMER'), // 'CUSTOMER' | 'ADMIN'
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  referenceId: text('reference_id').notNull().default(''),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 19. Store Locations
export const storeLocations = pgTable('store_locations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  municipality: text('municipality').notNull().default('Kageshwori Manohara'),
  area: text('area').notNull().default('Suncity, Kathmandu'),
  landmark: text('landmark').notNull().default('Nearby Big Mart'),
  fullAddress: text('full_address').notNull().default('Suncity, Kageshwori Manohara, Kathmandu, Nepal (Nearby Big Mart)'),
  phone: text('phone').notNull().default(''),
  openingHours: text('opening_hours').notNull().default('Sun - Fri: 10:00 AM - 7:30 PM | Sat: 11:00 AM - 6:00 PM'),
  mapCoordinates: text('map_coordinates').notNull().default(''),
  isPrimary: boolean('is_primary').notNull().default(true),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 20. Site Settings
export const siteSettings = pgTable('site_settings', {
  id: serial('id').primaryKey(),
  storeName: text('store_name').notNull().default('CHHAYASWORI IMPEX'),
  tagline: text('tagline').notNull().default('Comfort for Every Step'),
  logoUrl: text('logo_url').notNull().default(''),
  phone: text('phone').notNull().default(''),
  email: text('email').notNull().default(''),
  whatsappNumber: text('whatsapp_number').notNull().default(''),
  deliveryFeeKathmandu: integer('delivery_fee_kathmandu').notNull().default(120),
  deliveryFeeOutside: integer('delivery_fee_outside').notNull().default(220),
  freeDeliveryThreshold: integer('free_delivery_threshold').notNull().default(2500),
  returnPeriodDays: integer('return_period_days').notNull().default(7),
  returnPolicyText: text('return_policy_text')
    .notNull()
    .default('Return requests are accepted within 7 days of delivery. Footwear must be unworn, in original resalable condition, and include original packaging and tags.'),
  businessHours: text('business_hours').notNull().default('Sun – Fri: 10:00 AM – 7:30 PM'),
  instagramUrl: text('instagram_url').notNull().default(''),
  facebookUrl: text('facebook_url').notNull().default(''),
  tiktokUrl: text('tiktok_url').notNull().default(''),
  announcementText: text('announcement_text').notNull().default('FREE DELIVERY ON ORDERS ABOVE RS. 2,500 · KAGESHWORI MANOHARA, SUNCITY, KATHMANDU'),
  announcementActive: boolean('announcement_active').notNull().default(true),
  seoDefaultTitle: text('seo_default_title').notNull().default('CHHAYASWORI IMPEX — Comfort for Every Step | Footwear in Nepal'),
  seoDefaultDescription: text('seo_default_description')
    .notNull()
    .default('Shop premium shoes, ergonomic slippers, sandals, and comfort footwear from Chhayaswori Impex in Suncity, Kageshwori Manohara, Kathmandu, Nepal.'),
  esewaConfigured: boolean('esewa_configured').notNull().default(false),
  esewaMerchantCode: text('esewa_merchant_code').notNull().default(''),
  fonepayConfigured: boolean('fonepay_configured').notNull().default(false),
  fonepayMerchantCode: text('fonepay_merchant_code').notNull().default(''),
  bankName: text('bank_name').notNull().default(''),
  bankAccountName: text('bank_account_name').notNull().default('CHHAYASWORI IMPEX'),
  bankAccountNumber: text('bank_account_number').notNull().default(''),
  bankBranch: text('bank_branch').notNull().default('Kathmandu'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 21. Homepage Sections & Promotional Banners
export const homepageSections = pgTable('homepage_sections', {
  id: serial('id').primaryKey(),
  sectionKey: text('section_key').notNull().unique(),
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull().default(''),
  isActive: boolean('is_active').notNull().default(true),
  displayOrder: integer('display_order').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const banners = pgTable('banners', {
  id: serial('id').primaryKey(),
  placement: text('placement').notNull().default('HERO'), // 'HERO' | 'PROMO_1' | 'PROMO_2'
  subtitle: text('subtitle').notNull().default('NEW SEASON'),
  heading: text('heading').notNull(),
  description: text('description').notNull().default(''),
  ctaText: text('cta_text').notNull().default('SHOP NOW'),
  ctaLink: text('cta_link').notNull().default('/shop'),
  desktopImageUrl: text('desktop_image_url').notNull(),
  mobileImageUrl: text('mobile_image_url').notNull().default(''),
  contentPosition: text('content_position').notNull().default('RIGHT'), // 'LEFT' | 'RIGHT'
  displayOrder: integer('display_order').notNull().default(0),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 22. Storage Files (Buckets: product-images, review-images, payment-proofs, brand-assets)
export const storageFiles = pgTable('storage_files', {
  id: serial('id').primaryKey(),
  bucket: text('bucket').notNull(),
  filename: text('filename').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  dataUrl: text('data_url').notNull(),
  uploadedByUid: text('uploaded_by_uid'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
