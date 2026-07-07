import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import toast from 'react-hot-toast';
import { Activity, Clock, Box, RefreshCw, ChevronLeft, ChevronRight, Download, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { generateActivityLogPDF } from '../../utils/pdfGenerator';

interface Log {
  _id: string;
  action: string;
  details: string;
  createdAt: string;
}

const highlightText = (text: string) => {
  if (!text) return '';
  // Escape HTML to prevent XSS
  let safeText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // Highlight "X pcs"
  safeText = safeText.replace(/(\d+ pcs)/gi, '<span class="font-semibold text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">$1</span>');
  
  // Highlight "X products"
  safeText = safeText.replace(/(\d+ products)/gi, '<span class="font-semibold text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">$1</span>');

  // Highlight branch names: "branch XYZ"
  safeText = safeText.replace(/branch ([\w]+)/gi, 'branch <span class="font-semibold text-teal-600 bg-teal-50 px-1 py-0.5 rounded">$1</span>');

  // Highlight "stock to XYZ"
  safeText = safeText.replace(/stock to ([\w\s]+)$/gi, 'stock to <span class="font-semibold text-amber-600 bg-amber-50 px-1 py-0.5 rounded">$1</span>');

  // Highlight "new product: XYZ"
  safeText = safeText.replace(/new product: ([\w\s]+) \(/gi, 'new product: <span class="font-semibold text-amber-600 bg-amber-50 px-1 py-0.5 rounded">$1</span> (');

  return safeText;
};

export default function ActivityLog() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Calculate current month's first and last day
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [startDate, setStartDate] = useState(format(firstDay, 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(lastDay, 'yyyy-MM-dd'));
  const [exporting, setExporting] = useState(false);

  const fetchLogs = async (currentPage: number) => {
    try {
      setLoading(true);
      let url = `/admin/activity-logs?page=${currentPage}&limit=10`;
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const data = await apiFetch(url);
      setLogs(data.logs);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch activity logs');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      let url = `/admin/activity-logs?export=true`;
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const data = await apiFetch(url);
      if (data.logs && data.logs.length > 0) {
        generateActivityLogPDF(data.logs, { from: startDate, to: endDate });
        toast.success("PDF Downloaded successfully!");
      } else {
        toast.error("No logs found to export in this date range.");
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to export logs');
    } finally {
      setExporting(false);
    }
  };

  const clearFilter = () => {
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page, startDate, endDate]);

  return (
    <div className="max-w-4xl mx-auto space-y-3">
      <div className="flex justify-between items-center bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Activity Log</h1>
            <p className="text-xs text-slate-500 font-medium">
              Recent admin actions and events {total > 0 ? `(${total} total)` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            disabled={exporting || logs.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {exporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export PDF
          </button>
          <button
            onClick={() => fetchLogs(page)}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-end gap-4">
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 border border-slate-100 text-slate-500 shrink-0 mb-1">
            <Filter className="w-4 h-4" />
          </div>
        </div>
        
        <div className="flex-1 grid grid-cols-2 gap-4 w-full sm:max-w-md">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 text-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all px-3 py-2"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 text-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all px-3 py-2"
            />
          </div>
        </div>

        {(startDate || endDate) && (
          <button
            onClick={clearFilter}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors w-full sm:w-auto h-[38px] mb-[1px]"
          >
            <X className="w-4 h-4" />
            Clear Filter
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {loading && logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-indigo-200 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Loading logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Box className="w-12 h-12 text-slate-200 mb-3" />
            <p className="font-medium">No activity logs found.</p>
            <p className="text-xs mt-1">Actions you perform will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log._id} className="px-4 py-2.5 hover:bg-slate-50/50 transition-colors flex items-start gap-3">
                <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-slate-200 text-slate-500">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-sm text-slate-800">{log.action}</span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5" />
                      {format(new Date(log.createdAt), 'dd MMM, hh:mm a')}
                    </div>
                  </div>
                  <p 
                    className="text-sm text-slate-600 break-words leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: highlightText(log.details) }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between mt-auto">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
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
              disabled={page === totalPages || loading}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
