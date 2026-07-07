export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'branch' | 'super_admin';
  branchId?: string;
  companyName?: string;
  subscriptionEndDate?: string | Date;
  paymentStatus?: 'pending' | 'success' | 'failed' | 'active' | 'expired' | 'Paid' | 'Unpaid' | 'Expired';
}

export interface Branch {
  _id: string;
  name: string;
  location: string;
  managerName: string;
  contact: string;
  hasUser?: boolean;
}

export interface GlobalProduct {
  _id: string;
  name: string;
  sku: string;
  category: string;
  unitType?: 'L' | 'mL' | 'pcs';
  unitSize?: number;
  purchaseRate: number;
  sellRate: number;
  globalStock: number;
  lowStockThreshold: number;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockTransfer {
  _id: string;
  globalProductId: string | GlobalProduct;
  branchId: string | Branch;
  quantity: number;
  transferRate: number;
  status: 'pending' | 'accepted';
  sellingPrice?: number;
  transferredBy: string | User;
  batchId?: string;
  createdAt: string;
}

export interface BranchProduct {
  _id: string;
  branchId: string;
  globalProductId: string | GlobalProduct;
  transferRate: number;
  sellingPrice: number;
  currentStock: number;
  lowStockThreshold: number;
}

export interface InventoryItem {
  product: GlobalProduct;
  branchProductId: string;
  transferRate: number;
  sellingPrice: number;
  currentStock: number;
  lowStockThreshold: number;
}

export interface SaleItem {
  branchProductId: string;
  quantity: number;
  price: number;
  note?: string;
}

export interface Sale {
  _id: string;
  branchId: string | Branch;
  globalProductId: GlobalProduct;
  branchProductId: string | BranchProduct;
  quantity: number;
  transferRate: number;
  priceAtSale: number;
  totalAmount: number;
  totalProfit: number;
  createdAt: string;
  soldBy: User;
  note?: string;
}
