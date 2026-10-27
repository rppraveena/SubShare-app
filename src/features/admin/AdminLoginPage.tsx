import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginAdmin } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      const ok = loginAdmin(email, password);
      setLoading(false);
      if (ok) {
        navigate('/admin');
      } else {
        setError('Invalid administrative credentials. Access restricted to authorized personnel.');
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            <span className="text-xs font-black tracking-widest text-slate-300 uppercase">SubShare Internal</span>
          </div>
          <div className="w-9" />
        </div>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-blue-400" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">Admin Console Portal</h1>
          <p className="text-xs text-slate-400 mt-1">
            Restricted administrative login for NGO verification and safety monitoring.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              Administrator Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@trustshare.org"
              className="w-full h-11 px-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              Admin Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-11 px-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 mt-2"
          >
            {loading ? 'Verifying role…' : 'Authenticate as Administrator'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <Link to="/" className="text-xs text-slate-500 hover:text-slate-400 font-medium">
            ← Return to SubShare Public Site
          </Link>
        </div>
      </div>
    </div>
  );
};
