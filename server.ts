import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import * as dotenv from 'dotenv';
import {
  requireAuth,
  requireStaffOrAdmin,
  requireSuperAdmin,
  AuthRequest,
} from './src/middleware/auth.ts';
import { ensureDatabaseSeeded } from './src/db/seed.ts';
import {
  getStoreConfig,
  getAllCatalogProducts,
  incrementProductView,
  createOrUpdateProduct,
  adjustVariantInventory,
  archiveOrRestoreProduct,
  updateSiteSettingsData,
  updateCategoryImageOrDetails,
  saveBannerData,
  updateStoreLocationData,
  submitProductReview,
  getAllReviewsForAdmin,
  moderateReviewStatus,
  getAllCoupons,
  createOrUpdateCoupon,
  submitContactMessage,
  getContactMessagesForAdmin,
  updateContactMessageAdmin,
  getUserNotifications,
  markNotificationRead,
  uploadStorageFile,
} from './src/db/catalog.ts';
import {
  updateUserProfile,
  switchAccountRoleForTesting,
  requestPhoneOtp,
  verifyPhoneOtp,
  getUserAddresses,
  saveUserAddress,
  deleteUserAddress,
  getAllCustomersForAdmin,
  toggleCustomerRestriction,
  getStaffMembers,
  updateUserRoleAndPermissions,
} from './src/db/users.ts';
import {
  getUserCart,
  syncOrUpdateCartItem,
  mergeGuestCartWithAccount,
  getUserWishlistProductIds,
  toggleWishlistProduct,
  validateCouponServerSide,
  createOrderSecurely,
  getOrderByNumberOrId,
  getCustomerOrders,
  submitBankPaymentProof,
  getAllOrdersForAdmin,
  updateOrderAdminStatus,
  createReturnRequest,
  getUserReturns,
  getAllReturnsForAdmin,
  updateReturnStatusAdmin,
  getAdminAnalyticsSummary,
} from './src/db/orders.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = http.createServer(app);

  // Increase payload limit for secure base64 image uploads (up to 6MB JSON body)
  app.use(express.json({ limit: '6mb' }));

  // Serve generated studio photography assets in both dev & prod
  app.use(
    '/src/assets/images',
    express.static(path.resolve(process.cwd(), 'src/assets/images'))
  );

  // SEO: Dynamic robots.txt
  app.get('/robots.txt', (req, res) => {
    const baseUrl =
      process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    res.type('text/plain').send(
      `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /account\nDisallow: /checkout\nSitemap: ${baseUrl}/sitemap.xml\n`
    );
  });

  // SEO: Dynamic sitemap.xml backed by PostgreSQL products & categories
  app.get('/sitemap.xml', async (req, res) => {
    try {
      await ensureDatabaseSeeded();
      const baseUrl =
        process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      const [prods, config] = await Promise.all([
        getAllCatalogProducts(false),
        getStoreConfig(),
      ]);

      const urls = [
        `${baseUrl}/`,
        `${baseUrl}/shop`,
        ...config.categories.map((c) => `${baseUrl}/shop?category=${c.slug}`),
        ...prods.map((p) => `${baseUrl}/product/${p.slug}`),
      ];

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;
      res.header('Content-Type', 'application/xml').send(xml);
    } catch (error) {
      console.error('Sitemap error:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // ==================== PUBLIC STOREFRONT API ====================
  app.get('/api/bootstrap', async (_req, res) => {
    try {
      await ensureDatabaseSeeded();
      const [config, catalogProducts] = await Promise.all([
        getStoreConfig(),
        getAllCatalogProducts(false),
      ]);
      res.json({
        ...config,
        products: catalogProducts,
        paymentGatewayStatus: {
          cod: 'CONFIGURED',
          bankTransfer: 'CONFIGURED',
          esewa:
            config.settings?.esewaConfigured ||
            Boolean(process.env.ESEWA_MERCHANT_CODE && process.env.ESEWA_SECRET_KEY)
              ? 'CONFIGURED'
              : 'NOT_CONFIGURED',
          fonepay:
            config.settings?.fonepayConfigured ||
            Boolean(process.env.FONEPAY_MERCHANT_CODE && process.env.FONEPAY_SECRET_KEY)
              ? 'CONFIGURED'
              : 'NOT_CONFIGURED',
        },
      });
    } catch (error: any) {
      console.error('Bootstrap error:', error);
      res.status(500).json({
        error: error.message || 'Unable to load store data. Please try again.',
      });
    }
  });

  app.get('/api/products', async (_req, res) => {
    try {
      await ensureDatabaseSeeded();
      const prods = await getAllCatalogProducts(false);
      res.json(prods);
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Unable to load products. Please try again.',
      });
    }
  });

  app.post('/api/products/:slug/view', async (req, res) => {
    try {
      await incrementProductView(req.params.slug);
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/contact', async (req, res) => {
    try {
      const { name, phone, email, message } = req.body;
      if (!name || !phone || !message) {
        return res
          .status(400)
          .json({ error: 'Name, phone number, and message are required.' });
      }
      const saved = await submitContactMessage({ name, phone, email, message });
      res.json(saved);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to send message.' });
    }
  });

  app.get('/api/orders/track/:orderNumber', async (req, res) => {
    try {
      const order = await getOrderByNumberOrId(req.params.orderNumber);
      if (!order) {
        return res.status(404).json({ error: 'Order not found. Check your order number.' });
      }
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to track order.' });
    }
  });

  // ==================== AUTHENTICATED CUSTOMER API (RLS ENFORCED) ====================
  app.get('/api/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.profile!.uid;
      const [cart, wishlistIds, userAddresses, userOrders, userReturns, userNotifs] =
        await Promise.all([
          getUserCart(uid),
          getUserWishlistProductIds(uid),
          getUserAddresses(uid),
          getCustomerOrders(uid),
          getUserReturns(uid),
          getUserNotifications(uid, req.profile!.role),
        ]);

      res.json({
        profile: req.profile,
        permissions: req.permissions,
        cart,
        wishlistIds,
        addresses: userAddresses,
        orders: userOrders,
        returns: userReturns,
        notifications: userNotifs,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to load account data.' });
    }
  });

  app.put('/api/me/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      const updated = await updateUserProfile(req.profile!.uid, {
        fullName: req.body.fullName,
        phone: req.body.phone,
      });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/me/role-switch', requireAuth, async (req: AuthRequest, res) => {
    try {
      const updated = await switchAccountRoleForTesting(
        req.profile!.uid,
        req.body.role
      );
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Phone OTP Verification Flow
  app.post('/api/auth/otp/request', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { phone } = req.body;
      if (!phone) {
        return res.status(400).json({ error: 'Phone number is required.' });
      }
      const result = await requestPhoneOtp(req.profile!.uid, phone);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/auth/otp/verify', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { phone, code } = req.body;
      if (!phone || !code) {
        return res
          .status(400)
          .json({ error: 'Phone number and 6-digit OTP code are required.' });
      }
      const updatedProfile = await verifyPhoneOtp(req.profile!.uid, phone, code);
      res.json({ verified: true, profile: updatedProfile });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Cart & Merge
  app.post('/api/cart/item', requireAuth, async (req: AuthRequest, res) => {
    try {
      const cart = await syncOrUpdateCartItem(req.profile!.uid, {
        productId: Number(req.body.productId),
        variantId: Number(req.body.variantId),
        quantity: Number(req.body.quantity),
      });
      res.json(cart);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/cart/merge', requireAuth, async (req: AuthRequest, res) => {
    try {
      const cart = await mergeGuestCartWithAccount(
        req.profile!.uid,
        Array.isArray(req.body.items) ? req.body.items : []
      );
      res.json(cart);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Wishlist
  app.post('/api/wishlist/toggle', requireAuth, async (req: AuthRequest, res) => {
    try {
      const ids = await toggleWishlistProduct(
        req.profile!.uid,
        Number(req.body.productId)
      );
      res.json(ids);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Addresses
  app.post('/api/addresses', requireAuth, async (req: AuthRequest, res) => {
    try {
      const created = await saveUserAddress(req.profile!.uid, req.body);
      res.json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/addresses/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const resDel = await deleteUserAddress(
        req.profile!.uid,
        Number(req.params.id)
      );
      res.json(resDel);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Coupon Validation
  app.post('/api/coupons/validate', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { code, subtotal, categories } = req.body;
      const result = await validateCouponServerSide(
        req.profile!.uid,
        code,
        Number(subtotal || 0),
        Array.isArray(categories) ? categories : []
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Create Order (Requires Phone Verified + Server-Side Price & Stock Validation)
  app.post('/api/orders', requireAuth, async (req: AuthRequest, res) => {
    try {
      const created = await createOrderSecurely(req.profile!.uid, req.body);
      res.json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Submit Bank Payment Proof
  app.post(
    '/api/orders/:id/payment-proof',
    requireAuth,
    async (req: AuthRequest, res) => {
      try {
        const updated = await submitBankPaymentProof(
          req.profile!.uid,
          Number(req.params.id),
          req.body.transactionReference,
          req.body.proofImageUrl || ''
        );
        res.json(updated);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Submit Return Request
  app.post('/api/returns', requireAuth, async (req: AuthRequest, res) => {
    try {
      const created = await createReturnRequest(req.profile!.uid, req.body);
      res.json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Submit Product Review
  app.post('/api/reviews', requireAuth, async (req: AuthRequest, res) => {
    try {
      const created = await submitProductReview(
        req.profile!.uid,
        req.profile!.fullName || req.profile!.email,
        req.body
      );
      res.json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Mark Notification Read
  app.put(
    '/api/notifications/:id/read',
    requireAuth,
    async (req: AuthRequest, res) => {
      try {
        const updated = await markNotificationRead(Number(req.params.id));
        res.json(updated);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Upload File to Storage Bucket (product-images, review-images, payment-proofs, brand-assets)
  app.post('/api/storage/upload', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { bucket, filename, mimeType, dataUrl } = req.body;
      if (
        (bucket === 'product-images' || bucket === 'brand-assets') &&
        req.profile!.role !== 'SUPER_ADMIN' &&
        req.profile!.role !== 'STAFF'
      ) {
        return res
          .status(403)
          .json({ error: 'Only Admin or Staff can upload product or brand assets.' });
      }
      const uploaded = await uploadStorageFile(req.profile!.uid, {
        bucket,
        filename,
        mimeType,
        dataUrl,
      });
      res.json(uploaded);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ==================== ADMIN & STAFF API (RBAC PROTECTED) ====================
  app.get(
    '/api/admin/overview',
    requireAuth,
    requireStaffOrAdmin,
    async (_req: AuthRequest, res) => {
      try {
        const [
          analytics,
          allProds,
          allOrders,
          allCustomers,
          allReturns,
          allCoupons,
          allReviews,
          allMessages,
          staffList,
          storeConfig,
        ] = await Promise.all([
          getAdminAnalyticsSummary(),
          getAllCatalogProducts(true),
          getAllOrdersForAdmin(),
          getAllCustomersForAdmin(),
          getAllReturnsForAdmin(),
          getAllCoupons(),
          getAllReviewsForAdmin(),
          getContactMessagesForAdmin(),
          getStaffMembers(),
          getStoreConfig(),
        ]);

        res.json({
          analytics,
          products: allProds,
          orders: allOrders,
          customers: allCustomers,
          returns: allReturns,
          coupons: allCoupons,
          reviews: allReviews,
          messages: allMessages,
          staff: staffList,
          storeConfig,
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Admin Products
  app.post(
    '/api/admin/products',
    requireAuth,
    requireStaffOrAdmin,
    async (req: AuthRequest, res) => {
      try {
        if (!req.permissions?.canManageProducts) {
          return res
            .status(403)
            .json({ error: 'You do not have permission to manage products.' });
        }
        const saved = await createOrUpdateProduct(req.profile!.uid, req.body);
        res.json(saved);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  app.put(
    '/api/admin/products/:id/archive',
    requireAuth,
    requireStaffOrAdmin,
    async (req: AuthRequest, res) => {
      try {
        if (!req.permissions?.canManageProducts) {
          return res
            .status(403)
            .json({ error: 'You do not have permission to archive products.' });
        }
        const updated = await archiveOrRestoreProduct(
          Number(req.params.id),
          Boolean(req.body.isArchived)
        );
        res.json(updated);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Admin Inventory
  app.put(
    '/api/admin/inventory/:variantId',
    requireAuth,
    requireStaffOrAdmin,
    async (req: AuthRequest, res) => {
      try {
        if (!req.permissions?.canManageInventory) {
          return res
            .status(403)
            .json({ error: 'You do not have permission to manage inventory.' });
        }
        const updated = await adjustVariantInventory(
          req.profile!.uid,
          Number(req.params.variantId),
          Number(req.body.stock),
          req.body.reason || 'ADMIN_ADJUSTMENT'
        );
        res.json(updated);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Admin Orders
  app.put(
    '/api/admin/orders/:id',
    requireAuth,
    requireStaffOrAdmin,
    async (req: AuthRequest, res) => {
      try {
        if (!req.permissions?.canManageOrders) {
          return res
            .status(403)
            .json({ error: 'You do not have permission to manage orders.' });
        }
        const updated = await updateOrderAdminStatus(
          req.profile!.uid,
          Number(req.params.id),
          req.body
        );
        res.json(updated);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Admin Returns
  app.put(
    '/api/admin/returns/:id',
    requireAuth,
    requireStaffOrAdmin,
    async (req: AuthRequest, res) => {
      try {
        if (!req.permissions?.canManageReturns) {
          return res
            .status(403)
            .json({ error: 'You do not have permission to manage returns.' });
        }
        const updated = await updateReturnStatusAdmin(
          Number(req.params.id),
          req.body.status,
          req.body.adminNote || ''
        );
        res.json(updated);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Admin Customers
  app.put(
    '/api/admin/customers/:uid/restrict',
    requireAuth,
    requireStaffOrAdmin,
    async (req: AuthRequest, res) => {
      try {
        if (!req.permissions?.canManageCustomers) {
          return res
            .status(403)
            .json({ error: 'You do not have permission to manage customers.' });
        }
        const updated = await toggleCustomerRestriction(
          req.params.uid,
          Boolean(req.body.isRestricted)
        );
        res.json(updated);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Admin Reviews & Contact Messages
  app.put(
    '/api/admin/reviews/:id',
    requireAuth,
    requireStaffOrAdmin,
    async (req: AuthRequest, res) => {
      try {
        const updated = await moderateReviewStatus(
          Number(req.params.id),
          req.body.status
        );
        res.json(updated);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  app.put(
    '/api/admin/messages/:id',
    requireAuth,
    requireStaffOrAdmin,
    async (req: AuthRequest, res) => {
      try {
        const updated = await updateContactMessageAdmin(
          Number(req.params.id),
          req.body
        );
        res.json(updated);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Admin Coupons
  app.post(
    '/api/admin/coupons',
    requireAuth,
    requireStaffOrAdmin,
    async (req: AuthRequest, res) => {
      try {
        const saved = await createOrUpdateCoupon(req.body);
        res.json(saved);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Admin Categories & Banners
  app.put(
    '/api/admin/categories/:id',
    requireAuth,
    requireStaffOrAdmin,
    async (req: AuthRequest, res) => {
      try {
        const updated = await updateCategoryImageOrDetails(
          Number(req.params.id),
          req.body
        );
        res.json(updated);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  app.post(
    '/api/admin/banners',
    requireAuth,
    requireStaffOrAdmin,
    async (req: AuthRequest, res) => {
      try {
        const saved = await saveBannerData(req.body);
        res.json(saved);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  // SUPER ADMIN ONLY: Staff Management & Store Settings
  app.put(
    '/api/admin/staff/:uid',
    requireAuth,
    requireSuperAdmin,
    async (req: AuthRequest, res) => {
      try {
        const updated = await updateUserRoleAndPermissions(
          req.params.uid,
          req.body.role,
          req.body.permissions
        );
        res.json(updated);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  app.put(
    '/api/admin/settings',
    requireAuth,
    requireSuperAdmin,
    async (req: AuthRequest, res) => {
      try {
        const updated = await updateSiteSettingsData(req.body);
        res.json(updated);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  app.put(
    '/api/admin/locations/:id',
    requireAuth,
    requireSuperAdmin,
    async (req: AuthRequest, res) => {
      try {
        const updated = await updateStoreLocationData(
          Number(req.params.id),
          req.body
        );
        res.json(updated);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Vite middleware for development / Static files for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr:
          process.env.DISABLE_HMR === 'true'
            ? false
            : {
                server: httpServer,
              },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`CHHAYASWORI IMPEX server running on http://localhost:${PORT}`);
  });
}

startServer();
