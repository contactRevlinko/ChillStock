import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { Layers, Calendar, ArrowUpRight, ArrowDownRight, Box, Loader2, Download, ChevronLeft, ChevronRight, Store } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { generateStockFlowPDF } from '../../utils/pdfGenerator';
import toast from 'react-hot-toast';

export default function AdminStockFlow() {
  const [report, setReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    to: format(endOfMonth(new Date()), "yyyy-MM-dd")
  });
  const [page, setPage] = useState(1);
  const limit = 6;

  useEffect(() => {
    fetchStockFlow();
  }, []);

  const fetchStockFlow = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({ from: dateRange.from, to: dateRange.to }).toString();
      const data = await apiFetch(`/admin/reports/stock-flow?${query}`);
      setReport(data);
    } catch (error) {
      toast.error('Failed to load stock flow report');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStockFlow();
  };

  const totalIn = report.reduce((sum, item) => sum + item.totalIn, 0);
  const totalOut = report.reduce((sum, item) => sum + item.totalOut, 0);
  const totalStock = report.reduce((sum, item) => sum + item.currentGlobalStock, 0);

  const totalPages = Math.ceil(report.length / limit);
  const paginatedReport = report.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    setPage(1);
  }, [dateRange]);

  const handleExportPDF = () => {
    generateStockFlowPDF(dateRange, report, { totalIn, totalOut, totalStock });
    toast.success('Stock Flow Report exported as PDF');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Global Stock Flow</h1>
          <p className="text-slate-500 text-sm mt-1">Track stock added (IN) and transferred to branches (OUT)</p>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
        <form onSubmit={handleFilter} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">From Date</label>
            <input 
              type="date" 
              required
              value={dateRange.from} 
              onChange={e => setDateRange({...dateRange, from: e.target.value})}
              className="block w-full border border-slate-300 rounded-lg shadow-sm py-2.5 px-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors" 
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">To Date</label>
            <input 
              type="date" 
              required
              value={dateRange.to} 
              onChange={e => setDateRange({...dateRange, to: e.target.value})}
              className="block w-full border border-slate-300 rounded-lg shadow-sm py-2.5 px-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors" 
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button type="submit" disabled={loading} className="flex-1 md:flex-none bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-70">
              {loading ? 'Loading...' : 'Filter'}
            </button>
            <button type="button" onClick={handleExportPDF} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm flex items-center justify-center">
               <Download className="w-5 h-5 md:mr-2" />
               <span className="hidden md:inline">Export PDF</span>
            </button>
          </div>
        </form>
      </div>

      {!loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-6 border border-slate-200 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Stock IN</p>
                <p className="text-3xl font-black text-emerald-600 mt-1">{totalIn} units</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex justify-center items-center">
                <ArrowDownRight className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Stock OUT</p>
                <p className="text-3xl font-black text-amber-600 mt-1">{totalOut} units</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex justify-center items-center">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-slate-200 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Global Remaining</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{totalStock} units</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex justify-center items-center">
                <Layers className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {totalPages > 1 && (
              <div className="p-3 border-b border-slate-200 bg-slate-50/50 flex justify-end">
                <div className="flex items-center gap-3 bg-white p-1.5 px-3 rounded-xl border border-slate-200 shadow-sm">
                   <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Page {page} of {totalPages}</span>
                   <div className="flex items-center gap-1">
                     <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 disabled:opacity-50 text-slate-600"><ChevronLeft className="w-4 h-4" /></button>
                     <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 disabled:opacity-50 text-slate-600"><ChevronRight className="w-4 h-4" /></button>
                   </div>
                </div>
              </div>
            )}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Stock IN</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Stock OUT</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Remaining</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Out To Branches</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {paginatedReport.map(item => (
                    <tr key={item.productId} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-900">{item.productName}</div>
                        <div className="text-xs font-medium text-slate-500">SKU: {item.sku}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          +{item.totalIn}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          -{item.totalOut}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-slate-900">
                        {item.currentGlobalStock}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {item.branchesOut.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.branchesOut.map((b: any, idx: number) => (
                              <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-md font-medium border border-slate-200">
                                {b.branchName}: <strong className="text-slate-900">{b.quantity}</strong>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">No transfers</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {report.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">No products found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="lg:hidden mt-4">
              <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
                {paginatedReport.map((item, index) => (
                  <div key={item.productId} className={`p-4 ${index !== paginatedReport.length - 1 ? 'border-b border-slate-100' : ''}`}>
                     <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-bold text-slate-800 text-[15px]">{item.productName}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">SKU: {item.sku}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Remaining</div>
                          <div className="font-black text-slate-800 text-lg">{item.currentGlobalStock}</div>
                        </div>
                     </div>
                     
                     <div className="flex justify-between bg-slate-50 p-3 rounded-lg mb-3">
                        <div className="text-center flex-1">
                           <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Stock IN</p>
                           <p className="font-bold text-emerald-600 text-sm">+{item.totalIn}</p>
                        </div>
                        <div className="w-px bg-slate-200 mx-2"></div>
                        <div className="text-center flex-1">
                           <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Stock OUT</p>
                           <p className="font-bold text-amber-600 text-sm">-{item.totalOut}</p>
                        </div>
                     </div>

                     <div>
                       <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Out to Branches</p>
                       {item.branchesOut.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {item.branchesOut.map((b: any, idx: number) => (
                              <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-[11px] font-bold">
                                {b.branchName}: <span className="text-blue-600 ml-1">{b.quantity}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">No transfers yet</span>
                        )}
                     </div>
                  </div>
                ))}
              </div>
              {report.length === 0 && (
                 <div className="p-8 text-center text-slate-500 text-sm">No products found.</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
