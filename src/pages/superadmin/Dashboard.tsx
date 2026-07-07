import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Edit2, Trash2, KeyRound, Users, Calendar, ChevronDown, ChevronUp, CreditCard } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import EditAdminModal from '../../components/EditAdminModal';
import ChangePasswordModal from '../../components/ChangePasswordModal';

interface Admin {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  subscriptionStatus?: "Active" | "Inactive" | "Expired";
  subscriptionEndDate?: string;
  branchId?: { _id: string; name: string };
}

interface PaymentRecord {
  _id: string;
  adminId: { _id: string; name: string; companyName?: string; email: string };
  packageId: { _id: string; name: string };
  amount: number;
  orderId: string;
  paymentId: string;
  status: string;
  date: string;
}

export default function SuperAdminDashboard() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [adminsData, paymentsData] = await Promise.all([
        apiFetch('/superadmin/admins', { method: 'GET' }),
        apiFetch('/payment/history', { method: 'GET' })
      ]);
      setAdmins(adminsData);
      setPayments(paymentsData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => {
    setModalMode('create');
    setSelectedAdmin(null);
    setShowModal(true);
  };

  const handleEdit = (admin: Admin) => {
    setSelectedAdmin(admin);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleChangePassword = (admin: Admin) => {
    setSelectedAdmin(admin);
    setShowPasswordModal(true);
  };

  const handleDelete = async (adminId: string) => {
    if (!window.confirm('WARNING: If you delete this admin, ALL data created by this admin (Branches, Users, Products, Sales, Stock) will be permanently deleted! Are you absolutely sure?')) return;
    try {
      await apiFetch(`/superadmin/admins/${adminId}`, { method: 'DELETE' });
      toast.success('Admin deleted successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete admin');
    }
  };

  const closeModal = () => setShowModal(false);
  const closePasswordModal = () => setShowPasswordModal(false);

  const afterSave = () => {
    closeModal();
    fetchData();
  };

  const afterPasswordSave = () => {
    closePasswordModal();
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Management</h1>
          <p className="text-slate-500 font-medium mt-1">Manage system administrators, subscriptions, and payment history.</p>
        </div>
        <button 
          onClick={handleCreate} 
          className="flex items-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Admin
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/40 hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-5 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Admin Name</th>
                <th className="px-6 py-5 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Company & Contact</th>
                <th className="px-6 py-5 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Subscription</th>
                <th className="px-6 py-5 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Expiry Date</th>
                <th className="px-6 py-5 text-center text-xs font-black text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admins.map((admin) => {
                const adminPayments = payments.filter(p => p.adminId?._id === admin._id);
                const isExpanded = expandedId === admin._id;

                return (
                  <React.Fragment key={admin._id}>
                    <tr className={`hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-slate-50' : ''}`}>
                      <td className="px-6 py-5">
                        <div className="flex items-center">
                          <button 
                            onClick={() => toggleExpand(admin._id)}
                            className="mr-3 p-1 rounded-full hover:bg-slate-200 text-slate-400 transition"
                          >
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                          <div>
                            <div className="font-bold text-slate-900 text-base">{admin.name}</div>
                            <div className="text-xs font-bold text-blue-600 uppercase tracking-wide mt-0.5">
                              {adminPayments.length} Payments
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm font-bold text-slate-800">{admin.companyName || <span className="text-slate-400 italic font-normal">Not provided</span>}</div>
                        <div className="text-sm text-slate-500 mt-0.5">{admin.email}</div>
                        <div className="text-xs text-slate-400 font-medium mt-0.5">{admin.phone || 'No phone'}</div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                          admin.subscriptionStatus === 'Active' ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-500/20' :
                          admin.subscriptionStatus === 'Expired' ? 'bg-red-100 text-red-700 ring-1 ring-red-500/20' :
                          'bg-slate-100 text-slate-600 ring-1 ring-slate-500/20'
                        }`}>
                          {admin.subscriptionStatus || 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        {admin.subscriptionEndDate ? (
                          <div className="flex items-center text-sm font-bold text-slate-700">
                            <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                            {format(new Date(admin.subscriptionEndDate), 'dd MMM yyyy')}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 italic">No Subscription</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleChangePassword(admin)} 
                            className="p-2 text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition"
                            title="Change Password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEdit(admin)} 
                            className="p-2 text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
                            title="Edit Admin"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(admin._id)} 
                            className="p-2 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                            title="Delete Admin"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expandable Payment History Sub-Table */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="p-0 border-b border-slate-100">
                          <div className="bg-slate-50 px-14 py-6 border-l-4 border-blue-500 shadow-inner">
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center">
                              <CreditCard className="w-4 h-4 mr-2 text-blue-500" />
                              Payment History
                            </h4>
                            {adminPayments.length > 0 ? (
                              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                <table className="min-w-full divide-y divide-slate-100">
                                  <thead className="bg-slate-50/50">
                                    <tr>
                                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Date</th>
                                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Amount</th>
                                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Order ID</th>
                                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {adminPayments.map(payment => (
                                      <tr key={payment._id}>
                                        <td className="px-4 py-3 text-sm text-slate-600 font-medium">
                                          {format(new Date(payment.date), 'dd MMM yyyy, hh:mm a')}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-black text-slate-800">
                                          ₹{payment.amount}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                                          <div>Ord: <span className="text-slate-700">{payment.orderId || 'N/A'}</span></div>
                                          <div>Pay: <span className="text-slate-700">{payment.paymentId || 'N/A'}</span></div>
                                        </td>
                                        <td className="px-4 py-3">
                                          <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-xs font-bold ring-1 ring-emerald-500/20">
                                            {payment.status}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-sm text-slate-500 italic bg-white p-4 rounded-xl border border-slate-200">
                                No payment history found for this admin.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {admins.length === 0 && (
            <div className="flex flex-col items-center justify-center p-16 text-slate-500">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 ring-8 ring-slate-50">
                <Users className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-xl font-bold text-slate-700">No admins found</p>
              <p className="text-sm mt-2 text-slate-500">Click "Create Admin" to add your first administrator.</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {admins.map((admin) => {
          const adminPayments = payments.filter(p => p.adminId?._id === admin._id);
          const isExpanded = expandedId === admin._id;

          return (
            <div key={admin._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <button 
                    onClick={() => toggleExpand(admin._id)}
                    className="mr-3 p-1 rounded-full hover:bg-slate-100 text-slate-400 transition"
                  >
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{admin.name}</h3>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mt-0.5">{adminPayments.length} Payments</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                  admin.subscriptionStatus === 'Active' ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-500/20' :
                  admin.subscriptionStatus === 'Expired' ? 'bg-red-100 text-red-700 ring-1 ring-red-500/20' :
                  'bg-slate-100 text-slate-600 ring-1 ring-slate-500/20'
                }`}>
                  {admin.subscriptionStatus || 'Inactive'}
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                <div className="text-sm font-bold text-slate-800">{admin.companyName || <span className="text-slate-400 italic font-normal">Not provided</span>}</div>
                <div className="text-sm text-slate-500 mt-1">{admin.email}</div>
                <div className="text-xs text-slate-400 font-medium mt-1">{admin.phone || 'No phone'}</div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Expiry Date</span>
                {admin.subscriptionEndDate ? (
                  <div className="flex items-center text-sm font-bold text-slate-700">
                    <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                    {format(new Date(admin.subscriptionEndDate), 'dd MMM yyyy')}
                  </div>
                ) : (
                  <span className="text-sm text-slate-400 italic">No Subscription</span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
                <button 
                  onClick={() => handleChangePassword(admin)} 
                  className="flex flex-col items-center justify-center py-2 text-amber-600 bg-amber-50 rounded-xl active:scale-95 transition"
                >
                  <KeyRound className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-bold">Password</span>
                </button>
                <button 
                  onClick={() => handleEdit(admin)} 
                  className="flex flex-col items-center justify-center py-2 text-purple-600 bg-purple-50 rounded-xl active:scale-95 transition"
                >
                  <Edit2 className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-bold">Edit</span>
                </button>
                <button 
                  onClick={() => handleDelete(admin._id)} 
                  className="flex flex-col items-center justify-center py-2 text-rose-600 bg-rose-50 rounded-xl active:scale-95 transition"
                >
                  <Trash2 className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-bold">Delete</span>
                </button>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center">
                    <CreditCard className="w-4 h-4 mr-2 text-blue-500" />
                    Payment History
                  </h4>
                  {adminPayments.length > 0 ? (
                    <div className="space-y-3">
                      {adminPayments.map(payment => (
                        <div key={payment._id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-black text-slate-800">₹{payment.amount}</span>
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[9px] font-bold uppercase ring-1 ring-emerald-500/20">{payment.status}</span>
                          </div>
                          <div className="text-xs text-slate-500 mb-1">
                            {format(new Date(payment.date), 'dd MMM yyyy, hh:mm a')}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Ord: {payment.orderId || 'N/A'} <br/>
                            Pay: {payment.paymentId || 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic text-center p-3">No payment history found.</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {admins.length === 0 && (
          <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm font-medium shadow-sm">
            No admins found
          </div>
        )}
      </div>

      {showModal && (
        <EditAdminModal
          mode={modalMode}
          admin={selectedAdmin}
          onClose={closeModal}
          onSaved={afterSave}
        />
      )}

      {showPasswordModal && selectedAdmin && (
        <ChangePasswordModal
          admin={selectedAdmin}
          onClose={closePasswordModal}
          onSaved={afterPasswordSave}
        />
      )}
    </div>
  );
}
