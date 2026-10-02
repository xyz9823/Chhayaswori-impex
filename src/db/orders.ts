import { db } from './index.ts';
import {
  carts,
  cartItems,
  wishlists,
  wishlistItems,
  products,
  productVariants,
  coupons,
  couponUsage,
  siteSettings,
  orders,
  orderItems,
  orderStatusHistory,
  payments,
  paymentTransactions,
  inventory,
  returns,
  returnItems,
  notifications,
  profiles,
} from './schema.ts';
import { eq, and, desc, asc } from 'drizzle-orm';
import {
  sendOrderConfirmationSms,
  sendOrderStatusSms,
  sendDeliveryNotificationSms,
} from '../services/sms.ts';
import { processPayment } from '../services/payment.ts';

// 1. Cart Persistence & Merging
export async function getUserCart(uid: string) {
  try {
    let userCart = await db.select().from(carts).where(eq(carts.userUid, uid));
    if (userCart.length === 0) {
      userCart = await db.insert(carts).values({ userUid: uid }).returning();
    }
    const cartId = userCart[0].id;
    const items = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, cartId))
      .orderBy(asc(cartItems.id));

    const allProducts = await db.select().from(products);
    const allVariants = await db.select().from(productVariants);

    return items
      .map((item) => {
        const prod = allProducts.find((p) => p.id === item.productId);
        const variant = allVariants.find((v) => v.id === item.variantId);
        if (!prod || !variant || prod.isArchived || !prod.isActive) return null;
        return {
          id: item.id,
          productId: prod.id,
          variantId: variant.id,
          productName: prod.name,
          productSlug: prod.slug,
          productImage: prod.primaryImage,
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          colorHex: variant.colorHex,
          unitPrice: variant.priceOverride || prod.price,
          compareAtPrice: prod.compareAtPrice,
          availableStock: variant.stock,
          quantity: Math.min(item.quantity, Math.max(1, variant.stock)),
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.error('Database query failed in getUserCart:', error);
    throw new Error('Failed to load cart.', { cause: error });
  }
}

export async function syncOrUpdateCartItem(
  uid: string,
  payload: { productId: number; variantId: number; quantity: number }
) {
  try {
    let userCart = await db.select().from(carts).where(eq(carts.userUid, uid));
    if (userCart.length === 0) {
      userCart = await db.insert(carts).values({ userUid: uid }).returning();
    }
    const cartId = userCart[0].id;

    const variantRows = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, payload.variantId));
    if (variantRows.length === 0) {
      throw new Error('Selected size/color variant does not exist.');
    }
    const variant = variantRows[0];

    if (payload.quantity <= 0) {
      await db
        .delete(cartItems)
        .where(
          and(
            eq(cartItems.cartId, cartId),
            eq(cartItems.variantId, payload.variantId)
          )
        );
      return await getUserCart(uid);
    }

    if (variant.stock < payload.quantity) {
      throw new Error(
        variant.stock === 0
          ? `Size ${variant.size} (${variant.color}) is currently OUT OF STOCK.`
          : `Only ${variant.stock} unit(s) available for Size ${variant.size} (${variant.color}).`
      );
    }

    const existingItem = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, cartId),
          eq(cartItems.variantId, payload.variantId)
        )
      );

    if (existingItem.length > 0) {
      await db
        .update(cartItems)
        .set({ quantity: payload.quantity, updatedAt: new Date() })
        .where(eq(cartItems.id, existingItem[0].id));
    } else {
      await db.insert(cartItems).values({
        cartId,
        productId: payload.productId,
        variantId: payload.variantId,
        quantity: payload.quantity,
      });
    }

    return await getUserCart(uid);
  } catch (error: any) {
    console.error('Database query failed in syncOrUpdateCartItem:', error);
    throw new Error(error.message || 'Failed to update cart item.', { cause: error });
  }
}

