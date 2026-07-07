import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';
import toast from 'react-hot-toast';
import { Loader2, KeyRound, Save } from 'lucide-react';

export default function RazorpaySettings() {
  const [settings, setSettings] = useState({ razorpayKeyId: '', razorpayKeySecret: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await apiFetch('/settings/razorpay');
        if (data) {
          setSettings({
            razorpayKeyId: data.razorpayKeyId || '',
            razorpayKeySecret: data.razorpayKeySecret || ''
          });
        }
      } catch (err) {
        toast.error('Failed to load Razorpay settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/settings/razorpay', { method: 'PUT', body: JSON.stringify(settings) });
      toast.success('Razorpay settings saved successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Razorpay Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Configure your Razorpay payment gateway credentials.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center bg-slate-50/50">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4 text-blue-600">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">API Credentials</h2>
            <p className="text-xs text-slate-500">These credentials will be used for all subscription payments.</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold tracking-tight text-slate-700 mb-1">Key ID</label>
            <input 
              required 
              type="text" 
              value={settings.razorpayKeyId} 
              onChange={e => setSettings({...settings, razorpayKeyId: e.target.value})} 
              className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition font-mono text-sm" 
              placeholder="rzp_test_..." 
            />
            <p className="text-xs text-slate-400 mt-1">Found in Razorpay Dashboard &gt; Settings &gt; API Keys</p>
          </div>
          <div>
            <label className="block text-sm font-bold tracking-tight text-slate-700 mb-1">Key Secret</label>
            <input 
              required 
              type="password" 
              value={settings.razorpayKeySecret} 
              onChange={e => setSettings({...settings, razorpayKeySecret: e.target.value})} 
              className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition font-mono text-sm" 
              placeholder="••••••••••••••••••••••••" 
            />
            <p className="text-xs text-slate-400 mt-1">Keep this secret safe. It is never exposed to the frontend.</p>
          </div>
          
          <div className="pt-4 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save Configuration</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
