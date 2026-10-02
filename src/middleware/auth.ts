import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { getOrCreateProfile, getUserRoleAndPermissions } from '../db/users.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  profile?: {
    id: number;
    uid: string;
    email: string;
    fullName: string;
    phone: string;
    phoneVerified: boolean;
    role: string;
    isRestricted: boolean;
  };
  permissions?: {
    canManageProducts: boolean;
    canManageInventory: boolean;
    canManageOrders: boolean;
    canManageCustomers: boolean;
    canManageReturns: boolean;
    canManageCoupons: boolean;
    canManageSettings: boolean;
  } | null;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing authentication token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    const profile = await getOrCreateProfile(
      decodedToken.uid,
      decodedToken.email || '',
      decodedToken.name || ''
    );
    if (profile.isRestricted) {
      return res.status(403).json({ error: 'Your account has been restricted. Please contact customer support.' });
    }
    req.profile = profile;
    const perms = await getUserRoleAndPermissions(decodedToken.uid, profile.role);
    req.permissions = perms;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

export const requireStaffOrAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.profile) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.profile.role !== 'SUPER_ADMIN' && req.profile.role !== 'STAFF') {
    return res.status(403).json({ error: 'Forbidden: Admin or Staff access required' });
  }
  next();
};

export const requireSuperAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.profile) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.profile.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Super Admin access required' });
  }
  next();
};
