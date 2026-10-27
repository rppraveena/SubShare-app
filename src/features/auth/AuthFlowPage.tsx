import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, ArrowLeft, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { AccountType } from '../../types';
import { supabase } from '../../lib/supabase';

// Step Components
import { EmailPasswordStep } from './steps/EmailPasswordStep';
import { AccountTypeStep } from './steps/AccountTypeStep';
import { IndividualProfileStep } from './steps/IndividualProfileStep';
import { OrganizationProfileStep } from './steps/OrganizationProfileStep';

export const AuthFlowPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'signup' ? 'signup' : 'signin';

  const {
    signInWithEmail,
    signUpWithEmail,
    completeIndividualProfile,
    completeOrganizationProfile,
  } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(initialTab);
  const [step, setStep] = useState<number>(1); // 1: Credentials, 2: AccountType, 3: Profile

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'signup' || tabParam === 'signin') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  // Sign Up Flow Shared State
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('individual');

  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError(null);

    if (!signInEmail.trim() || !signInEmail.includes('@')) {
      setSignInError('Please enter a valid email address');
      return;
    }
    if (!signInPassword) {
      setSignInError('Please enter your password');
      return;
    }

    setSignInLoading(true);
    const res = await signInWithEmail(signInEmail.trim(), signInPassword);
    setSignInLoading(false);

    if (res.success) {
      localStorage.removeItem('profile_completed');
      localStorage.removeItem('onboarding_step');

      const userId = res.user?.id || (await supabase.auth.getUser()).data.user?.id;
      if (userId) {
        // 1. Check if user is ADMIN
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin, account_type')
          .eq('id', userId)
          .maybeSingle();

        if (profile?.is_admin === true) {
          navigate('/admin', { replace: true });
          return;
        }

        // 2. Check if user is ORGANIZATION
        if (profile?.account_type === 'organization') {
          const { data: org } = await supabase
            .from('organizations')
            .select('verification_status')
            .eq('user_id', userId)
            .maybeSingle();

          if (org?.verification_status === 'pending') {
            navigate('/organization/pending', { replace: true });
            return;
          }
          if (org?.verification_status === 'rejected') {
            navigate('/organization/rejected', { replace: true });
            return;
          }
          // Verified organization → org home
          navigate('/organization/home', { replace: true });
          return;
        }
      }

      // 3. Default: INDIVIDUAL user
      navigate('/home', { replace: true });
      return;
    } else {
      setSignInError(res.error || 'Authentication failed. Please check your credentials.');
    }
  };

  const handleStep1Submit = async (values: { name: string; email: string; pass: string }) => {
    setName(values.name);
    setSignupEmail(values.email);
    setSignupPassword(values.pass);
    setSignupError(null);
    setSignupLoading(true);

    const res = await signUpWithEmail(values.email, values.pass, values.name);
    setSignupLoading(false);

    if (res.success) {
      setStep(2);
    } else {
      setSignupError(res.error || 'Signup failed. Please try again.');
    }
  };

  const handleStep2AccountType = (type: AccountType) => {
    setAccountType(type);
    setStep(3);
  };

  const handleStep3IndividualSubmit = async (data: {
    photo?: File;
    city: string;
    latitude?: number;
    longitude?: number;
    dob?: string;
    gender?: string;
  }) => {
    setSignupError(null);
    setSignupLoading(true);

    const res = await completeIndividualProfile(data);
    setSignupLoading(false);

    if (res.success) {
      navigate('/home');
    } else {
      setSignupError(res.error || 'Failed to complete profile');
    }
  };

  const handleStep3OrgSubmit = async (data: {
    orgName: string;
    type: string;
    regNumber: string;
    regDate?: string;
    contactPerson: string;
    officialEmail: string;
    officialPhone: string;
    address: string;
    city: string;
    certificateFile?: File;
    govDocFile?: File;
  }) => {
    setSignupError(null);
    setSignupLoading(true);

    const res = await completeOrganizationProfile(data);
    setSignupLoading(false);

    if (res.success) {
      navigate('/organization/pending');
    } else {
      setSignupError(res.error || 'Failed to submit organization details');
    }
  };

  const handleBack = () => {
    if (activeTab === 'signup' && step > 1) {
      setStep((prev) => prev - 1);
    } else {
      navigate('/');
    }
  };

  const switchTab = (tab: 'signin' | 'signup') => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setSignInError(null);
    setSignupError(null);
  };

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-slate-950 flex flex-col max-w-md mx-auto relative font-sans">
      {/* Header Bar */}
      <div className="px-5 pt-6 pb-3 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-800">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 rounded-full text-gray-700 dark:text-slate-300 hover:bg-[#F3F2EF] dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-[#0A66C2] flex items-center justify-center text-white shadow-2xs">
            <Shield className="w-4.5 h-4.5" />
          </div>
          <span className="font-bold text-[#0A66C2] text-lg tracking-tight">SubShare</span>
        </div>

        <div className="w-8" />
      </div>

      {/* Main Card */}
      <div className="flex-1 flex flex-col p-5 m-4 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm shadow-2xs">
        {/* Auth Mode Tabs */}
        <div className="flex bg-[#F3F2EF] dark:bg-slate-950 p-1 rounded-full mb-6 border border-[#E5E7EB] dark:border-slate-800">
          <button
            type="button"
            onClick={() => switchTab('signin')}
            className={`flex-1 py-2.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'signin'
                ? 'bg-[#0A66C2] text-white shadow-2xs'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
            }`}
          >
            Sign In
          </button>

          <button
            type="button"
            onClick={() => switchTab('signup')}
            className={`flex-1 py-2.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'signup'
                ? 'bg-[#0A66C2] text-white shadow-2xs'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
            }`}
          >
            Join SubShare
          </button>
        </div>

        {/* SIGN IN TAB */}
        {activeTab === 'signin' && (
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Welcome Back</h2>
                <p className="text-xs text-gray-600 dark:text-slate-400 mt-0.5">
                  Sign in to access your verified peer exchanges.
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1 block">
                  Email Address
                </label>
                <div className="flex items-center border border-[#E5E7EB] dark:border-slate-800 rounded-xs overflow-hidden bg-white dark:bg-slate-950 focus-within:border-[#0A66C2]">
                  <div className="pl-3.5 pr-2.5 border-r border-[#E5E7EB] dark:border-slate-800">
                    <Mail className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={signInEmail}
                    onChange={(e) => {
                      setSignInEmail(e.target.value);
                      setSignInError(null);
                    }}
                    placeholder="name@example.com"
                    required
                    className="flex-1 h-11 px-3 text-gray-900 dark:text-white text-sm outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider block">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-xs text-[#0A66C2] hover:underline font-semibold"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="flex items-center border border-[#E5E7EB] dark:border-slate-800 rounded-xs overflow-hidden bg-white dark:bg-slate-950 focus-within:border-[#0A66C2]">
                  <div className="pl-3.5 pr-2.5 border-r border-[#E5E7EB] dark:border-slate-800">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signInPassword}
                    onChange={(e) => {
                      setSignInPassword(e.target.value);
                      setSignInError(null);
                    }}
                    placeholder="••••••••"
                    required
                    className="flex-1 h-11 px-3 text-gray-900 dark:text-white text-sm outline-none bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="px-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-[#0A66C2] border-gray-300 rounded-xs focus:ring-[#0A66C2]"
                  />
                  <span className="text-xs text-gray-600 dark:text-slate-400 font-medium">Remember this device</span>
                </label>
              </div>

              {signInError && (
                <div className="p-3 bg-[#FEE2E2] border border-[#CC1016]/20 rounded-xs text-xs text-[#CC1016] font-semibold">
                  {signInError}
                </div>
              )}

              {/* Sign In Pill Button */}
              <button
                type="submit"
                disabled={signInLoading}
                className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold py-3.5 rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60 text-base"
              >
                {signInLoading ? (
                  <span className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeDasharray="40" strokeDashoffset="30" />
                    </svg>
                    Signing in…
                  </span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* CREATE ACCOUNT WIZARD */}
        {activeTab === 'signup' && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="mb-5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                <span>
                  Step {step} of 3:{' '}
                  {step === 1 && 'Credentials'}
                  {step === 2 && 'Account Type'}
                  {step === 3 && (accountType === 'individual' ? 'Personal Profile' : 'Organization Setup')}
                </span>
                <span className="text-[#0A66C2] font-bold">{Math.round((step / 3) * 100)}%</span>
              </div>
              <div className="h-1.5 w-full bg-[#E5E7EB] dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="bg-[#0A66C2] h-full transition-all duration-300"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex-1">
              {step === 1 && (
                <EmailPasswordStep
                  initialValues={{ name, email: signupEmail }}
                  onSubmit={handleStep1Submit}
                  loading={signupLoading}
                  error={signupError}
                  onSwitchToSignIn={() => switchTab('signin')}
                />
              )}

              {step === 2 && (
                <AccountTypeStep
                  selectedType={accountType}
                  onContinue={handleStep2AccountType}
                />
              )}

              {step === 3 && accountType === 'individual' && (
                <IndividualProfileStep
                  onSubmit={handleStep3IndividualSubmit}
                  loading={signupLoading}
                  error={signupError}
                />
              )}

              {step === 3 && accountType === 'organization' && (
                <OrganizationProfileStep
                  onSubmit={handleStep3OrgSubmit}
                  loading={signupLoading}
                  error={signupError}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Trust Bar */}
      <div className="p-4 text-center">
        <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0A66C2]" />
          <span>SubShare Secure Peer Identity Network</span>
        </p>
      </div>
    </div>
  );
};
