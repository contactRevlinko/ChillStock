import React, { useState } from 'react';
import { Outlet, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../context/store';
import { LogOut, IceCream, LayoutDashboard, Store, Box, BarChart3, ShoppingBag, Layers, ArrowRightLeft, PackagePlus, AlertTriangle, User, Activity } from 'lucide-react';

export const AdminLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  let daysRemaining: number | null = null;
  if (user?.subscriptionEndDate) {
    const expiryDate = new Date(user.subscriptionEndDate);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    if (diffTime > 0) {
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } else {
      daysRemaining = 0;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col hidden lg:flex">
        <div className="h-20 flex items-center px-6 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
              <span className="text-white font-black text-xl leading-none">{(user?.companyName || 'CHILLSTOCK').charAt(0).toUpperCase()}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-blue-500 uppercase">{user?.companyName || 'CHILLSTOCK'}</h1>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavItem to="/admin" icon={<LayoutDashboard />} label="Dashboard" navigate={navigate} currentPath={location.pathname} />
          <NavItem to="/admin/branches" icon={<Store />} label="Branches" navigate={navigate} currentPath={location.pathname} />
          <NavItem to="/admin/products" icon={<Box />} label="Global Products" navigate={navigate} currentPath={location.pathname} />
          <NavItem to="/admin/transfers" icon={<ArrowRightLeft />} label="Stock Transfers" navigate={navigate} currentPath={location.pathname} />
          <NavItem to="/admin/stock-in" icon={<PackagePlus />} label="Stock In" navigate={navigate} currentPath={location.pathname} />
          <NavItem to="/admin/stock-flow" icon={<Layers />} label="Stock Flow" navigate={navigate} currentPath={location.pathname} />
          <NavItem to="/admin/reports" icon={<BarChart3 />} label="Reports" navigate={navigate} currentPath={location.pathname} />
          <NavItem to="/admin/activity-logs" icon={<Activity />} label="Activity Log" navigate={navigate} currentPath={location.pathname} />
        </nav>
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
              <span className="text-blue-600 font-bold text-lg uppercase">{user?.name?.charAt(0) || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Logged In</div>
              <div className="font-bold text-sm text-slate-800 truncate leading-tight" title={user?.name}>{user?.name}</div>
              <div className="text-[11px] text-slate-500 truncate leading-tight mt-0.5" title={user?.email}>{user?.email}</div>
            </div>
          </div>
          <button 
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center justify-center w-full px-3 py-2.5 text-rose-600 bg-white border border-rose-100 hover:bg-rose-50 hover:border-rose-200 rounded-lg transition-colors font-medium text-sm shadow-sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout Account
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {daysRemaining !== null && daysRemaining <= 5 && (
          <div className="bg-red-500 text-white px-4 py-2 flex items-center justify-center text-sm font-medium shrink-0 shadow-md z-50">
            <AlertTriangle className="w-4 h-4 mr-2 shrink-0" />
            <span className="mr-4">
              {daysRemaining === 0 
                ? "Your subscription expires today!" 
                : `Your subscription expires in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}.`}
            </span>
            <Link to="/admin/pricing" className="bg-white text-red-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-red-50 transition-colors shrink-0">
              Renew Now
            </Link>
          </div>
        )}
        
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 relative z-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
              <span className="text-white font-black text-xl leading-none">{(user?.companyName || 'CHILLSTOCK').charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-blue-500 tracking-tight uppercase leading-none">{user?.companyName || 'CHILLSTOCK'}</span>
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
                    <span className="text-blue-600 font-bold text-lg uppercase">{user?.name?.charAt(0) || 'U'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Logged In</p>
                    <p className="font-bold text-sm text-slate-800 truncate leading-tight">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">{user?.email}</p>
                  </div>
                </div>
                <div className="p-2">
                  <button 
                    onClick={() => { logout(); navigate('/login'); }}
                    className="w-full flex items-center justify-center px-3 py-2.5 text-sm font-bold text-rose-600 bg-white border border-rose-100 rounded-lg hover:bg-rose-50 transition-colors shadow-sm"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Logout Account
                  </button>
                </div>
              </div>
            </>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
          <div className="h-24 lg:hidden shrink-0 w-full"></div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-between px-1 py-2 pb-safe z-20 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
          <BottomNavItem to="/admin" icon={<LayoutDashboard size={20} />} label="Dash" navigate={navigate} currentPath={location.pathname} />
          <BottomNavItem to="/admin/branches" icon={<Store size={20} />} label="Branch" navigate={navigate} currentPath={location.pathname} />
          <BottomNavItem to="/admin/products" icon={<Box size={20} />} label="Product" navigate={navigate} currentPath={location.pathname} />
          <BottomNavItem to="/admin/transfers" icon={<ArrowRightLeft size={20} />} label="Transfer" navigate={navigate} currentPath={location.pathname} />
          <BottomNavItem to="/admin/stock-in" icon={<PackagePlus size={20} />} label="Stock In" navigate={navigate} currentPath={location.pathname} />
          <BottomNavItem to="/admin/stock-flow" icon={<Layers size={20} />} label="Stock" navigate={navigate} currentPath={location.pathname} />
          <BottomNavItem to="/admin/reports" icon={<BarChart3 size={20} />} label="Report" navigate={navigate} currentPath={location.pathname} />
          <BottomNavItem to="/admin/activity-logs" icon={<Activity size={20} />} label="Logs" navigate={navigate} currentPath={location.pathname} />
        </nav>
      </div>
    </div>
  );
};

export const BranchLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user || user.role !== 'branch') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 h-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
              <span className="text-white font-black text-xl leading-none">C</span>
            </div>
            <span className="font-bold text-2xl text-blue-500 tracking-tight hidden sm:block">CHILLSTOCK</span>
            <span className="hidden sm:inline-block ml-3 px-2 py-1 bg-blue-50 text-blue-500 text-[10px] font-bold uppercase tracking-widest rounded-lg">Branch Portal</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop Branch Nav */}
            <nav className="hidden lg:flex gap-1 bg-slate-100/50 p-1 rounded-xl mr-4">
               <NavItemDesktop to="/branch" icon={<ShoppingBag className="w-4 h-4 mr-2"/>} label="Sell" currentPath={location.pathname} navigate={navigate} />
               <NavItemDesktop to="/branch/stock" icon={<Layers className="w-4 h-4 mr-2"/>} label="Stock" currentPath={location.pathname} navigate={navigate} />
               <NavItemDesktop to="/branch/reports" icon={<BarChart3 className="w-4 h-4 mr-2"/>} label="Reports" currentPath={location.pathname} navigate={navigate} />
            </nav>

            <div className="hidden sm:flex flex-col items-end mr-2 sm:mr-4">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-tighter">Logged In</span>
              <span className="text-sm font-bold text-slate-800">{user?.name}</span>
            </div>
            <button onClick={() => { logout(); navigate('/login'); }} className="w-10 h-10 shrink-0 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-y-auto w-full mx-auto p-4 min-h-0 lg:max-w-6xl">
        <Outlet />
        <div className="h-24 lg:hidden shrink-0 w-full"></div>
      </main>

      {/* Bottom Nav (Mobile/Tablet) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-3 pb-safe z-20 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <BottomNavItem to="/branch" icon={<ShoppingBag />} label="Sell" navigate={navigate} currentPath={location.pathname} />
        <BottomNavItem to="/branch/stock" icon={<Layers />} label="Stock" navigate={navigate} currentPath={location.pathname} />
        <BottomNavItem to="/branch/reports" icon={<BarChart3 />} label="Reports" navigate={navigate} currentPath={location.pathname} />
      </nav>
    </div>
  );
};

const NavItemDesktop = ({ to, icon, label, navigate, currentPath }: { to: string, icon: React.ReactNode, label: string, navigate: any, currentPath: string }) => {
  const isActive = currentPath === to || (to !== '/branch' && currentPath.startsWith(to));
  return (
    <button
      onClick={() => navigate(to)}
      className={`flex items-center px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
        isActive ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
      }`}
    >
      {icon}
      {label}
    </button>
  );
};

const NavItem = ({ to, icon, label, navigate, currentPath }: { to: string, icon: React.ReactNode, label: string, navigate: any, currentPath: string }) => {
  const isActive = currentPath === to || (to !== '/admin' && currentPath.startsWith(to));
  return (
    <button
      onClick={() => navigate(to)}
      className={`flex items-center w-full px-4 py-3 rounded-xl transition-colors font-medium ${
        isActive ? 'bg-red-50 text-red-500' : 'text-slate-500 hover:bg-slate-50'
      }`}
    >
      <span className={`w-5 h-5 mr-3 shrink-0 flex items-center justify-center ${isActive ? 'text-red-500' : 'text-slate-500'}`}>
        {icon}
      </span>
      <span className="text-left whitespace-nowrap">{label}</span>
    </button>
  );
};

const BottomNavItem = ({ to, icon, label, navigate, currentPath }: { to: string, icon: React.ReactNode, label: string, navigate: any, currentPath: string }) => {
  const isActive = currentPath === to || (to !== '/branch' && to !== '/admin' && currentPath.startsWith(to));
  return (
    <button
      onClick={() => navigate(to)}
      className={`flex flex-col items-center justify-center flex-1 transition-colors px-0.5 ${
        isActive ? 'text-red-500' : 'text-slate-500 hover:text-slate-900'
      }`}
    >
      <span className="mb-0.5">{icon}</span>
      <span className="text-[9px] font-medium truncate w-full text-center tracking-tight">{label}</span>
    </button>
  );
};
