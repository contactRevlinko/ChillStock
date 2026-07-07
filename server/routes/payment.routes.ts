import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { authenticate, requireSuperAdmin } from "../middleware/auth";
import { Settings } from "../models/Settings";
import { Package } from "../models/Package";
import { User } from "../models/User";
import { PaymentHistory } from "../models/PaymentHistory";

const router = express.Router();

// Get public Razorpay Key ID for frontend
router.get("/key", async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    res.json({ keyId: settings.razorpayKeyId });
  } catch (err) {
    res.status(500).json({ message: "Error fetching Razorpay Key" });
  }
});

// Create Order (Admin)
router.post("/create-order", authenticate, async (req, res) => {
  try {
    const { packageId } = req.body;
    if (req.user?.role !== "admin") return res.status(403).json({ message: "Only admins can purchase subscriptions" });

    const pkg = await Package.findById(packageId);
    if (!pkg || !pkg.isActive) return res.status(404).json({ message: "Package not found or inactive" });

    const settings = await Settings.findOne();
    if (!settings) return res.status(500).json({ message: "Razorpay settings not configured" });

    const instance = new Razorpay({
      key_id: settings.razorpayKeyId,
      key_secret: settings.razorpayKeySecret,
    });

    const options = {
      amount: pkg.price * 100, // amount in the smallest currency unit (paise)
      currency: "INR",
      receipt: `rcpt_${req.user.userId.slice(-6)}_${Date.now()}` // Max 40 chars
    };

    const order = await instance.orders.create(options);
    if (!order) return res.status(500).json({ message: "Some error occured with Razorpay" });

    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message || error.description || "Error creating Razorpay order", details: error });
  }
});

// Verify Payment and Activate Subscription
router.post("/verify", authenticate, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, packageId } = req.body;
    if (req.user?.role !== "admin") return res.status(403).json({ message: "Only admins can purchase subscriptions" });

    const settings = await Settings.findOne();
    if (!settings) return res.status(500).json({ message: "Razorpay settings not configured" });

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", settings.razorpayKeySecret)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Payment is successful
      const pkg = await Package.findById(packageId);
      if (!pkg) return res.status(404).json({ message: "Package not found" });

      const admin = await User.findById(req.user.userId);
      if (!admin) return res.status(404).json({ message: "Admin not found" });

      // Update User subscription
      admin.packageId = pkg._id as any;
      admin.paymentStatus = "Paid";
      admin.subscriptionStatus = "Active";
      admin.paymentId = razorpay_payment_id;
      admin.orderId = razorpay_order_id;
      admin.lastPaymentDate = new Date();
      admin.subscriptionStartDate = new Date();
      
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + pkg.durationDays);
      admin.subscriptionEndDate = endDate;
      
      await admin.save();

      // Log payment history
      const history = new PaymentHistory({
        adminId: admin._id,
        packageId: pkg._id,
        amount: pkg.price,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        status: "Paid"
      });
      await history.save();

      return res.status(200).json({ message: "Payment verified successfully" });
    } else {
      // Record failed payment
      const pkg = await Package.findById(packageId);
      if (pkg) {
        const history = new PaymentHistory({
          adminId: req.user.userId,
          packageId: pkg._id,
          amount: pkg.price,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          status: "Failed"
        });
        await history.save();
      }
      return res.status(400).json({ message: "Invalid signature sent!" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error!" });
  }
});

// Get Payment History (Super Admin)
router.get("/history", authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const history = await PaymentHistory.find()
      .populate("adminId", "name email companyName")
      .populate("packageId", "name price")
      .sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: "Error fetching history" });
  }
});

export default router;
