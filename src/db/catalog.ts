import { db } from './index.ts';
import {
  products,
  productVariants,
  productImages,
  categories,
  banners,
  siteSettings,
  storeLocations,
  reviews,
  coupons,
  contactMessages,
  notifications,
  storageFiles,
  inventory,
  orders,
  orderItems,
} from './schema.ts';
import { eq, desc, asc, and, or } from 'drizzle-orm';
import crypto from 'crypto';

export async function getStoreConfig() {
  try {
    const [settingsList, cats, bannerList, locations] = await Promise.all([
      db.select().from(siteSettings),
      db.select().from(categories).orderBy(asc(categories.displayOrder)),
      db.select().from(banners).orderBy(asc(banners.displayOrder)),
      db.select().from(storeLocations).orderBy(desc(storeLocations.isPrimary)),
    ]);

    return {
      settings: settingsList[0] || null,
      categories: cats,
      banners: bannerList,
      locations,
    };
  } catch (error) {
    console.error('Database query failed in getStoreConfig:', error);
    throw new Error('Failed to load store configuration.', { cause: error });
  }
}

export async function getAllCatalogProducts(includeArchived = false) {
  try {
    const allProds = includeArchived
      ? await db.select().from(products).orderBy(desc(products.createdAt))
      : await db
          .select()
          .from(products)
          .where(and(eq(products.isArchived, false), eq(products.isActive, true)))
          .orderBy(desc(products.createdAt));

    const allVariants = await db
      .select()
      .from(productVariants)
      .orderBy(asc(productVariants.id));
    const allImages = await db
      .select()
      .from(productImages)
      .orderBy(asc(productImages.displayOrder));
    const allReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.status, 'APPROVED'))
      .orderBy(desc(reviews.createdAt));

    return allProds.map((p) => {
      const variants = allVariants.filter((v) => v.productId === p.id);
      const images = allImages.filter((img) => img.productId === p.id);
      const prodReviews = allReviews.filter((r) => r.productId === p.id);
      const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
      const sizes = Array.from(new Set(variants.map((v) => v.size)));
      const colors = Array.from(new Set(variants.map((v) => v.color)));

      return {
        ...p,
        variants,
        images:
          images.length > 0
            ? images
            : [
                {
                  id: 0,
                  productId: p.id,
                  imageUrl: p.primaryImage,
                  altText: p.name,
                  color: colors[0] || 'Default',
                  displayOrder: 0,
                  isPrimary: true,
                  createdAt: p.createdAt,
                },
              ],
        reviews: prodReviews,
        totalStock,
        sizes,
        colors,
      };
    });
  } catch (error) {
    console.error('Database query failed in getAllCatalogProducts:', error);
    throw new Error('Unable to load products. Please try again.', { cause: error });
  }
}

export async function incrementProductView(slug: string) {
  try {
    const existing = await db.select().from(products).where(eq(products.slug, slug));
    if (existing.length > 0) {
      await db
        .update(products)
        .set({ viewsCount: existing[0].viewsCount + 1 })
        .where(eq(products.id, existing[0].id));
    }
  } catch (error) {
    console.error('Database query failed in incrementProductView:', error);
  }
}