export async function mergeGuestCartWithAccount(
  uid: string,
  guestItems: Array<{ productId: number; variantId: number; quantity: number }>
) {
  try {
    let userCart = await db.select().from(carts).where(eq(carts.userUid, uid));
    if (userCart.length === 0) {
      userCart = await db.insert(carts).values({ userUid: uid }).returning();
    }
    const cartId = userCart[0].id;
    const allVariants = await db.select().from(productVariants);

    for (const gItem of guestItems) {
      const variant = allVariants.find((v) => v.id === gItem.variantId);
      if (!variant || variant.stock <= 0) continue;

      const existing = await db
        .select()
        .from(cartItems)
        .where(
          and(
            eq(cartItems.cartId, cartId),
            eq(cartItems.variantId, gItem.variantId)
          )
        );

      if (existing.length > 0) {
        const mergedQty = Math.min(
          variant.stock,
          existing[0].quantity + Math.max(1, gItem.quantity)
        );
        await db
          .update(cartItems)
          .set({ quantity: mergedQty, updatedAt: new Date() })
          .where(eq(cartItems.id, existing[0].id));
      } else {
        const safeQty = Math.min(variant.stock, Math.max(1, gItem.quantity));
        await db.insert(cartItems).values({
          cartId,
          productId: gItem.productId,
          variantId: gItem.variantId,
          quantity: safeQty,
        });
      }
    }

    return await getUserCart(uid);
  } catch (error) {
    console.error('Database query failed in mergeGuestCartWithAccount:', error);
    throw new Error('Failed to merge guest cart.', { cause: error });
  }
}

// 2. Wishlist Persistence
export async function getUserWishlistProductIds(uid: string) {
  try {
    const items = await db
      .select()
      .from(wishlistItems)
      .where(eq(wishlistItems.userUid, uid));
    return items.map((i) => i.productId);
  } catch (error) {
    console.error('Database query failed in getUserWishlistProductIds:', error);
    throw new Error('Failed to load wishlist.', { cause: error });
  }
}

export async function toggleWishlistProduct(uid: string, productId: number) {
  try {
    await db.insert(wishlists).values({ userUid: uid }).onConflictDoNothing();
    const existing = await db
      .select()
      .from(wishlistItems)
      .where(
        and(
          eq(wishlistItems.userUid, uid),
          eq(wishlistItems.productId, productId)
        )
      );

    if (existing.length > 0) {
      await db
        .delete(wishlistItems)
        .where(eq(wishlistItems.id, existing[0].id));
    } else {
      await db.insert(wishlistItems).values({
        userUid: uid,
        productId,
      });
    }

    return await getUserWishlistProductIds(uid);
  } catch (error) {
    console.error('Database query failed in toggleWishlistProduct:', error);
    throw new Error('Failed to update wishlist.', { cause: error });
  }
}

// 3. Server-Side Coupon Validation
export async function validateCouponServerSide(
  uid: string | null,
  code: string,
  subtotal: number,
  cartCategories: string[] = []
) {
  try {
    const cleanCode = code.toUpperCase().trim();
    const rows = await db
      .select()
      .from(coupons)
      .where(and(eq(coupons.code, cleanCode), eq(coupons.isActive, true)));

    if (rows.length === 0) {
      throw new Error('Invalid or inactive coupon code.');
    }

    const coupon = rows[0];
    const now = new Date();
    if (coupon.startsAt && now < new Date(coupon.startsAt)) {
      throw new Error('This coupon is not yet active.');
    }
    if (coupon.expiresAt && now > new Date(coupon.expiresAt)) {
      throw new Error('This coupon has expired.');
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new Error('This coupon has reached its maximum usage limit.');
    }
    if (subtotal < coupon.minOrderAmount) {
      throw new Error(
        `Minimum order of Rs. ${coupon.minOrderAmount.toLocaleString()} required for coupon ${cleanCode}.`
      );
    }
    if (
      coupon.categoryRestriction &&
      cartCategories.length > 0 &&
      !cartCategories.includes(coupon.categoryRestriction.toLowerCase())
    ) {
      throw new Error(
        `This coupon is only valid for ${coupon.categoryRestriction} items.`
      );
    }

    if (uid && coupon.perUserLimit) {
      const userUses = await db
        .select()
        .from(couponUsage)
        .where(
          and(
            eq(couponUsage.couponId, coupon.id),
            eq(couponUsage.userUid, uid)
          )
        );
      if (userUses.length >= coupon.perUserLimit) {
        throw new Error('You have already used this coupon code the maximum number of times.');
      }
    }

    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else {
      discountAmount = Math.min(subtotal, coupon.discountValue);
    }

    return {
      coupon,
      discountAmount,
    };
  } catch (error: any) {
    console.error('Coupon validation error:', error);
    throw new Error(error.message || 'Coupon validation failed.', { cause: error });
  }
}

