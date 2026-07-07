import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../context/store';
import { apiFetch } from '../utils/api';
import toast from 'react-hot-toast';
import { IceCream, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState('Sign In');
  const { login, logout, user } = useAuthStore();
  const navigate = useNavigate();

  const handleEmailBlur = async () => {
    if (!email) {
      setCompanyName('Sign In');
      return;
    }
    try {
      const data = await apiFetch(`/auth/company?email=${encodeURIComponent(email)}`);
      if (data && data.companyName) {
        setCompanyName(data.companyName);
      }
    } catch (error) {
      console.error('Failed to fetch company info', error);
      setCompanyName('Sign In');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      login(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}`);
      
      if (data.user.role === 'super_admin') {
        toast.error("Access Denied: Super Admin must use the /login-superadmin portal.");
        logout(); // ensure they aren't logged in
        return;
      }
      
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/branch');
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-500 shadow-sm border border-blue-200">
            <IceCream className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome Back!</h2>
          
          <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-slate-100 text-center">
            <p className="text-slate-600 mb-2">You are currently logged in as:</p>
            <div className="inline-block bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-bold mb-6">
              {user.name} ({user.role.toUpperCase()})
              <div className="text-xs font-normal text-blue-600 mt-0.5">{user.email}</div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => navigate(user.role === 'admin' ? '/admin' : user.role === 'super_admin' ? '/superadmin' : '/branch')}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="w-full flex justify-center py-2.5 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-500 shadow-sm border border-blue-200">
          <IceCream className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase">{companyName}</h2>
        <p className="mt-2 text-sm text-slate-600">Stock & Sales Management System</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email address</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="admin@company.com"

                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log in to Portal'}
              </button>
            </div>
            
            <div className="mt-4 text-center flex flex-col space-y-2">
              <p className="text-sm text-slate-600">
                Want to check our plans? <Link to="/admin/pricing" className="font-medium text-blue-600 hover:text-blue-500">View Packages</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