export async function createOrUpdateProduct(
  adminUid: string,
  payload: {
    id?: number;
    name: string;
    slug?: string;
    sku: string;
    shortDescription: string;
    fullDescription: string;
    categorySlug: string;
    subcategory?: string;
    productType: string;
    gender: string;
    price: number;
    compareAtPrice?: number | null;
    primaryImage: string;
    material: string;
    features: string[];
    tagsList: string[];
    lowStockThreshold?: number;
    isFeatured?: boolean;
    isNewArrival?: boolean;
    isBestSeller?: boolean;
    isComfortCollection?: boolean;
    isOnSale?: boolean;
    isActive?: boolean;
    isArchived?: boolean;
    seoTitle?: string;
    seoDescription?: string;
    variants: Array<{
      id?: number;
      sku?: string;
      size: string;
      color: string;
      colorHex?: string;
      stock: number;
      priceOverride?: number | null;
    }>;
    images?: Array<{
      imageUrl: string;
      altText?: string;
      color?: string;
      isPrimary?: boolean;
    }>;
  }
) {
  try {
    const cleanSlug =
      (payload.slug || payload.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || `product-${Date.now()}`;

    const price = Math.max(1, Number(payload.price) || 0);
    const compareAtPrice =
      payload.compareAtPrice && Number(payload.compareAtPrice) > price
        ? Number(payload.compareAtPrice)
        : null;
    const discountPercent = compareAtPrice
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : 0;

    const catRows = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, payload.categorySlug));
    const categoryId = catRows[0]?.id || null;

    let savedProduct;
    if (payload.id) {
      const updated = await db
        .update(products)
        .set({
          name: payload.name,
          slug: cleanSlug,
          sku: payload.sku,
          shortDescription: payload.shortDescription || '',
          fullDescription: payload.fullDescription || '',
          categoryId,
          categorySlug: payload.categorySlug,
          subcategory: payload.subcategory || 'Everyday Comfort',
          productType: payload.productType,
          gender: payload.gender,
          price,
          compareAtPrice,
          discountPercent,
          primaryImage: payload.primaryImage,
          material: payload.material || 'EVA Cushioned Sole & Breathable Upper',
          features: Array.isArray(payload.features) ? payload.features : [],
          tagsList: Array.isArray(payload.tagsList) ? payload.tagsList : [],
          lowStockThreshold: Number(payload.lowStockThreshold ?? 5),
          isFeatured: Boolean(payload.isFeatured),
          isNewArrival: Boolean(payload.isNewArrival),
          isBestSeller: Boolean(payload.isBestSeller),
          isComfortCollection: Boolean(payload.isComfortCollection),
          isOnSale: Boolean(payload.isOnSale || discountPercent > 0),
          isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
          isArchived: Boolean(payload.isArchived),
          seoTitle: payload.seoTitle || `${payload.name} | CHHAYASWORI IMPEX`,
          seoDescription:
            payload.seoDescription || payload.shortDescription || payload.name,
          updatedAt: new Date(),
        })
        .where(eq(products.id, payload.id))
        .returning();
      savedProduct = updated[0];
    } else {
      const inserted = await db
        .insert(products)
        .values({
          uuid: crypto.randomUUID(),
          name: payload.name,
          slug: cleanSlug,
          sku: payload.sku,
          shortDescription: payload.shortDescription || '',
          fullDescription: payload.fullDescription || '',
          categoryId,
          categorySlug: payload.categorySlug,
          subcategory: payload.subcategory || 'Everyday Comfort',
          productType: payload.productType,
          gender: payload.gender,
          price,
          compareAtPrice,
          discountPercent,
          primaryImage: payload.primaryImage,
          material: payload.material || 'EVA Cushioned Sole & Breathable Upper',
          features: Array.isArray(payload.features) ? payload.features : [],
          tagsList: Array.isArray(payload.tagsList) ? payload.tagsList : [],
          lowStockThreshold: Number(payload.lowStockThreshold ?? 5),
          isFeatured: Boolean(payload.isFeatured),
          isNewArrival: Boolean(payload.isNewArrival ?? true),
          isBestSeller: Boolean(payload.isBestSeller),
          isComfortCollection: Boolean(payload.isComfortCollection),
          isOnSale: Boolean(payload.isOnSale || discountPercent > 0),
          isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
          isArchived: false,
          seoTitle: payload.seoTitle || `${payload.name} | CHHAYASWORI IMPEX`,
          seoDescription:
            payload.seoDescription || payload.shortDescription || payload.name,
        })
        .returning();
      savedProduct = inserted[0];
    }

    // Handle variants safely without deleting existing order references
    if (Array.isArray(payload.variants) && payload.variants.length > 0) {
      const existingVariants = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.productId, savedProduct.id));

      for (const v of payload.variants) {
        const match = existingVariants.find(
          (ev) =>
            (v.id && ev.id === v.id) ||
            (ev.size.toLowerCase() === v.size.toLowerCase() &&
              ev.color.toLowerCase() === v.color.toLowerCase())
        );

        const variantSku =
          v.sku ||
          `${savedProduct.sku}-${v.color.substring(0, 3).toUpperCase()}-${v.size}`;

        if (match) {
          const prevStock = match.stock;
          const nextStock = Math.max(0, Number(v.stock) || 0);
          await db
            .update(productVariants)
            .set({
              sku: variantSku,
              size: v.size,
              color: v.color,
              colorHex: v.colorHex || '#111111',
              stock: nextStock,
              priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
              isActive: true,
              updatedAt: new Date(),
            })
            .where(eq(productVariants.id, match.id));

          if (prevStock !== nextStock) {
            await db.insert(inventory).values({
              variantId: match.id,
              productId: savedProduct.id,
              changeAmount: nextStock - prevStock,
              previousStock: prevStock,
              newStock: nextStock,
              reason: 'ADMIN_ADJUSTMENT',
              updatedByUid: adminUid,
            });
          }
        } else {
          const nextStock = Math.max(0, Number(v.stock) || 0);
          const createdVar = await db
            .insert(productVariants)
            .values({
              productId: savedProduct.id,
              sku: variantSku,
              size: v.size,
              color: v.color,
              colorHex: v.colorHex || '#111111',
              stock: nextStock,
              priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
              isActive: true,
            })
            .returning();

          await db.insert(inventory).values({
            variantId: createdVar[0].id,
            productId: savedProduct.id,
            changeAmount: nextStock,
            previousStock: 0,
            newStock: nextStock,
            reason: 'INITIAL_STOCK',
            updatedByUid: adminUid,
          });
        }
      }
    }

    // Handle images
    if (Array.isArray(payload.images) && payload.images.length > 0) {
      await db.delete(productImages).where(eq(productImages.productId, savedProduct.id));
      for (let i = 0; i < payload.images.length; i++) {
        const img = payload.images[i];
        await db.insert(productImages).values({
          productId: savedProduct.id,
          imageUrl: img.imageUrl,
          altText: img.altText || savedProduct.name,
          color: img.color || null,
          displayOrder: i,
          isPrimary: i === 0 || Boolean(img.isPrimary),
        });
      }
    }

    return savedProduct;
  } catch (error: any) {
    console.error('Database query failed in createOrUpdateProduct:', error);
    throw new Error(error.message || 'Failed to save product.', { cause: error });
  }
}

