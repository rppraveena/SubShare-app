import React, { useState } from 'react';
import { Camera, MapPin, Calendar, UserCheck, ArrowRight, Navigation, Upload } from 'lucide-react';
import { getLocationWithPermission } from '../../../lib/capacitorPlugins';

interface IndividualProfileStepProps {
  onSubmit: (data: {
    photo?: File;
    city: string;
    latitude?: number;
    longitude?: number;
    dob?: string;
    gender?: string;
  }) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const IndividualProfileStep: React.FC<IndividualProfileStepProps> = ({
  onSubmit,
  loading,
  error,
}) => {
  const [city, setCity] = useState('');
  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setLocalError('Photo file size must be less than 5MB');
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setLocalError(null);
    }
  };

  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    setLocalError(null);
    try {
      const pos = await getLocationWithPermission();
      if (pos) {
        setLat(pos.latitude);
        setLng(pos.longitude);
        setCity(`GPS Location (${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)})`);
      } else {
        setLocalError('Could not obtain location. Please enter city manually.');
      }
    } catch {
      setLocalError('Location detection failed. Enter city manually.');
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!city.trim()) {
      setLocalError('Please enter your city or detect location');
      return;
    }

    await onSubmit({
      photo: photo || undefined,
      city: city.trim(),
      latitude: lat,
      longitude: lng,
      dob: dob || undefined,
      gender: gender || undefined,
    });
  };

  const activeError = localError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <UserCheck className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Personal Profile</h2>
        </div>
        <p className="text-xs text-slate-500">
          Complete your profile to unlock verified peer interactions.
        </p>
      </div>

      {/* Profile Photo Upload */}
      <div className="flex flex-col items-center justify-center py-2">
        <label className="relative cursor-pointer group">
          <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden group-hover:border-blue-500 transition-colors">
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-7 h-7 text-slate-400 group-hover:text-blue-600 transition-colors" />
            )}
          </div>
          <div className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full shadow-md">
            <Upload className="w-3.5 h-3.5" />
          </div>
          <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
        </label>
        <span className="text-[11px] text-slate-500 font-medium mt-1.5">
          {photo ? photo.name : 'Upload Profile Photo (Optional)'}
        </span>
      </div>

      {/* Location / City */}
      <div>
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">
          City / Location
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/10">
            <div className="flex items-center pl-3 pr-2.5 border-r border-slate-200 h-11">
              <MapPin className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Mumbai, Bengaluru"
              required
              className="flex-1 h-11 px-3 text-slate-900 text-sm outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={detectingLocation}
            className="px-3 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <Navigation className={`w-3.5 h-3.5 text-blue-600 ${detectingLocation ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">GPS</span>
          </button>
        </div>
      </div>

      {/* Date of Birth */}
      <div>
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">
          Date of Birth
        </label>
        <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/10">
          <div className="flex items-center pl-3 pr-2.5 border-r border-slate-200 h-11">
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="flex-1 h-11 px-3 text-slate-900 text-sm outline-none bg-transparent"
          />
        </div>
      </div>

      {/* Gender */}
      <div>
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">
          Gender (Optional)
        </label>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="w-full h-11 px-3 border border-slate-200 rounded-xl text-slate-900 text-sm outline-none bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </select>
      </div>

      {activeError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
          {activeError}
        </div>
      )}

      {/* Complete Setup Button */}
      <button
        type="submit"
        disabled={loading || !city.trim()}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all disabled:opacity-60 mt-2"
      >
        {loading ? (
          <span className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeDasharray="40" strokeDashoffset="30" />
            </svg>
            Saving Profile…
          </span>
        ) : (
          <>
            <span>Complete Setup</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
};
