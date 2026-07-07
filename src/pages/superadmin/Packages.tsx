import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';
import toast from 'react-hot-toast';
import { Loader2, Plus, Edit2, Trash2 } from 'lucide-react';

export default function Packages() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '', description: '', price: 0, durationDays: 30, features: '', isActive: true
  });

  const fetchPackages = async () => {
    try {
      const data = await apiFetch('/packages');
      setPackages(data);
    } catch (err) {
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const openNew = () => {
    setEditingId(null);
    setFormData({ name: '', description: '', price: 0, durationDays: 30, features: '', isActive: true });
    setIsModalOpen(true);
  };

  const openEdit = (pkg: any) => {
    setEditingId(pkg._id);
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      price: pkg.price,
      durationDays: pkg.durationDays,
      features: pkg.features.join('\n'),
      isActive: pkg.isActive
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        features: formData.features.split('\n').filter(f => f.trim() !== '')
      };
      
      if (editingId) {
        await apiFetch(`/packages/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
        toast.success('Package updated');
      } else {
        await apiFetch('/packages', { method: 'POST', body: JSON.stringify(payload) });
        toast.success('Package created');
      }
      setIsModalOpen(false);
      fetchPackages();
    } catch (err: any) {
      toast.error(err.message || 'Error saving package');
    }
  };

  const deletePackage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;
    try {
      await apiFetch(`/packages/${id}`, { method: 'DELETE' });
      toast.success('Package deleted');
      fetchPackages();
    } catch (err) {
      toast.error('Error deleting package');
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Package Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage subscription packages for Admins.</p>
        </div>
        <button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Add Package
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Package Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Price (₹)</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Duration</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {packages.map(pkg => (
                <tr key={pkg._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-900">{pkg.name}</div>
                    <div className="text-xs text-slate-500">{pkg.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">₹{pkg.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{pkg.durationDays} Days</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${pkg.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                      {pkg.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openEdit(pkg)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit2 className="w-4 h-4 inline" /></button>
                    <button onClick={() => deletePackage(pkg._id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4 inline" /></button>
                  </td>
                </tr>
              ))}
              {packages.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">No packages found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {packages.map(pkg => (
          <div key={pkg._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{pkg.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{pkg.description}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${pkg.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                {pkg.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Price</span>
                <span className="font-bold text-slate-900 text-lg">₹{pkg.price}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Duration</span>
                <span className="font-bold text-slate-900">{pkg.durationDays} Days</span>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-3 space-x-3">
              <button onClick={() => openEdit(pkg)} className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-semibold bg-indigo-50 px-4 py-2 rounded-lg">
                <Edit2 className="w-4 h-4 mr-2" /> Edit
              </button>
              <button onClick={() => deletePackage(pkg._id)} className="flex items-center text-red-500 hover:text-red-700 text-sm font-semibold bg-red-50 px-4 py-2 rounded-lg">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </button>
            </div>
          </div>
        ))}
        {packages.length === 0 && (
          <div className="text-center py-8 text-slate-500 bg-white rounded-2xl border border-slate-200">No packages found.</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle w-full max-w-lg border border-slate-100">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-6 pt-6 pb-6">
                  <h3 className="text-xl font-bold text-slate-800 tracking-tight mb-5">{editingId ? 'Edit Package' : 'Add Package'}</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold tracking-tight text-slate-700 mb-1">Package Name</label>
                      <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold tracking-tight text-slate-700 mb-1">Description</label>
                      <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold tracking-tight text-slate-700 mb-1">Price (₹)</label>
                        <input required type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold tracking-tight text-slate-700 mb-1">Duration (Days)</label>
                        <input required type="number" min="1" value={formData.durationDays} onChange={e => setFormData({...formData, durationDays: Number(e.target.value)})} className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold tracking-tight text-slate-700 mb-1">Features (One per line)</label>
                      <textarea rows={4} value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Feature 1\nFeature 2" />
                    </div>
                    <div className="flex items-center mt-2">
                      <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                      <label htmlFor="isActive" className="ml-2 block text-sm text-slate-900 font-medium">Active (Visible to Users)</label>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50/80 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">Save Package</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
