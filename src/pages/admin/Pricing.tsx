import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';
import toast from 'react-hot-toast';
import { Loader2, Check, Shield, AlertCircle, ArrowLeft, UserPlus } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../context/store';

// Helper to load Razorpay SDK dynamically
const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Pricing() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRazorpayConfigured, setIsRazorpayConfigured] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { user, login } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const pkgs = await apiFetch('/packages/active');
        setPackages(Array.isArray(pkgs) ? pkgs : []);
      } catch (err) {
        toast.error('Failed to load pricing packages');
      }
    };
    
    const fetchConfig = async () => {
      try {
        const config = await apiFetch('/settings/razorpay/config');
        if (config?.configured) setIsRazorpayConfigured(true);
      } catch (err) {
        // Fail silently for config
      }
    };
    
    const loadAll = async () => {
      await fetchPackages();
      await fetchConfig();
      setLoading(false);
    };
    
    loadAll();
    loadRazorpay();
  }, []);

  const handleBuy = async (pkg: any) => {
    if (!user) {
      toast.error('You must create an account first to purchase a plan.');
      navigate('/signup');
      return;
    }
    setProcessingId(pkg._id);
    
    try {
      // 1. Fetch Razorpay Key
      const keyRes = await apiFetch('/payment/key');
      if (!keyRes.keyId) throw new Error("Payment gateway not configured");

      // 2. Create Order
      const order = await apiFetch('/payment/create-order', {
        method: 'POST',
        body: JSON.stringify({ packageId: pkg._id })
      });

      // 3. Open Razorpay Checkout
      const options = {
        key: keyRes.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "CHILLSTOCK POS",
        description: `Subscription: ${pkg.name}`,
        order_id: order.id,
        handler: async function (response: any) {
          // 4. Verify Payment on Server
          try {
            await apiFetch('/payment/verify', {
              method: 'POST',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                packageId: pkg._id
              })
            });
            
            toast.success('Payment successful! Your subscription is active.');
            
            // Refresh user data
            const updatedUser = await apiFetch('/auth/me');
            if (updatedUser) login(updatedUser.user, updatedUser.token);
            
            navigate('/admin');
          } catch (err: any) {
            toast.error(err.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: "#2563eb"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast.error(response.error.description || 'Payment Failed');
      });
      rzp.open();

    } catch (err: any) {
      toast.error(err.message || 'Error initializing payment');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 pt-8 pb-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Link to="/" className="flex items-center text-slate-500 hover:text-slate-800 transition font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
          </Link>
        </div>
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Choose Your Plan</h1>
          <p className="text-lg text-slate-600">
            {user?.paymentStatus === 'Expired' ? 
              <span className="text-red-600 font-bold flex items-center justify-center"><AlertCircle className="w-5 h-5 mr-2" /> Your subscription has expired. Please renew to continue using the system.</span> 
              : 'Select a subscription plan to unlock full access to the POS system.'}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {packages.map(pkg => (
            <div key={pkg._id} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col relative overflow-hidden transition-transform hover:-translate-y-1">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{pkg.name}</h3>
                <p className="text-slate-500 text-sm h-10">{pkg.description}</p>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline text-5xl font-black text-slate-900">
                  ₹{pkg.price}
                  <span className="text-lg font-medium text-slate-500 ml-2">/ {pkg.durationDays} days</span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {pkg.features.map((feature: string, idx: number) => (
                  <li key={idx} className="flex items-start">
                    <Check className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
                    <span className="text-slate-600 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handleBuy(pkg)}
                disabled={processingId === pkg._id}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-4 text-center font-bold text-lg shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center"
              >
                {processingId === pkg._id ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Shield className="w-5 h-5 mr-2" /> Buy Now</>}
              </button>
            </div>
          ))}
          {packages.length === 0 && (
            <div className="col-span-3 text-center p-12 bg-white rounded-3xl border border-slate-200">
              <p className="text-slate-500 text-lg">No pricing plans available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