// 4. Secure Server-Side Order Creation & Atomic Inventory Update
export async function createOrderSecurely(
  uid: string,
  payload: {
    items: Array<{ productId: number; variantId: number; quantity: number }>;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    province: string;
    district: string;
    municipality: string;
    area: string;
    streetAddress: string;
    landmark?: string;
    deliveryNote?: string;
    couponCode?: string;
    paymentMethod: 'COD' | 'ESEWA' | 'FONEPAY' | 'BANK_TRANSFER';
    bankTransactionReference?: string;
    bankProofImageUrl?: string;
  }
) {
  try {
    // 1. Verify customer phone verification status
    const userRows = await db.select().from(profiles).where(eq(profiles.uid, uid));
    if (userRows.length === 0) {
      throw new Error('Customer account not found.');
    }
    const customerProfile = userRows[0];
    if (!customerProfile.phoneVerified) {
      throw new Error(
        'Phone verification is mandatory before placing an order. Please complete OTP verification.'
      );
    }

    if (!payload.items || payload.items.length === 0) {
      throw new Error('Cannot create an order with an empty cart.');
    }

    // 2. Load store settings for delivery calculation & payment configuration
    const settingsRows = await db.select().from(siteSettings);
    const settings = settingsRows[0] || {
      deliveryFeeKathmandu: 120,
      deliveryFeeOutside: 220,
      freeDeliveryThreshold: 2500,
      esewaConfigured: false,
      fonepayConfigured: false,
    };

    // 3. Payment gateway handling (Safe Development / Test Mode enabled)
    const isEsewaRealConfigured = Boolean(
      settings.esewaConfigured ||
      (process.env.ESEWA_PRODUCT_CODE && process.env.ESEWA_SECRET_KEY)
    );
    const isFonepayRealConfigured = Boolean(
      settings.fonepayConfigured ||
      (process.env.FONEPAY_MERCHANT_CODE && process.env.FONEPAY_SECRET_KEY)
    );

    const isTestPaymentMode =
      (payload.paymentMethod === 'ESEWA' && !isEsewaRealConfigured) ||
      (payload.paymentMethod === 'FONEPAY' && !isFonepayRealConfigured);

    // 4. Retrieve actual database products and variants, validate stock
    const allProds = await db.select().from(products);
    const allVariants = await db.select().from(productVariants);

    let subtotal = 0;
    const cartCategories: string[] = [];
    const verifiedLines: Array<{
      product: typeof allProds[0];
      variant: typeof allVariants[0];
      unitPrice: number;
      quantity: number;
      lineTotal: number;
    }> = [];

    for (const reqItem of payload.items) {
      const qty = Math.max(1, Math.floor(Number(reqItem.quantity) || 1));
      const prod = allProds.find((p) => p.id === reqItem.productId);
      const variant = allVariants.find(
        (v) => v.id === reqItem.variantId && v.productId === reqItem.productId
      );

      if (!prod || ! prod.isActive || prod.isArchived) {
        throw new Error('One or more products in your cart are no longer available.');
      }
      if (!variant || !variant.isActive) {
        throw new Error(`Selected variant for ${prod.name} is invalid.`);
      }
      if (variant.stock < qty) {
        throw new Error(
          variant.stock === 0
            ? `${prod.name} (Size ${variant.size}, ${variant.color}) is OUT OF STOCK.`
            : `Insufficient stock for ${prod.name} (Size ${variant.size}, ${variant.color}). Only ${variant.stock} available.`
        );
      }

      const unitPrice = variant.priceOverride || prod.price;
      const lineTotal = unitPrice * qty;
      subtotal += lineTotal;
      cartCategories.push(prod.categorySlug.toLowerCase());
      verifiedLines.push({
        product: prod,
        variant,
        unitPrice,
        quantity: qty,
        lineTotal,
      });
    }

    // 5. Validate coupon server-side if provided
    let discountAmount = 0;
    let validatedCoupon: any = null;
    if (payload.couponCode && payload.couponCode.trim() !== '') {
      const couponRes = await validateCouponServerSide(
        uid,
        payload.couponCode,
        subtotal,
        cartCategories
      );
      discountAmount = couponRes.discountAmount;
      validatedCoupon = couponRes.coupon;
    }

    // 6. Calculate delivery fee server-side based on district & free threshold
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const isKathmandu =
      payload.district.trim().toLowerCase().includes('kathmandu');
    let deliveryFee = isKathmandu
      ? settings.deliveryFeeKathmandu
      : settings.deliveryFeeOutside;

    if (afterDiscount >= settings.freeDeliveryThreshold) {
      deliveryFee = 0;
    }

    const grandTotal = afterDiscount + deliveryFee;

    // 7. Determine initial payment & order status (with Development Test Mode support)
    let initialPaymentStatus = 'Pending';
    let initialOrderStatus = 'Payment Pending';
    let defaultTxnRef = payload.bankTransactionReference || '';

    if (payload.paymentMethod === 'COD') {
      initialPaymentStatus = 'Pending';
      initialOrderStatus = 'Confirmed';
    } else if (payload.paymentMethod === 'BANK_TRANSFER') {
      initialPaymentStatus = payload.bankTransactionReference ? 'Processing' : 'Pending';
      initialOrderStatus = 'Payment Pending';
    } else if (isTestPaymentMode) {
      initialPaymentStatus = 'Paid';
      initialOrderStatus = 'Confirmed';
      defaultTxnRef = `TEST-${payload.paymentMethod}-SIM-${Date.now().toString().slice(-6)}`;
    }

    const orderNumber = `CHX-${Date.now().toString().slice(-6)}-${Math.floor(
      10 + Math.random() * 90
    )}`;

    // 8. Insert Order
    const createdOrders = await db
      .insert(orders)
      .values({
        orderNumber,
        userUid: uid,
        customerName: payload.customerName.trim(),
        customerPhone: payload.customerPhone.trim(),
        customerEmail: (payload.customerEmail || customerProfile.email || '').trim(),
        phoneVerified: true,
        province: payload.province.trim(),
        district: payload.district.trim(),
        municipality: payload.municipality.trim(),
        area: payload.area.trim(),
        streetAddress: payload.streetAddress.trim(),
        landmark: (payload.landmark || '').trim(),
        deliveryNote: (payload.deliveryNote || '').trim(),
        subtotal,
        discountAmount,
        couponCode: validatedCoupon ? validatedCoupon.code : null,
        deliveryFee,
        grandTotal,
        paymentMethod: payload.paymentMethod,
        paymentStatus: initialPaymentStatus,
        orderStatus: initialOrderStatus,
        internalNotes: isTestPaymentMode
          ? `[DEVELOPMENT/TEST ONLY] Simulated ${payload.paymentMethod} test payment. No real money was charged.`
          : '',
      })
      .returning();

    const order = createdOrders[0];

    // 9. Insert Order Items & Decrement Variant Stock Atomically + Write Inventory Logs
    for (const line of verifiedLines) {
      await db.insert(orderItems).values({
        orderId: order.id,
        productId: line.product.id,
        variantId: line.variant.id,
        productName: line.product.name,
        productImage: line.product.primaryImage,
        sku: line.variant.sku,
        size: line.variant.size,
        color: line.variant.color,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        lineTotal: line.lineTotal,
      });

      const newStock = Math.max(0, line.variant.stock - line.quantity);
      await db
        .update(productVariants)
        .set({ stock: newStock, updatedAt: new Date() })
        .where(eq(productVariants.id, line.variant.id));

      await db.insert(inventory).values({
        variantId: line.variant.id,
        productId: line.product.id,
        changeAmount: -line.quantity,
        previousStock: line.variant.stock,
        newStock,
        reason: 'ORDER_PLACED',
        referenceOrderId: order.id,
        updatedByUid: uid,
      });

      // Notify Admin if low stock reached
      if (newStock <= line.product.lowStockThreshold) {
        await db.insert(notifications).values({
          recipientUid: null,
          recipientRole: 'ADMIN',
          type: 'LOW_STOCK',
          title: 'Low Stock Alert',
          message: `${line.product.name} (${line.variant.color} / Size ${line.variant.size}) is down to ${newStock} unit(s).`,
          referenceId: String(line.product.id),
        });
      }
    }

    // 10. Record Order Status History
    await db.insert(orderStatusHistory).values({
      orderId: order.id,
      status: initialOrderStatus,
      note:
        payload.paymentMethod === 'COD'
          ? 'Order placed with Cash on Delivery and phone verified via OTP.'
          : `Order placed via ${payload.paymentMethod}. Awaiting payment verification.`,
      changedByUid: uid,
    });

    // 11. Record Payment & Transaction
    const createdPayments = await db
      .insert(payments)
      .values({
        orderId: order.id,
        paymentMethod: payload.paymentMethod,
        amount: grandTotal,
        status: initialPaymentStatus,
        transactionReference: (defaultTxnRef || '').trim(),
        proofImageUrl: payload.bankProofImageUrl || '',
      })
      .returning();

    await db.insert(paymentTransactions).values({
      paymentId: createdPayments[0].id,
      orderId: order.id,
      gateway: payload.paymentMethod,
      eventType: payload.bankTransactionReference
        ? 'PROOF_SUBMITTED'
        : 'INITIATED',
      referenceId: (payload.bankTransactionReference || orderNumber).trim(),
      status: initialPaymentStatus,
    });

    // 12. Record Coupon Usage if applicable
    if (validatedCoupon) {
      await db
        .update(coupons)
        .set({ usedCount: validatedCoupon.usedCount + 1 })
        .where(eq(coupons.id, validatedCoupon.id));

      await db.insert(couponUsage).values({
        couponId: validatedCoupon.id,
        userUid: uid,
        orderId: order.id,
        discountApplied: discountAmount,
      });
    }

    // 13. Clear user's server-side cart
    const userCart = await db.select().from(carts).where(eq(carts.userUid, uid));
    if (userCart.length > 0) {
      await db.delete(cartItems).where(eq(cartItems.cartId, userCart[0].id));
    }

    // 14. Create Customer & Admin Notifications
    await db.insert(notifications).values([
      {
        recipientUid: uid,
        recipientRole: 'CUSTOMER',
        type: 'ORDER_PLACED',
        title: `Order #${order.orderNumber} Placed`,
        message: `Thank you for your order of Rs. ${grandTotal.toLocaleString()}. Current status: ${initialOrderStatus}.`,
        referenceId: order.orderNumber,
      },
      {
        recipientUid: null,
        recipientRole: 'ADMIN',
        type: 'NEW_ORDER',
        title: `New Order #${order.orderNumber}`,
        message: `${order.customerName} placed an order for Rs. ${grandTotal.toLocaleString()} (${order.paymentMethod}).`,
        referenceId: order.orderNumber,
      },
    ]);

    // 15. Send Simulated SMS for Order Confirmation
    await sendOrderConfirmationSms(
      order.customerPhone,
      order.orderNumber,
      grandTotal
    );

    return await getOrderByNumberOrId(order.orderNumber);
  } catch (error: any) {
    console.error('Database query failed in createOrderSecurely:', error);
    throw new Error(error.message || 'Failed to place order.', { cause: error });
  }
}

