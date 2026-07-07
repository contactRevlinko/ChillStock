import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

interface Admin {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  branchId?: { _id: string; name: string };
}

type Mode = 'create' | 'edit';

interface Props {
  mode: Mode;
  admin?: Admin | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditAdminModal({ mode, admin, onClose, onSaved }: Props) {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', companyName: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && admin) {
      setForm({ name: admin.name || '', email: admin.email || '', password: '', phone: admin.phone || '', companyName: admin.companyName || '' });
    } else {
      setForm({ name: '', email: '', password: '', phone: '', companyName: '' });
    }
  }, [mode, admin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length > 10) {
        toast.error('Phone number cannot exceed 10 digits');
        return;
      }
      setForm(prev => ({ ...prev, [name]: numericValue }));
      return;
    }

    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (form.phone && !/^\d{10}$/.test(form.phone)) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        companyName: form.companyName,
        ...(form.password ? { password: form.password } : {})
      };
      if (mode === 'create') {
        await apiFetch('/superadmin/admins', { method: 'POST', body: JSON.stringify(payload) });
        toast.success('Admin created');
      } else if (mode === 'edit' && admin) {
        await apiFetch(`/superadmin/admins/${admin._id}`, { method: 'PUT', body: JSON.stringify(payload) });
        toast.success('Admin updated');
      }
      onSaved();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            {mode === 'create' ? 'Create New Admin' : 'Edit Admin'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold tracking-tight text-slate-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Rahul Sharma"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-bold tracking-tight text-slate-700 mb-1">Company Name</label>
            <input
              type="text"
              name="companyName"
              required
              value={form.companyName}
              onChange={handleChange}
              placeholder="e.g. Acme Corp"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-bold tracking-tight text-slate-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="admin@chillstock.com"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-bold tracking-tight text-slate-700 mb-1">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="e.g. +91 9876543210"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
          {mode === 'create' && (
            <div>
              <label className="block text-sm font-bold tracking-tight text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                placeholder="Enter password"
                value={form.password}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          )}
          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
            >
              {loading ? 'Saving...' : 'Save Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
