import { ArrowLeft, ArrowRight, Building2, CheckCircle2, FileText, Loader2, MapPin, Navigation, Shield, Upload, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../../stores/adminStore';
import { useAuthStore } from '../../stores/authStore';
import { getLocationWithPermission } from '../../lib/capacitorPlugins';

export interface ProfileSetupPageProps {}

export const ProfileSetupPage: React.FC<ProfileSetupPageProps> = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { completeProfileSetup } = useAuthStore();
  const { addVerificationRequest } = useAdminStore();

  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState<'individual' | 'organization'>('individual');

  // Individual fields
  const [name, setName] = useState(user?.name && user.name !== 'New User' ? user.name : '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80');

  // Location fields
  const [location, setLocation] = useState(user?.location || '');
  const [coords, setCoords] = useState<{ lat?: number; lon?: number }>({
    lat: user?.latitude,
    lon: user?.longitude,
  });
  const [locationDetecting, setLocationDetecting] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);

  // Organization fields
  const [orgName, setOrgName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [orgPhone, setOrgPhone] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgType, setOrgType] = useState<'NGO' | 'Orphanage' | 'Old Age Home' | 'Charitable Trust' | 'Community Org' | 'Other'>('NGO');
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);

  const [error, setError] = useState('');

  // Auto-fill from authenticated user state
  useEffect(() => {
    if (user) {
      if (user.name && user.name !== 'New User') setName(user.name);
      if (user.email) setEmail(user.email);
      if (user.phone) setPhone(user.phone);
      if (user.location) setLocation(user.location);
    }
  }, [user]);

  // GPS Location detector using native Capacitor Geolocation & Reverse Geocoding
  const handleDetectLocation = async () => {
    setLocationDetecting(true);
    setLocationDenied(false);
    setError('');

    try {
      const { latitude: lat, longitude: lon } = await getLocationWithPermission();
      setCoords({ lat, lon });

      try {
        // Reverse geocode via OpenStreetMap Nominatim
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
          { headers: { 'Accept-Language': 'en' } }
        );
        if (res.ok) {
          const data = await res.json();
          const address = data.address || {};
          const suburb = address.suburb || address.neighbourhood || address.residential || address.road;
          const city = address.city || address.town || address.state_district || address.county || address.state;
          const locality = suburb && city ? `${suburb}, ${city}` : (city || data.display_name?.split(',').slice(0, 2).join(',') || `${lat.toFixed(4)}, ${lon.toFixed(4)}`);
          setLocation(locality);
          setLocationSuccess(true);
        } else {
          // Fallback to coordinates
          setLocation(`Lat: ${lat.toFixed(3)}, Lon: ${lon.toFixed(3)}`);
          setLocationSuccess(true);
        }
      } catch {
        setLocation(`Lat: ${lat.toFixed(3)}, Lon: ${lon.toFixed(3)}`);
        setLocationSuccess(true);
      }
    } catch (err: any) {
      console.warn('Geolocation denied or failed:', err?.message || err);
      setLocationDenied(true);
    } finally {
      setLocationDetecting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedDocName(file.name);
    }
  };

  const handleNext = () => {
    setError('');

    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (accountType === 'individual') {
        if (!name.trim()) { setError('Please enter your full name'); return; }
        if (!phone.trim() && !user?.phone) { setError('Please enter your mobile phone number'); return; }
        if (!email.trim() && !user?.email) { setError('Please enter your email address'); return; }
        if (!location.trim()) { setError('Please detect or enter your locality/city'); return; }
      } else {
        if (!orgName.trim()) { setError('Please enter your organization name'); return; }
        if (!regNumber.trim()) { setError('Please enter your government registration number'); return; }
        if (!contactPerson.trim()) { setError('Please enter primary contact person name'); return; }
        if (!location.trim()) { setError('Please provide your organization location'); return; }
        if (!uploadedDocName) { setError('Please upload your registration document for admin verification'); return; }
      }
      setStep(3);
    } else if (step === 3) {
      if (accountType === 'individual') {
        completeProfileSetup({
          name: name.trim(),
          accountType: 'individual',
          location: location.trim(),
          latitude: coords.lat,
          longitude: coords.lon,
          phone: phone || user?.phone,
          email: email || user?.email,
        });
      } else {
        // Complete as organization and queue for Admin verification
        completeProfileSetup({
          name: orgName.trim(),
          accountType: 'organization',
          location: location.trim(),
          latitude: coords.lat,
          longitude: coords.lon,
          phone: orgPhone || phone,
          email: orgEmail || email,
          orgDetails: {
            name: orgName.trim(),
            regNumber: regNumber.trim(),
            type: orgType,
            contactPerson: contactPerson.trim(),
            documentUrl: uploadedDocName || 'Certificate.pdf',
          },
        });

        addVerificationRequest({
          orgName: orgName.trim(),
          type: orgType,
          regNumber: regNumber.trim(),
          contactPerson: contactPerson.trim(),
          email: orgEmail || email || 'contact@org.org',
          phone: orgPhone || phone || '+91 90000 00000',
          documentName: uploadedDocName || 'Registration_Certificate.pdf',
        });
      }

      navigate('/home');
    }
  };

  const progress = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-lg mx-auto shadow-xl">
      {/* Header */}
      <div className="px-5 pt-8 pb-4 flex items-center gap-3 border-b border-slate-100">
        <button
          onClick={() => {
            if (step > 1) {
              setStep((s) => s - 1);
            } else {
              navigate(-1);
            }
          }}
          className="p-2 -ml-2 rounded-xl hover:bg-slate-50 transition-colors"
          title="Go Back"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Step {step} of 3: {step === 1 ? 'Account Type' : step === 2 ? 'Details & Location' : 'Review & Confirm'}
              </span>
            </div>
            <span className="text-xs font-bold text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step 1: Account Type */}
      {step === 1 && (
        <div className="flex-1 px-5 pt-4 flex flex-col">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Choose Account Type</h1>
          <p className="text-slate-500 text-sm mt-1 mb-6">
            Select your primary identity on SubShare.
          </p>

          <div className="space-y-4">
            {/* Individual Option */}
            <button
              onClick={() => setAccountType('individual')}
              className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                accountType === 'individual'
                  ? 'border-primary bg-blue-50/70 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-3 rounded-xl ${accountType === 'individual' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <User className="w-6 h-6" />
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${accountType === 'individual' ? 'border-primary bg-primary' : 'border-slate-300'}`}>
                  {accountType === 'individual' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>
              <h3 className="font-bold text-slate-900 text-base">Individual / Citizen</h3>
              <p className="text-sm text-slate-500 mt-1">
                Exchange event tickets, share carpools, donate blood, volunteer, and share family subscription slots.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {['Verified Mobile', 'Live GPS Proximity', 'Dynamic Trust Score'].map((tag) => (
                  <span key={tag} className="text-[11px] bg-blue-100/80 text-blue-700 rounded-full px-2.5 py-0.5 font-medium border border-blue-200">
                    {tag}
                  </span>
                ))}
              </div>
            </button>

            {/* Organization Option */}
            <button
              onClick={() => setAccountType('organization')}
              className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                accountType === 'organization'
                  ? 'border-primary bg-blue-50/70 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-3 rounded-xl ${accountType === 'organization' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Building2 className="w-6 h-6" />
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${accountType === 'organization' ? 'border-primary bg-primary' : 'border-slate-300'}`}>
                  {accountType === 'organization' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>
              <h3 className="font-bold text-slate-900 text-base">Organization / NGO / Shelter</h3>
              <p className="text-sm text-slate-500 mt-1">
                Receive bulk cooked food donations, coordinate hospital emergency blood drives, and redistribute essential resources.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {['NGO / Trust', 'Registration Audit', 'Admin Verified Badge ✓'].map((tag) => (
                  <span key={tag} className="text-[11px] bg-amber-100/80 text-amber-700 rounded-full px-2.5 py-0.5 font-medium border border-amber-200">
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Information & Location */}
      {step === 2 && (
        <div className="flex-1 px-5 pt-4 flex flex-col overflow-y-auto pb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {accountType === 'individual' ? 'Personal Details & Location' : 'Organization & Document Setup'}
          </h1>
          <p className="text-slate-500 text-sm mt-1 mb-5">
            {accountType === 'individual'
              ? 'Tell us your name and allow GPS location for nearby matching.'
              : 'Provide your official registration details and registration certificate for admin review.'}
          </p>

          <div className="space-y-4">
            {accountType === 'individual' ? (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Karthik Raja"
                    className="w-full h-12 px-4 border border-slate-200 rounded-xl text-slate-900 font-medium text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98402 11245"
                      className="w-full h-12 px-4 border border-slate-200 rounded-xl text-slate-900 font-medium text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="karthik@gmail.com"
                      className="w-full h-12 px-4 border border-slate-200 rounded-xl text-slate-900 font-medium text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">
                    Organization Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Karunai Shelter & Care Home"
                    className="w-full h-12 px-4 border border-slate-200 rounded-xl text-slate-900 font-medium text-sm outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">
                      Registration Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                      placeholder="e.g. TN-NGO-2022-8941"
                      className="w-full h-12 px-4 border border-slate-200 rounded-xl text-slate-900 font-medium text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">
                      Contact Person <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="e.g. Rev. Daniel Thomas"
                      className="w-full h-12 px-4 border border-slate-200 rounded-xl text-slate-900 font-medium text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 block">
                    Organization Type <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['NGO', 'Old Age Home', 'Orphanage', 'Charitable Trust', 'Community Org', 'Other'] as const).map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setOrgType(t)}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                          orgType === t
                            ? 'border-primary bg-blue-50 text-primary font-bold'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Org Phone</label>
                    <input
                      type="tel"
                      value={orgPhone}
                      onChange={(e) => setOrgPhone(e.target.value)}
                      placeholder="+91 94440 91822"
                      className="w-full h-12 px-4 border border-slate-200 rounded-xl text-slate-900 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Org Email</label>
                    <input
                      type="email"
                      value={orgEmail}
                      onChange={(e) => setOrgEmail(e.target.value)}
                      placeholder="contact@karunai.org"
                      className="w-full h-12 px-4 border border-slate-200 rounded-xl text-slate-900 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Document Upload */}
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">
                    Verification Document Upload <span className="text-rose-500">*</span>
                  </label>
                  <label className="border-2 border-dashed border-slate-200 hover:border-primary rounded-2xl p-4 flex flex-col items-center gap-2 cursor-pointer bg-slate-50/50 transition-colors">
                    <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileUpload} className="hidden" />
                    {uploadedDocName ? (
                      <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        <FileText className="w-4 h-4" />
                        <span className="text-xs font-bold truncate max-w-xs">{uploadedDocName}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-slate-400" />
                        <span className="text-xs font-bold text-slate-700">Click to upload 12A / 80G / Trust Deed PDF</span>
                        <span className="text-[11px] text-slate-400">PDF, PNG, or JPG (max 5MB)</span>
                      </>
                    )}
                  </label>
                </div>
              </>
            )}

            {/* LOCATION FLOW (GPS + Fallback) */}
            <div className="pt-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">
                Current Location <span className="text-rose-500">*</span>
              </label>

              {/* GPS Action Button */}
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={locationDetecting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-primary/40 bg-blue-50/70 text-primary text-xs font-bold hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                  {locationDetecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Acquiring GPS coordinates & reverse geocoding…
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4" />
                      Detect Locality via GPS
                    </>
                  )}
                </button>
              </div>

              {locationSuccess && (
                <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Detected: {location}</span>
                </div>
              )}

              {locationDenied && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-2 text-xs text-amber-800">
                  <p className="font-semibold mb-1">
                    Location permission is required for nearby services. You can enable it later in settings.
                  </p>
                  <p className="text-amber-700">Please enter your location manually below:</p>
                </div>
              )}

              {/* Manual input fallback */}
              <div className="relative">
                <div className="absolute left-3.5 top-3.5 text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Anna Nagar, Chennai or Indiranagar, Bengaluru"
                  className="w-full h-12 pl-10 pr-4 border border-slate-200 rounded-xl text-slate-900 font-medium text-sm outline-none focus:border-primary"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Your exact GPS coordinates remain private; only approximate locality is visible for nearby matching.
              </p>
            </div>

            {error && <p className="text-xs text-rose-600 font-semibold mt-2">{error}</p>}
          </div>
        </div>
      )}

      {/* Step 3: Review & Confirmation */}
      {step === 3 && (
        <div className="flex-1 px-5 pt-4 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4 shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ready to Complete Setup</h1>
          <p className="text-slate-500 text-sm mt-1 mb-6 max-w-xs">
            {accountType === 'individual'
              ? 'Your profile is ready. You will start with a baseline Trust Score calculated from your verified phone.'
              : 'Your organization profile will be placed in Pending status until approved by our Trust Admin team.'}
          </p>

          <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left space-y-3 mb-6">
            <div className="flex justify-between text-xs pb-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Account Name</span>
              <span className="text-slate-900 font-bold">{accountType === 'individual' ? name : orgName}</span>
            </div>
            <div className="flex justify-between text-xs pb-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Account Type</span>
              <span className="text-slate-900 font-bold capitalize">{accountType}</span>
            </div>
            <div className="flex justify-between text-xs pb-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Location</span>
              <span className="text-slate-900 font-bold">{location}</span>
            </div>
            <div className="flex justify-between text-xs pb-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Verification Status</span>
              <span className={`font-bold ${accountType === 'organization' ? 'text-amber-600' : 'text-emerald-600'}`}>
                {accountType === 'organization' ? 'Pending (Admin review required)' : 'Phone Verified ✓'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-medium">Initial Trust Score</span>
              <span className="text-primary font-black">{accountType === 'individual' ? '25 / 100 (New User)' : 'Pending Verification'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="px-5 pb-8 pt-3 border-t border-slate-100 bg-white">
        <button
          onClick={handleNext}
          className="w-full bg-primary text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-transform"
        >
          {step === 3 ? (
            accountType === 'individual' ? 'Enter SubShare Home ›' : 'Submit Organization for Review ›'
          ) : (
            <>
              {step === 2 ? 'Save & Review' : 'Continue'}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