export async function getOrderByNumberOrId(identifier: string | number) {
  try {
    const orderRows =
      typeof identifier === 'number' || /^\d+$/.test(String(identifier))
        ? await db.select().from(orders).where(eq(orders.id, Number(identifier)))
        : await db
            .select()
            .from(orders)
            .where(eq(orders.orderNumber, String(identifier).trim()));

    if (orderRows.length === 0) return null;
    const ord = orderRows[0];

    const [items, history, payRows] = await Promise.all([
      db.select().from(orderItems).where(eq(orderItems.orderId, ord.id)),
      db
        .select()
        .from(orderStatusHistory)
        .where(eq(orderStatusHistory.orderId, ord.id))
        .orderBy(asc(orderStatusHistory.createdAt)),
      db.select().from(payments).where(eq(payments.orderId, ord.id)),
    ]);

    return {
      ...ord,
      items,
      statusHistory: history,
      payment: payRows[0] || null,
    };
  } catch (error) {
    console.error('Database query failed in getOrderByNumberOrId:', error);
    throw new Error('Failed to retrieve order details.', { cause: error });
  }
}

export async function getCustomerOrders(uid: string) {
  try {
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userUid, uid))
      .orderBy(desc(orders.createdAt));

    const allItems = await db.select().from(orderItems);
    const allHistory = await db
      .select()
      .from(orderStatusHistory)
      .orderBy(asc(orderStatusHistory.createdAt));
    const allPayments = await db.select().from(payments);

    return userOrders.map((o) => ({
      ...o,
      items: allItems.filter((i) => i.orderId === o.id),
      statusHistory: allHistory.filter((h) => h.orderId === o.id),
      payment: allPayments.find((p) => p.orderId === o.id) || null,
    }));
  } catch (error) {
    console.error('Database query failed in getCustomerOrders:', error);
    throw new Error('Failed to load your orders.', { cause: error });
  }
}

