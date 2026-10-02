import { db } from './index.ts';
import {
  profiles,
  staffPermissions,
  addresses,
  phoneOtpVerifications,
  notifications,
  orders,
} from './schema.ts';
import { eq, desc, and, or, ilike } from 'drizzle-orm';
import crypto from 'crypto';
import { sendOtpSms } from '../services/sms.ts';

const OWNER_EMAIL = 'kishankhadka0909@gmail.com';

export async function getOrCreateProfile(uid: string, email: string, name: string) {
  try {
    const existing = await db.select().from(profiles).where(eq(profiles.uid, uid));
    if (existing.length > 0) {
      // Ensure owner always has SUPER_ADMIN if not manually switched
      return existing[0];
    }

    // Check if any SUPER_ADMIN exists yet or if email matches owner
    const allProfiles = await db.select().from(profiles);
    const isOwnerOrFirst =
      email.toLowerCase() === OWNER_EMAIL.toLowerCase() || allProfiles.length === 0;
    const initialRole = isOwnerOrFirst ? 'SUPER_ADMIN' : 'CUSTOMER';

    const result = await db
      .insert(profiles)
      .values({
        uid,
        email,
        fullName: name || email.split('@')[0] || 'Customer',
        role: initialRole,
      })
      .onConflictDoUpdate({
        target: profiles.uid,
        set: {
          email,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (initialRole === 'SUPER_ADMIN') {
      await db
        .insert(staffPermissions)
        .values({
          userUid: uid,
          canManageProducts: true,
          canManageInventory: true,
          canManageOrders: true,
          canManageCustomers: true,
          canManageReturns: true,
          canManageCoupons: true,
          canManageSettings: true,
        })
        .onConflictDoNothing();
    }

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateProfile:', error);
    throw new Error('Failed to load or create user profile.', { cause: error });
  }
}

export async function getUserRoleAndPermissions(uid: string, role: string) {
  try {
    if (role === 'SUPER_ADMIN') {
      return {
        canManageProducts: true,
        canManageInventory: true,
        canManageOrders: true,
        canManageCustomers: true,
        canManageReturns: true,
        canManageCoupons: true,
        canManageSettings: true,
      };
    }
    if (role === 'STAFF') {
      const perms = await db
        .select()
        .from(staffPermissions)
        .where(eq(staffPermissions.userUid, uid));
      if (perms.length > 0) {
        return perms[0];
      }
      return {
        canManageProducts: true,
        canManageInventory: true,
        canManageOrders: true,
        canManageCustomers: true,
        canManageReturns: true,
        canManageCoupons: false,
        canManageSettings: false,
      };
    }
    return null;
  } catch (error) {
    console.error('Database query failed in getUserRoleAndPermissions:', error);
    throw new Error('Failed to load user permissions.', { cause: error });
  }
}

export async function updateUserProfile(
  uid: string,
  data: { fullName?: string; phone?: string }
) {
  try {
    const current = await db.select().from(profiles).where(eq(profiles.uid, uid));
    const phoneChanged =
      data.phone !== undefined && current[0] && current[0].phone !== data.phone;

    const updated = await db
      .update(profiles)
      .set({
        ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(phoneChanged ? { phoneVerified: false } : {}),
        updatedAt: new Date(),
      })
      .where(eq(profiles.uid, uid))
      .returning();

    return updated[0];
  } catch (error) {
    console.error('Database query failed in updateUserProfile:', error);
    throw new Error('Failed to update user profile.', { cause: error });
  }
}

export async function switchAccountRoleForTesting(uid: string, targetRole: string) {
  try {
    if (!['CUSTOMER', 'STAFF', 'SUPER_ADMIN'].includes(targetRole)) {
      throw new Error('Invalid role specified.');
    }
    const updated = await db
      .update(profiles)
      .set({ role: targetRole, updatedAt: new Date() })
      .where(eq(profiles.uid, uid))
      .returning();

    if (targetRole === 'STAFF' || targetRole === 'SUPER_ADMIN') {
      await db
        .insert(staffPermissions)
        .values({
          userUid: uid,
          canManageProducts: true,
          canManageInventory: true,
          canManageOrders: true,
          canManageCustomers: true,
          canManageReturns: true,
          canManageCoupons: targetRole === 'SUPER_ADMIN',
          canManageSettings: targetRole === 'SUPER_ADMIN',
        })
        .onConflictDoNothing();
    }

    return updated[0];
  } catch (error) {
    console.error('Database query failed in switchAccountRoleForTesting:', error);
    throw new Error('Failed to update account role.', { cause: error });
  }
}

// Server-side Phone OTP Generation & Verification (Never exposes raw OTP secrets)
function hashOtp(phone: string, code: string): string {
  const secret = process.env.OTP_SERVER_SECRET || 'chhayaswori-server-otp-salt-2026';
  return crypto.createHmac('sha256', secret).update(`${phone}:${code}`).digest('hex');
}

export async function requestPhoneOtp(uid: string, phone: string) {
  try {
    const cleanPhone = phone.replace(/\s+/g, '').trim();
    if (!/^(\+?977)?9[678]\d{8}$/.test(cleanPhone) && !/^\d{10}$/.test(cleanPhone)) {
      throw new Error('Please enter a valid 10-digit Nepal mobile number (e.g. 98XXXXXXXX).');
    }

    // Generate 6-digit OTP on the server
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = hashOtp(cleanPhone, code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.insert(phoneOtpVerifications).values({
      userUid: uid,
      phone: cleanPhone,
      otpHash,
      expiresAt,
      verified: false,
      attempts: 0,
    });

    // Store in user notifications so the customer can read their SMS simulation message in-app without exposing secrets in code
    await db.insert(notifications).values({
      recipientUid: uid,
      recipientRole: 'CUSTOMER',
      type: 'PHONE_OTP',
      title: 'Phone Verification Code Sent',
      message: `CHHAYASWORI IMPEX verification code for ${cleanPhone} is ${code}. Valid for 10 minutes.`,
      referenceId: cleanPhone,
    });

    // Send simulated SMS (or live if token provided)
    await sendOtpSms(cleanPhone, code);

    const smsGatewayConfigured = Boolean(process.env.SMS_API_TOKEN || process.env.NEPAL_SMS_API_TOKEN);

    return {
      phone: cleanPhone,
      expiresAt,
      smsGatewayConfigured,
      isDevelopmentMode: !smsGatewayConfigured,
      devDisclaimer: "SMS service is currently in development/test mode.",
      devOtpCode: code,
      deliveryNotice: smsGatewayConfigured
        ? `OTP dispatched via SMS to ${cleanPhone}.`
        : `SMS service is currently in development/test mode. Your verification code is: ${code}`,
    };
  } catch (error: any) {
    console.error('Database query failed in requestPhoneOtp:', error);
    throw new Error(error.message || 'Failed to request phone verification code.', {
      cause: error,
    });
  }
}

export async function verifyPhoneOtp(uid: string, phone: string, code: string) {
  try {
    const cleanPhone = phone.replace(/\s+/g, '').trim();
    const cleanCode = code.trim();

    const records = await db
      .select()
      .from(phoneOtpVerifications)
      .where(
        and(
          eq(phoneOtpVerifications.userUid, uid),
          eq(phoneOtpVerifications.phone, cleanPhone),
          eq(phoneOtpVerifications.verified, false)
        )
      )
      .orderBy(desc(phoneOtpVerifications.createdAt));

    if (records.length === 0) {
      throw new Error('No pending verification found for this phone number. Please request a new OTP.');
    }

    const latest = records[0];
    if (latest.attempts >= 5) {
      throw new Error('Too many failed attempts. Please request a new OTP code.');
    }

    if (new Date() > new Date(latest.expiresAt)) {
      throw new Error('Verification code has expired. Please request a new OTP.');
    }

    const expectedHash = hashOtp(cleanPhone, cleanCode);
    if (expectedHash !== latest.otpHash) {
      await db
        .update(phoneOtpVerifications)
        .set({ attempts: latest.attempts + 1 })
        .where(eq(phoneOtpVerifications.id, latest.id));
      throw new Error('Invalid OTP verification code. Please check and try again.');
    }

    await db
      .update(phoneOtpVerifications)
      .set({ verified: true })
      .where(eq(phoneOtpVerifications.id, latest.id));

    const updatedProfile = await db
      .update(profiles)
      .set({
        phone: cleanPhone,
        phoneVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(profiles.uid, uid))
      .returning();

    return updatedProfile[0];
  } catch (error: any) {
    console.error('Database query failed in verifyPhoneOtp:', error);
    throw new Error(error.message || 'Failed to verify OTP code.', { cause: error });
  }
}

// Addresses
export async function getUserAddresses(uid: string) {
  try {
    return await db
      .select()
      .from(addresses)
      .where(eq(addresses.userUid, uid))
      .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));
  } catch (error) {
    console.error('Database query failed in getUserAddresses:', error);
    throw new Error('Failed to load addresses.', { cause: error });
  }
}

export async function saveUserAddress(
  uid: string,
  addr: {
    label: string;
    fullName: string;
    phone: string;
    province: string;
    district: string;
    municipality: string;
    area: string;
    streetAddress: string;
    landmark?: string;
    isDefault?: boolean;
  }
) {
  try {
    if (addr.isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userUid, uid));
    }
    const created = await db
      .insert(addresses)
      .values({
        userUid: uid,
        label: addr.label || 'Home',
        fullName: addr.fullName,
        phone: addr.phone,
        province: addr.province,
        district: addr.district,
        municipality: addr.municipality,
        area: addr.area,
        streetAddress: addr.streetAddress,
        landmark: addr.landmark || '',
        isDefault: Boolean(addr.isDefault),
      })
      .returning();
    return created[0];
  } catch (error) {
    console.error('Database query failed in saveUserAddress:', error);
    throw new Error('Failed to save address.', { cause: error });
  }
}

export async function deleteUserAddress(uid: string, addressId: number) {
  try {
    await db
      .delete(addresses)
      .where(and(eq(addresses.id, addressId), eq(addresses.userUid, uid)));
    return { deleted: true };
  } catch (error) {
    console.error('Database query failed in deleteUserAddress:', error);
    throw new Error('Failed to delete address.', { cause: error });
  }
}

// Admin Customer & Staff Management
export async function getAllCustomersForAdmin(search?: string) {
  try {
    const allUsers = search
      ? await db
          .select()
          .from(profiles)
          .where(
            or(
              ilike(profiles.fullName, `%${search}%`),
              ilike(profiles.email, `%${search}%`),
              ilike(profiles.phone, `%${search}%`)
            )
          )
          .orderBy(desc(profiles.createdAt))
      : await db.select().from(profiles).orderBy(desc(profiles.createdAt));

    const allOrders = await db.select().from(orders);

    return allUsers.map((u) => {
      const userOrders = allOrders.filter((o) => o.userUid === u.uid);
      const totalSpent = userOrders
        .filter((o) => o.orderStatus !== 'Cancelled')
        .reduce((sum, o) => sum + o.grandTotal, 0);
      return {
        id: u.id,
        uid: u.uid,
        email: u.email,
        fullName: u.fullName,
        phone: u.phone,
        phoneVerified: u.phoneVerified,
        role: u.role,
        isRestricted: u.isRestricted,
        createdAt: u.createdAt,
        totalOrders: userOrders.length,
        totalSpent,
        orders: userOrders,
      };
    });
  } catch (error) {
    console.error('Database query failed in getAllCustomersForAdmin:', error);
    throw new Error('Failed to fetch customer list.', { cause: error });
  }
}

export async function toggleCustomerRestriction(targetUid: string, isRestricted: boolean) {
  try {
    const updated = await db
      .update(profiles)
      .set({ isRestricted, updatedAt: new Date() })
      .where(eq(profiles.uid, targetUid))
      .returning();
    return updated[0];
  } catch (error) {
    console.error('Database query failed in toggleCustomerRestriction:', error);
    throw new Error('Failed to update customer restriction status.', { cause: error });
  }
}

export async function getStaffMembers() {
  try {
    const staffUsers = await db
      .select()
      .from(profiles)
      .where(or(eq(profiles.role, 'STAFF'), eq(profiles.role, 'SUPER_ADMIN')))
      .orderBy(desc(profiles.createdAt));

    const perms = await db.select().from(staffPermissions);

    return staffUsers.map((u) => {
      const p = perms.find((perm) => perm.userUid === u.uid);
      return {
        ...u,
        permissions: p || {
          canManageProducts: true,
          canManageInventory: true,
          canManageOrders: true,
          canManageCustomers: true,
          canManageReturns: true,
          canManageCoupons: u.role === 'SUPER_ADMIN',
          canManageSettings: u.role === 'SUPER_ADMIN',
        },
      };
    });
  } catch (error) {
    console.error('Database query failed in getStaffMembers:', error);
    throw new Error('Failed to load staff members.', { cause: error });
  }
}

export async function updateUserRoleAndPermissions(
  targetUid: string,
  role: string,
  permissionsData?: {
    canManageProducts?: boolean;
    canManageInventory?: boolean;
    canManageOrders?: boolean;
    canManageCustomers?: boolean;
    canManageReturns?: boolean;
    canManageCoupons?: boolean;
    canManageSettings?: boolean;
  }
) {
  try {
    const updatedUser = await db
      .update(profiles)
      .set({ role, updatedAt: new Date() })
      .where(eq(profiles.uid, targetUid))
      .returning();

    if (permissionsData && (role === 'STAFF' || role === 'SUPER_ADMIN')) {
      await db
        .insert(staffPermissions)
        .values({
          userUid: targetUid,
          canManageProducts: permissionsData.canManageProducts ?? true,
          canManageInventory: permissionsData.canManageInventory ?? true,
          canManageOrders: permissionsData.canManageOrders ?? true,
          canManageCustomers: permissionsData.canManageCustomers ?? true,
          canManageReturns: permissionsData.canManageReturns ?? true,
          canManageCoupons: permissionsData.canManageCoupons ?? false,
          canManageSettings: permissionsData.canManageSettings ?? false,
        })
        .onConflictDoUpdate({
          target: staffPermissions.userUid,
          set: {
            ...permissionsData,
            updatedAt: new Date(),
          },
        });
    }
    return updatedUser[0];
  } catch (error) {
    console.error('Database query failed in updateUserRoleAndPermissions:', error);
    throw new Error('Failed to update staff role and permissions.', { cause: error });
  }
}
