// server/routes/superadmin.routes.ts
import { Router } from "express";
import { authenticate, requireSuperAdmin } from "../middleware/auth.js";
import { User } from "../models/User.js";
import bcrypt from "bcryptjs";
import { Branch } from "../models/Branch.js";
import { BranchProduct } from "../models/BranchProduct.js";
import { GlobalProduct } from "../models/GlobalProduct.js";
import { PaymentHistory } from "../models/PaymentHistory.js";
import { Sale } from "../models/Sale.js";
import { Settings } from "../models/Settings.js";
import { StockIn } from "../models/StockIn.js";
import { StockTransfer } from "../models/StockTransfer.js";
const router = Router();
router.use(authenticate);
router.use(requireSuperAdmin);

// List all admins with branch info (Super admin only)
router.get("/admins", async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" })
      .populate("branchId")
      .lean();
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: "Error fetching admins" });
  }
});

// Get single admin detail (Super admin only)
router.get("/admins/:id", async (req, res) => {
  try {
    const admin = await User.findOne({ _id: req.params.id, role: "admin" })
      .populate("branchId")
      .lean();
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: "Error fetching admin" });
  }
});

// Create a new admin (Super admin only)
router.post('/admins', async (req, res) => {
  try {
    const { name, email, password, branchId, phone, companyName, isEnabled } = req.body;
    // Ensure branch is not already assigned to another admin
    if (branchId) {
      const existing = await User.findOne({ role: 'admin', branchId });
      if (existing) {
        return res.status(400).json({ message: 'Branch already assigned to another admin' });
      }
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const adminUser = new User({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      branchId: branchId || undefined,
      phone: phone || undefined,
      companyName: companyName || undefined,
      isEnabled: isEnabled !== undefined ? isEnabled : true,
    });
    await adminUser.save();
    res.json({ message: "Admin user created" });
  } catch (error) {
    res.status(500).json({ message: "Error creating admin" });
  }
});

// Delete an admin (Super admin only) - CASCADE DELETE
router.delete('/admins/:id', async (req, res) => {
  try {
    const adminId = req.params.id;

    // Verify admin exists
    const admin = await User.findOne({ _id: adminId, role: 'admin' });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    // 1. Find all branches of this admin
    const branches = await Branch.find({ adminId });
    const branchIds = branches.map(b => b._id);

    // 2. Delete branch users (managers)
    await User.deleteMany({ role: 'branch', branchId: { $in: branchIds } });

    // 3. Delete branch related data
    await Sale.deleteMany({ branchId: { $in: branchIds } });
    await BranchProduct.deleteMany({ branchId: { $in: branchIds } });
    await StockTransfer.deleteMany({ branchId: { $in: branchIds } });
    await Branch.deleteMany({ adminId });

    // 4. Find all global products of this admin
    const globalProducts = await GlobalProduct.find({ adminId });
    const globalProductIds = globalProducts.map(p => p._id);

    // 5. Delete global product related data
    await StockIn.deleteMany({ globalProductId: { $in: globalProductIds } });
    await StockTransfer.deleteMany({ globalProductId: { $in: globalProductIds } }); // Catch any remaining
    await GlobalProduct.deleteMany({ adminId });

    // 6. Delete other admin data
    await PaymentHistory.deleteMany({ adminId });
    await Settings.deleteMany({ adminId });

    // 7. Finally delete the admin user
    await User.deleteOne({ _id: adminId, role: 'admin' });

    res.json({ message: 'Admin and all associated data permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting admin and associated data' });
  }
});

// Update an admin (Super admin only)
router.put('/admins/:id', async (req, res) => {
  try {
    const { name, email, password, branchId, phone, companyName } = req.body;
    const update: any = {};
    if (name) update.name = name;
    if (email) update.email = email;
    if (phone !== undefined) update.phone = phone;
    if (companyName !== undefined) update.companyName = companyName;
    if (password) update.password = await bcrypt.hash(password, 10);
    if (branchId) {
      // Ensure the new branch is not used by another admin
      const conflict = await User.findOne({ _id: { $ne: req.params.id }, role: 'admin', branchId });
      if (conflict) {
        return res.status(400).json({ message: 'Branch already assigned to another admin' });
      }
      update.branchId = branchId;
    }
    const admin = await User.findOneAndUpdate({ _id: req.params.id, role: 'admin' }, update, { new: true });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    res.json({ message: 'Admin updated', admin });
  } catch (error) {
    res.status(500).json({ message: 'Error updating admin' });
  }
});

export default router;