export async function adjustVariantInventory(
  adminUid: string,
  variantId: number,
  newStockValue: number,
  reason = 'ADMIN_ADJUSTMENT'
) {
  try {
    const existing = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, variantId));
    if (existing.length === 0) {
      throw new Error('Product variant not found.');
    }
    const v = existing[0];
    const cleanStock = Math.max(0, Number(newStockValue) || 0);

    const updated = await db
      .update(productVariants)
      .set({ stock: cleanStock, updatedAt: new Date() })
      .where(eq(productVariants.id, variantId))
      .returning();

    await db.insert(inventory).values({
      variantId: v.id,
      productId: v.productId,
      changeAmount: cleanStock - v.stock,
      previousStock: v.stock,
      newStock: cleanStock,
      reason,
      updatedByUid: adminUid,
    });

    return updated[0];
  } catch (error) {
    console.error('Database query failed in adjustVariantInventory:', error);
    throw new Error('Failed to update variant inventory.', { cause: error });
  }
}

export async function archiveOrRestoreProduct(productId: number, isArchived: boolean) {
  try {
    const updated = await db
      .update(products)
      .set({ isArchived, isActive: !isArchived, updatedAt: new Date() })
      .where(eq(products.id, productId))
      .returning();
    return updated[0];
  } catch (error) {
    console.error('Database query failed in archiveOrRestoreProduct:', error);
    throw new Error('Failed to update product archive state.', { cause: error });
  }
}

