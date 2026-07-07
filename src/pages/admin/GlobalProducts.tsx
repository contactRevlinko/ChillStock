import React, { useEffect, useState } from 'react';
import { Package, Plus, Search, Edit2, Loader2, Trash2, ArrowRightLeft, Download, Upload, Box, ChevronLeft, ChevronRight, Calculator, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { apiFetch } from '../../utils/api';
import { GlobalProduct, Branch } from '../../types';
import toast from 'react-hot-toast';
import { generateTransferReceiptPDF } from '../../utils/pdfGenerator';
import { useAuthStore } from '../../context/store';

export default function AdminGlobalProducts() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<GlobalProduct[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 9;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '', sku: '', category: '', unitType: 'pcs', unitSize: 1, purchaseRate: 0, sellRate: 0, imageUrl: '', lowStockThreshold: 50
  });

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockAddId, setStockAddId] = useState<string | null>(null);
  const [addStockAmount, setAddStockAmount] = useState<number>(0);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferData, setTransferData] = useState({
    globalProductId: '', branchId: '', quantity: 0, transferRate: 0
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  
  const [expectationData, setExpectationData] = useState<any>(null);
  const [isExpectationModalOpen, setIsExpectationModalOpen] = useState(false);
  const [loadingExpectation, setLoadingExpectation] = useState(false);
  const [isStockInExpanded, setIsStockInExpanded] = useState(false);
  const [isStockOutExpanded, setIsStockOutExpanded] = useState(false);

  const fetchData = async () => {
    try {
      const [pData, bData] = await Promise.all([
        apiFetch('/admin/products'),
        apiFetch('/admin/branches')
      ]);
      setProducts(pData);
      setBranches(bData);
    } catch (error) {
      toast.error('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredProducts = products.filter(p => {
    const lowerSearch = search.toLowerCase();
    const nameMatch = p.name?.toLowerCase().includes(lowerSearch) ?? false;
    const skuMatch = p.sku?.toLowerCase().includes(lowerSearch) ?? false;
    return nameMatch || skuMatch;
  });

  const totalPages = Math.ceil(filteredProducts.length / limit);
  const paginatedProducts = filteredProducts.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, sellRate: formData.purchaseRate };
      if (editingId) {
        await apiFetch(`/admin/products/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
        toast.success('Product updated');
      } else {
        await apiFetch('/admin/products', { method: 'POST', body: JSON.stringify(payload) });
        toast.success('Product created');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Error saving product');
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await apiFetch(`/admin/products/${deleteConfirmId}`, { method: 'DELETE' });
      toast.success('Product deleted');
      setSelectedIds(selectedIds.filter(id => id !== deleteConfirmId));
      fetchData();
      setDeleteConfirmId(null);
    } catch (error) {
      toast.error('Error deleting product');
    }
  };

  const confirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await apiFetch(`/admin/products/bulk-delete`, { method: 'POST', body: JSON.stringify({ ids: selectedIds }) });
      toast.success(`${selectedIds.length} Products deleted`);
      setSelectedIds([]);
      fetchData();
      setIsBulkDeleteModalOpen(false);
    } catch (error) {
      toast.error('Error deleting products');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p._id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleAddStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch(`/admin/products/${stockAddId}`, { method: 'PUT', body: JSON.stringify({ addStock: addStockAmount }) });
      toast.success('Stock added successfully');
      setIsStockModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error('Error adding stock');
    }
  };

  
  const openExpectation = async (p: GlobalProduct) => {
    setIsExpectationModalOpen(true);
    setLoadingExpectation(true);
    setExpectationData(null);
    setIsStockInExpanded(false);
    setIsStockOutExpanded(false);
    try {
      const data = await apiFetch(`/admin/products/${p._id}/expectation`);
      setExpectationData(data);
    } catch (error) {
      toast.error('Failed to load expectation data');
    } finally {
      setLoadingExpectation(false);
    }
  };


  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferData.branchId) {
      toast.error('Please explicitly select a branch from the dropdown');
      return;
    }
    try {
      const payload = { ...transferData };
      await apiFetch(`/admin/transfer`, { method: 'POST', body: JSON.stringify(payload) });
      toast.success('Stock transferred successfully');
      setIsTransferModalOpen(false);
      fetchData();

      try {
        const product = products.find(p => p._id === transferData.globalProductId);
        const branch = branches.find(b => b._id === payload.branchId);
        if (product && branch) {
           const items = [{
             name: product.name,
             unit: `${product.unitSize}${product.unitType}`,
             quantity: transferData.quantity,
             price: transferData.transferRate
           }];
           const total = transferData.quantity * transferData.transferRate;
           generateTransferReceiptPDF(branch.name, user?.name || 'Admin', items, total, true);
        }
      } catch (pdfError) {
        console.error('PDF Generation failed', pdfError);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error transferring stock');
    }
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Name", "SKU", "Category", "PurchaseRate", "SellRate", "ImageURL"]
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "products_template.xlsx");
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws) as any[];
        
        const newProducts = rows.map(row => {
          const nRow: any = {};
          for (let key in row) {
            nRow[key.trim().toLowerCase()] = row[key];
          }
          return {
            name: nRow.name || nRow.productname || '',
            sku: nRow.sku ? String(nRow.sku).trim() : '',
            category: nRow.category || 'Uncategorized',
            unitType: 'pcs',
            unitSize: 1,
            purchaseRate: Number(nRow.purchaserate) || 0,
            sellRate: Number(nRow.sellrate) || 0,
            imageUrl: nRow.imageurl || ''
          };
        }).filter(p => p.name && p.sku && !p.name.toString().includes('(e.g.'));

        if (newProducts.length === 0) {
          toast.error("No valid products found in Excel. Check column names.");
          return;
        }

        const skus = newProducts.map(p => p.sku);
        if (new Set(skus).size !== skus.length) {
          toast.error("Error: Your Excel file contains duplicate SKUs.");
          return;
        }

        await apiFetch('/admin/products/bulk', { method: 'POST', body: JSON.stringify({ products: newProducts }) });
        toast.success(`Successfully uploaded ${newProducts.length} products`);
        fetchData();
      } catch (error: any) {
        toast.error(error.message || "Error processing Excel file");
      }
      if (e.target) e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const openNew = () => {
    setFormData({ name: '', sku: '', category: '', unitType: 'pcs', unitSize: 1, purchaseRate: 0, sellRate: 0, imageUrl: '', lowStockThreshold: 50 });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEdit = (p: GlobalProduct) => {
    setFormData({
      name: p.name,
      sku: p.sku,
      category: p.category,
      unitType: p.unitType ?? "",
      unitSize: p.unitSize ?? 0,
      purchaseRate: p.purchaseRate,
      sellRate: p.sellRate,
      imageUrl: p.imageUrl,
      lowStockThreshold: p.lowStockThreshold,
    });
    setEditingId(p._id);
    setIsModalOpen(true);
  };

  const openStockAdd = (p: GlobalProduct) => {
    setStockAddId(p._id);
    setAddStockAmount(0);
    setIsStockModalOpen(true);
  };

  const openTransfer = (p: GlobalProduct) => {
    setTransferData({
      globalProductId: p._id,
      branchId: branches[0]?._id || '',
      quantity: 1,
      transferRate: p.sellRate
    });
    setIsTransferModalOpen(true);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Global Products</h1>
          <p className="text-slate-500 text-sm">Manage products, pricing, and global stock.</p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
          {selectedIds.length > 0 && (
            <button onClick={() => setIsBulkDeleteModalOpen(true)} className="col-span-2 sm:col-span-1 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center shadow-sm border border-red-200">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete ({selectedIds.length})
            </button>
          )}
          <button onClick={handleDownloadTemplate} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center border border-slate-200">
            <Download className="w-4 h-4 mr-2" />
            Template
          </button>
          <label className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center cursor-pointer shadow-sm">
            <Upload className="w-4 h-4 mr-2" />
            Upload
            <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleExcelUpload} />
          </label>
          <button onClick={openNew} className="col-span-2 sm:col-span-1 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all active:scale-95 flex items-center justify-center whitespace-nowrap">
            <Plus className="w-5 h-5 mr-2" />
            Add Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full sm:max-w-xs pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-3 bg-slate-50 p-1.5 px-3 rounded-xl border border-slate-200 self-end sm:self-auto">
               <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Page {page} of {totalPages}</span>
               <div className="flex items-center gap-1">
                 <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50 text-slate-600"><ChevronLeft className="w-4 h-4" /></button>
                 <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50 text-slate-600"><ChevronRight className="w-4 h-4" /></button>
               </div>
            </div>
          )}
        </div>

        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-6 py-4 w-12">
                  <input type="checkbox" checked={filteredProducts.length > 0 && selectedIds.length === filteredProducts.length} onChange={toggleSelectAll} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                </th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">SKU / Cat</th>
                <th className="px-6 py-4">Buy | Sell Rate</th>
                <th className="px-6 py-4">Global Stock</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProducts.map(p => (
                <tr key={p._id} className={`hover:bg-slate-50/50 transition-colors ${selectedIds.includes(p._id) ? 'bg-blue-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    <input type="checkbox" checked={selectedIds.includes(p._id)} onChange={() => toggleSelect(p._id)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                        {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <Package className="text-slate-400 w-5 h-5" />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{p.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="font-mono text-xs mb-1">{p.sku}</div>
                    <div className="text-xs">{p.category}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-700">Buy: ₹{p.purchaseRate}</div>
                    <div className="text-sm font-bold text-emerald-600">Sell: ₹{p.sellRate}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${p.globalStock > 0 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
                      {p.globalStock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-2 items-center">
                      <button onClick={() => openStockAdd(p)} className="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md text-xs hover:bg-blue-100 font-bold flex items-center transition-colors"><Plus className="w-3 h-3 mr-1" /> Stock</button>
                      <button onClick={() => openTransfer(p)} className="text-purple-600 bg-purple-50 px-3 py-1.5 rounded-md text-xs hover:bg-purple-100 font-bold flex items-center transition-colors"><ArrowRightLeft className="w-3 h-3 mr-1"/> Transfer</button>
                      <button onClick={() => openExpectation(p)} className="text-slate-400 hover:text-emerald-600 p-1.5 transition-colors"><Calculator className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(p)} className="text-slate-400 hover:text-blue-600 p-1.5 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteConfirmId(p._id)} className="text-slate-400 hover:text-red-600 p-1.5 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        {/* Mobile View */}
        <div className="lg:hidden mt-4">
          <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
            {paginatedProducts.map((p, index) => (
              <div key={p._id} className={`p-4 ${index !== paginatedProducts.length - 1 ? 'border-b border-slate-100' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={selectedIds.includes(p._id)} onChange={() => toggleSelect(p._id)} className="w-5 h-5 rounded border-slate-300 text-blue-600 mt-1 cursor-pointer" />
                    <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                      {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover rounded-lg" /> : <Package className="text-slate-300 w-6 h-6" />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-[15px]">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.category}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{p.sku}</div>
                    </div>
                  </div>
                   <div className="flex gap-1.5 shrink-0">
                     <button onClick={() => openExpectation(p)} className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200">
                       <Calculator className="w-3.5 h-3.5" />
                     </button>
                     <button onClick={() => openEdit(p)} className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50">
                       <Edit2 className="w-3.5 h-3.5" />
                     </button>
                     <button onClick={() => setDeleteConfirmId(p._id)} className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200">
                       <Trash2 className="w-3.5 h-3.5" />
                     </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-4">
                   <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Buy | Sell</p>
                      <div className="text-sm font-bold text-slate-700">₹{p.purchaseRate} <span className="text-slate-400 mx-1">|</span> <span className="text-emerald-600">₹{p.sellRate}</span></div>
                   </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Global Stock</p>
                       <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${p.globalStock > (p.lowStockThreshold ?? 50) ? 'text-slate-700' : 'text-rose-600'}`}>{p.globalStock}</span>
                          <span className="text-[10px] text-slate-400">Min: {p.lowStockThreshold ?? 50}</span>
                       </div>
                    </div>
                </div>
                
                <div className="flex gap-3 mt-4">
                   <button onClick={() => openStockAdd(p)} className="flex-1 bg-rose-50 text-rose-500 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center">
                     + Stock
                   </button>
                   <button onClick={() => openTransfer(p)} className="flex-1 bg-purple-50 text-purple-600 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center">
                     <ArrowRightLeft className="w-4 h-4 mr-1.5" /> Transfer
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>
          {filteredProducts.length === 0 && (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Box className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No products found</h3>
                <p className="text-slate-500 text-sm mt-1 max-w-xs">Get started by adding your first product.</p>
                <button onClick={openNew} className="mt-6 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm">
                  Add Product
                </button>
              </div>
          )}
        </div>

      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setIsTransferModalOpen(false)}></div>
          <div className="bg-white rounded-2xl w-full max-w-sm relative z-10 overflow-hidden shadow-xl">
             <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Transfer to Branch</h3>
             </div>
             <form onSubmit={handleTransferSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold tracking-tight text-slate-700 mb-1">Select Branch</label>
                  <select required value={transferData.branchId} onChange={e => setTransferData({...transferData, branchId: e.target.value})} className="w-full border-slate-200 rounded-lg px-3 py-2 border focus:ring-2 focus:ring-blue-500">
                    <option value="">-- Choose Branch --</option>
                    {branches.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold tracking-tight text-slate-700 mb-1">Quantity</label>
                  <input required type="number" min="1" value={transferData.quantity || ''} onChange={e => setTransferData({...transferData, quantity: parseInt(e.target.value)})} className="w-full border-slate-200 rounded-lg px-3 py-2 border focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold tracking-tight text-slate-700 mb-1">Transfer Rate / sell price</label>
                  <input required type="number" step="any" value={transferData.transferRate || ''} onChange={e => setTransferData({...transferData, transferRate: parseFloat(e.target.value)})} className="w-full border-slate-200 rounded-lg px-3 py-2 border focus:ring-2 focus:ring-blue-500" />
                  {transferData.transferRate < (products.find(p => p._id === transferData.globalProductId)?.purchaseRate || 0) && (
                    <p className="text-xs text-red-500 mt-1 font-medium bg-red-50 p-1 rounded">Warning: Lower than original purchase rate!</p>
                  )}
                  {transferData.transferRate < (products.find(p => p._id === transferData.globalProductId)?.sellRate || 0) && transferData.transferRate >= (products.find(p => p._id === transferData.globalProductId)?.purchaseRate || 0) && (
                    <p className="text-xs text-amber-500 mt-1 font-medium bg-amber-50 p-1 rounded">Note: Lower than default sell rate.</p>
                  )}
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsTransferModalOpen(false)} className="flex-1 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" disabled={!transferData.branchId || !transferData.quantity || !transferData.transferRate} className="flex-1 py-2 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50">Transfer</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {isStockModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setIsStockModalOpen(false)}></div>
          <div className="bg-white rounded-2xl w-full max-w-sm relative z-10 overflow-hidden shadow-xl">
             <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Add Stock</h3>
             </div>
             <form onSubmit={handleAddStockSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold tracking-tight text-slate-700 mb-1">Quantity to add</label>
                  <input required type="number" value={addStockAmount} onChange={e => setAddStockAmount(parseInt(e.target.value))} className="w-full border-slate-200 rounded-lg px-3 py-2 border focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsStockModalOpen(false)} className="flex-1 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors">Add</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-2xl w-full max-w-md relative z-10 overflow-hidden shadow-xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold tracking-tight text-slate-800">{editingId ? 'Edit Product' : 'New Product'}</h3>
            </div>
            
            <div className="p-6 overflow-y-auto w-full">
              <form id="productForm" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold tracking-tight text-slate-700 mb-1">Product Name *</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-slate-200 rounded-lg px-3 py-2 border focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold tracking-tight text-slate-700 mb-1">SKU *</label>
                    <input required type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full border-slate-200 rounded-lg px-3 py-2 border focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-mono text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold tracking-tight text-slate-700 mb-1">Category *</label>
                    <input required type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border-slate-200 rounded-lg px-3 py-2 border focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
                  </div>
                </div>



                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold tracking-tight text-slate-700 mb-1">Purchase Rate (Cost) *</label>
                    <input required type="number" value={formData.purchaseRate} onChange={e => setFormData({...formData, purchaseRate: parseFloat(e.target.value)})} className="w-full border-slate-200 rounded-lg px-3 py-2 border focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Sell Rate (₹)</label>
                    <input disabled type="number" value={formData.purchaseRate} className="w-full border-slate-200 rounded-lg px-3 py-2 border bg-slate-100 text-slate-500 cursor-not-allowed" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold tracking-tight text-slate-700 mb-1">Low Stock Threshold</label>
                    <input required type="number" min="0" value={formData.lowStockThreshold} onChange={e => setFormData({...formData, lowStockThreshold: parseInt(e.target.value)})} className="w-full border-slate-200 rounded-lg px-3 py-2 border focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold tracking-tight text-slate-700 mb-1">Image URL</label>
                  <input type="url" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="w-full border-slate-200 rounded-lg px-3 py-2 border focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
              <button type="submit" form="productForm" className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setDeleteConfirmId(null)}></div>
          <div className="bg-white rounded-2xl w-full max-w-sm relative z-10 overflow-hidden shadow-xl p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Product</h3>
            <p className="text-slate-600 text-sm mb-6">Are you sure you want to delete this product? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirmId(null)} 
                className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-bold bg-white hover:bg-slate-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setIsBulkDeleteModalOpen(false)}></div>
          <div className="bg-white rounded-2xl w-full max-w-sm relative z-10 overflow-hidden shadow-xl p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Bulk Delete Products</h3>
            <p className="text-slate-600 text-sm mb-6">Are you sure you want to delete {selectedIds.length} selected products? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsBulkDeleteModalOpen(false)} 
                className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-bold bg-white hover:bg-slate-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmBulkDelete}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {isExpectationModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsExpectationModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle w-full max-w-xl border border-slate-100">
              <div className="bg-white px-6 pt-6 pb-6">
                {loadingExpectation || !expectationData ? (
                  <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
                ) : (
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">{expectationData.product.name}</h3>
                        <p className="text-xs text-slate-500 font-mono mt-1">{expectationData.product.sku}</p>
                      </div>
                      <div className="text-right">
                         <div className="text-[10px] uppercase font-bold text-slate-400">Current Stock</div>
                         <div className="font-black text-rose-500 text-2xl">{expectationData.product.currentStock}</div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                       <div className="border border-emerald-100 rounded-xl overflow-hidden">
                         <div 
                           className="flex justify-between items-center bg-emerald-50/50 p-4 cursor-pointer hover:bg-emerald-50 transition-colors"
                           onClick={() => setIsStockInExpanded(!isStockInExpanded)}
                         >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 font-black">+</div>
                              <div>
                                 <div className="font-bold text-slate-800">Total Stock In</div>
                                 <div className="text-[11px] text-slate-500">{expectationData.stockIn.count} records</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                               <div className="font-black text-emerald-600 text-xl">{expectationData.stockIn.total}</div>
                               {isStockInExpanded ? <ChevronUp className="w-4 h-4 text-emerald-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </div>
                         </div>
                         {isStockInExpanded && expectationData.stockIn.records && (
                           <div className="p-4 bg-white space-y-2 border-t border-emerald-50 max-h-60 overflow-y-auto">
                             {expectationData.stockIn.records.map((record: any, idx: number) => (
                               <div key={idx} className="flex justify-between items-center border border-slate-100 rounded-lg p-3 hover:bg-slate-50/50">
                                 <div>
                                   <div className="text-xs font-bold text-slate-700">{format(new Date(record.createdAt), 'MM/dd/yyyy, h:mm:ss a')}</div>
                                   <div className="text-[11px] text-slate-500 mt-0.5">By {record.addedBy?.name || 'Admin'}</div>
                                 </div>
                                 <div className="font-bold text-emerald-600 text-sm">+{record.quantity}</div>
                               </div>
                             ))}
                           </div>
                         )}
                       </div>
                       
                       <div className="border border-orange-100 rounded-xl overflow-hidden">
                         <div 
                           className="flex justify-between items-center bg-orange-50/50 p-4 cursor-pointer hover:bg-orange-50 transition-colors"
                           onClick={() => setIsStockOutExpanded(!isStockOutExpanded)}
                         >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0 font-black">-</div>
                              <div>
                                 <div className="font-bold text-slate-800">Total Stock Out</div>
                                 <div className="text-[11px] text-slate-500">{expectationData.stockOut.count} transfers</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                               <div className="font-black text-orange-600 text-xl">{expectationData.stockOut.total}</div>
                               {isStockOutExpanded ? <ChevronUp className="w-4 h-4 text-orange-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </div>
                         </div>
                         {isStockOutExpanded && expectationData.stockOut.records && (
                           <div className="p-4 bg-white space-y-2 border-t border-orange-50 max-h-60 overflow-y-auto">
                             {expectationData.stockOut.records.map((record: any, idx: number) => (
                               <div key={idx} className="flex justify-between items-center border border-slate-100 rounded-lg p-3 hover:bg-slate-50/50">
                                 <div>
                                   <div className="text-xs font-bold text-slate-700">To {record.branchId?.name || 'Unknown Branch'}</div>
                                   <div className="text-[11px] text-slate-500 mt-0.5">{format(new Date(record.createdAt), 'MM/dd/yyyy, h:mm:ss a')}</div>
                                 </div>
                                 <div className="font-bold text-orange-500 text-sm">-{record.quantity}</div>
                               </div>
                             ))}
                           </div>
                         )}
                       </div>
                    </div>
                    
                    <div className="flex justify-between items-center bg-slate-50 rounded-xl p-4 mb-6">
                       <div className="text-sm font-bold text-slate-500">Mathematical Expectation:</div>
                       <div className="font-bold text-slate-800 bg-white px-3 py-1 rounded-lg border border-slate-200">
                         {expectationData.stockIn.total} - {expectationData.stockOut.total} = {expectationData.expectation}
                       </div>
                    </div>
                    
                    <div className="flex justify-end">
                       <button onClick={() => setIsExpectationModalOpen(false)} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors">
                         Close
                       </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
