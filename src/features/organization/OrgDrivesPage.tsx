import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HeartHandshake, Plus, Calendar, MapPin, CheckCircle2 } from 'lucide-react';

export const OrgDrivesPage: React.FC = () => {
  const navigate = useNavigate();
  const [drives, setDrives] = useState([
    {
      id: 'd1',
      title: 'City Center Blood Donation Drive',
      date: 'Next Saturday, 10:00 AM',
      location: 'Community Hall, Trichy',
      registeredDonors: 14,
      status: 'Active',
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim()) return;

    setDrives([
      {
        id: `d_${Date.now()}`,
        title: title.trim(),
        date: date || 'Upcoming',
        location: location.trim(),
        registeredDonors: 0,
        status: 'Active',
      },
      ...drives,
    ]);

    setTitle('');
    setDate('');
    setLocation('');
    setShowModal(false);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#F3F2EF] dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors font-sans pb-28">
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold">Blood Donation Drives</h1>
            <p className="text-[11px] text-gray-500">Host community drives</p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-[#0A66C2] text-white font-semibold text-xs px-3.5 py-2 rounded-full flex items-center gap-1 shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Drive</span>
        </button>
      </div>

      <div className="p-4 space-y-3 flex-1">
        {drives.map((d) => (
          <div
            key={d.id}
            className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-sm p-4 space-y-2 shadow-2xs"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-xs bg-[#DCFCE7] text-[#057642]">
                  {d.status}
                </span>
                <h3 className="font-bold text-gray-900 dark:text-white text-base mt-1">{d.title}</h3>
              </div>
              <span className="text-xs font-bold text-[#0A66C2] bg-[#EAF3FB] px-2.5 py-1 rounded-full">
                {d.registeredDonors} Donors
              </span>
            </div>

            <div className="space-y-1 text-xs text-gray-600 dark:text-slate-400 pt-1 border-t border-[#E5E7EB] dark:border-slate-800">
              <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" /> {d.date}</p>
              <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-400" /> {d.location}</p>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-lg p-5 w-full max-w-md space-y-4">
            <h3 className="font-bold text-base">Host Blood Donation Drive</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Drive Title</label>
                <input
                  type="text"
                  placeholder="e.g. Trichy City Blood Drive"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#F3F2EF] dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-sm p-2.5 outline-none font-medium text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Date & Time</label>
                <input
                  type="text"
                  placeholder="e.g. Next Saturday, 10:00 AM"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#F3F2EF] dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-sm p-2.5 outline-none font-medium text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Location / Venue</label>
                <input
                  type="text"
                  placeholder="e.g. Community Hall"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#F3F2EF] dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-sm p-2.5 outline-none font-medium text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-full border border-gray-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-[#0A66C2] text-white font-semibold shadow-2xs"
                >
                  Create Drive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
