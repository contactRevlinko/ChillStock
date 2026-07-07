import React, { useEffect, useState } from 'react';
import { Box, Search, Loader2, Edit2, PackagePlus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import toast from 'react-hot-toast';

export default function AdminStockIn() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 9;

  // Edit State
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [editQuantity, setEditQuantity] = useState<number | ''>('');
  const [isEditing, setIsEditing] = useState(false);

  const fetchLogs = async () => {
    try {
      const data = await apiFetch('/admin/stockin-logs');
      setLogs(data);
    } catch (error) {
      toast.error('Error fetching stock in logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const openEditModal = (log: any) => {
    setEditingEntry(log);
    setEditQuantity(log.quantity);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry || editQuantity === '' || Number(editQuantity) < 0) return;
    
    setIsEditing(true);
    try {
      await apiFetch(`/admin/stockin/${editingEntry._id}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: Number(editQuantity) })
      });
      toast.success('Stock in updated successfully');
      setEditingEntry(null);
      fetchLogs();
    } catch (error: any) {
      toast.error(error.message || 'Update failed');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteStockIn = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this stock in entry? This will remove the stock from global inventory.')) return;
    try {
      await apiFetch(`/admin/stockin/${id}`, { method: 'DELETE' });
      toast.success('Stock in deleted and inventory reverted');
      fetchLogs();
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  const filteredLogs = logs.filter(l =>
    l.globalProductId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.globalProductId?.category?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLogs.length / limit);
  const paginatedLogs = filteredLogs.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    setPage(1);
  }, [search]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Stock In History</h1>
          <p className="text-slate-500 text-sm mt-1">View log of stock added to global inventory.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by product name or category..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full sm:max-w-xs pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm transition-shadow"
            />
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-3 bg-white p-1.5 px-3 rounded-xl border border-slate-200 shadow-sm self-end sm:self-auto">
               <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Page {page} of {totalPages}</span>
               <div className="flex items-center gap-1">
                 <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 disabled:opacity-50 text-slate-600"><ChevronLeft className="w-4 h-4" /></button>
                 <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 disabled:opacity-50 text-slate-600"><ChevronRight className="w-4 h-4" /></button>
               </div>
            </div>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Quantity Added</th>
                <th className="px-6 py-4">Added By</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLogs.map(l => (
                <tr key={l._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="font-semibold text-slate-800">{new Date(l.createdAt).toLocaleDateString()}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{new Date(l.createdAt).toLocaleTimeString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{l.globalProductId?.name || 'Unknown'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{l.globalProductId?.category || '-'}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded text-sm">+{l.quantity}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {l.addedBy?.name || 'Admin'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => openEditModal(l)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit Quantity"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteStockIn(l._id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <PackagePlus className="w-12 h-12 text-slate-200 mb-3" />
                      <p className="font-medium text-slate-600">No stock in entries found.</p>
                      <p className="text-xs mt-1">Add stock via the Global Products page.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden mt-4">
          <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
            {paginatedLogs.map((l, index) => (
              <div key={l._id} className={`p-4 flex items-start gap-3 ${index !== paginatedLogs.length - 1 ? 'border-b border-slate-100' : ''}`}>
                <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <PackagePlus className="text-emerald-600 w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 text-[15px] truncate">{l.globalProductId?.name || 'Unknown'}</div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {new Date(l.createdAt).toLocaleDateString()} • {new Date(l.createdAt).toLocaleTimeString()}
                  </div>
                  {l.globalProductId?.category && (
                    <div className="text-[10px] text-slate-400 mt-0.5">{l.globalProductId.category}</div>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0 items-end">
                   <div className="flex items-center gap-2">
                     <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-1 rounded font-bold text-xs">
                       +{l.quantity}
                     </span>
                     <div className="flex flex-col gap-1">
                       <button onClick={() => openEditModal(l)} className="text-rose-400 border border-rose-100 rounded p-1 hover:bg-rose-50">
                         <Edit2 className="w-3.5 h-3.5" />
                       </button>
                       <button onClick={() => handleDeleteStockIn(l._id)} className="text-rose-500 border border-rose-100 rounded p-1 hover:bg-rose-50">
                         <Trash2 className="w-3.5 h-3.5" />
                       </button>
                     </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {filteredLogs.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              <PackagePlus className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="font-medium text-slate-600">No stock in entries found.</p>
              <p className="text-xs mt-1">Add stock via the Global Products page.</p>
            </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingEntry && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-xl border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Edit Stock In Quantity</h2>
                <p className="text-xs text-slate-500 mt-0.5">{editingEntry.globalProductId?.name}</p>
              </div>
              <button onClick={() => setEditingEntry(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
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
                    onChange={e => setEditQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                  <p className="text-xs text-slate-500 mt-1.5">
                    Original quantity: {editingEntry.quantity}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
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
