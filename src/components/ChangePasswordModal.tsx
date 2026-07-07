import React, { useState } from 'react';
import { apiFetch } from '../utils/api';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

interface Admin {
  _id: string;
  name: string;
  email: string;
}

interface Props {
  admin: Admin;
  onClose: () => void;
  onSaved: () => void;
}

export default function ChangePasswordModal({ admin, onClose, onSaved }: Props) {
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const payload = { password: form.password };
      await apiFetch(`/superadmin/admins/${admin._id}`, { method: 'PUT', body: JSON.stringify(payload) });
      toast.success('Password updated successfully');
      onSaved();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            Change Password
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-slate-500 mb-4">
            Update password for <strong>{admin.name}</strong> ({admin.email})
          </p>

          <div>
            <label className="block text-sm font-bold tracking-tight text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              name="password"
              required
              placeholder="Enter new password"
              value={form.password}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold tracking-tight text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              required
              placeholder="Confirm new password"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            />
          </div>

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
              className="px-5 py-2.5 font-semibold bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition"
            >
              {loading ? 'Saving...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
