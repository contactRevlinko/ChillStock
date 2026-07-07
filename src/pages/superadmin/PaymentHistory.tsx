import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';
import toast from 'react-hot-toast';
import { Loader2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function PaymentHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await apiFetch('/payment/history');
        setHistory(data);
      } catch (err) {
        toast.error('Failed to load payment history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment History</h1>
        <p className="text-slate-500 text-sm mt-1">View all admin subscription payments and transactions.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Admin / Company</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Package</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Amount (₹)</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Order ID / Payment ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {history.map((h, i) => (
                <tr key={h._id || i} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-slate-900">
                      <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                      {format(new Date(h.date || h.createdAt), 'dd MMM yyyy, hh:mm a')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-900">{h.adminId?.name || 'Unknown'}</div>
                    <div className="text-xs text-slate-500">{h.adminId?.companyName || h.adminId?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {h.packageId?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                    ₹{h.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs font-mono text-slate-600">Ord: {h.orderId}</div>
                    <div className="text-xs font-mono text-slate-400">Pay: {h.paymentId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      h.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 
                      h.status === 'Failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {h.status}
                    </span>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">No payment history found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