export async function submitBankPaymentProof(
  uid: string,
  orderId: number,
  transactionReference: string,
  proofImageUrl: string
) {
  try {
    const ordRows = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userUid, uid)));
    if (ordRows.length === 0) {
      throw new Error('Order not found.');
    }

    await db
      .update(orders)
      .set({ paymentStatus: 'Processing', updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    const payRows = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId));

    if (payRows.length > 0) {
      await db
        .update(payments)
        .set({
          transactionReference: transactionReference.trim(),
          proofImageUrl,
          status: 'Processing',
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payRows[0].id));
    }

    await db.insert(notifications).values({
      recipientUid: null,
      recipientRole: 'ADMIN',
      type: 'BANK_PROOF_UPLOADED',
      title: `Payment Proof Uploaded (#${ordRows[0].orderNumber})`,
      message: `Customer submitted bank transfer reference: ${transactionReference}`,
      referenceId: ordRows[0].orderNumber,
    });

    return await getOrderByNumberOrId(orderId);
  } catch (error: any) {
    console.error('Database query failed in submitBankPaymentProof:', error);
    throw new Error(error.message || 'Failed to submit payment proof.', {
      cause: error,
    });
  }
}

// 5. Admin Order Management & Status / Payment Verification
export async function getAllOrdersForAdmin() {
  try {
    const allOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));
    const allItems = await db.select().from(orderItems);
    const allHistory = await db
      .select()
      .from(orderStatusHistory)
      .orderBy(asc(orderStatusHistory.createdAt));
    const allPayments = await db.select().from(payments);

    return allOrders.map((o) => ({
      ...o,
      items: allItems.filter((i) => i.orderId === o.id),
      statusHistory: allHistory.filter((h) => h.orderId === o.id),
      payment: allPayments.find((p) => p.orderId === o.id) || null,
    }));
  } catch (error) {
    console.error('Database query failed in getAllOrdersForAdmin:', error);
    throw new Error('Failed to load orders.', { cause: error });
  }
}

