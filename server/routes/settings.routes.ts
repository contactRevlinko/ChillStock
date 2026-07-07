import express from "express";
import { Settings } from "../models/Settings";
import { authenticate, requireSuperAdmin } from "../middleware/auth";

const router = express.Router();

// GET Razorpay Config (For frontend to know Key ID)
router.get("/razorpay/config", async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings || !settings.razorpayKeyId) {
      return res.json({ configured: false });
    }
    res.json({ configured: true, keyId: settings.razorpayKeyId });
  } catch (err) {
    res.status(500).json({ message: "Error fetching config" });
  }
});

// GET Razorpay Keys (Super Admin)
router.get("/razorpay", authenticate, requireSuperAdmin, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: "Error fetching settings" });
  }
});

// UPDATE Razorpay Keys (Super Admin)
router.put("/razorpay", authenticate, requireSuperAdmin, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      settings.razorpayKeyId = req.body.razorpayKeyId;
      settings.razorpayKeySecret = req.body.razorpayKeySecret;
    }
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: "Error updating settings" });
  }
});

// GET SMTP Settings (Super Admin)
router.get("/smtp", authenticate, requireSuperAdmin, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    res.json({
      smtpHost: settings.smtpHost || "",
      smtpPort: settings.smtpPort || "",
      smtpUser: settings.smtpUser || "",
      smtpPassword: settings.smtpPassword || ""
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching SMTP settings" });
  }
});

// UPDATE SMTP Settings (Super Admin)
router.put("/smtp", authenticate, requireSuperAdmin, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    settings.smtpHost = req.body.smtpHost;
    settings.smtpPort = req.body.smtpPort;
    settings.smtpUser = req.body.smtpUser;
    settings.smtpPassword = req.body.smtpPassword;
    await settings.save();
    res.json({ message: "SMTP Settings updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error updating SMTP settings" });
  }
});

export default router;
