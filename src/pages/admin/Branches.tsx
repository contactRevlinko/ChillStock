import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import { Branch } from '../../types';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Key, Loader2, Eye, Store, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 8;
  const navigate = useNavigate();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Branch>>({
    name: '', location: '', managerName: '', contact: ''
  });
  const [authData, setAuthData] = useState({ branchId: '', name: '', email: '', password: '' });
  
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetData, setResetData] = useState({ branchId: '', newPassword: '', confirmPassword: '' });
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBranches();
  }, []);
console.log(branches);
  const fetchBranches = async () => {
    try {
      const data = await apiFetch('/admin/branches');
      setBranches(data);
    } catch (error: any) {
      toast.error('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.contact && !/^\d{10}$/.test(formData.contact)) {
      toast.error('Contact phone number must be exactly 10 digits');
      return;
    }
    try {
      if (editingId) {
        await apiFetch(`/admin/branches/${editingId}`, { method: 'PUT', body: JSON.stringify(formData) });
        toast.success('Branch updated');
      } else {
        await apiFetch('/admin/branches', { method: 'POST', body: JSON.stringify(formData) });
        toast.success('Branch created');
      }
      setIsModalOpen(false);
      fetchBranches();
    } catch (error: any) {
      toast.error(error.message || 'Error saving branch');
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/admin/branch-users', { method: 'POST', body: JSON.stringify(authData) });
      toast.success('Branch user created successfully');
      setIsAuthModalOpen(false);
      fetchBranches();
    } catch (error: any) {
      toast.error(error.message || 'Error creating branch user');
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetData.newPassword !== resetData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await apiFetch('/admin/branch-users/reset-password', { 
        method: 'PUT', 
        body: JSON.stringify({ branchId: resetData.branchId, password: resetData.newPassword }) 
      });
      toast.success('Password reset successfully');
      setIsResetModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Error resetting password');
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await apiFetch(`/admin/branches/${deleteConfirmId}`, { method: 'DELETE' });
      toast.success('Branch deleted');
      fetchBranches();
      setDeleteConfirmId(null);
    } catch (error: any) {
      toast.error('Failed to delete branch');
    }
  };

  const openNew = () => {
    setEditingId(null);
    setFormData({ name: '', location: '', managerName: '', contact: '' });
    setIsModalOpen(true);
  };

  const openEdit = (b: Branch) => {
    setEditingId(b._id);
    setFormData(b);
    setIsModalOpen(true);
  };

  const openAuth = (b: Branch) => {
    if (b.hasUser) {
      setResetData({ branchId: b._id, newPassword: '', confirmPassword: '' });
      setIsResetModalOpen(true);
    } else {
      setAuthData({ branchId: b._id, name: `${b.name} User`, email: '', password: '' });
      setIsAuthModalOpen(true);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  const totalPages = Math.ceil(branches.length / limit);
  const paginatedBranches = branches.slice((page - 1) * limit, page * limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Branches</h1>
          <p className="text-slate-500 text-sm mt-1">Manage retail locations and their access.</p>
        </div>
        <button onClick={openNew} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center transition-colors shadow-sm text-sm font-medium">
          <Plus className="w-5 h-5 mr-2" /> Add Branch
        </button>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-3 bg-white p-2 px-4 rounded-xl shadow-sm border border-slate-200">
           <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Page {page} of {totalPages}</span>
           <div className="flex items-center gap-1">
             <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 disabled:opacity-50 text-slate-600"><ChevronLeft className="w-4 h-4" /></button>
             <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 disabled:opacity-50 text-slate-600"><ChevronRight className="w-4 h-4" /></button>
           </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Manager</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {paginatedBranches.map(b => (
                <tr key={b._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{b.name}</div>
                    <div className="text-sm text-slate-500">{b.location}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{b.managerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{b.contact}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button onClick={() => navigate(`/admin/branches/${b._id}`)} className="text-blue-600 hover:text-blue-900 border border-blue-200 px-3 py-1 rounded-md text-xs mr-2 transition-colors">Details</button>
                    {/* HIDDEN FOR CLIENT: <button onClick={() => openAuth(b)} className={b.hasUser ? "text-amber-500 hover:text-amber-700" : "text-emerald-600 hover:text-emerald-900"} title={b.hasUser ? "Reset Password" : "Create User Login"}><Key className="w-4 h-4 inline" /></button> */}
                    <button onClick={() => openEdit(b)} className="text-indigo-600 hover:text-indigo-900"><Edit2 className="w-4 h-4 inline" /></button>
                    <button onClick={() => setDeleteConfirmId(b._id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4 inline" /></button>
                  </td>
                </tr>
              ))}
              {branches.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">No branches found. Create one.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden mt-4">
          <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
            {paginatedBranches.map((b, index) => (
              <div key={b._id} className={`p-4 ${index !== paginatedBranches.length - 1 ? 'border-b border-slate-100' : ''}`}>
                <div className="mb-4">
                  <div className="font-bold text-slate-800 text-[15px]">{index + 1 + (page - 1) * limit}). {b.name}</div>
                  <div className="text-sm text-slate-500">{b.location}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-lg p-3 mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Manager</span>
                    <span className="font-bold text-slate-700">{b.managerName}</span>
                  </div>
                  <div>
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Contact</span>
                     <span className="font-bold text-slate-700">{b.contact}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                   <button onClick={() => navigate(`/admin/branches/${b._id}`)} className="flex-1 border border-rose-200 text-rose-500 py-2 rounded-lg text-sm font-bold flex items-center justify-center hover:bg-rose-50">
                     Details
                   </button>
                   <button onClick={() => openEdit(b)} className="w-10 h-10 border border-blue-200 text-blue-500 rounded-lg flex items-center justify-center hover:bg-blue-50 shrink-0">
                     <Edit2 className="w-4 h-4" />
                   </button>
                   <button onClick={() => setDeleteConfirmId(b._id)} className="w-10 h-10 border border-rose-200 text-rose-500 rounded-lg flex items-center justify-center hover:bg-rose-50 shrink-0">
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </div>
            ))}
          </div>
          {branches.length === 0 && (
             <div className="p-12 flex flex-col items-center justify-center text-center">
               <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                 <Store className="w-8 h-8 text-slate-400" />
               </div>
               <h3 className="text-lg font-bold text-slate-900">No branches yet</h3>
               <p className="text-slate-500 text-sm mt-1 max-w-xs">Get started by adding your first retail location.</p>
               <button onClick={openNew} className="mt-6 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm">
                 Create Branch
               </button>
             </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle w-full max-w-lg border border-slate-100">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-6 pt-6 pb-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">{editingId ? 'Edit Branch' : 'Add Branch'}</h3>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold tracking-tight text-slate-700 mb-1">Branch Name</label>
                      <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-slate-400" placeholder="e.g. Main Street Branch" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold tracking-tight text-slate-700 mb-1">Location / Address</label>
                      <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-slate-400" placeholder="e.g. 123 Main St, City" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-bold tracking-tight text-slate-700 mb-1">Manager Name</label>
                        <input required type="text" value={formData.managerName} onChange={e => setFormData({...formData, managerName: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-slate-400" placeholder="e.g. John Doe" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold tracking-tight text-slate-700 mb-1">Contact Phone</label>
                        <input required type="text" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-slate-400" placeholder="e.g. +1 234 567 890" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50/80 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all active:scale-95">
                    {editingId ? 'Save Changes' : 'Create Branch'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-900 bg-opacity-50 transition-opacity" onClick={() => setIsAuthModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md w-full">
              <form onSubmit={handleAuthSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-slate-900 mb-2">Create Branch Login</h3>
                  <p className="text-sm text-slate-500 mb-5">Create credentials for the branch manager to access the POS terminal.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Name</label>
                      <input required type="text" value={authData.name} onChange={e => setAuthData({...authData, name: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Login Email</label>
                      <input required type="email" value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Password</label>
                      <input required type="password" value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-slate-200">
                  <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 sm:ml-3 sm:w-auto sm:text-sm">
                    Create Login
                  </button>
                  <button type="button" onClick={() => setIsAuthModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-900 bg-opacity-50 transition-opacity" onClick={() => setIsResetModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md w-full">
              <form onSubmit={handleResetSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-slate-900 mb-2">Reset Password</h3>
                  <p className="text-sm text-slate-500 mb-5">Set a new password for this branch login.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">New Password</label>
                      <input required type="password" value={resetData.newPassword} onChange={e => setResetData({...resetData, newPassword: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
                      <input required type="password" value={resetData.confirmPassword} onChange={e => setResetData({...resetData, confirmPassword: e.target.value})} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-slate-200">
                  <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-amber-600 text-base font-medium text-white hover:bg-amber-700 sm:ml-3 sm:w-auto sm:text-sm">
                    Reset Password
                  </button>
                  <button type="button" onClick={() => setIsResetModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setDeleteConfirmId(null)}></div>
          <div className="bg-white rounded-2xl w-full max-w-sm relative z-10 overflow-hidden shadow-xl p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Branch</h3>
            <p className="text-slate-600 text-sm mb-6">Are you sure you want to delete this branch? This will also delete its users and cannot be undone.</p>
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
    </div>
  );
}
