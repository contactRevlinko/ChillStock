import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    branchId?: string;
    subscriptionEndDate?: string | Date;
    paymentStatus?: string;
    [key: string]: any;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret") as any;
    
    // Check if user still exists in the database
    const userId = decoded.userId || decoded.id;
    const dbUser = await User.findById(userId);
    if (!dbUser) {
      return res.status(401).json({ message: "Account deleted or disabled" });
    }

    req.user = {
      ...decoded,
      userId: userId,
      subscriptionEndDate: dbUser.subscriptionEndDate,
      paymentStatus: dbUser.paymentStatus,
      role: dbUser.role
    };

    // Auto-logout enforcement: If the subscription is expired, kick them out
    if (req.user.role === 'admin' && req.user.subscriptionEndDate) {
      if (new Date(req.user.subscriptionEndDate) < new Date()) {
        return res.status(401).json({ message: "Subscription expired. Please renew." });
      }
    }

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== "admin" && req.user?.role !== "super_admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// Super admin only middleware
export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== "super_admin") {
    return res.status(403).json({ message: "Super admin access required" });
  }
  next();
};

export const requireBranch = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== "branch" && req.user?.role !== "admin" && req.user?.role !== "super_admin") {
    return res.status(403).json({ message: "Branch access required" });
  }
  next();
};

export const requireActiveSubscription = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role === "super_admin" || req.user?.role === "branch") {
    return next();
  }
  
  if (req.user?.role === "admin") {
    const { paymentStatus, subscriptionEndDate } = req.user as any;
    
    if (paymentStatus !== "Paid") {
      return res.status(402).json({ message: "Payment required. Subscription is not active.", redirect: "/admin/pricing" });
    }
    
    if (subscriptionEndDate && new Date(subscriptionEndDate) < new Date()) {
      return res.status(402).json({ message: "Subscription expired.", redirect: "/admin/pricing", expired: true });
    }
    
    return next();
  }
  
  return res.status(403).json({ message: "Access denied" });
};
