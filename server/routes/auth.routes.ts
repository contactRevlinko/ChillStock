import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const router = Router();

router.get('/debug/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ email: user.email, role: user.role, password: user.password });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/company', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.json({ companyName: 'Sign In' });
    const user = await User.findOne({ email: email as string });
    if (user && user.role === 'super_admin') {
      return res.json({ companyName: 'SUPER ADMIN' });
    }
    if (user && user.companyName) {
      return res.json({ companyName: user.companyName });
    }
    return res.json({ companyName: 'Sign In' });
  } catch (error) {
    return res.json({ companyName: 'Sign In' });
  }
});

router.post('/login', async (req, res) => {
  try {
    // Fallback for non‑JSON payloads (e.g., raw string body)
    let body = req.body;
    if (typeof body === 'string' && body.length) {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid JSON payload' });
      }
    }
    const { email, password } = body;
    console.log('Login request body:', body);
    const user = await User.findOne({ email });
      console.log('Found user:', { email: user?.email, role: user?.role, passwordHash: user?.password });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isValid = await bcrypt.compare(password, user.password || "");
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    // Check expiry for admin
    if (user.role === 'admin' && user.subscriptionEndDate && new Date(user.subscriptionEndDate) < new Date()) {
      user.paymentStatus = 'Expired';
      user.subscriptionStatus = 'Expired';
      await user.save();
    }

    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role, 
        branchId: user.branchId,
        paymentStatus: user.paymentStatus,
        subscriptionEndDate: user.subscriptionEndDate
      },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "24h" }
    );

    
    console.log('Generated token:', token);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
        companyName: user.companyName,
        paymentStatus: user.paymentStatus,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionEndDate: user.subscriptionEndDate
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, companyName, phone } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      companyName,
      phone,
      role: 'admin',
      paymentStatus: 'Pending',
      subscriptionStatus: 'Inactive'
    });

    await user.save();

    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role, 
        branchId: user.branchId,
        paymentStatus: user.paymentStatus,
        subscriptionEndDate: user.subscriptionEndDate
      },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "24h" }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
        companyName: user.companyName,
        paymentStatus: user.paymentStatus,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionEndDate: user.subscriptionEndDate
      }
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error during signup" });
  }
});

import { authenticate } from "../middleware/auth";

router.get('/me', authenticate, async (req: any, res) => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Re-check expiry on /me just in case
    if (user.role === 'admin' && user.subscriptionEndDate && new Date(user.subscriptionEndDate) < new Date()) {
      user.paymentStatus = 'Expired';
      user.subscriptionStatus = 'Expired';
      await user.save();
    }
    
    res.json({
      token: req.header("Authorization")?.replace("Bearer ", ""),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
        companyName: user.companyName,
        paymentStatus: user.paymentStatus,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionEndDate: user.subscriptionEndDate
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