export async function updateSiteSettingsData(payload: Record<string, any>) {
  try {
    const existing = await db.select().from(siteSettings);
    if (existing.length === 0) {
      const created = await db.insert(siteSettings).values(payload).returning();
      return created[0];
    }
    const updated = await db
      .update(siteSettings)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(eq(siteSettings.id, existing[0].id))
      .returning();
    return updated[0];
  } catch (error) {
    console.error('Database query failed in updateSiteSettingsData:', error);
    throw new Error('Failed to update site settings.', { cause: error });
  }
}

export async function updateCategoryImageOrDetails(
  categoryId: number,
  data: { name?: string; description?: string; imageUrl?: string; isActive?: boolean }
) {
  try {
    const updated = await db
      .update(categories)
      .set(data)
      .where(eq(categories.id, categoryId))
      .returning();
    return updated[0];
  } catch (error) {
    console.error('Database query failed in updateCategoryImageOrDetails:', error);
    throw new Error('Failed to update category.', { cause: error });
  }
}

export async function saveBannerData(payload: {
  id?: number;
  placement: string;
  subtitle: string;
  heading: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  desktopImageUrl: string;
  mobileImageUrl?: string;
  contentPosition?: string;
  displayOrder?: number;
  isActive?: boolean;
}) {
  try {
    if (payload.id) {
      const updated = await db
        .update(banners)
        .set({
          placement: payload.placement,
          subtitle: payload.subtitle,
          heading: payload.heading,
          description: payload.description,
          ctaText: payload.ctaText,
          ctaLink: payload.ctaLink,
          desktopImageUrl: payload.desktopImageUrl,
          mobileImageUrl: payload.mobileImageUrl || payload.desktopImageUrl,
          contentPosition: payload.contentPosition || 'RIGHT',
          displayOrder: payload.displayOrder ?? 0,
          isActive: payload.isActive !== undefined ? payload.isActive : true,
        })
        .where(eq(banners.id, payload.id))
        .returning();
      return updated[0];
    }
    const created = await db
      .insert(banners)
      .values({
        placement: payload.placement,
        subtitle: payload.subtitle,
        heading: payload.heading,
        description: payload.description,
        ctaText: payload.ctaText,
        ctaLink: payload.ctaLink,
        desktopImageUrl: payload.desktopImageUrl,
        mobileImageUrl: payload.mobileImageUrl || payload.desktopImageUrl,
        contentPosition: payload.contentPosition || 'RIGHT',
        displayOrder: payload.displayOrder ?? 0,
        isActive: payload.isActive !== undefined ? payload.isActive : true,
      })
      .returning();
    return created[0];
  } catch (error) {
    console.error('Database query failed in saveBannerData:', error);
    throw new Error('Failed to save banner.', { cause: error });
  }
}

export async function updateStoreLocationData(
  locationId: number,
  data: {
    name?: string;
    municipality?: string;
    area?: string;
    landmark?: string;
    fullAddress?: string;
    phone?: string;
    openingHours?: string;
    mapCoordinates?: string;
  }
) {
  try {
    const updated = await db
      .update(storeLocations)
      .set(data)
      .where(eq(storeLocations.id, locationId))
      .returning();
    return updated[0];
  } catch (error) {
    console.error('Database query failed in updateStoreLocationData:', error);
    throw new Error('Failed to update store location.', { cause: error });
  }
}

