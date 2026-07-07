/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Login from './pages/Login';
import SuperAdminLogin from './pages/SuperAdminLogin';
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import SuperAdminLayout from './components/SuperAdminLayout';
import Packages from './pages/superadmin/Packages';
import RazorpaySettings from './pages/superadmin/RazorpaySettings';
import PaymentHistory from './pages/superadmin/PaymentHistory';
import Pricing from './pages/admin/Pricing';
import Signup from './pages/Signup';

import AdminDashboard from './pages/admin/Dashboard';
import AdminBranches from './pages/admin/Branches';
import AdminReports from './pages/admin/Reports';
import AdminGlobalProducts from './pages/admin/GlobalProducts';
import AdminTransfers from './pages/admin/Transfers';
import AdminStockIn from './pages/admin/StockIn';
import AdminBranchDetails from './pages/admin/BranchDetails';
import AdminStockFlow from './pages/admin/StockFlow';
import ActivityLog from './pages/admin/ActivityLog';

import BranchSell from './pages/branch/Sell';
import BranchStock from './pages/branch/Stock';
import BranchReports from './pages/branch/Reports';
import { AdminLayout, BranchLayout } from './components/Layout';
import { useAuthStore } from './context/store';

const SubscriptionGuard = () => {
  const { user } = useAuthStore();
  
  if (user?.role === 'admin') {
    if (user.paymentStatus !== 'Paid') {
      return <Navigate to="/admin/pricing" replace />;
    }
    if (user.subscriptionEndDate && new Date(user.subscriptionEndDate) < new Date()) {
      return <Navigate to="/admin/pricing" replace />;
    }
  }
  return <Outlet />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<SuperAdminLogin />} />

        {/* Super Admin Routes */}
        <Route path="/superadmin" element={<SuperAdminLayout />}>
          <Route index element={<SuperAdminDashboard />} />
          <Route path="packages" element={<Packages />} />
          <Route path="razorpay" element={<RazorpaySettings />} />
        </Route>
        
        <Route path="/admin/pricing" element={<Pricing />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route element={<SubscriptionGuard />}>
            <Route index element={<AdminDashboard />} />
            <Route path="branches" element={<AdminBranches />} />
            <Route path="branches/:id" element={<AdminBranchDetails />} />
            <Route path="products" element={<AdminGlobalProducts />} />
            <Route path="transfers" element={<AdminTransfers />} />
            <Route path="stock-in" element={<AdminStockIn />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="stock-flow" element={<AdminStockFlow />} />
            <Route path="activity-logs" element={<ActivityLog />} />
          </Route>
        </Route>

        {/* Branch Routes */}
        <Route path="/branch" element={<BranchLayout />}>
          <Route index element={<BranchSell />} />
          <Route path="stock" element={<BranchStock />} />
          <Route path="reports" element={<BranchReports />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
