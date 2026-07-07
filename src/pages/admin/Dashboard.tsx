import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { Store, CircleDollarSign, AlertTriangle, Box, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const result = await apiFetch('/admin/reports/all-branches');
      setData(result);
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  if (!data) return null;

  const statCards = [
    { label: 'Total Branches', value: data.totalBranches, icon: <Store className="w-6 h-6 text-indigo-500" />, bg: 'bg-indigo-50', onClick: undefined },
    { label: "Today's Sales", value: `₹${data.todaySales.toFixed(2)}`, icon: <CircleDollarSign className="w-6 h-6 text-emerald-500" />, bg: 'bg-emerald-50', onClick: undefined },
    { label: 'Total Stock Value', value: `₹${data.totalStockValue.toFixed(2)}`, icon: <Box className="w-6 h-6 text-blue-500" />, bg: 'bg-blue-50', onClick: undefined },
    { label: 'Low Stock Alerts', value: data.lowStockAlerts, icon: <AlertTriangle className="w-6 h-6 text-rose-500" />, bg: 'bg-rose-50', onClick: () => setIsLowStockModalOpen(true) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Real-time pulse of your ice cream empire.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div 
            key={i} 
            className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center ${stat.onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
            onClick={stat.onClick}
          >
            <div className={`w-12 h-12 rounded-full ${stat.bg} flex items-center justify-center mr-4`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {isLowStockModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-xl border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-slate-900 text-lg">Low Stock Alerts</h3>
              </div>
              <button 
                onClick={() => setIsLowStockModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-0 overflow-y-auto flex-1">
              {data.globalInventory?.filter((p: any) => p.globalStock <= (p.lowStockThreshold ?? 50)).length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      <th className="px-6 py-3">Global Product</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3 text-right">Global Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.globalInventory
                      .filter((p: any) => p.globalStock <= (p.lowStockThreshold ?? 50))
                      .map((p: any) => (
                      <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3">
                          <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                          <p className="text-[10px] text-slate-500">{p.sku}</p>
                        </td>
                        <td className="px-6 py-3">
                          <p className="font-medium text-slate-700 text-sm">{p.category}</p>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-lg text-sm font-bold">
                            {p.globalStock}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-1">Threshold: {p.lowStockThreshold ?? 50}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center text-slate-500">
                  <AlertTriangle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="font-medium text-slate-600">No low stock alerts</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
