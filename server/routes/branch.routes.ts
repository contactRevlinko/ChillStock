import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { AuthRequest } from "../middleware/auth.js";
import { Sale } from "../models/Sale.js";
import { BranchProduct } from "../models/BranchProduct.js";
import { StockTransfer } from "../models/StockTransfer.js";

const router = Router();
router.use(authenticate);

// PENDING TRANSFERS
router.get("/transfers/pending", async (req: AuthRequest, res) => {
  try {
    const branchId = req.user?.branchId;
    const transfers = await StockTransfer.find({ branchId, status: "pending" })
      .populate("globalProductId")
      .populate("transferredBy", "name email")
      .sort({ createdAt: -1 });
    res.json(transfers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching pending transfers" });
  }
});

// ACCEPT TRANSFER
router.post("/transfers/:id/accept", async (req: AuthRequest, res) => {
  try {
    const { sellingPrice } = req.body;
    const branchId = req.user?.branchId;
    
    if (typeof sellingPrice !== "number" || sellingPrice <= 0) {
      return res.status(400).json({ message: "Invalid selling price" });
    }

    const transfer = await StockTransfer.findOne({ _id: req.params.id, branchId, status: "pending" });
    if (!transfer) return res.status(404).json({ message: "Pending transfer not found" });

    // Update transfer status
    transfer.status = "accepted";
    transfer.sellingPrice = sellingPrice;
    await transfer.save();

    // Check if BranchProduct exists
    let branchProduct = await BranchProduct.findOne({
      branchId,
      globalProductId: transfer.globalProductId,
      transferRate: transfer.transferRate,
      sellingPrice: sellingPrice
    });

    if (branchProduct) {
      branchProduct.currentStock += transfer.quantity;
      await branchProduct.save();
    } else {
      branchProduct = new BranchProduct({
        branchId,
        globalProductId: transfer.globalProductId,
        transferRate: transfer.transferRate,
        sellingPrice: sellingPrice,
        currentStock: transfer.quantity,
        lowStockThreshold: 10
      });
      await branchProduct.save();
    }

    res.json({ message: "Transfer accepted successfully", branchProduct });
  } catch (error) {
    res.status(500).json({ message: "Error accepting transfer" });
  }
});


// INVENTORY (Branch Products)
router.get("/inventory/:branchId", async (req: AuthRequest, res) => {
  try {
    const { branchId } = req.params;
    // Enforce branch isolation for non-super admins
    if (req.user?.role !== "super_admin" && branchId !== req.user?.branchId?.toString()) {
      return res.status(403).json({ message: "Access denied: cannot view inventory of other branches" });
    }
    const products = await BranchProduct.find({ branchId }).populate("globalProductId").sort({ createdAt: -1 });
    
    // We map it back to a somewhat compatible format for the frontend
    const merged = products.map(p => {
      return {
        product: {
           ...((p.globalProductId as any).toObject ? (p.globalProductId as any).toObject() : p.globalProductId),
           _id: p.globalProductId._id, // the GlobalProduct ID
        },
        branchProductId: p._id,
        transferRate: p.transferRate,
        sellingPrice: p.sellingPrice,
        currentStock: p.currentStock,
        lowStockThreshold: p.lowStockThreshold
      };
    });
    
    res.json(merged);
  } catch (error) {
    res.status(500).json({ message: "Error fetching inventory" });
  }
});

// Update lowStockThreshold (Only thing they can update on a product)
router.put("/inventory/:id", async (req: AuthRequest, res) => {
  try {
    const { lowStockThreshold } = req.body;
    const branchProduct = await BranchProduct.findOneAndUpdate(
       { _id: req.params.id, branchId: req.user?.branchId },
       { lowStockThreshold },
       { new: true }
    );
    res.json(branchProduct);
  } catch (error) {
    res.status(500).json({ message: "Error updating inventory" });
  }
});

// SALES
router.post("/sales", async (req: AuthRequest, res) => {
  try {
    const { items } = req.body;
    const branchId = req.user?.branchId;
    const soldBy = req.user?.userId;
    
    const salesRecords = [];
    
    for (const item of items) {
      // Deduct from branch product stock
      const branchProduct = await BranchProduct.findOne({ _id: item.branchProductId, branchId });
      if (!branchProduct || branchProduct.currentStock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock` });
      }
      
      branchProduct.currentStock -= item.quantity;
      await branchProduct.save();
      
      const totalAmount = item.quantity * branchProduct.sellingPrice;
      const profitPerItem = branchProduct.sellingPrice - branchProduct.transferRate;
      const totalProfit = item.quantity * profitPerItem;
      
      // Create sale record
      const sale = new Sale({
        branchId,
        globalProductId: branchProduct.globalProductId,
        branchProductId: branchProduct._id,
        quantity: item.quantity,
        transferRate: branchProduct.transferRate,
        priceAtSale: branchProduct.sellingPrice,
        totalAmount,
        totalProfit,
        soldBy,
        note: item.note || ""
      });
      await sale.save();
      salesRecords.push(sale);
    }
    
    res.status(201).json({ message: "Sale complete", sales: salesRecords });
  } catch (error) {
    res.status(500).json({ message: "Error processing sale" });
  }
});

router.get("/sales/:branchId", async (req: AuthRequest, res) => {
  try {
    const { branchId } = req.params;
    // Admins can only view their own branch's sales
    if (req.user?.role !== "super_admin" && branchId !== req.user?.branchId?.toString()) {
      return res.status(403).json({ message: "Access denied: cannot view sales of other branches" });
    }
    const { from, to } = req.query;

    let query: any = { branchId };

    if (from && to) {
      query.createdAt = {
        $gte: new Date(from as string),
        $lte: new Date(to as string)
      };
    }

    const sales = await Sale.find(query)
      .populate('globalProductId')
      .populate('branchProductId')
      .populate('soldBy')
      .sort({ createdAt: -1 });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: "Error fetching sales" });
  }
});

export default router;