export async function updateOrderAdminStatus(
  adminUid: string,
  orderId: number,
  data: {
    orderStatus?: string;
    paymentStatus?: string;
    internalNotes?: string;
    statusNote?: string;
  }
) {
  try {
    const existingRows = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));
    if (existingRows.length === 0) {
      throw new Error('Order not found.');
    }
    const ord = existingRows[0];

    const nextOrderStatus = data.orderStatus || ord.orderStatus;
    const nextPaymentStatus = data.paymentStatus || ord.paymentStatus;

    // Restock inventory if order transitions to Cancelled for the first time
    if (nextOrderStatus === 'Cancelled' && ord.orderStatus !== 'Cancelled') {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, ord.id));
      for (const item of items) {
        const varRows = await db
          .select()
          .from(productVariants)
          .where(eq(productVariants.id, item.variantId));
        if (varRows.length > 0) {
          const prev = varRows[0].stock;
          const next = prev + item.quantity;
          await db
            .update(productVariants)
            .set({ stock: next, updatedAt: new Date() })
            .where(eq(productVariants.id, item.variantId));
          await db.insert(inventory).values({
            variantId: item.variantId,
            productId: item.productId,
            changeAmount: item.quantity,
            previousStock: prev,
            newStock: next,
            reason: 'ORDER_CANCELLED',
            referenceOrderId: ord.id,
            updatedByUid: adminUid,
          });
        }
      }
    }

    await db
      .update(orders)
      .set({
        orderStatus: nextOrderStatus,
        paymentStatus: nextPaymentStatus,
        internalNotes:
          data.internalNotes !== undefined ? data.internalNotes : ord.internalNotes,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    if (data.paymentStatus) {
      await db
        .update(payments)
        .set({
          status: nextPaymentStatus,
          verifiedByUid: nextPaymentStatus === 'Paid' ? adminUid : null,
          verifiedAt: nextPaymentStatus === 'Paid' ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(payments.orderId, orderId));
    }

    if (data.orderStatus && data.orderStatus !== ord.orderStatus) {
      await db.insert(orderStatusHistory).values({
        orderId: ord.id,
        status: nextOrderStatus,
        note: data.statusNote || `Order status updated to ${nextOrderStatus}.`,
        changedByUid: adminUid,
      });

      await db.insert(notifications).values({
        recipientUid: ord.userUid,
        recipientRole: 'CUSTOMER',
        type: 'ORDER_STATUS',
        title: `Order #${ord.orderNumber} ${nextOrderStatus}`,
        message: `Your order #${ord.orderNumber} is now ${nextOrderStatus}.`,
        referenceId: ord.orderNumber,
      });

      // Dispatch simulated SMS to customer
      await sendOrderStatusSms(
        ord.customerPhone,
        ord.orderNumber,
        nextOrderStatus
      );

      // If out for delivery, send simulated delivery notification SMS
      if (nextOrderStatus === 'Out for Delivery') {
        await sendDeliveryNotificationSms(
          ord.customerPhone,
          ord.orderNumber,
          ord.area
        );
      }
    }

    if (data.paymentStatus === 'Paid' && ord.paymentStatus !== 'Paid') {
      await db.insert(notifications).values({
        recipientUid: ord.userUid,
        recipientRole: 'CUSTOMER',
        type: 'PAYMENT_CONFIRMED',
        title: `Payment Confirmed (#${ord.orderNumber})`,
        message: `Your payment of Rs. ${ord.grandTotal.toLocaleString()} for order #${ord.orderNumber} has been verified.`,
        referenceId: ord.orderNumber,
      });
    }

    return await getOrderByNumberOrId(orderId);
  } catch (error: any) {
    console.error('Database query failed in updateOrderAdminStatus:', error);
    throw new Error(error.message || 'Failed to update order status.', {
      cause: error,
    });
  }
}

// 6. Returns System
export async function createReturnRequest(
  uid: string,
  payload: {
    orderId: number;
    reason: string;
    details: string;
    conditionConfirmed: boolean;
    items: Array<{ orderItemId: number; quantity: number; reason?: string }>;
  }
) {
  try {
    if (!payload.conditionConfirmed) {
      throw new Error(
        'Please confirm that the product is unused, in resalable condition, and with original packaging.'
      );
    }

    const ordRows = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, payload.orderId), eq(orders.userUid, uid)));
    if (ordRows.length === 0) {
      throw new Error('Order not found.');
    }
    const ord = ordRows[0];

    const settingsRows = await db.select().from(siteSettings);
    const returnDays = settingsRows[0]?.returnPeriodDays || 7;
    const orderAgeDays =
      (Date.now() - new Date(ord.updatedAt).getTime()) / (1000 * 60 * 60 * 24);

    if (orderAgeDays > returnDays + 1) {
      throw new Error(
        `Return window of ${returnDays} days has passed for this order.`
      );
    }

    const returnNumber = `RET-${Date.now().toString().slice(-6)}`;
    const createdRet = await db
      .insert(returns)
      .values({
        returnNumber,
        orderId: ord.id,
        userUid: uid,
        reason: payload.reason,
        details: payload.details || '',
        conditionConfirmed: true,
        status: 'Requested',
        refundAmount: ord.grandTotal,
      })
      .returning();

    for (const item of payload.items || []) {
      await db.insert(returnItems).values({
        returnId: createdRet[0].id,
        orderItemId: item.orderItemId,
        quantity: item.quantity || 1,
        reason: item.reason || payload.reason,
      });
    }

    await db.insert(notifications).values({
      recipientUid: null,
      recipientRole: 'ADMIN',
      type: 'RETURN_REQUEST',
      title: `Return Requested (#${returnNumber})`,
      message: `Return request submitted for order #${ord.orderNumber}: ${payload.reason}`,
      referenceId: returnNumber,
    });

    return createdRet[0];
  } catch (error: any) {
    console.error('Database query failed in createReturnRequest:', error);
    throw new Error(error.message || 'Failed to submit return request.', {
      cause: error,
    });
  }
}