// Reviews (Verified Purchase checks)
export async function submitProductReview(
  uid: string,
  customerName: string,
  payload: {
    productId: number;
    rating: number;
    comment: string;
    imageUrl?: string;
  }
) {
  try {
    const rating = Math.min(5, Math.max(1, Number(payload.rating) || 5));
    // Check if user has purchased this product
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userUid, uid));
    const orderIds = userOrders.map((o) => o.id);
    const allOrderItems = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.productId, payload.productId));

    const matchingOrderItem = allOrderItems.find((oi) => orderIds.includes(oi.orderId));
    const isVerifiedPurchase = Boolean(matchingOrderItem);

    const created = await db
      .insert(reviews)
      .values({
        productId: payload.productId,
        userUid: uid,
        orderId: matchingOrderItem?.orderId || null,
        customerName: customerName || 'Verified Customer',
        rating,
        comment: payload.comment.trim(),
        imageUrl: payload.imageUrl || '',
        isVerifiedPurchase,
        status: 'APPROVED',
      })
      .returning();

    // Recompute product rating
    const approvedReviews = await db
      .select()
      .from(reviews)
      .where(
        and(eq(reviews.productId, payload.productId), eq(reviews.status, 'APPROVED'))
      );

    if (approvedReviews.length > 0) {
      const avg =
        approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length;
      await db
        .update(products)
        .set({
          ratingAvg: Number(avg.toFixed(1)),
          reviewCount: approvedReviews.length,
        })
        .where(eq(products.id, payload.productId));
    }

    return created[0];
  } catch (error) {
    console.error('Database query failed in submitProductReview:', error);
    throw new Error('Failed to submit product review.', { cause: error });
  }
}

export async function getAllReviewsForAdmin() {
  try {
    return await db.select().from(reviews).orderBy(desc(reviews.createdAt));
  } catch (error) {
    console.error('Database query failed in getAllReviewsForAdmin:', error);
    throw new Error('Failed to load reviews.', { cause: error });
  }
}

export async function moderateReviewStatus(reviewId: number, status: string) {
  try {
    const updated = await db
      .update(reviews)
      .set({ status })
      .where(eq(reviews.id, reviewId))
      .returning();
    return updated[0];
  } catch (error) {
    console.error('Database query failed in moderateReviewStatus:', error);
    throw new Error('Failed to moderate review.', { cause: error });
  }
}

// Coupons
export async function getAllCoupons() {
  try {
    return await db.select().from(coupons).orderBy(desc(coupons.createdAt));
  } catch (error) {
    console.error('Database query failed in getAllCoupons:', error);
    throw new Error('Failed to fetch coupons.', { cause: error });
  }
}

export async function createOrUpdateCoupon(payload: {
  id?: number;
  code: string;
  description: string;
  discountType: string;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number | null;
  usageLimit?: number | null;
  perUserLimit?: number;
  categoryRestriction?: string | null;
  isActive?: boolean;
}) {
  try {
    const cleanCode = payload.code.toUpperCase().trim();
    if (payload.id) {
      const updated = await db
        .update(coupons)
        .set({
          code: cleanCode,
          description: payload.description,
          discountType: payload.discountType,
          discountValue: Number(payload.discountValue),
          minOrderAmount: Number(payload.minOrderAmount || 0),
          maxDiscountAmount: payload.maxDiscountAmount
            ? Number(payload.maxDiscountAmount)
            : null,
          usageLimit: payload.usageLimit ? Number(payload.usageLimit) : null,
          perUserLimit: Number(payload.perUserLimit || 1),
          categoryRestriction: payload.categoryRestriction || null,
          isActive: payload.isActive !== undefined ? payload.isActive : true,
        })
        .where(eq(coupons.id, payload.id))
        .returning();
      return updated[0];
    }
    const created = await db
      .insert(coupons)
      .values({
        code: cleanCode,
        description: payload.description,
        discountType: payload.discountType,
        discountValue: Number(payload.discountValue),
        minOrderAmount: Number(payload.minOrderAmount || 0),
        maxDiscountAmount: payload.maxDiscountAmount
          ? Number(payload.maxDiscountAmount)
          : null,
        usageLimit: payload.usageLimit ? Number(payload.usageLimit) : null,
        perUserLimit: Number(payload.perUserLimit || 1),
        categoryRestriction: payload.categoryRestriction || null,
        isActive: payload.isActive !== undefined ? payload.isActive : true,
      })
      .returning();
    return created[0];
  } catch (error) {
    console.error('Database query failed in createOrUpdateCoupon:', error);
    throw new Error('Failed to save coupon.', { cause: error });
  }
}

