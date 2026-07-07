import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../context/store';
import { apiFetch } from '../../utils/api';
import { Sale } from '../../types';
import toast from 'react-hot-toast';
import { Loader2, Calendar, FileText, Download, Box } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { generateReportPDF } from '../../utils/pdfGenerator';

export default function BranchReports() {
  const { user } = useAuthStore();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [dateRange, setDateRange] = useState({
    from: format(startOfDay(new Date()), "yyyy-MM-dd'T'HH:mm"),
    to: format(endOfDay(new Date()), "yyyy-MM-dd'T'HH:mm")
  });

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({ from: dateRange.from, to: dateRange.to }).toString();
      const data = await apiFetch(`/branch/sales/${user?.branchId}?${query}`);
      setSales(data);
    } catch (error) {
      toast.error('Failed to load sales report');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSales();
  };

  const totalSalesAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalProfit = sales.reduce((sum, sale) => sum + (sale.totalProfit || 0), 0);
  const totalUnits = sales.reduce((sum, sale) => sum + sale.quantity, 0);

  // Top Product Calculation
  const productTotals = sales.reduce((acc: any, sale) => {
    const id = sale.globalProductId?._id;
    if (!id) return acc;
    if (!acc[id]) acc[id] = { name: sale.globalProductId.name, qty: 0 };
    acc[id].qty += sale.quantity;
    return acc;
  }, {});
  const topProductObj = Object.values(productTotals).sort((a: any, b: any) => b.qty - a.qty)[0] as {name: string, qty: number} | undefined;

  const handleExportPDF = () => {
    generateReportPDF(user?.name || 'Branch', {from: dateRange.from, to: dateRange.to}, sales, totalSalesAmount, topProductObj);
    toast.success('Report exported as PDF');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Reports</h1>
          <p className="text-slate-500 text-sm">View transaction history and daily totals.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 mb-6">
        <form onSubmit={handleFilter} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-slate-700 mb-1">From Date</label>
            <input 
              type="datetime-local" 
              value={dateRange.from}
              onChange={e => setDateRange({...dateRange, from: e.target.value})}
              className="block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
            />
          </div>
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-slate-700 mb-1">To Date</label>
            <input 
              type="datetime-local" 
              value={dateRange.to}
              onChange={e => setDateRange({...dateRange, to: e.target.value})}
              className="block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button type="submit" className="flex-1 md:flex-none bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              Filter
            </button>
            <button type="button" onClick={handleExportPDF} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center">
               <Download className="w-5 h-5 md:mr-2" />
               <span className="hidden md:inline">Export PDF</span>
            </button>
          </div>
        </form>
      </div>

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-800">Period Revenue</p>
              <p className="text-3xl font-bold text-emerald-900 mt-1">₹{totalSalesAmount.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-200 text-emerald-700 rounded-full flex justify-center items-center">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-800">Net Profit</p>
              <p className="text-3xl font-bold text-indigo-900 mt-1">₹{totalProfit.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-200 text-indigo-700 rounded-full flex justify-center items-center">
              <FileText className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-purple-50 rounded-xl p-6 border border-purple-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">Units Sold</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">{totalUnits}</p>
            </div>
            <div className="w-12 h-12 bg-purple-200 text-purple-700 rounded-full flex justify-center items-center">
              <Box className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-amber-50 rounded-xl p-6 border border-amber-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-800">Top Product</p>
              <p className="text-xl font-bold text-amber-900 mt-1 truncate max-w-[120px]" title={topProductObj?.name}>{topProductObj?.name || 'N/A'}</p>
              {topProductObj && <p className="text-xs text-amber-700 font-bold">{topProductObj.qty} units</p>}
            </div>
            <div className="w-12 h-12 bg-amber-200 text-amber-700 rounded-full flex justify-center items-center shrink-0">
              <Box className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="hidden lg:block overflow-x-auto">
          {loading ? (
             <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Qty</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {sales.map(sale => (
                  <tr key={sale._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {format(new Date(sale.createdAt), 'MMM dd, HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{sale.globalProductId?.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-500">@ ₹{sale.priceAtSale.toFixed(2)} each</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-slate-700">
                      {sale.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-slate-900">
                      ₹{sale.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">No sales found for this period.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile View */}
        <div className="lg:hidden divide-y divide-slate-100">
           {loading ? (
             <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
           ) : (
             <>
               {sales.map(sale => (
                 <div key={sale._id} className="p-4 space-y-3">
                   <div className="flex justify-between items-start">
                     <div>
                       <p className="font-bold text-slate-900">{sale.globalProductId?.name || 'Unknown'}</p>
                       <p className="text-xs text-slate-500">{format(new Date(sale.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                     </div>
                     <p className="font-black text-slate-900">₹{sale.totalAmount.toFixed(2)}</p>
                   </div>
                   <div className="flex justify-between items-center text-sm bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                     <div>
                       <span className="text-[10px] text-slate-400 font-bold uppercase block">Price</span>
                       <span className="font-semibold text-slate-600">₹{sale.priceAtSale.toFixed(2)}</span>
                     </div>
                     <div className="text-right">
                       <span className="text-[10px] text-slate-400 font-bold uppercase block">Qty sold</span>
                       <span className="font-bold text-blue-600">{sale.quantity}</span>
                     </div>
                   </div>
                 </div>
               ))}
               {sales.length === 0 && (
                 <div className="p-8 text-center text-slate-500 text-sm">No sales found for this period.</div>
               )}
             </>
           )}
        </div>
      </div>
    </div>
  );
}
