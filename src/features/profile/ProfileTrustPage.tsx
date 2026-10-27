import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Shield,
  Edit3,
  LogOut,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Camera,
  User as UserIcon,
  X,
  Loader2,
  Sun,
  Moon,
  Monitor,
  Eye,
  Flag,
  IndianRupee,
  FileText,
  FileCheck,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { TrustScoreBadge } from '../../components/ui/TrustScoreBadge';
import { supabase } from '../../lib/supabase';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import { calculateTrustScore } from '../../services/trustService';

export const ProfileTrustPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { logout, updateEmergencyContact, updateProfile } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showTrustExplainer, setShowTrustExplainer] = useState(false);
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Editable Form State
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editCity, setEditCity] = useState(user?.location || '');
  const [editArea, setEditArea] = useState('');
  const [showContact, setShowContact] = useState(false);
  const [showPhone, setShowPhone] = useState(false);

  // Fetch current profile flags
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('profiles')
      .select('show_contact, show_phone')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setShowContact(!!data.show_contact);
          setShowPhone(!!data.show_phone);
        }
      });
  }, [user?.id]);

  // Photo Upload State
  const [photoUploading, setPhotoUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setPhotoUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('profile-photos')
        .upload(path, file, { upsert: true });

      if (uploadErr) {
        const reader = new FileReader();
        reader.onloadend = () => {
          updateProfile({ avatar: reader.result as string });
        };
        reader.readAsDataURL(file);
      } else {
        const { data: pubData } = supabase.storage.from('profile-photos').getPublicUrl(path);
        if (pubData?.publicUrl) {
          updateProfile({ avatar: pubData.publicUrl });
        }
      }
    } catch (err: any) {
      console.warn('Image upload error:', err);
    } finally {
      setPhotoUploading(false);
    }
  };

  // Emergency contact form state
  const [editingEmergency, setEditingEmergency] = useState(false);
  const [emName, setEmName] = useState(user?.emergencyContact?.name || '');
  const [emPhone, setEmPhone] = useState(user?.emergencyContact?.phone || '');
  const [emRel, setEmRel] = useState(user?.emergencyContact?.relationship || 'Family');

  const trustBreakdown = calculateTrustScore(user || {});

  const handleSavePersonalInfo = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const locationText = editArea.trim() ? `${editArea.trim()}, ${editCity.trim()}` : editCity.trim();

      updateProfile({
        name: editName.trim(),
        phone: editPhone.trim(),
        location: locationText,
      });

      if (user?.id) {
        await supabase
          .from('profiles')
          .update({
            name: editName.trim(),
            phone: editPhone.trim(),
            city: editCity.trim(),
            show_contact: showContact,
            show_phone: showPhone,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      }

      setSaveSuccess(true);
      setEditingPersonal(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmergency = (e: React.FormEvent) => {
    e.preventDefault();
    if (emName.trim() && emPhone.trim()) {
      updateEmergencyContact({
        name: emName.trim(),
        phone: emPhone.trim(),
        relationship: emRel,
      });
      setEditingEmergency(false);
    }
  };

  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const handleLogoutConfirm = async () => {
    setShowSignOutModal(false);
    await logout();
    navigate('/');
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 dark:bg-slate-950 pb-24 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Profile Header */}
      <div className="bg-slate-900 dark:bg-slate-900 px-5 pt-6 pb-9 text-white">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-base font-black tracking-tight">Trust & Profile Center</h1>
          <button
            onClick={() => setEditingPersonal(!editingPersonal)}
            className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
          >
            {editingPersonal ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            {editingPersonal ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
              alt={user?.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30 flex-shrink-0"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={photoUploading}
              className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {photoUploading ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg text-white truncate">{user?.name || 'Guest User'}</h2>
            <p className="text-slate-400 text-xs truncate flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
              {user?.location || 'Location Not Set'}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] font-bold bg-white/10 text-blue-300 px-2 py-0.5 rounded-full border border-white/15 uppercase tracking-wider">
                {user?.accountType || 'Individual'}
              </span>
              {user?.role === 'admin' && (
                <span className="text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full">
                  Admin
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="-mt-4 px-4 flex flex-col gap-4">
        {saveSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Profile updated successfully!</span>
          </div>
        )}

        {saveError && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{saveError}</span>
          </div>
        )}

        {/* 1. EDITABLE PROFILE FORM */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Personal Information</h3>
            <span className="text-[11px] text-slate-400 font-medium">Fully Editable</span>
          </div>

          {editingPersonal ? (
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">City</label>
                <input
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              {/* Privacy Toggles */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showContact}
                    onChange={(e) => setShowContact(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Show my email address to other users
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPhone}
                    onChange={(e) => setShowPhone(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Show my phone number to other users
                  </span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPersonal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePersonalInfo}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between"><span className="text-slate-500 font-medium">Email:</span><span className="font-bold">{user?.email}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-500 font-medium">Phone:</span><span className="font-bold">{user?.phone || 'Not provided'}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-500 font-medium">Location:</span><span className="font-bold">{user?.location || 'Not provided'}</span></div>
            </div>
          )}
        </div>

        {/* 2. DYNAMIC TRUST SCORE BREAKDOWN */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              Dynamic Trust Score
            </h3>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${trustBreakdown.tierColor}`}>
              {trustBreakdown.tier}
            </span>
          </div>

          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 mb-3">
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{trustBreakdown.score} / 100</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Calculated from verified platform activity</p>
            </div>
            <TrustScoreBadge score={trustBreakdown.score} size="lg" />
          </div>

          <button
            onClick={() => setShowTrustExplainer(!showTrustExplainer)}
            className="w-full text-left text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between py-1"
          >
            <span>View Score Breakdown ({trustBreakdown.items.length} Factors)</span>
            {showTrustExplainer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showTrustExplainer && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              {trustBreakdown.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${item.completed ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700'}`} />
                    {item.label}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    +{item.points} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. APPEARANCE / THEME SWITCHER */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs">
          <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-3">
            Appearance
          </h3>
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                theme === 'light'
                  ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Light</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                theme === 'dark'
                  ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                theme === 'system'
                  ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>System</span>
            </button>
          </div>
        </div>

        {/* 4. QUICK LINKS (My Reports, Payment Ledger) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 space-y-1 shadow-2xs">
          <Link
            to="/reports/my"
            className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            <div className="flex items-center gap-2.5">
              <Flag className="w-4 h-4 text-rose-500" />
              <span>My Reports & Moderation Tickets</span>
            </div>
            <span className="text-slate-400">→</span>
          </Link>

          <Link
            to="/payments"
            className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            <div className="flex items-center gap-2.5">
              <IndianRupee className="w-4 h-4 text-emerald-500" />
              <span>Payment & Escrow Ledger</span>
            </div>
            <span className="text-slate-400">→</span>
          </Link>
        </div>

        {/* 5. LEGAL & POLICY LINKS */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 space-y-1 shadow-2xs">
          <button
            type="button"
            onClick={() => window.open('https://subshare.netlify.app/#owner', '_blank')}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition border-b border-slate-100 dark:border-slate-800 text-left"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-slate-500" />
              <span className="text-base font-semibold text-slate-800 dark:text-slate-200">Privacy Policy</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => window.open('https://subshare.netlify.app/#owner', '_blank')}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition text-left"
          >
            <div className="flex items-center gap-2.5">
              <FileCheck className="w-5 h-5 text-slate-500" />
              <span className="text-base font-semibold text-slate-800 dark:text-slate-200">Terms of Service</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* 6. SIGN OUT BUTTON */}
        <button
          onClick={() => setShowSignOutModal(true)}
          className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold py-3.5 rounded-2xl text-xs transition flex items-center justify-center gap-2 border border-rose-500/20"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Account</span>
        </button>
      </div>

      {/* Sign Out Confirmation Modal */}
      {showSignOutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 max-w-sm w-full text-center">
            <LogOut className="w-10 h-10 text-rose-500 mx-auto" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Sign Out?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to sign out? Your session is saved securely.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSignOutModal(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="flex-1 py-3 rounded-2xl bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-600/20"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