// Contact Messages
export async function submitContactMessage(data: {
  name: string;
  phone: string;
  email?: string;
  message: string;
}) {
  try {
    const created = await db
      .insert(contactMessages)
      .values({
        name: data.name.trim(),
        phone: data.phone.trim(),
        email: (data.email || '').trim(),
        message: data.message.trim(),
        status: 'UNREAD',
      })
      .returning();

    await db.insert(notifications).values({
      recipientUid: null,
      recipientRole: 'ADMIN',
      type: 'CONTACT_MESSAGE',
      title: 'New Customer Inquiry',
      message: `${data.name} (${data.phone}): ${data.message.substring(0, 80)}`,
      referenceId: String(created[0].id),
    });

    return created[0];
  } catch (error) {
    console.error('Database query failed in submitContactMessage:', error);
    throw new Error('Failed to submit contact message.', { cause: error });
  }
}

export async function getContactMessagesForAdmin() {
  try {
    return await db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt));
  } catch (error) {
    console.error('Database query failed in getContactMessagesForAdmin:', error);
    throw new Error('Failed to load contact messages.', { cause: error });
  }
}

export async function updateContactMessageAdmin(
  id: number,
  data: { status?: string; adminNote?: string }
) {
  try {
    const updated = await db
      .update(contactMessages)
      .set(data)
      .where(eq(contactMessages.id, id))
      .returning();
    return updated[0];
  } catch (error) {
    console.error('Database query failed in updateContactMessageAdmin:', error);
    throw new Error('Failed to update contact message.', { cause: error });
  }
}

// Notifications
export async function getUserNotifications(uid: string, role: string) {
  try {
    if (role === 'SUPER_ADMIN' || role === 'STAFF') {
      return await db
        .select()
        .from(notifications)
        .where(
          or(
            eq(notifications.recipientUid, uid),
            eq(notifications.recipientRole, 'ADMIN')
          )
        )
        .orderBy(desc(notifications.createdAt));
    }
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientUid, uid))
      .orderBy(desc(notifications.createdAt));
  } catch (error) {
    console.error('Database query failed in getUserNotifications:', error);
    throw new Error('Failed to load notifications.', { cause: error });
  }
}

export async function markNotificationRead(id: number) {
  try {
    const updated = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return updated[0];
  } catch (error) {
    console.error('Database query failed in markNotificationRead:', error);
    throw new Error('Failed to mark notification read.', { cause: error });
  }
}

// Secure Image Storage Buckets (MIME type, extension, and size validation)
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4 MB

export async function uploadStorageFile(
  uid: string,
  payload: {
    bucket: 'product-images' | 'review-images' | 'payment-proofs' | 'brand-assets';
    filename: string;
    mimeType: string;
    dataUrl: string;
  }
) {
  try {
    const cleanFilename = payload.filename.toLowerCase().trim();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => cleanFilename.endsWith(ext));
    if (!hasValidExt || !ALLOWED_MIME_TYPES.includes(payload.mimeType)) {
      throw new Error(
        'Invalid file type. Only JPEG, PNG, WEBP, and AVIF images are permitted. Executable uploads are blocked.'
      );
    }

    if (!payload.dataUrl.startsWith('data:image/')) {
      throw new Error('Invalid image payload.');
    }

    const sizeBytes = Math.ceil((payload.dataUrl.length * 3) / 4);
    if (sizeBytes > MAX_UPLOAD_BYTES) {
      throw new Error('Image exceeds maximum allowed size of 4MB.');
    }

    const saved = await db
      .insert(storageFiles)
      .values({
        bucket: payload.bucket,
        filename: payload.filename,
        mimeType: payload.mimeType,
        sizeBytes,
        dataUrl: payload.dataUrl,
        uploadedByUid: uid,
      })
      .returning();

    return {
      id: saved[0].id,
      bucket: saved[0].bucket,
      filename: saved[0].filename,
      url: saved[0].dataUrl,
      createdAt: saved[0].createdAt,
    };
  } catch (error: any) {
    console.error('Database query failed in uploadStorageFile:', error);
    throw new Error(error.message || 'Failed to upload image to storage bucket.', {
      cause: error,
    });
  }
}
