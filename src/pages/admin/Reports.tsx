import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { Sale, Branch } from '../../types';
import toast from 'react-hot-toast';
import { Loader2, Calendar, FileText, Download, Building, TrendingUp, Package, Award, BarChart3, Search, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { generateReportPDF } from '../../utils/pdfGenerator';

export default function AdminReports() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 8;
  
  const [dateRange, setDateRange] = useState({
    from: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [selectedBranch]);

  const fetchBranches = async () => {
    try {
      const data = await apiFetch('/admin/branches');
      setBranches(data);
    } catch (error) {
      toast.error('Failed to load branches');
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      // Need to include end of day for the 'to' date
      const toDate = endOfDay(new Date(dateRange.to)).toISOString();
      let url = `/admin/reports/transfers?from=${dateRange.from}&to=${toDate}`;
      if (selectedBranch) {
        url += `&branchId=${selectedBranch}`;
      }
      const data = await apiFetch(url);
      setTransfers(data);
    } catch (error) {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReport();
  };

  const totalSalesAmount = transfers.reduce((sum, transfer: any) => sum + (transfer.quantity * transfer.transferRate), 0);
  const totalProfit = transfers.reduce((sum, transfer: any) => sum + (transfer.quantity * (transfer.transferRate - (transfer.globalProductId?.purchaseRate || 0))), 0);
  const totalUnits = transfers.reduce((sum, transfer: any) => sum + transfer.quantity, 0);

  // Top Product Calculation
  const productTotals = transfers.reduce((acc: any, transfer: any) => {
    const id = transfer.globalProductId?._id;
    if (!id) return acc;
    if (!acc[id]) acc[id] = { name: transfer.globalProductId.name, qty: 0 };
    acc[id].qty += transfer.quantity;
    return acc;
  }, {});
  const topProductObj = Object.values(productTotals).sort((a: any, b: any) => b.qty - a.qty)[0] as {name: string, qty: number} | undefined;

  const handleExportPDF = () => {
    const branchName = selectedBranch ? branches.find(b => b._id === selectedBranch)?.name || 'Branch' : 'All Branches';
    const mappedSales = transfers.map((t: any) => ({
      ...t,
      totalAmount: t.quantity * t.transferRate,
      totalProfit: t.quantity * (t.transferRate - (t.globalProductId?.purchaseRate || 0))
    }));
    generateReportPDF(branchName, {from: dateRange.from, to: dateRange.to}, mappedSales as any, totalSalesAmount, topProductObj);
    toast.success('Report exported as PDF');
  };

  const filteredTransfers = search
    ? transfers.filter((t: any) =>
        t.globalProductId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.branchId?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : transfers;

  const totalPages = Math.ceil(filteredTransfers.length / limit);
  const paginatedTransfers = filteredTransfers.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    setPage(1);
  }, [search, selectedBranch, dateRange]);

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Reports</h1>
          <p className="text-slate-500 text-xs mt-0.5">Stock transfer & profit reports across branches</p>
        </div>
        <button
          type="button"
          onClick={handleExportPDF}
          disabled={loading || transfers.length === 0}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      {/* Filters */}
      <form onSubmit={handleFilter} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Branch</label>
            <div className="relative">
              <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select 
                value={selectedBranch} 
                onChange={e => setSelectedBranch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none transition-colors"
              >
                <option value="">All Branches</option>
                {branches.map(b => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">From</label>
            <input 
              type="date" 
              required
              value={dateRange.from} 
              onChange={e => setDateRange({...dateRange, from: e.target.value})}
              className="w-full py-2 px-3 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">To</label>
            <input 
              type="date" 
              required
              value={dateRange.to} 
              onChange={e => setDateRange({...dateRange, to: e.target.value})}
              className="w-full py-2 px-3 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors" 
            />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
              {loading ? 'Loading...' : 'Generate'}
            </button>
          </div>
        </div>
      </form>

      {!loading && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue</span>
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-lg font-black text-slate-900">Rs. {totalSalesAmount.toFixed(0)}</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Profit</span>
                <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-lg font-black text-emerald-600">Rs. {totalProfit.toFixed(0)}</p>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Items Sold</span>
                <div className="w-8 h-8 bg-violet-50 text-violet-600 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <p className="text-lg font-black text-slate-900">{totalUnits} <span className="text-xs font-medium text-slate-400">units</span></p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Top Product</span>
                <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <p className="text-sm font-bold text-slate-900 truncate" title={topProductObj?.name}>{topProductObj?.name || 'N/A'}</p>
              {topProductObj && <p className="text-[10px] font-medium text-slate-400 mt-0.5">{topProductObj.qty} units sold</p>}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h3 className="text-sm font-bold text-slate-700">Transfer Records ({filteredTransfers.length})</h3>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                {totalPages > 1 && (
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Page {page} of {totalPages}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 text-slate-600 bg-white border border-slate-200 rounded disabled:opacity-50"><ChevronLeft className="w-3 h-3" /></button>
                      <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 text-slate-600 bg-white border border-slate-200 rounded disabled:opacity-50"><ChevronRight className="w-3 h-3" /></button>
                    </div>
                  </div>
                )}
                <div className="relative w-full sm:w-auto">
                <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search product or branch..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full sm:w-56 pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                />
              </div>
            </div>
          </div>
          {filteredTransfers.length > 0 ? (
               <>
                 {/* Desktop Table */}
                 <div className="hidden lg:block overflow-x-auto">
                   <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                          {!selectedBranch && <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Branch</th>}
                          <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product</th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Qty</th>
                          <th className="px-4 py-2.5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rate</th>
                          <th className="px-4 py-2.5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Revenue</th>
                          <th className="px-4 py-2.5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Profit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedTransfers.map((transfer: any) => {
                          const revenue = transfer.quantity * transfer.transferRate;
                          const profit = transfer.quantity * (transfer.transferRate - (transfer.globalProductId?.purchaseRate || 0));
                          return (
                            <tr key={transfer._id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 text-xs text-slate-500">
                                <div className="font-medium text-slate-700">{format(new Date(transfer.createdAt), 'dd MMM yyyy')}</div>
                                <div className="text-[10px] text-slate-400">{format(new Date(transfer.createdAt), 'hh:mm a')}</div>
                              </td>
                              {!selectedBranch && (
                                <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                                  {transfer.branchId?.name || 'Unknown'}
                                </td>
                              )}
                              <td className="px-4 py-3 text-xs font-semibold text-slate-800">
                                {transfer.globalProductId?.name ? transfer.globalProductId.name : (
                                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                                    {transfer.productName || 'Deleted Product'}
                                    <span className="bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider">Deleted</span>
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-xs text-center">
                                <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700">{transfer.quantity}</span>
                              </td>
                              <td className="px-4 py-3 text-xs text-right text-slate-500 font-mono">
                                {transfer.transferRate.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-xs text-right font-bold text-slate-800 font-mono">
                                {revenue.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-xs text-right font-bold font-mono">
                                <span className={profit >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                                  {profit.toFixed(2)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 border-t border-slate-200">
                          <td className="px-4 py-2.5 text-xs font-bold text-slate-600" colSpan={selectedBranch ? 3 : 4}>
                            Total ({filteredTransfers.length} records)
                          </td>
                          <td className="px-4 py-2.5 text-xs text-right font-bold text-slate-800 font-mono">
                            {totalSalesAmount.toFixed(2)}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-right font-bold text-emerald-600 font-mono">
                            {totalProfit.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                   </table>
                 </div>

                 {/* Mobile View */}
                 <div className="lg:hidden mt-4">
                    <div className="bg-white rounded-xl overflow-hidden border border-slate-200">
                      {paginatedTransfers.map((transfer: any, index) => {
                        const revenue = transfer.quantity * transfer.transferRate;
                        const profit = transfer.quantity * (transfer.transferRate - (transfer.globalProductId?.purchaseRate || 0));
                        return (
                          <div key={transfer._id} className={`p-4 ${index !== paginatedTransfers.length - 1 ? 'border-b border-slate-100' : ''}`}>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                {transfer.globalProductId?.name ? (
                                  <div className="font-bold text-slate-800 text-[15px]">
                                    {transfer.globalProductId.name}
                                  </div>
                                ) : (
                                  <div className="font-bold text-slate-800 text-[15px]">
                                    {transfer.productName || 'Deleted Product'} <span className="bg-slate-100 text-slate-500 border border-slate-200 px-1 py-0.5 rounded text-[10px] uppercase tracking-wider ml-1">Deleted</span>
                                  </div>
                                )}
                                <div className="text-[11px] text-slate-500 mt-1">
                                  {format(new Date(transfer.createdAt), 'dd MMM yyyy, hh:mm a')}
                                  {!selectedBranch && <span className="font-bold text-slate-600"> • {transfer.branchId?.name || 'Unknown'}</span>}
                                </div>
                              </div>
                              <div className="font-bold text-slate-800 text-[15px] whitespace-nowrap">
                                Rs. {revenue.toFixed(0)}
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center mt-3">
                              <div className="flex gap-2">
                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[11px] font-bold">
                                  Qty: {transfer.quantity}
                                </span>
                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[11px] font-bold">
                                  Rate: {transfer.transferRate.toFixed(0)}
                                </span>
                              </div>
                              <span className={`px-2 py-1 rounded text-[11px] font-bold ${profit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                Profit: {profit >= 0 ? '' : '-'}{Math.abs(profit).toFixed(0)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                 </div>

                 {totalPages > 1 && (
                    <div className="sm:hidden px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between mt-4">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="flex items-center px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </button>
                      <span className="text-sm text-slate-500 font-medium">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="flex items-center px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                 )}
               </>
            ) : (
               <div className="p-12 text-center text-slate-500">
                 <FileText className="w-10 h-10 mx-auto text-slate-200 mb-2" />
                 <p className="text-sm font-medium text-slate-600">No records found</p>
                 <p className="text-xs mt-0.5 text-slate-400">Try adjusting your date filters</p>
               </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
