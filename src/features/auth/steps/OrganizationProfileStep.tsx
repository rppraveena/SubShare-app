import React, { useState } from 'react';
import { Building2, FileText, Upload, MapPin, CheckCircle, ArrowRight } from 'lucide-react';

interface OrganizationProfileStepProps {
  onSubmit: (data: {
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
  }) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const OrganizationProfileStep: React.FC<OrganizationProfileStepProps> = ({
  onSubmit,
  loading,
  error,
}) => {
  const [orgName, setOrgName] = useState('');
  const [type, setType] = useState('NGO');
  const [regNumber, setRegNumber] = useState('');
  const [regDate, setRegDate] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [officialPhone, setOfficialPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  const [certFile, setCertFile] = useState<File | null>(null);
  const [govFile, setGovFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleCertChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 5 * 1024 * 1024) {
        setLocalError('Registration certificate must be less than 5MB');
        return;
      }
      setCertFile(f);
      setLocalError(null);
    }
  };

  const handleGovDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 5 * 1024 * 1024) {
        setLocalError('Government document must be less than 5MB');
        return;
      }
      setGovFile(f);
      setLocalError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!orgName.trim()) {
      setLocalError('Please enter the Organization Name');
      return;
    }
    if (!regNumber.trim()) {
      setLocalError('Please enter the Registration Number');
      return;
    }
    if (!contactPerson.trim()) {
      setLocalError('Please enter Contact Person Name');
      return;
    }
    if (!officialEmail.trim() || !officialEmail.includes('@')) {
      setLocalError('Please enter a valid Official Email');
      return;
    }
    if (!city.trim()) {
      setLocalError('Please enter City / Location');
      return;
    }

    await onSubmit({
      orgName: orgName.trim(),
      type,
      regNumber: regNumber.trim(),
      regDate: regDate || undefined,
      contactPerson: contactPerson.trim(),
      officialEmail: officialEmail.trim().toLowerCase(),
      officialPhone: officialPhone.trim(),
      address: address.trim(),
      city: city.trim(),
      certificateFile: certFile || undefined,
      govDocFile: govFile || undefined,
    });
  };

  const activeError = localError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <Building2 className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Organization Details</h2>
        </div>
        <p className="text-xs text-slate-500">
          Submit official entity documents for verification by SubShare trust auditors.
        </p>
      </div>

      {/* Org Name */}
      <div>
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">
          Organization Name *
        </label>
        <input
          type="text"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          placeholder="e.g. Hope Foundation Trust"
          required
          className="w-full h-11 px-3 border border-slate-200 rounded-xl text-slate-900 text-sm outline-none bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
        />
      </div>

      {/* Org Type & Reg Number */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">
            Organization Type *
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full h-11 px-3 border border-slate-200 rounded-xl text-slate-900 text-sm outline-none bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
          >
            <option value="NGO">NGO</option>
            <option value="Orphanage">Orphanage</option>
            <option value="Old Age Home">Old Age Home</option>
            <option value="Charitable Trust">Charitable Trust</option>
            <option value="Community Organization">Community Organization</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">
            Registration Number *
          </label>
          <input
            type="text"
            value={regNumber}
            onChange={(e) => setRegNumber(e.target.value)}
            placeholder="e.g. REG-884021"
            required
            className="w-full h-11 px-3 border border-slate-200 rounded-xl text-slate-900 text-sm outline-none bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
          />
        </div>
      </div>

      {/* Date of Registration & Contact Person */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">
            Date of Registration
          </label>
          <input
            type="date"
            value={regDate}
            onChange={(e) => setRegDate(e.target.value)}
            className="w-full h-11 px-3 border border-slate-200 rounded-xl text-slate-900 text-sm outline-none bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">
            Contact Person Name *
          </label>
          <input
            type="text"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            placeholder="Authorized representative"
            required
            className="w-full h-11 px-3 border border-slate-200 rounded-xl text-slate-900 text-sm outline-none bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
          />
        </div>
      </div>

      {/* Official Email & Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">
            Official Email *
          </label>
          <input
            type="email"
            value={officialEmail}
            onChange={(e) => setOfficialEmail(e.target.value)}
            placeholder="org@domain.org"
            required
            className="w-full h-11 px-3 border border-slate-200 rounded-xl text-slate-900 text-sm outline-none bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">
            Official Phone
          </label>
          <input
            type="tel"
            value={officialPhone}
            onChange={(e) => setOfficialPhone(e.target.value)}
            placeholder="+91 98402 00000"
            className="w-full h-11 px-3 border border-slate-200 rounded-xl text-slate-900 text-sm outline-none bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
          />
        </div>
      </div>

      {/* City & Address */}
      <div>
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">
          City / Location *
        </label>
        <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-blue-600">
          <div className="pl-3 pr-2 border-r border-slate-200">
            <MapPin className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Chennai, Tamil Nadu"
            required
            className="flex-1 h-11 px-3 text-slate-900 text-sm outline-none"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">
          Full Registered Address
        </label>
        <textarea
          rows={2}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Building name, Street, Postal Code"
          className="w-full p-3 border border-slate-200 rounded-xl text-slate-900 text-sm outline-none bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 resize-none"
        />
      </div>

      {/* Document Uploads */}
      <div className="space-y-3 pt-2">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
          Verification Documents (Max 5MB each, PDF/JPG/PNG)
        </label>

        {/* Certificate */}
        <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs font-bold text-slate-800">Registration Certificate</p>
              <p className="text-[11px] text-slate-500">
                {certFile ? certFile.name : 'No file chosen'}
              </p>
            </div>
          </div>
          <label className="px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer flex items-center gap-1">
            <Upload className="w-3.5 h-3.5 text-slate-500" /> Upload
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleCertChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Govt Doc */}
        <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-slate-800">Government Identification / Tax Doc</p>
              <p className="text-[11px] text-slate-500">
                {govFile ? govFile.name : 'No file chosen'}
              </p>
            </div>
          </div>
          <label className="px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer flex items-center gap-1">
            <Upload className="w-3.5 h-3.5 text-slate-500" /> Upload
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleGovDocChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {activeError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
          {activeError}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all disabled:opacity-60 mt-4"
      >
        {loading ? (
          <span className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeDasharray="40" strokeDashoffset="30" />
            </svg>
            Submitting Documents…
          </span>
        ) : (
          <>
            <span>Submit for Verification</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
};
