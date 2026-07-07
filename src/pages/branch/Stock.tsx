import React, { useState, useEffect, useMemo, FC } from 'react';
import { apiFetch } from '../../utils/api';
import { StockTransfer, InventoryItem } from '../../types';
import toast from 'react-hot-toast';
import { Layers, AlertTriangle, Search, Loader2, AlertOctagon, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../../context/store';

interface TransferCardProps {
  transfer: StockTransfer;
  onAccept: (id: string, sp: number) => Promise<void>;
  key?: React.Key;
}

const TransferCard: FC<TransferCardProps> = ({ transfer, onAccept }) => {
  const [sellingPrice, setSellingPrice] = useState(transfer.transferRate.toString());
  const [submitting, setSubmitting] = useState(false);

  const product: any = transfer.globalProductId;

  const handleAccept = async () => {
    const sp = parseFloat(sellingPrice);
    if (isNaN(sp) || sp <= 0) {
      toast.error('Enter a valid selling price');
      return;
    }
    setSubmitting(true);
    await onAccept(transfer._id, sp);
    setSubmitting(false);
  };

  return (
    <div className="bg-amber-50 rounded-xl shadow-sm border border-amber-200 overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b bg-amber-100 border-amber-200 flex justify-between items-center">
         <div className="flex items-center gap-2">
           <AlertTriangle className="w-4 h-4 text-amber-600" />
           <span className="font-bold text-amber-900 line-clamp-1">Pending Arrival</span>
         </div>
         <span className="text-xs font-semibold text-amber-700">{new Date(transfer.createdAt).toLocaleDateString()}</span>
      </div>
      
      <div className="p-4 flex-1">
        <p className="font-bold text-slate-800 text-lg mb-1">{product?.name}</p>
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium text-slate-600">Qty: {transfer.quantity}</span>
          <span className="text-sm font-bold text-slate-700">Cost: ₹{transfer.transferRate}</span>
        </div>
        
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Set Selling Price</label>
          <input 
            type="number" 
            step="any"
            value={sellingPrice}
            onChange={e => setSellingPrice(e.target.value)}
            className="w-full h-10 px-3 border border-amber-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all shadow-sm"
          />
        </div>
      </div>
      
      <div className="p-4 bg-amber-100/50 border-t border-amber-200 flex gap-2">
         <button 
           onClick={handleAccept}
           disabled={submitting}
           className="w-full py-2.5 rounded-xl bg-amber-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-amber-700 transition-colors shadow-sm disabled:opacity-50"
         >
           {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-4 h-4"/> Accept Stock</>}
         </button>
      </div>
    </div>
  );
}

export default function BranchStock() {
  const { user } = useAuthStore();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user?.branchId) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [invData, transData] = await Promise.all([
        apiFetch(`/branch/inventory/${user?.branchId}`),
        apiFetch(`/branch/transfers/pending`)
      ]);
      setInventory(invData);
      setTransfers(transData);
    } catch (error: any) {
      toast.error('Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  const acceptTransfer = async (id: string, sellingPrice: number) => {
    try {
      await apiFetch(`/branch/transfers/${id}/accept`, {
        method: 'POST',
        body: JSON.stringify({ sellingPrice })
      });
      toast.success('Stock added to inventory');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Error accepting transfer');
    }
  };

  const filteredInventory = useMemo(() => {
    let sorted = [...inventory].sort((a, b) => {
      const aLow = a.currentStock <= a.lowStockThreshold;
      const bLow = b.currentStock <= b.lowStockThreshold;
      if (aLow && !bLow) return -1;
      if (!aLow && bLow) return 1;
      return a.product.name.localeCompare(b.product.name);
    });

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      sorted = sorted.filter(p => 
        p.product.name.toLowerCase().includes(query) || 
        p.product.sku.toLowerCase().includes(query)
      );
    }

    return sorted;
  }, [inventory, searchQuery]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Stock Management</h1>
            <p className="text-slate-500 text-sm">Accept transfers and monitor inventory</p>
          </div>
        </div>
      </div>

      {transfers.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Pending Transfers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {transfers.map(t => (
               <TransferCard key={t._id} transfer={t} onAccept={acceptTransfer} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Current Inventory</h2>
          <div className="w-full sm:w-auto flex-1 max-w-sm relative ml-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInventory.map(item => (
            <div key={item.branchProductId} className={clsx(
              "bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col",
              item.currentStock <= item.lowStockThreshold ? "border-rose-200 ring-1 ring-rose-50" : "border-slate-200"
            )}>
              <div className="px-4 py-3 border-b flex flex-col bg-slate-50 border-slate-100">
                 <span className="font-bold text-slate-900 line-clamp-1">{item.product.name}</span>
                 <span className="text-xs text-slate-500">{item.product.sku}</span>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Cost</p>
                    <p className="text-sm font-bold text-slate-700">₹{item.transferRate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-emerald-600 uppercase tracking-wider font-bold">Sell Price</p>
                    <p className="text-lg font-black text-emerald-600">₹{item.sellingPrice}</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Current Stock</p>
                  <p className={clsx("text-2xl font-black", item.currentStock <= item.lowStockThreshold ? "text-rose-600" : "text-slate-900")}>
                    {item.currentStock}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {filteredInventory.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
               <AlertOctagon className="w-12 h-12 text-slate-300 mb-4" />
               <p className="font-bold text-slate-900">No inventory found</p>
               <p className="text-slate-500 text-sm mt-1">Accept pending transfers to add stock.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