export async function getUserReturns(uid: string) {
  try {
    return await db
      .select()
      .from(returns)
      .where(eq(returns.userUid, uid))
      .orderBy(desc(returns.createdAt));
  } catch (error) {
    console.error('Database query failed in getUserReturns:', error);
    throw new Error('Failed to load return requests.', { cause: error });
  }
}

export async function getAllReturnsForAdmin() {
  try {
    return await db.select().from(returns).orderBy(desc(returns.createdAt));
  } catch (error) {
    console.error('Database query failed in getAllReturnsForAdmin:', error);
    throw new Error('Failed to load returns for admin.', { cause: error });
  }
}

export async function updateReturnStatusAdmin(
  returnId: number,
  status: string,
  adminNote: string
) {
  try {
    const updated = await db
      .update(returns)
      .set({ status, adminNote, updatedAt: new Date() })
      .where(eq(returns.id, returnId))
      .returning();

    if (updated[0]) {
      await db.insert(notifications).values({
        recipientUid: updated[0].userUid,
        recipientRole: 'CUSTOMER',
        type: 'RETURN_UPDATED',
        title: `Return #${updated[0].returnNumber} ${status}`,
        message: `Your return request #${updated[0].returnNumber} status is now: ${status}. ${adminNote}`,
        referenceId: updated[0].returnNumber,
      });
    }

    return updated[0];
  } catch (error) {
    console.error('Database query failed in updateReturnStatusAdmin:', error);
    throw new Error('Failed to update return request.', { cause: error });
  }
}

