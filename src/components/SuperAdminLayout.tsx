import React, { useState } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../context/store';
import { LogOut, IceCream, Users, Loader2, Package, Settings, Mail, User } from 'lucide-react';

export const SuperAdminLayout = () => {
  // Pull latest auth state on each render
  const { user, logout, token } = useAuthStore();
  console.log('SuperAdminLayout user:', user);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // While we have a token but the user hasn't been hydrated yet, show a spinner
  if (token && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // No authenticated user → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Only super admins may access this layout
  if (user.role !== 'super_admin') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col hidden lg:flex">
        <div className="h-20 flex items-center px-6 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
              <IceCream className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-blue-500">SUPER ADMIN</h1>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavItem
            to="/superadmin"
            icon={<Users />}
            label="Admin Management"
            navigate={navigate}
            currentPath={location.pathname}
          />
          <NavItem
            to="/superadmin/packages"
            icon={<Package />}
            label="Package Management"
            navigate={navigate}
            currentPath={location.pathname}
          />
          <NavItem
            to="/superadmin/razorpay"
            icon={<Settings />}
            label="Razorpay Settings"
            navigate={navigate}
            currentPath={location.pathname}
          />
        </nav>
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
              <span className="text-blue-600 font-bold text-lg uppercase">{user?.name?.charAt(0) || 'S'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Logged In</div>
              <div className="font-bold text-sm text-slate-800 truncate leading-tight" title={user?.name}>{user?.name}</div>
              <div className="text-[11px] text-slate-500 truncate leading-tight mt-0.5" title={user?.email}>{user?.email}</div>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login_superadmin'); }}
            className="flex items-center justify-center w-full px-3 py-2.5 text-rose-600 bg-white border border-rose-100 hover:bg-rose-50 hover:border-rose-200 rounded-lg transition-colors font-medium text-sm shadow-sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout Account
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 relative z-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
              <IceCream className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-blue-500 tracking-tight uppercase leading-none">SUPER ADMIN</span>
            </div>
          </div>
          
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-600 active:bg-slate-200 transition-colors"
          >
            <User className="w-5 h-5" />
          </button>
          
          {isMobileMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsMobileMenuOpen(false)}></div>
              <div className="absolute top-16 right-4 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden transform origin-top-right transition-all">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
                    <span className="text-blue-600 font-bold text-lg uppercase">{user?.name?.charAt(0) || 'S'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Logged In</p>
                    <p className="font-bold text-sm text-slate-800 truncate leading-tight">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">{user?.email}</p>
                  </div>
                </div>
                <div className="p-2">
                  <button 
                    onClick={() => { logout(); navigate('/login_superadmin'); }}
                    className="w-full flex items-center justify-center px-3 py-2.5 text-sm font-bold text-rose-600 bg-white border border-rose-100 rounded-lg hover:bg-rose-50 transition-colors shadow-sm"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Logout Account
                  </button>
                </div>
              </div>
            </>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24 lg:pb-8">
          <Outlet />
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-3 pb-safe z-20 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
          <BottomNavItem to="/superadmin" icon={<Users size={20} />} label="Admins" navigate={navigate} currentPath={location.pathname} />
          <BottomNavItem to="/superadmin/packages" icon={<Package size={20} />} label="Packages" navigate={navigate} currentPath={location.pathname} />
          <BottomNavItem to="/superadmin/razorpay" icon={<Settings size={20} />} label="Razorpay" navigate={navigate} currentPath={location.pathname} />
        </nav>
      </div>
    </div>
  );
};

export default SuperAdminLayout;

const NavItem = ({ to, icon, label, navigate, currentPath }: { to: string; icon: React.ReactNode; label: string; navigate: any; currentPath: string }) => {
  const isActive = currentPath === to || (to !== '/superadmin' && currentPath.startsWith(to));
  return (
    <button
      onClick={() => navigate(to)}
      className={`flex items-center w-full px-4 py-3 rounded-xl transition-colors font-medium ${isActive ? 'bg-red-50 text-red-500' : 'text-slate-500 hover:bg-slate-50'}`}
    >
      <span className={`w-5 h-5 mr-3 shrink-0 flex items-center justify-center ${isActive ? 'text-red-500' : 'text-slate-500'}`}>
        {icon}
      </span>
      <span className="text-left whitespace-nowrap">{label}</span>
    </button>
  );
};

const BottomNavItem = ({ to, icon, label, navigate, currentPath }: { to: string, icon: React.ReactNode, label: string, navigate: any, currentPath: string }) => {
  const isActive = currentPath === to || (to !== '/superadmin' && currentPath.startsWith(to));
  return (
    <button
      onClick={() => navigate(to)}
      className={`flex flex-col items-center justify-center flex-1 transition-colors px-0.5 ${
        isActive ? 'text-red-500' : 'text-slate-500 hover:text-slate-900'
      }`}
    >
      <span className="mb-0.5">{icon}</span>
      <span className="text-[10px] font-bold truncate w-full text-center tracking-tight">{label}</span>
    </button>
  );
};
