import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Box, Calendar, ShoppingBag, Loader2, Download, Plus, ArrowRightLeft, Search, Trash2, ChevronDown, Check, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Branch, StockTransfer, GlobalProduct } from '../../types';
import { format } from 'date-fns';
import { generateTransferReceiptPDF } from '../../utils/pdfGenerator';

// Custom Dropdown Component
function CustomDropdown({ options, value, onChange, placeholder }: { options: {label: string, value: string, disabled?: boolean, subLabel?: string}[], value: string, onChange: (val: string) => void, placeholder: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  const selected = options.find(o => o.value === value);
  const filteredOptions = searchQuery
    ? options.filter(o => o.label.toLowerCase().includes(searchQuery.toLowerCase()) || o.subLabel?.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-slate-300 rounded-md shadow-sm py-2.5 px-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm flex justify-between items-center transition-colors hover:border-blue-300"
      >
        <span className={selected ? 'text-slate-900 font-bold' : 'text-slate-500'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-2xl max-h-72 rounded-md text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm border border-slate-200 flex flex-col">
          <div className="sticky top-0 bg-white p-2 border-b border-slate-100 z-10">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>
          </div>
          <div className="overflow-auto flex-1">
            {filteredOptions.length === 0 && <div className="py-3 px-3 text-slate-500 text-sm text-center">No results found</div>}
            {filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={option.disabled}
                className={`w-full text-left px-3 py-2.5 border-b border-slate-50 last:border-0 flex justify-between items-center ${option.disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:bg-blue-50 cursor-pointer'} ${value === option.value ? 'bg-blue-50 text-blue-700' : 'text-slate-900'}`}
                onClick={() => {
                  if (!option.disabled) {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchQuery('');
                  }
                }}
              >
                <div>
                  <span className={`block truncate ${value === option.value ? 'font-bold' : 'font-medium'}`}>{option.label}</span>
                  {option.subLabel && <span className={`block text-[10px] mt-0.5 ${value === option.value ? 'text-blue-500' : 'text-slate-500'}`}>{option.subLabel}</span>}
                </div>
                {value === option.value && <Check className="w-4 h-4 text-blue-600" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminBranchDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ branch: Branch, products: any[], transfers: StockTransfer[] } | null>(null);
  const [dateRange, setDateRange] = useState({
    from: format(new Date(new Date().setDate(1)), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  });
  const [page, setPage] = useState(1);
  const limit = 8;

  const [isBulkTransferOpen, setIsBulkTransferOpen] = useState(false);
  const [globalProducts, setGlobalProducts] = useState<GlobalProduct[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [id, dateRange]);

  const fetchDetails = async () => {
    try {
      const response = await apiFetch(`/admin/branches/${id}/details?from=${dateRange.from}&to=${dateRange.to}`);
      setData(response);
    } catch (error) {
      toast.error('Failed to load branch details');
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalProducts = async () => {
    try {
      const products = await apiFetch('/admin/products');
      setGlobalProducts(products);
    } catch (error) {
      toast.error('Failed to load products');
    }
  };

  const openBulkTransfer = () => {
    fetchGlobalProducts();
    setSelectedItems([]);
    setIsBulkTransferOpen(true);
  };

  const handleAddProduct = (productId: string) => {
    if (!productId) return;
    const gp = globalProducts.find(p => p._id === productId);
    if (!gp) return;
    if (selectedItems.find(item => item.globalProductId === productId)) return;
    
    setSelectedItems([...selectedItems, {
      globalProductId: gp._id,
      name: gp.name,
      quantity: 1,
      transferRate: gp.purchaseRate,
      sellingPrice: gp.sellRate,
      maxStock: gp.globalStock
    }]);
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedItems(selectedItems.filter(item => item.globalProductId !== productId));
  };

  const handleUpdateItem = (productId: string, field: string, value: number) => {
    setSelectedItems(selectedItems.map(item => {
      if (item.globalProductId === productId) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleBulkTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      toast.error("Please select at least one product");
      return;
    }

    // Validate stock
    const invalidItem = selectedItems.find(item => item.quantity > item.maxStock);
    if (invalidItem) {
      toast.error(`Not enough global stock for ${invalidItem.name}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiFetch('/admin/transfer/bulk', {
        method: 'POST',
        body: JSON.stringify({
          branchId: id,
          products: selectedItems
        })
      });
      toast.success('Stock transferred successfully');
      
      if (data && data.branch) {
        const total = selectedItems.reduce((sum, item) => sum + (item.quantity * item.transferRate), 0);
        const printItems = selectedItems.map(item => ({
          name: item.name,
          unit: 'pcs',
          quantity: item.quantity,
          price: item.transferRate
        }));
        generateTransferReceiptPDF(data.branch.name, data.branch.managerName || 'Manager', printItems, total);
      }

      setIsBulkTransferOpen(false);
      fetchDetails();
      setIsBulkTransferOpen(false);
      fetchDetails();
    } catch (error: any) {
      toast.error(error.message || 'Transfer failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Transfer State
  const [editingTransfer, setEditingTransfer] = useState<any>(null);
  const [editQuantity, setEditQuantity] = useState<number | ''>('');
  const [isEditing, setIsEditing] = useState(false);

  const openEditModal = (log: any) => {
    setEditingTransfer(log);
    setEditQuantity(log.quantity);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransfer || editQuantity === '' || Number(editQuantity) < 0) return;
    
    setIsEditing(true);
    try {
      await apiFetch(`/admin/transfer/${editingTransfer._id}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: Number(editQuantity) })
      });
      toast.success('Transfer updated successfully');
      setEditingTransfer(null);
      fetchDetails();
    } catch (error: any) {
      toast.error(error.message || 'Update failed');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteTransfer = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this transfer? This will return the stock to global inventory.')) return;
    try {
      await apiFetch(`/admin/transfer/${id}`, { method: 'DELETE' });
      toast.success('Transfer deleted and stock reverted');
      fetchDetails();
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  if (loading || !data) return <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  // Group transfers by batchId or createdAt
  const groupedTransfersMap = data.transfers.reduce((acc, t) => {
    const key = t.batchId || t.createdAt.toString();
    if (!acc[key]) {
      acc[key] = { batchId: key, createdAt: t.createdAt, transfers: [], totalQuantity: 0, totalValue: 0 };
    }
    acc[key].transfers.push(t);
    acc[key].totalQuantity += t.quantity;
    acc[key].totalValue += (t.quantity * t.transferRate);
    return acc;
  }, {} as Record<string, any>);

  const groupedTransfers = Object.values(groupedTransfersMap).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalPages = Math.ceil(groupedTransfers.length / limit);
  const paginatedTransfers = groupedTransfers.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    setPage(1);
  }, [dateRange]);

  // Dummy Export for now since we removed sales
  const handleExportPDF = () => {
    toast.error('Export currently unavailble for transfers');
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/branches')} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{data.branch.name}</h1>
            <p className="text-slate-500 text-xs mt-0.5">{data.branch.location} • Manager: {data.branch.managerName}</p>
          </div>
        </div>
        <button 
          onClick={openBulkTransfer}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center text-sm font-medium transition-colors shadow-sm"
        >
          <ArrowRightLeft className="w-4 h-4 mr-1.5" /> Transfer Stock
        </button>
      </div>

      <div className="flex flex-col gap-4 items-start w-full">
        {/* Transfer History */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 w-full">
           <div className="flex justify-between items-center mb-3">
             <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5"><ArrowRightLeft className="w-4 h-4 text-blue-500" /> Transfer History</h3>
             {totalPages > 1 && (
               <div className="flex items-center gap-2">
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline-block">Page {page} / {totalPages}</span>
                 <div className="flex items-center gap-1">
                   <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 text-slate-600 bg-slate-50 border border-slate-200 rounded disabled:opacity-50"><ChevronLeft className="w-3 h-3" /></button>
                   <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 text-slate-600 bg-slate-50 border border-slate-200 rounded disabled:opacity-50"><ChevronRight className="w-3 h-3" /></button>
                 </div>
               </div>
             )}
           </div>
           
           <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">From</label>
                <input type="date" value={dateRange.from} onChange={e => setDateRange({...dateRange, from: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-500 text-sm" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">To</label>
                <input type="date" value={dateRange.to} onChange={e => setDateRange({...dateRange, to: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-500 text-sm" />
              </div>
           </div>

          <div className="space-y-3">
             {paginatedTransfers.length > 0 ? paginatedTransfers.map((group: any) => (
              <details key={group.batchId} className="group bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
                <summary className="p-3 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors list-none">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
                       <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{format(new Date(group.createdAt), 'dd MMM yyyy, p')}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{group.transfers.length} products • Total Qty: {group.totalQuantity}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">₹{group.totalValue.toFixed(2)}</p>
                      <p className="text-[10px] font-medium text-emerald-600 mt-0.5 bg-emerald-50 inline-block px-1.5 py-0.5 rounded border border-emerald-100">Transferred</p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const printItems = group.transfers.map((t: any) => ({
                          name: t.globalProductId?.name || 'Unknown',
                          unit: 'pcs',
                          quantity: t.quantity,
                          price: t.transferRate
                        }));
                        generateTransferReceiptPDF(data.branch.name, data.branch.managerName || 'Manager', printItems, group.totalValue);
                      }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </summary>
                <div className="p-3 bg-white border-t border-slate-100 space-y-2">
                   {group.transfers.map((t: any) => {
                     const gp: any = t.globalProductId;
                     return (
                       <div key={t._id} className="flex justify-between items-center text-xs py-1 border-b border-slate-50 last:border-0">
                         <div className="flex items-center gap-2">
                           <Box className="w-3 h-3 text-slate-400" />
                           <span className="font-medium text-slate-700">{gp?.name || 'Unknown'}</span>
                         </div>
                         <div className="text-slate-600 flex items-center gap-4">
                           <span>Qty: <span className="font-bold">{t.quantity}</span></span>
                           <span>Rate: ₹{t.transferRate}</span>
                           <div className="flex gap-1">
                             <button 
                               onClick={(e) => {
                                 e.preventDefault();
                                 openEditModal(t);
                               }}
                               className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                               title="Edit Quantity"
                             >
                               <Edit2 className="w-3 h-3" />
                             </button>
                             <button 
                               onClick={(e) => {
                                 e.preventDefault();
                                 handleDeleteTransfer(t._id);
                               }}
                               className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                               title="Delete Transfer"
                             >
                               <Trash2 className="w-3 h-3" />
                             </button>
                           </div>
                         </div>
                       </div>
                     );
                   })}
                </div>
              </details>
             )) : (
               <div className="text-center py-6 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                  <p className="text-sm font-medium text-slate-600">No Transfers Found</p>
               </div>
             )}
          </div>
        </div>
      </div>

      {isBulkTransferOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsBulkTransferOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full border border-slate-100">
              <form onSubmit={handleBulkTransferSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-xl leading-6 font-black text-slate-900 flex items-center gap-2">
                        <ArrowRightLeft className="w-5 h-5 text-blue-600" /> Bulk Transfer Stock
                      </h3>
                      <p className="text-xs font-medium text-slate-500 mt-1">Select products and quantities to transfer to <span className="font-bold text-slate-700">{data.branch.name}</span>.</p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Add Product</label>
                    <CustomDropdown 
                      placeholder="-- Select a Product to Add --"
                      value=""
                      onChange={handleAddProduct}
                      options={globalProducts.map(gp => ({
                        label: gp.name,
                        value: gp._id,
                        disabled: gp.globalStock <= 0,
                        subLabel: `Stock: ${gp.globalStock} • SKU: ${gp.sku}`
                      }))}
                    />
                  </div>

                  {selectedItems.length > 0 && (
                    <div className="mb-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 px-1">Selected Products ({selectedItems.length})</h4>
                      
                      {/* Desktop Table View */}
                      <div className="hidden md:block border border-slate-200 rounded-xl overflow-y-auto max-h-[45vh] shadow-sm">
                        <table className="min-w-full divide-y divide-slate-200 relative">
                          <thead className="bg-slate-50 sticky top-0 z-10 outline outline-1 outline-slate-200">
                            <tr>
                              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Product Name</th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-24">Quantity</th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-32">Transfer Rate (₹)</th>
                              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-32">Selling Price (₹)</th>
                              <th className="px-4 py-3 w-12"></th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-100">
                            {selectedItems.map((item) => (
                              <tr key={item.globalProductId} className="hover:bg-slate-50/50">
                                <td className="px-4 py-3 text-sm text-slate-900">
                                  <div className="font-bold">{item.name}</div>
                                  <div className="text-[10px] font-medium text-slate-500 mt-0.5">Max Stock: <span className="text-blue-600 font-bold">{item.maxStock}</span></div>
                                </td>
                                <td className="px-4 py-3">
                                  <input 
                                    type="number" 
                                    required 
                                    min="1" 
                                    max={item.maxStock}
                                    value={item.quantity}
                                    onChange={(e) => handleUpdateItem(item.globalProductId, 'quantity', Number(e.target.value))}
                                    className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <input 
                                    type="number" 
                                    required 
                                    min="0"
                                    step="0.01"
                                    value={item.transferRate}
                                    onChange={(e) => handleUpdateItem(item.globalProductId, 'transferRate', Number(e.target.value))}
                                    className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm font-mono text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <input 
                                    type="number" 
                                    required 
                                    min="0"
                                    step="0.01"
                                    value={item.sellingPrice}
                                    onChange={(e) => handleUpdateItem(item.globalProductId, 'sellingPrice', Number(e.target.value))}
                                    className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm font-mono text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                                  />
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button type="button" onClick={() => handleRemoveProduct(item.globalProductId)} className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="md:hidden space-y-3 overflow-y-auto max-h-[50vh] px-1 pb-2">
                        {selectedItems.map((item) => (
                           <div key={item.globalProductId} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative">
                             <button type="button" onClick={() => handleRemoveProduct(item.globalProductId)} className="absolute top-3 right-3 text-red-500 bg-red-50 p-1.5 rounded-lg border border-red-100">
                               <Trash2 className="w-4 h-4" />
                             </button>
                             <div className="pr-10 mb-3">
                                <div className="font-bold text-slate-900 text-base leading-tight">{item.name}</div>
                                <div className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">Max Global Stock: <span className="text-blue-600">{item.maxStock}</span></div>
                             </div>
                             
                             <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                               <div className="col-span-2 sm:col-span-1">
                                 <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Transfer Qty</label>
                                 <input 
                                   type="number" 
                                   required 
                                   min="1" 
                                   max={item.maxStock}
                                   value={item.quantity}
                                   onChange={(e) => handleUpdateItem(item.globalProductId, 'quantity', Number(e.target.value))}
                                   className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm font-bold outline-none focus:border-blue-500 bg-white shadow-sm" 
                                 />
                               </div>
                               <div className="col-span-1">
                                 <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Trans. Rate (₹)</label>
                                 <input 
                                   type="number" 
                                   required 
                                   min="0"
                                   step="0.01"
                                   value={item.transferRate}
                                   onChange={(e) => handleUpdateItem(item.globalProductId, 'transferRate', Number(e.target.value))}
                                   className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 bg-white shadow-sm" 
                                 />
                               </div>
                               <div className="col-span-1">
                                 <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sell Price (₹)</label>
                                 <input 
                                   type="number" 
                                   required 
                                   min="0"
                                   step="0.01"
                                   value={item.sellingPrice}
                                   onChange={(e) => handleUpdateItem(item.globalProductId, 'sellingPrice', Number(e.target.value))}
                                   className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 bg-white shadow-sm" 
                                 />
                               </div>
                             </div>
                           </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedItems.length === 0 && (
                    <div className="text-center py-10 bg-slate-50 rounded-xl border-2 border-slate-200 border-dashed">
                      <Box className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-600">No products selected.</p>
                      <p className="text-xs text-slate-500 mt-1">Use the dropdown above to add products for transfer.</p>
                    </div>
                  )}

                </div>
                <div className="bg-slate-50 px-4 py-4 sm:px-6 sm:flex sm:flex-row-reverse border-t border-slate-200">
                  <button disabled={isSubmitting || selectedItems.length === 0} type="submit" className="w-full inline-flex justify-center items-center rounded-xl border border-transparent shadow-sm px-6 py-2.5 bg-blue-600 text-base font-bold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm transition-all">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ArrowRightLeft className="w-4 h-4 mr-2" />}
                    Confirm Transfer
                  </button>
                  <button type="button" onClick={() => setIsBulkTransferOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-xl border border-slate-300 shadow-sm px-6 py-2.5 bg-white text-base font-bold text-slate-700 hover:bg-slate-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transfer Modal */}
      {editingTransfer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-xl border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Edit Transfer Quantity</h2>
                <p className="text-xs text-slate-500 mt-0.5">{editingTransfer.globalProductId?.name}</p>
              </div>
              <button onClick={() => setEditingTransfer(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <Trash2 className="w-5 h-5 opacity-0" /> {/* Spacer */}
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">New Quantity</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editQuantity}
                    // onChange={e => setEditQuantity(e.target.value)}
                    onChange={(e) => setEditQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                  <p className="text-xs text-slate-500 mt-1.5">
                    Original quantity: {editingTransfer.quantity}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTransfer(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing || editQuantity === ''}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-70 flex items-center"
                >
                  {isEditing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
