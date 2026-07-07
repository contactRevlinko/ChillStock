import express from "express";
import { Package } from "../models/Package";
import { authenticate, requireSuperAdmin } from "../middleware/auth";

const router = express.Router();

// GET all active packages (Public / Admins)
router.get("/active", async (req, res) => {
  try {
    const packages = await Package.find({ isActive: true }).sort({ price: 1 });
    res.json(packages);
  } catch (err) {
    res.status(500).json({ message: "Error fetching packages" });
  }
});

// GET all packages (Super Admin)
router.get("/", authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const packages = await Package.find().sort({ createdAt: -1 });
    res.json(packages);
  } catch (err) {
    res.status(500).json({ message: "Error fetching packages" });
  }
});

// CREATE Package (Super Admin)
router.post("/", authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const newPackage = new Package(req.body);
    await newPackage.save();
    res.status(201).json(newPackage);
  } catch (err) {
    res.status(500).json({ message: "Error creating package" });
  }
});

// UPDATE Package (Super Admin)
router.put("/:id", authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const updated = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Package not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Error updating package" });
  }
});

// DELETE Package (Super Admin)
router.delete("/:id", authenticate, requireSuperAdmin, async (req, res) => {
  try {
    await Package.findByIdAndDelete(req.params.id);
    res.json({ message: "Package deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting package" });
  }
});

export default router;
