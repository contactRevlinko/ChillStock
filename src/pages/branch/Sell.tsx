import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../context/store';
import { apiFetch } from '../../utils/api';
import { InventoryItem } from '../../types';
import toast from 'react-hot-toast';
import { ShoppingCart, Check, X, Box, Loader2, Minus, Plus, Printer, FileDown, Search } from 'lucide-react';
import clsx from 'clsx';
import { printBluetoothReceipt } from '../../utils/bluetoothPrint';
import { generateReceiptPDF } from '../../utils/pdfGenerator';

export default function BranchSell() {
  const { user } = useAuthStore();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{ [branchProductId: string]: number | string }>({});
  const [isConfirming, setIsConfirming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saleComplete, setSaleComplete] = useState<any>(null);

  useEffect(() => {
    if (user?.branchId) {
      fetchInventory();
    }
  }, [user]);

  const fetchInventory = async () => {
    try {
      const data = await apiFetch(`/branch/inventory/${user?.branchId}`);
      setInventory(data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const currentCartCount = Object.values(cart).reduce<number>((a, b) => {
    const val = parseFloat(String(b));
    return a + (isNaN(val) ? 0 : val);
  }, 0);
  
  const getCartDetails = () => {
    let total = 0;
    const items = Object.entries(cart).map(([branchProductId, quantity]) => {
      const item = inventory.find(i => i.branchProductId === branchProductId);
      if (!item) return null;
      const price = Number(item.sellingPrice) || 0;
      const qty = parseFloat(String(quantity));
      if (isNaN(qty) || qty <= 0) return null;
      total += price * qty;
      return {
        branchProductId,
        name: item.product.name,
        unit: 'pcs',
        price,
        quantity: qty
      };
    }).filter(Boolean) as any[];
    return { items, total };
  };

  const handleUpdateCart = (branchProductId: string, delta: number) => {
    const item = inventory.find(i => i.branchProductId === branchProductId);
    if (!item) return;
    
    setCart(prev => {
      const current = Number(prev[branchProductId]) || 0;
      const next = Math.max(0, current + delta);
      
      if (next > item.currentStock) {
        toast.error(`Only ${item.currentStock} units available`);
        return prev;
      }
      
      const newCart = { ...prev };
      if (next === 0) delete newCart[branchProductId];
      else newCart[branchProductId] = next;
      return newCart;
    });
  };

  const handleSetCart = (branchProductId: string, rawVal: string) => {
    const item = inventory.find(i => i.branchProductId === branchProductId);
    if (!item) return;
    
    setCart(prev => {
      // Allow empty string to delete
      if (rawVal === '') {
        const newCart = { ...prev };
        delete newCart[branchProductId];
        return newCart;
      }

      // Allow only numbers and at most one decimal point
      if (!/^\d*\.?\d*$/.test(rawVal)) {
        return prev;
      }
      
      const numericVal = parseFloat(rawVal);
      
      // If valid float and exceeds stock, cap it
      if (!isNaN(numericVal) && numericVal > item.currentStock) {
        toast.error(`Only ${item.currentStock} units available`);
        const newCart = { ...prev };
        newCart[branchProductId] = item.currentStock;
        return newCart;
      }
      
      const newCart = { ...prev };
      newCart[branchProductId] = rawVal;
      return newCart;
    });
  };

  const handleConfirmSale = () => {
    if (currentCartCount === 0) return;
    setIsConfirming(true);
  };

  const executeSale = async () => {
    const { items, total } = getCartDetails();
    setIsProcessing(true);
    try {
      await apiFetch('/branch/sales', {
        method: 'POST',
        body: JSON.stringify({
          branchId: user?.branchId,
          items: items.map(i => ({ branchProductId: i.branchProductId, quantity: i.quantity, price: i.price }))
        })
      });
      toast.success('Sale verified!');
      setSaleComplete({ items, total, branchName: user?.name?.split(' User')[0] || 'CHILLSTOCK Branch' });
      setCart({});
      fetchInventory();
      setIsConfirming(false);
    } catch (error: any) {
      toast.error(error.message || 'Error processing payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintBT = async () => {
    if (!saleComplete) return;
    try {
      await printBluetoothReceipt(saleComplete.branchName, saleComplete.items, saleComplete.total);
      toast.success('Dispatched to thermal printer');
    } catch (e: any) {
      toast.error('Bluetooth printer not found. Falling back to PDF.');
      handleDownloadPDF();
    }
  };

  const handleDownloadPDF = () => {
    if (!saleComplete) return;
    try {
      generateReceiptPDF(saleComplete.branchName, saleComplete.items, saleComplete.total, true);
    } catch (e) {
      toast.error('Receipt generation failed');
    }
  };

  const filteredInventory = useMemo(() => {
    let list = inventory;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => item.product.name.toLowerCase().includes(q) || item.product.sku.toLowerCase().includes(q));
    }
    return list;
  }, [inventory, searchQuery]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="pb-24">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Terminal</h1>
          <p className="text-slate-500 text-sm font-medium">Select items to checkout</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 flex items-center gap-3 w-full sm:w-auto justify-center shrink-0">
             <ShoppingCart className="w-5 h-5 text-blue-500" />
             <span className="font-bold text-blue-900">{currentCartCount} Items</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredInventory.map((item) => {
          const rawQty = cart[item.branchProductId];
          const qty = rawQty !== undefined ? rawQty : 0;
          const isSelected = rawQty !== undefined;
          const outOfStock = item.currentStock === 0;

          return (
            <div 
              key={item.branchProductId} 
              className={clsx(
                "bg-white border rounded-xl shadow-sm transition-all duration-200 flex flex-col p-3",
                isSelected ? "border-blue-400 ring-2 ring-blue-50" : "border-slate-200 hover:border-slate-300",
                outOfStock ? "opacity-50 grayscale hover:border-slate-200 border-dashed" : "cursor-pointer"
              )}
              onClick={() => !outOfStock && handleUpdateCart(item.branchProductId, 1)}
            >
              <div className="flex items-center gap-3 w-full">
                <div className="w-12 h-12 bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-slate-100">
                  {item.product.imageUrl ? (
                    <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover select-none" draggable={false} />
                  ) : (
                    <Box className="w-6 h-6 text-slate-300" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-slate-800 leading-tight truncate" title={item.product.name}>{item.product.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-slate-500 text-xs">
                    </span>
                    {outOfStock && <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded uppercase">Empty</span>}
                  </div>
                </div>
                
                <div className="text-right shrink-0">
                  <p className={clsx("text-base font-black truncate", outOfStock ? "text-slate-400" : "text-slate-900")}>
                    ₹{item.sellingPrice.toFixed(2)}
                  </p>
                </div>
              </div>
              
              {!outOfStock && (
                <div className={clsx("overflow-hidden transition-all duration-200", isSelected ? "mt-3 h-10 opacity-100" : "h-0 opacity-0")}>
                  <div className="flex items-center justify-between w-full bg-slate-50 rounded-lg p-1 border border-slate-200 h-10">
                    <button onClick={(e) => { e.stopPropagation(); handleUpdateCart(item.branchProductId, -1); }} disabled={!qty || Number(qty) <= 0} className="w-8 h-8 flex justify-center items-center rounded-md bg-white shadow-sm text-slate-600 disabled:opacity-50">
                      <Minus className="w-4 h-4" />
                    </button>
                    <input 
                      type="text"
                      inputMode="decimal"
                      value={qty || ''}
                      placeholder="0"
                      onChange={(e) => {
                        handleSetCart(item.branchProductId, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-16 text-center font-bold text-sm bg-transparent border-none focus:outline-none focus:ring-0 [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button onClick={(e) => { e.stopPropagation(); handleUpdateCart(item.branchProductId, 1); }} disabled={Number(qty) >= item.currentStock} className="w-8 h-8 flex justify-center items-center rounded-md bg-blue-50 text-blue-600 shadow-sm disabled:opacity-50 disabled:bg-slate-100">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filteredInventory.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
           <Box className="w-12 h-12 text-slate-300 mb-4" />
           <p className="font-bold text-slate-900">No products available</p>
           <p className="text-slate-500 text-sm mt-1">{searchQuery ? "No search results match your criteria." : "Accept transfers in Stock tab first."}</p>
        </div>
      )}

      {/* Floating Action Button */}
      {currentCartCount > 0 && !isConfirming && !saleComplete && (
        <div className="fixed bottom-20 md:bottom-8 left-4 right-4 md:left-auto md:right-8 z-30 flex justify-end pointer-events-none animate-in slide-in-from-bottom-5 fade-in">
          <div className="w-full md:w-80 pointer-events-auto">
            <button 
              onClick={handleConfirmSale}
              className="w-full bg-slate-900 hover:bg-black text-white p-3 rounded-2xl shadow-xl flex items-center justify-between transition-transform active:scale-95"
            >
              <div className="flex items-center">
                <div className="bg-blue-500 w-10 h-10 rounded-xl flex items-center justify-center font-bold mr-3 shadow-inner">
                  {currentCartCount}
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                  <span className="font-black text-xl">₹{getCartDetails().total.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center text-sm font-bold bg-white/10 px-4 py-2 rounded-xl text-white">
                Checkout →
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirming && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center items-end md:items-center">
          <div className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-5 md:zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Confirm Payment</h3>
              <button onClick={() => setIsConfirming(false)} className="text-slate-400 hover:text-slate-900 bg-slate-100 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6">
              <div className="max-h-60 overflow-y-auto pr-2 space-y-3">
                {getCartDetails().items.map(item => (
                  <div key={item.branchProductId} className="flex justify-between items-center group">
                    <div className="flex items-center">
                      <span className="font-bold text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-md min-w-[3rem] text-center mr-3">{item.quantity} {item.unit.replace(/[0-9.]/g, '').trim()}</span>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.unit}</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 text-sm">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-slate-200 mt-4 pt-4 flex justify-between items-end">
                <span className="font-semibold text-slate-500 text-sm uppercase tracking-widest">Total Due</span>
                <span className="font-black text-3xl text-blue-600">₹{getCartDetails().total.toFixed(2)}</span>
              </div>
            </div>
            
            <button 
              onClick={executeSale}
              disabled={isProcessing}
              className="w-full bg-blue-500 text-white rounded-2xl py-4 font-black tracking-wide text-lg shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition flex justify-center items-center active:scale-95"
            >
              {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirm Exact Cash'}
            </button>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {saleComplete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex justify-center items-center">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl m-4 text-center animate-in zoom-in-95">
            <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex justify-center items-center mx-auto mb-6 shadow-lg shadow-emerald-500/40">
              <Check className="w-10 h-10 font-bold" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Success!</h3>
            <p className="text-slate-500 font-medium mb-8 bg-slate-50 py-2 rounded-lg">Collected: <span className="font-bold text-slate-900">₹{saleComplete.total.toFixed(2)}</span></p>
            
            <div className="space-y-3 mb-8">
              <button onClick={handlePrintBT} className="w-full bg-slate-900 hover:bg-black text-white py-4 px-4 rounded-2xl font-bold flex items-center justify-center transition-transform active:scale-95 shadow-lg">
                <Printer className="w-5 h-5 mr-3" /> Execute Bluetooth Print
              </button>
              <button onClick={handleDownloadPDF} className="w-full bg-white border-2 border-slate-200 shadow-sm text-slate-700 hover:bg-slate-50 hover:border-slate-300 py-3 px-4 rounded-xl font-bold flex items-center justify-center transition-colors">
                <FileDown className="w-5 h-5 mr-2" /> Download Receipt
              </button>
            </div>
            
            <button onClick={() => setSaleComplete(null)} className="text-sm font-bold tracking-wide text-blue-500 hover:text-blue-700 uppercase">
              Start Next Transaction
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