// 7. Real Database Analytics for Admin Dashboard
export async function getAdminAnalyticsSummary() {
  try {
    const [
      allOrders,
      allOrderItems,
      allProducts,
      allVariants,
      allUsers,
      allReturns,
      allInventoryLogs,
    ] = await Promise.all([
      db.select().from(orders).orderBy(desc(orders.createdAt)),
      db.select().from(orderItems),
      db.select().from(products),
      db.select().from(productVariants),
      db.select().from(profiles),
      db.select().from(returns),
      db.select().from(inventory).orderBy(desc(inventory.createdAt)),
    ]);

    const activeOrders = allOrders.filter((o) => o.orderStatus !== 'Cancelled');
    const totalRevenue = activeOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const paidRevenue = activeOrders
      .filter((o) => o.paymentStatus === 'Paid' || o.orderStatus === 'Delivered')
      .reduce((sum, o) => sum + o.grandTotal, 0);
    const averageOrderValue =
      activeOrders.length > 0 ? Math.round(totalRevenue / activeOrders.length) : 0;

    const pendingOrdersCount = allOrders.filter((o) =>
      ['Pending', 'Payment Pending', 'Confirmed', 'Processing'].includes(
        o.orderStatus
      )
    ).length;

    const pendingPaymentsCount = allOrders.filter((o) =>
      ['Pending', 'Processing'].includes(o.paymentStatus) &&
      o.orderStatus !== 'Cancelled'
    ).length;

    const lowStockVariants = allVariants
      .map((v) => {
        const prod = allProducts.find((p) => p.id === v.productId);
        return {
          ...v,
          productName: prod?.name || 'Unknown Product',
          threshold: prod?.lowStockThreshold ?? 5,
        };
      })
      .filter((v) => v.stock <= v.threshold);

    // Best sellers calculation from actual order items + product views
    const salesByProductId: Record<number, { units: number; revenue: number }> = {};
    for (const oi of allOrderItems) {
      if (!salesByProductId[oi.productId]) {
        salesByProductId[oi.productId] = { units: 0, revenue: 0 };
      }
      salesByProductId[oi.productId].units += oi.quantity;
      salesByProductId[oi.productId].revenue += oi.lineTotal;
    }

    const bestSellers = allProducts
      .filter((p) => !p.isArchived)
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: p.price,
        primaryImage: p.primaryImage,
        viewsCount: p.viewsCount,
        unitsSold: salesByProductId[p.id]?.units || 0,
        revenue: salesByProductId[p.id]?.revenue || 0,
      }))
      .sort((a, b) => b.unitsSold - a.unitsSold || b.viewsCount - a.viewsCount)
      .slice(0, 6);

    const statusBreakdown: Record<string, number> = {};
    for (const o of allOrders) {
      statusBreakdown[o.orderStatus] = (statusBreakdown[o.orderStatus] || 0) + 1;
    }

    const paymentBreakdown: Record<string, number> = {};
    for (const o of allOrders) {
      paymentBreakdown[o.paymentStatus] =
        (paymentBreakdown[o.paymentStatus] || 0) + 1;
    }

    return {
      totalRevenue,
      paidRevenue,
      totalOrders: allOrders.length,
      averageOrderValue,
      totalCustomers: allUsers.length,
      totalProducts: allProducts.filter((p) => !p.isArchived).length,
      lowStockCount: lowStockVariants.length,
      lowStockVariants,
      pendingOrdersCount,
      pendingPaymentsCount,
      pendingReturnsCount: allReturns.filter((r) =>
        ['Requested', 'Under Review'].includes(r.status)
      ).length,
      bestSellers,
      recentOrders: allOrders.slice(0, 8),
      statusBreakdown,
      paymentBreakdown,
      recentInventoryLogs: allInventoryLogs.slice(0, 20),
    };
  } catch (error) {
    console.error('Database query failed in getAdminAnalyticsSummary:', error);
    throw new Error('Failed to load admin analytics.', { cause: error });
  }
}
