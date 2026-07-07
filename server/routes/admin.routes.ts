import { Router } from "express";
import { authenticate, requireAdmin, requireSuperAdmin, requireActiveSubscription } from "../middleware/auth.js";
import { Branch } from "../models/Branch.js";
import { GlobalProduct } from "../models/GlobalProduct.js";
import { BranchProduct } from "../models/BranchProduct.js";
import { StockTransfer } from "../models/StockTransfer.js";
import { StockIn } from "../models/StockIn.js";
import { Sale } from "../models/Sale.js";
import { User } from "../models/User.js";
import ActivityLog from "../models/ActivityLog.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const router = Router();
router.use(authenticate);
router.use(requireActiveSubscription);
// Removed global requireAdmin to allow super admin specific routes. Individual routes will use requireAdmin or requireSuperAdmin as needed.

// BRANCHES
router.get("/branches", async (req, res) => {
  try {
    // Super admin should not have access to branch list
    if (req.user.role === "super_admin") {
      return res.status(403).json({ message: "Super admin cannot view branches" });
    }
    // Regular admin sees only branches they created (adminId)
    const adminId = new mongoose.Types.ObjectId(req.user.userId);
    const branches = await Branch.find({ adminId }).sort({ createdAt: -1 }).lean();
    // Add hasUser flag for each branch
    const branchesWithUsers = await Promise.all(
      branches.map(async (b) => {
        const hasUser = await User.exists({ branchId: b._id });
        return { ...b, hasUser: !!hasUser };
      })
    );
    res.json(branchesWithUsers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching branches" });
  }
});

// ACTIVITY LOGS
router.get("/activity-logs", requireAdmin, requireActiveSubscription, async (req: any, res) => {
  try {
    const filter: any = req.user.role === "super_admin" ? {} : { adminId: req.user.userId };
    
    if (req.query.startDate && req.query.endDate) {
      const start = new Date(req.query.startDate as string);
      start.setHours(0, 0, 0, 0);

      const end = new Date(req.query.endDate as string);
      end.setHours(23, 59, 59, 999);

      filter.createdAt = {
        $gte: start,
        $lte: end
      };
    }
    
    if (req.query.export === 'true') {
      const logs = await ActivityLog.find(filter).sort({ createdAt: -1 });
      return res.json({ logs });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const skip = (page - 1) * limit;

    const total = await ActivityLog.countDocuments(filter);
    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    res.json({
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching activity logs" });
  }
});

router.post("/branches", async (req, res) => {
  try {
    // Only branch admins can create a branch; super admin should not have branches
    if (req.user.role === "super_admin") {
      return res.status(403).json({ message: "Super admin cannot create branches" });
    }
    const branch = new Branch({ ...req.body, adminId: new mongoose.Types.ObjectId(req.user.userId) });
    await branch.save();
    
    await ActivityLog.create({
      adminId: req.user.userId,
      action: "Created Branch",
      details: `Added new branch ${branch.name}`
    });
    
    res.status(201).json(branch);
  } catch (error) {
    res.status(500).json({ message: "Error creating branch", error });
  }
});

router.put("/branches/:id", async (req, res) => {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    if (branch) {
      await ActivityLog.create({
        adminId: req.user.userId,
        action: "Updated Branch",
        details: `Updated details for branch ${branch.name}`
      });
    }

    res.json(branch);
  } catch (error) {
    res.status(500).json({ message: "Error updating branch" });
  }
});

router.delete("/branches/:id", async (req, res) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    await User.deleteMany({ branchId: req.params.id }); 
    
    if (branch) {
      await ActivityLog.create({
        adminId: req.user.userId,
        action: "Deleted Branch",
        details: `Deleted branch ${branch.name} and associated users`
      });
    }
    
    res.json({ message: "Branch deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting branch" });
  }
});

// GLOBAL PRODUCTS
router.get("/products", async (req, res) => {
  try {
    const adminId = new mongoose.Types.ObjectId(req.user.userId);
    const products = await GlobalProduct.find({ adminId }).sort({ createdAt: -1 }).lean();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching global products" });
  }
});

router.get("/products/:id/expectation", async (req, res) => {
  try {
    const product = await GlobalProduct.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const stockInRecords = await StockIn.find({ globalProductId: new mongoose.Types.ObjectId(req.params.id) })
      .populate('addedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const stockOutRecords = await StockTransfer.find({ globalProductId: new mongoose.Types.ObjectId(req.params.id) })
      .populate('branchId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const totalIn = stockInRecords.reduce((sum, record) => sum + record.quantity, 0);
    const inCount = stockInRecords.length;
    
    const totalOut = stockOutRecords.reduce((sum, record) => sum + record.quantity, 0);
    const outCount = stockOutRecords.length;

    res.json({
      product: { name: product.name, sku: product.sku, currentStock: product.globalStock },
      stockIn: { total: totalIn, count: inCount, records: stockInRecords },
      stockOut: { total: totalOut, count: outCount, records: stockOutRecords },
      expectation: totalIn - totalOut
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

router.post("/products", async (req, res) => {
  try {
    console.log("POST /products body:", req.body);
    const adminId = new mongoose.Types.ObjectId(req.user.userId);
    const productData = { ...req.body, adminId };
    console.log("productData:", productData);
    const product = new GlobalProduct(productData);
    console.log("product before save:", product);
    await product.save();
    
    if (product.globalStock > 0) {
      await StockIn.create({
        globalProductId: product._id,
        quantity: product.globalStock,
        addedBy: adminId
      });
    }

    await ActivityLog.create({
      adminId: req.user.userId,
      action: "Added Product",
      details: `Added new product: ${product.name} (${product.globalStock || 0} pcs)`
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("POST /products error:", error);
    res.status(500).json({ message: "Error creating global product", error });
  }
});

router.post("/products/bulk", async (req, res) => {
  try {
    const products = req.body.products;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Invalid products array" });
    }
    
    // Check for duplicates
    const skus = products.map(p => p.sku);
    const existing = await GlobalProduct.find({ sku: { $in: skus } });
    if (existing.length > 0) {
      const existingSkus = existing.map(p => p.sku).join(", ");
      return res.status(400).json({ message: `Duplicate SKUs found: ${existingSkus}` });
    }

    const productsWithAdmin = products.map((p: any) => ({
      ...p,
      adminId: req.user.userId
    }));

    const created = await GlobalProduct.insertMany(productsWithAdmin);

    const productNames = created.map(p => `${p.name} (${p.globalStock || 0} pcs)`).join(', ');
    await ActivityLog.create({
      adminId: req.user.userId,
      action: "Bulk Added Products",
      details: `Added ${created.length} new products via bulk import: ${productNames}`
    });

    res.status(201).json({ message: "Products created successfully", count: created.length });
  } catch (error) {
    res.status(500).json({ message: "Error in bulk product creation", error });
  }
});

router.put("/products/:id", async (req: any, res) => {
  try {
    // If adding stock, you might just do currentStock += extra
    if (req.body.addStock) {
       const product = await GlobalProduct.findById(req.params.id);
       if (!product) return res.status(404).json({ message: "Not found" });
       
       const quantity = Number(req.body.addStock);
       product.globalStock += quantity;
       await product.save();
       
       // Record this in StockIn history
       await StockIn.create({
         globalProductId: product._id,
         quantity,
         addedBy: req.user?.userId
       });
       
       await ActivityLog.create({
         adminId: req.user.userId,
         action: "Added Stock",
         details: `Added ${quantity} pcs stock to ${product.name}`
       });
       
       return res.json(product);
    }
    const product = await GlobalProduct.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Error updating global product" });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    const product = await GlobalProduct.findByIdAndDelete(req.params.id);
    if (product) {
      await ActivityLog.create({
        adminId: req.user.userId,
        action: "Deleted Product",
        details: `Deleted product: ${product.name}`
      });
    }
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting product" });
  }
});

router.post("/products/bulk-delete", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Invalid product IDs" });
    }
    
    await GlobalProduct.deleteMany({ _id: { $in: ids } });

    await ActivityLog.create({
      adminId: req.user.userId,
      action: "Bulk Deleted Products",
      details: `Deleted ${ids.length} products`
    });

    res.json({ message: "Products deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting products" });
  }
});

// STOCK TRANSFERS
router.post("/transfer", async (req: any, res) => {
  try {
    console.log("=== TRANSFER API HIT ===");
    console.log("req.body:", req.body);
    console.log("req.user:", req.user);
    
    const { globalProductId, quantity, transferRate } = req.body;
    const product = await GlobalProduct.findById(globalProductId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Determine target branch based on user selection or role
    let targetBranchId = req.body.branchId || req.user.branchId;
    if (!targetBranchId) {
       // Token might be stale, fetch user from DB to get latest branchId
       const dbUser = await User.findById(req.user.userId);
       if (dbUser && dbUser.branchId) {
         targetBranchId = dbUser.branchId.toString();
       }
    }

    if (!targetBranchId) {
      return res.status(400).json({ message: "Branch ID is required" });
    }

    if (product.globalStock < quantity) {
      return res.status(400).json({ message: "Insufficient global stock" });
    }

    product.globalStock -= quantity;
    await product.save();

    // Auto-accept into branch stock
    let branchProd = await BranchProduct.findOne({ 
      branchId: targetBranchId, 
      globalProductId: product._id,
      transferRate: transferRate
    });

    if (branchProd) {
      branchProd.currentStock += quantity;
      await branchProd.save();
    } else {
      branchProd = new BranchProduct({
        branchId: targetBranchId,
        globalProductId: product._id,
        currentStock: quantity,
        transferRate: transferRate,
        sellingPrice: transferRate,
        lowStockThreshold: 10
      });
      await branchProd.save();
    }

    const transfer = new StockTransfer({
      globalProductId,
      branchId: targetBranchId,
      quantity,
      transferRate,
      sellingPrice: transferRate,
      status: "accepted", // Auto accept
      transferredBy: req.user.userId,
      productName: product.name
    });

    await transfer.save();

    const branchDoc = await Branch.findById(targetBranchId);
    const branchName = branchDoc ? branchDoc.name : targetBranchId;

    await ActivityLog.create({
      adminId: req.user.userId,
      action: "Transferred Stock",
      details: `Transferred ${quantity} pcs of ${product.name} to branch ${branchName}`
    });

    res.status(201).json({ message: "Stock transferred successfully", transfer });
  } catch (error) {
    res.status(500).json({ message: "Error transferring stock" });
  }
});

router.post("/transfer/bulk", async (req: any, res) => {
  try {
    const { products } = req.body;
    // Determine target branch based on user selection or role
    let targetBranchId = req.body.branchId || req.user.branchId;
    if (!targetBranchId) {
       // Token might be stale, fetch user from DB to get latest branchId
       const dbUser = await User.findById(req.user.userId);
       if (dbUser && dbUser.branchId) {
         targetBranchId = dbUser.branchId.toString();
       }
    }

    if (!targetBranchId) {
      return res.status(400).json({ message: "Branch ID is required" });
    }
    // products is an array of { globalProductId, quantity, transferRate, sellingPrice }
    const batchId = new mongoose.Types.ObjectId().toString();
    const transfers = [];

    for (const item of products) {
      const product = await GlobalProduct.findById(item.globalProductId);
      if (!product || product.globalStock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for product ${product?.name || item.globalProductId}` });
      }

      product.globalStock -= item.quantity;
      await product.save();

      // Auto-accept into branch stock
      let branchProd = await BranchProduct.findOne({ 
        branchId: targetBranchId, 
        globalProductId: item.globalProductId,
        transferRate: item.transferRate,
        sellingPrice: item.sellingPrice || 0
      });

      if (branchProd) {
        branchProd.currentStock += item.quantity;
        await branchProd.save();
      } else {
        branchProd = new BranchProduct({
          branchId: targetBranchId,
          globalProductId: item.globalProductId,
          currentStock: item.quantity,
          transferRate: item.transferRate,
          sellingPrice: item.sellingPrice || 0,
          lowStockThreshold: 10
        });
        await branchProd.save();
      }

      const transfer = new StockTransfer({
        globalProductId: item.globalProductId,
        branchId: targetBranchId,
        quantity: item.quantity,
        transferRate: item.transferRate,
        sellingPrice: item.sellingPrice,
        status: "accepted", // Auto accept
        transferredBy: req.user.userId,
        batchId,
        productName: product.name
      });
      await transfer.save();
      transfers.push(transfer);
    }

    const branchDoc = await Branch.findById(targetBranchId);
    const branchName = branchDoc ? branchDoc.name : targetBranchId;

    const transferDetails = transfers.map(t => `${t.productName} (${t.quantity} pcs)`).join(', ');
    await ActivityLog.create({
      adminId: req.user.userId,
      action: "Bulk Transferred Stock",
      details: `Transferred ${transfers.length} products to branch ${branchName}: ${transferDetails}`
    });

    res.status(201).json({ message: "Bulk stock transferred successfully", transfers, batchId });
  } catch (error: any) {
    console.error("Bulk transfer error:", error);
    res.status(500).json({ message: "Error in bulk transfer: " + (error.message || "Unknown error") });
  }
});

    // Update a transfer - only allowed for owning branch or super admin
    router.put("/transfer/:id", async (req: any, res) => {
      try {
        const { id } = req.params;
        const { quantity: newQuantity } = req.body;

        if (typeof newQuantity !== 'number' || newQuantity < 0) {
          return res.status(400).json({ message: "Invalid quantity" });
        }

        const transfer = await StockTransfer.findById(id);
        if (!transfer) {
          return res.status(404).json({ message: "Transfer not found" });
        }

        // Authorization: only super admin, admin, or the branch that owns the transfer can edit
        if (req.user.role !== "super_admin" && req.user.role !== "admin" && transfer.branchId.toString() !== req.user.branchId?.toString()) {
          return res.status(403).json({ message: "Access denied: cannot modify this transfer" });
        }

        const oldQuantity = transfer.quantity;
        const diff = newQuantity - oldQuantity;

        // Check if we have enough global stock if quantity increases
        const globalProduct = await GlobalProduct.findById(transfer.globalProductId);
        if (!globalProduct) {
          return res.status(404).json({ message: "Global product not found" });
        }

        if (diff > 0 && globalProduct.globalStock < diff) {
          return res.status(400).json({ message: "Not enough global stock available" });
        }

        if (transfer.status === "accepted") {
          let branchProduct = await BranchProduct.findOne({
            branchId: transfer.branchId,
            globalProductId: transfer.globalProductId
          });
          if (!branchProduct) {
            // Auto-heal missing branch product (e.g. if it was deleted accidentally)
            branchProduct = new BranchProduct({
              branchId: transfer.branchId,
              globalProductId: transfer.globalProductId,
              transferRate: transfer.transferRate,
              sellingPrice: transfer.transferRate,
              currentStock: transfer.quantity, // Assume it had the original transfer quantity
              lowStockThreshold: 10
            });
            await branchProduct.save();
          }

          // Prevent reducing quantity below consumed amount
          if (diff < 0 && branchProduct.currentStock + diff < 0) {
            return res.status(400).json({ message: "Cannot reduce quantity below what is already consumed/sold in branch" });
          }

          branchProduct.currentStock += diff;
          await branchProduct.save();
        }

        // Apply global changes
        globalProduct.globalStock -= diff;
        transfer.quantity = newQuantity;

        await globalProduct.save();
        await transfer.save();

        res.json({ message: "Transfer updated successfully", transfer });
      } catch (error) {
        console.error("Update transfer error:", error);
        res.status(500).json({ message: "Error updating transfer" });
      }
    });

    // Delete a transfer - only allowed for owning branch or super admin
    router.delete("/transfer/:id", async (req: any, res) => {
      try {
        const { id } = req.params;
        const transfer = await StockTransfer.findById(id);

        if (!transfer) {
          return res.status(404).json({ message: "Transfer not found" });
        }

        // Authorization check
        if (req.user.role !== "super_admin" && req.user.role !== "admin" && transfer.branchId.toString() !== req.user.branchId?.toString()) {
          return res.status(403).json({ message: "Access denied: cannot delete this transfer" });
        }

        const globalProduct = await GlobalProduct.findById(transfer.globalProductId);
        const branchProduct = await BranchProduct.findOne({
          branchId: transfer.branchId,
          globalProductId: transfer.globalProductId
        });

        // Ensure branch stock allows deletion (if branch product exists)
        if (branchProduct && branchProduct.currentStock - transfer.quantity < 0) {
          return res.status(400).json({ message: "Cannot delete transfer: Branch has already sold/consumed these items" });
        }

        // Reverse the transfer
        if (globalProduct) {
          globalProduct.globalStock += transfer.quantity;
          await globalProduct.save();
        }
        
        if (branchProduct) {
          branchProduct.currentStock -= transfer.quantity;
          await branchProduct.save();
        }
        await StockTransfer.findByIdAndDelete(id);

        res.json({ message: "Transfer deleted successfully" });
      } catch (error) {
        console.error("Delete transfer error:", error);
        res.status(500).json({ message: "Error deleting transfer" });
      }
    });

router.get("/transfer-logs", async (req, res) => {
  try {
    let query: any = {};
    if (req.user.role !== "super_admin") {
      const adminUser = await User.findById(req.user.userId).lean();
      if (adminUser) {
        query.transferredBy = adminUser._id; // ensure only own transfers
      }
    }
    const logs = await StockTransfer.find(query)
      .populate("globalProductId")
      .populate("branchId")
      .populate("transferredBy")
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching transfer logs" });
  }
});

// STOCK IN LOGS
router.get("/stockin-logs", async (req, res) => {
  try {
    let query: any = {};
    if (req.user.role !== "super_admin") {
      const adminUser = await User.findById(req.user.userId).lean();
      if (adminUser) {
        query.addedBy = adminUser._id; // ensure only own stock in entries
      }
    }
    const logs = await StockIn.find(query)
      .populate("globalProductId")
      .populate("addedBy")
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching stock in logs" });
  }
});

// EDIT STOCK IN
router.put("/stockin/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity: newQuantity } = req.body;

    if (typeof newQuantity !== 'number' || newQuantity < 0) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    const stockIn = await StockIn.findById(id);
    if (!stockIn) {
      return res.status(404).json({ message: "Stock in record not found" });
    }

    const oldQuantity = stockIn.quantity;
    const diff = newQuantity - oldQuantity;

    const globalProduct = await GlobalProduct.findById(stockIn.globalProductId);
    if (!globalProduct) {
      return res.status(404).json({ message: "Global product not found" });
    }

    // If reducing quantity, check we don't go negative on global stock
    if (diff < 0 && globalProduct.globalStock + diff < 0) {
      return res.status(400).json({ message: "Cannot reduce: not enough global stock remaining" });
    }

    globalProduct.globalStock += diff;
    stockIn.quantity = newQuantity;

    await globalProduct.save();
    await stockIn.save();

    res.json({ message: "Stock in updated successfully", stockIn });
  } catch (error) {
    console.error("Update stock in error:", error);
    res.status(500).json({ message: "Error updating stock in" });
  }
});

router.delete("/stockin/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const stockIn = await StockIn.findById(id);

    if (!stockIn) {
      return res.status(404).json({ message: "Stock in record not found" });
    }

    const globalProduct = await GlobalProduct.findById(stockIn.globalProductId);
    if (!globalProduct) {
      return res.status(404).json({ message: "Global product not found" });
    }

    // When deleting a stock in entry, global stock decreases
    if (globalProduct.globalStock - stockIn.quantity < 0) {
      return res.status(400).json({ message: "Cannot delete stock in: Not enough global stock remaining (items may have been transferred)" });
    }

    globalProduct.globalStock -= stockIn.quantity;
    await globalProduct.save();
    await StockIn.findByIdAndDelete(id);

    res.json({ message: "Stock in record deleted successfully" });
  } catch (error) {
    console.error("Delete stock in error:", error);
    res.status(500).json({ message: "Error deleting stock in" });
  }
});
// BRANCH DETAILS
router.get("/branches/:id/details", async (req, res) => {
  try {
    const branchId = req.params.id;
    // Branch admins can only view their own branch, super_admin and admin can view all
    if (req.user.role !== "super_admin" && req.user.role !== "admin" && branchId !== req.user.branchId?.toString()) {
      return res.status(403).json({ message: "Access denied: cannot view other branches" });
    }
    const branch = await Branch.findById(branchId);
    if (!branch) return res.status(404).json({ message: "Branch not found" });

    const products = await BranchProduct.find({ branchId }).populate('globalProductId').sort({ createdAt: -1 });
    const { from, to } = req.query;
    
    let transferQuery: any = { branchId };
    if (from && to) {
      transferQuery.createdAt = {
        $gte: new Date(from as string),
        $lte: new Date(to as string)
      };
    }
    
    const transfers = await StockTransfer.find(transferQuery).populate('globalProductId').populate('transferredBy').sort({ createdAt: -1 });

    res.json({
      branch,
      products,
      transfers
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching branch details" });
  }
});

// REPORTS
router.get("/reports/all-branches", async (req, res) => {
  try {
    // Super admin sees all branches; admins see only their own
    let branchFilter = {};
    if (req.user.role !== "super_admin") {
      branchFilter = { adminId: req.user.userId };
    }
    const branches = await Branch.find(branchFilter);

    const branchProducts = await BranchProduct.find(
      Object.keys(branchFilter).length > 0 ? { branchId: { $in: branches.map(b => b._id) } } : {}
    ).populate('globalProductId').populate('branchId', 'name location');
    
    let totalStockValue = 0;
    branchProducts.forEach((p: any) => {
      totalStockValue += (p.currentStock * p.transferRate);
    });

    const globalProductFilter = req.user.role === "super_admin" ? {} : { adminId: req.user.userId };
    const globalProducts = await GlobalProduct.find(globalProductFilter);
    let globalLowStockCount = 0;
    globalProducts.forEach((p: any) => {
      const threshold = p.lowStockThreshold ?? 50;
      if (p.globalStock <= threshold) globalLowStockCount++;
    });

    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    const salesMatchQuery: any = { createdAt: { $gte: startOfToday } };
    if (Object.keys(branchFilter).length > 0) {
      salesMatchQuery.branchId = { $in: branches.map(b => b._id) };
    }
    const todaySales = await Sale.aggregate([
      { $match: salesMatchQuery },
      { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } }
    ]);
    const salesTotal = todaySales.length > 0 ? todaySales[0].totalAmount : 0;

    res.json({
      totalBranches: branches.length,
      totalStockValue,
      todaySales: salesTotal,
      lowStockAlerts: globalLowStockCount,
      allInventory: branchProducts,
      globalInventory: globalProducts
    });
  } catch (error) {
    console.error("Error in all-branches:", error);
    res.status(500).json({ message: "Error generating reports" });
  }
});

router.get("/reports/stock-flow", async (req, res) => {
  try {
    const { from, to } = req.query;
    let stockInMatchQuery: any = {};
    let stockOutMatchQuery: any = {};
    if (req.user.role !== "super_admin") {
      stockInMatchQuery.addedBy = new mongoose.Types.ObjectId(req.user.userId);
      stockOutMatchQuery.transferredBy = new mongoose.Types.ObjectId(req.user.userId);
    }
    // Add date filter if requested
    if (from && to) {
      stockInMatchQuery.createdAt = {
        $gte: new Date(from as string),
        $lte: new Date(to as string)
      };
      stockOutMatchQuery.createdAt = {
        $gte: new Date(from as string),
        $lte: new Date(to as string)
      };
    }

    // 1. Fetch Stock IN data
    const stockInData = await StockIn.aggregate([
      { $match: stockInMatchQuery },
      { 
        $group: {
          _id: "$globalProductId",
          totalIn: { $sum: "$quantity" }
        }
      }
    ]);

    // 2. Fetch Stock OUT data (Transfers)
    const stockOutData = await StockTransfer.aggregate([
      { $match: stockOutMatchQuery },
      {
        $group: {
          _id: {
            productId: "$globalProductId",
            branchId: "$branchId"
          },
          totalOutToBranch: { $sum: "$quantity" }
        }
      },
      {
        $group: {
          _id: "$_id.productId",
          totalOut: { $sum: "$totalOutToBranch" },
          branches: {
            $push: {
              branchId: "$_id.branchId",
              quantity: "$totalOutToBranch"
            }
          }
        }
      }
    ]);

    // 3. Fetch Product Details and Branch Details
    let globalProductFilter: any = {};
    let branchFilter: any = {};
    if (req.user.role !== "super_admin") {
      globalProductFilter.adminId = req.user.userId;
      branchFilter.adminId = req.user.userId;
    }
    const products = await GlobalProduct.find(globalProductFilter);
    const branches = await Branch.find(branchFilter);

    const branchMap = branches.reduce((acc, b) => {
      acc[b._id.toString()] = b.name;
      return acc;
    }, {} as any);

    const report = products.map(product => {
      const pid = product._id.toString();
      const inData = stockInData.find(d => d._id.toString() === pid) || { totalIn: 0 };
      const outData = stockOutData.find(d => d._id.toString() === pid) || { totalOut: 0, branches: [] };

      return {
        productId: pid,
        productName: product.name,
        category: product.category,
        sku: product.sku,
        currentGlobalStock: product.globalStock,
        totalIn: inData.totalIn,
        totalOut: outData.totalOut,
        branchesOut: outData.branches.map((b: any) => ({
          branchName: branchMap[b.branchId.toString()] || 'Unknown',
          quantity: b.quantity
        }))
      };
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: "Error generating stock flow report" });
  }
});

router.get("/reports/transfers", async (req, res) => {
  try {
    const { from, to, branchId } = req.query;
    let query: any = {};
    if (req.user.role !== "super_admin") {
      query.transferredBy = req.user.userId;
      if (branchId) query.branchId = branchId;
    } else if (branchId) {
      query.branchId = branchId;
    }
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from as string);
      if (to) query.createdAt.$lte = new Date(to as string);
    }
    const transfers = await StockTransfer.find(query).populate('branchId').populate('globalProductId').sort({ createdAt: -1 });
    res.json(transfers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching transfers" });
  }
});

// Create Branch User (Admin helper)
router.post("/branch-users", async (req, res) => {
  try {
    const { branchId, name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: "branch",
      branchId
    });
    await user.save();
    res.json({ message: "Branch user created" });
  } catch (error) {
    res.status(500).json({ message: "Error creating user" });
  }
});

// ==== Super Admin Admin Management ==== //
// Create new admin (Super admin only)
router.post("/admins", requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const adminUser = new User({
      name,
      email,
      password: hashedPassword,
      role: "admin"
    });
    await adminUser.save();
    res.json({ message: "Admin user created" });
  } catch (error) {
    res.status(500).json({ message: "Error creating admin" });
  }
});

// Get all admins with branch info (Super admin only)
router.get("/admins", requireSuperAdmin, async (req, res) => {
  try {
    // Super admin can see all admins; regular admins see only themselves
    if (req.user.role !== "super_admin") {
      const admin = await User.findById(req.user.userId).populate("branchId").lean();
      if (!admin) return res.status(404).json({ message: "Admin not found" });
      return res.json([admin]);
    }
    const admins = await User.find({ role: "admin" })
      .populate("branchId")
      .lean();
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: "Error fetching admins" });
  }
});
// Get admin detail (Super admin only)
router.get("/admins/:id", requireSuperAdmin, async (req, res) => {
  try {
    // Super admin can view any admin; regular admins can only view themselves
    if (req.user.role !== "super_admin") {
      if (req.params.id !== req.user.userId) {
        return res.status(403).json({ message: "Access denied: cannot view other admins" });
      }
    }
    const admin = await User.findOne({ _id: req.params.id, role: "admin" }).populate("branchId").lean();
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: "Error fetching admin details" });
  }
});
// Delete admin (Super admin only)
router.delete("/admins/:id", requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ message: "Admin deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting admin" });
  }
});

// Get own profile and branch details (Admin only)
router.get("/me", requireAdmin, async (req, res) => {
  try {
    const admin = await User.findById(req.user?.userId)
      .populate("branchId")
      .lean();
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    let branchDetails = null;
    if (admin.branchId) {
      const branchId = admin.branchId._id;
      const branch = await Branch.findById(branchId);
      const products = await BranchProduct.find({ branchId }).populate('globalProductId').sort({ createdAt: -1 });
      const transfers = await StockTransfer.find({ branchId }).populate('globalProductId').populate('transferredBy').sort({ createdAt: -1 });
      branchDetails = { branch, products, transfers };
    }

    res.json({ admin, branchDetails });
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile" });
  }
});
// Update admin details (Super admin only)
router.put("/admins/:id", requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const admin = await User.findOneAndUpdate({ _id: id, role: "admin" }, updates, { new: true });
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    res.json({ message: "Admin updated", admin });
  } catch (error) {
    res.status(500).json({ message: "Error updating admin" });
  }
});

// Update admin password (Super admin only)
router.put("/admins/:id/password", requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await User.findOneAndUpdate({ _id: id, role: "admin" }, { password: hashedPassword }, { new: true });
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    res.json({ message: "Password updated" });
  } catch (error) {
    res.status(500).json({ message: "Error updating password" });
  }
});

// Reset Branch User Password
router.put("/branch-users/reset-password", async (req, res) => {
  try {
    const { branchId, password } = req.body;
    const user = await User.findOne({ branchId });
    if (!user) return res.status(404).json({ message: "No user found for this branch" });
    
    user.password = await bcrypt.hash(password, 10);
    await user.save();
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error resetting password" });
  }
});

export default router;
