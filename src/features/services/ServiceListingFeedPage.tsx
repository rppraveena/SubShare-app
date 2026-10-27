import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Ticket,
  Car,
  HeartHandshake,
  Utensils,
  Share2,
  Search,
  MapPin,
  Clock,
  Users,
  Flame,
  Plus,
  X,
  Upload,
  Sparkles,
  Info,
  Check,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileText,
  Building2,
  Shield,
  Phone,
  Map,
  List,
  Navigation,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useServiceStore } from '../../stores/serviceStore';
import { useAuthStore } from '../../stores/authStore';
import { ServiceCategory } from '../../types';
import { TrustScoreBadge } from '../../components/ui/TrustScoreBadge';
import { DistancePill } from '../../components/ui/DistancePill';
import { StatusPill } from '../../components/ui/StatusPill';
import { formatProximity, calculateHaversineDistance } from '../../utils/distance';
import { getLocationWithPermission } from '../../lib/capacitorPlugins';
import { ServiceMapView, MapItem } from '../../components/map/ServiceMapView';

const safeDate = (val?: string) => {
  if (!val) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return null;
};

const safeTime = (val?: string) => {
  if (!val) return null;
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(val)) return val;
  const match = val.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (match) {
    let hours = parseInt(match[1]);
    const mins = match[2];
    const ampm = match[3]?.toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${mins}:00`;
  }
  return null;
};

export interface ServiceListingFeedPageProps {}

type SubTab = 'available' | 'mine' | 'requests';

const TABS: { id: ServiceCategory; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'tickets', label: 'Tickets', icon: Ticket },
  { id: 'rides', label: 'Rides', icon: Car },
  { id: 'blood', label: 'Blood SOS', icon: HeartHandshake },
  { id: 'food', label: 'Food Aid', icon: Utensils },
  { id: 'subscriptions', label: 'Subs', icon: Share2 },
];

export const ServiceListingFeedPage: React.FC<ServiceListingFeedPageProps> = () => {
  const [searchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const {
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    tickets,
    rides,
    bloodRequests,
    foodDonations,
    subscriptions,
    ticketRequests,
    rideRequests,
    bloodResponses,
    foodAcceptances,
    subscriptionRequests,
    addTicket,
    addRide,
    addBloodRequest,
    addFoodDonation,
    addSubscription,
    acceptTicketRequest,
    rejectTicketRequest,
    acceptRideRequest,
    rejectRideRequest,
    updateFoodStatus,
    approveSubscriptionMember,
    rejectSubscriptionMember,
    fetchFromSupabase,
  } = useServiceStore();

  useEffect(() => {
    fetchFromSupabase();
  }, [fetchFromSupabase]);

  const updateProfile = useAuthStore((s) => s.updateProfile);
  const [localSearch, setLocalSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<SubTab>('available');
  const [actionSuccess, setActionSuccess] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    setLocationError('');
    try {
      const geo = await getLocationWithPermission();
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${geo.latitude}&lon=${geo.longitude}&format=json`,
          { headers: { 'Accept-Language': 'en' } }
        );
        if (res.ok) {
          const data = await res.json();
          const address = data.address || {};
          const suburb = address.suburb || address.neighbourhood || address.residential || address.road;
          const city = address.city || address.town || address.state_district || address.county || address.state;
          const locality = suburb && city ? `${suburb}, ${city}` : (city || data.display_name?.split(',').slice(0, 2).join(',') || `${geo.latitude.toFixed(4)}, ${geo.longitude.toFixed(4)}`);
          updateProfile({ latitude: geo.latitude, longitude: geo.longitude, location: locality });
          setActionSuccess(`GPS location updated to ${locality}`);
        } else {
          updateProfile({ latitude: geo.latitude, longitude: geo.longitude });
          setActionSuccess(`GPS coordinates updated`);
        }
      } catch {
        updateProfile({ latitude: geo.latitude, longitude: geo.longitude });
        setActionSuccess(`GPS coordinates updated`);
      }
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      console.warn('GPS location request failed:', err);
      setLocationError('Could not access GPS. Please ensure location permission is allowed.');
      setTimeout(() => setLocationError(''), 5000);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const isWithinRadius = (itemLat?: number, itemLon?: number) => {
    if (!radiusKm) return true;
    if (!user?.latitude || !user?.longitude || !itemLat || !itemLon) return true;
    const km = calculateHaversineDistance(user.latitude, user.longitude, itemLat, itemLon);
    return km <= radiusKm;
  };

  const mapItems: MapItem[] = [
    ...tickets
      .filter((t) => t.status === 'available' && t.latitude && t.longitude)
      .map((t) => ({
        id: t.id,
        category: 'tickets' as const,
        title: t.title,
        subtitle: `${t.venue}, ${t.city} • ₹${t.sellingPrice}`,
        latitude: t.latitude!,
        longitude: t.longitude!,
        distanceKm: user?.latitude && user?.longitude && t.latitude && t.longitude
          ? calculateHaversineDistance(user.latitude, user.longitude, t.latitude, t.longitude)
          : undefined,
        badge: `₹${t.sellingPrice}`,
        linkUrl: `/services/${t.id}`,
      })),
    ...rides
      .filter((r) => (r.seatsAvailable ?? 0) > 0 && r.latitude && r.longitude)
      .map((r) => ({
        id: r.id,
        category: 'rides' as const,
        title: `${r.origin} → ${r.destination}`,
        subtitle: `${r.date} • ₹${r.pricePerSeat}/seat`,
        latitude: r.latitude!,
        longitude: r.longitude!,
        distanceKm: user?.latitude && user?.longitude && r.latitude && r.longitude
          ? calculateHaversineDistance(user.latitude, user.longitude, r.latitude, r.longitude)
          : undefined,
        badge: `${r.seatsAvailable} seats`,
        linkUrl: `/services/${r.id}`,
      })),
    ...bloodRequests
      .filter((b) => b.status !== 'fulfilled' && b.latitude && b.longitude)
      .map((b) => ({
        id: b.id,
        category: 'blood' as const,
        title: `Urgent ${b.bloodGroup} Blood Request`,
        subtitle: `${b.hospital}, ${b.location}`,
        latitude: b.latitude!,
        longitude: b.longitude!,
        distanceKm: user?.latitude && user?.longitude && b.latitude && b.longitude
          ? calculateHaversineDistance(user.latitude, user.longitude, b.latitude, b.longitude)
          : undefined,
        badge: b.bloodGroup,
        linkUrl: `/services/${b.id}`,
      })),
    ...foodDonations
      .filter((f) => f.status === 'available' && f.latitude && f.longitude)
      .map((f) => ({
        id: f.id,
        category: 'food' as const,
        title: f.foodType,
        subtitle: `${f.pickupLocation} • ${f.approxMeals} meals`,
        latitude: f.latitude!,
        longitude: f.longitude!,
        distanceKm: user?.latitude && user?.longitude && f.latitude && f.longitude
          ? calculateHaversineDistance(user.latitude, user.longitude, f.latitude, f.longitude)
          : undefined,
        badge: `${f.approxMeals} meals`,
        linkUrl: `/services/${f.id}`,
      })),
  ].filter((item) => (activeCategory === 'subscriptions' ? true : item.category === activeCategory));

  // Form states for Create modal
  const [ticketForm, setTicketForm] = useState({
    title: '',
    eventType: 'movie' as 'movie' | 'concert' | 'cricket' | 'theater' | 'other',
    venue: '',
    city: user?.location || 'Chennai',
    date: '',
    time: '',
    seats: '',
    quantity: 1,
    originalPrice: 500,
    sellingPrice: 500,
    proofDocument: '',
    notes: '',
  });

  const [rideForm, setRideForm] = useState({
    origin: user?.location || '',
    destination: '',
    date: '',
    time: '',
    seatsTotal: 3,
    seatsAvailable: 3,
    pricePerSeat: 150,
    vehicleModel: '',
    genderPreference: 'Everyone' as 'Everyone' | 'Women only' | 'Women preferred',
    notes: '',
  });

  const [bloodForm, setBloodForm] = useState({
    patientName: '',
    bloodGroup: 'O-' as 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-',
    unitsRequired: 1,
    hospital: '',
    location: user?.location || '',
    urgency: 'Immediate (Critical)' as 'Immediate (Critical)' | 'Within 4 Hours' | 'Within 24 Hours',
    requiredBefore: '',
    attenderContact: user?.phone || '',
    notes: '',
  });

  const [foodForm, setFoodForm] = useState({
    foodType: 'Cooked Meals' as 'Cooked Meals' | 'Packaged Food' | 'Bakery & Bread' | 'Produce & Groceries',
    dietaryType: 'Vegetarian' as 'Vegetarian' | 'Non-Vegetarian' | 'Vegan',
    approxMeals: 25,
    cookedTime: 'Today, 1:00 PM',
    pickupDeadline: 'Today, 6:00 PM',
    pickupLocation: user?.location || '',
    notes: '',
    donorType: 'Individual Donor' as 'Restaurant' | 'Event Hall' | 'Caterer' | 'Individual Donor' | 'Hotel',
  });

  const [subForm, setSubForm] = useState({
    serviceName: 'Spotify Family',
    totalSlots: 6,
    monthlyShare: 40,
    billingCycle: '1st of every month',
    description: 'Official family invitation link sent via email. No password sharing required.',
  });

  // Sync tab from URL query param
  useEffect(() => {
    const tabParam = searchParams.get('tab') as ServiceCategory | null;
    if (tabParam && TABS.find((t) => t.id === tabParam)) {
      setActiveCategory(tabParam);
      setSubTab('available');
    }
  }, [searchParams, setActiveCategory]);

  useEffect(() => {
    setSubTab('available');
  }, [activeCategory]);

  // SMART SEARCH: Rule-based intent parser
  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
    setSearchQuery(val);

    const q = val.toLowerCase();
    if (q.includes('blood') || q.includes('donor') || q.includes('o-') || q.includes('a+') || q.includes('b-') || q.includes('hospital')) {
      setActiveCategory('blood');
    } else if (q.includes('ride') || q.includes('carpool') || q.includes('travel') || q.includes('lift')) {
      setActiveCategory('rides');
    } else if (q.includes('ticket') || q.includes('movie') || q.includes('concert') || q.includes('match') || q.includes('coldplay')) {
      setActiveCategory('tickets');
    } else if (q.includes('food') || q.includes('meal') || q.includes('ngo') || q.includes('hunger') || q.includes('excess')) {
      setActiveCategory('food');
    } else if (q.includes('sub') || q.includes('spotify') || q.includes('netflix') || q.includes('youtube') || q.includes('prime')) {
      setActiveCategory('subscriptions');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    // 1. Validate form according to activeCategory
    if (activeCategory === 'tickets') {
      if (!ticketForm.title.trim()) {
        setCreateError('Movie / Event Name is required.');
        return;
      }
      if (!ticketForm.sellingPrice && ticketForm.sellingPrice !== 0) {
        setCreateError('Selling price is required.');
        return;
      }
    } else if (activeCategory === 'rides') {
      if (!rideForm.origin.trim() || !rideForm.destination.trim()) {
        setCreateError('Origin and Destination are required.');
        return;
      }
    } else if (activeCategory === 'blood') {
      if (!bloodForm.patientName.trim()) {
        setCreateError('Patient name is required.');
        return;
      }
      if (!bloodForm.hospital.trim()) {
        setCreateError('Hospital name is required.');
        return;
      }
      if (!bloodForm.location.trim()) {
        setCreateError('Hospital locality is required.');
        return;
      }
      if (!bloodForm.attenderContact.trim()) {
        setCreateError('Attender phone number is required.');
        return;
      }
    } else if (activeCategory === 'food') {
      if (!foodForm.pickupLocation.trim()) {
        setCreateError('Pickup location is required.');
        return;
      }
    } else if (activeCategory === 'subscriptions') {
      if (!subForm.serviceName.trim()) {
        setCreateError('Service name is required.');
        return;
      }
    }

    // 2. Get authenticated Supabase session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('[SUPABASE AUTH SESSION ERROR]', sessionError);
      setCreateError(sessionError.message || 'Error fetching authentication session.');
      return;
    }

    let authUserId: string | undefined = sessionData?.session?.user?.id;
    if (!authUserId) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.id) {
          authUserId = userData.user.id;
        }
      } catch (uErr) {
        console.warn('[SubShare] getUser error:', uErr);
      }
    }

    console.log('[SubShare] auth user id:', authUserId);
    console.log('[SubShare] zustand user id:', user?.id);

    if (!authUserId) {
      console.error('[AUTH ERROR] No active authenticated session found');
      setCreateError('No authenticated user session found. Please sign in to publish to network.');
      return;
    }

    // STRICT: Always use the verified auth.users id from session, never stale Zustand state
    const currentUserId = authUserId;

    // Sync Zustand store if it had a stale or mismatched ID
    if (user && user.id !== authUserId) {
      console.log('[SubShare] Syncing stale Zustand user id from', user.id, 'to', authUserId);
      useAuthStore.getState().updateProfile({ id: authUserId });
    }

    setIsSubmitting(true);

    try {
      // 3. Build database payload & 4. Supabase INSERT & 5. Check error
      if (activeCategory === 'tickets') {
        const qty = Number(ticketForm.quantity) || 1;
        const payload = {
          user_id: currentUserId,
          event_name: ticketForm.title.trim(),
          event_type: ticketForm.eventType || 'other',
          venue: ticketForm.venue.trim() || null,
          event_date: safeDate(ticketForm.date),
          event_time: safeTime(ticketForm.time),
          seat_number: ticketForm.seats.trim() || null,
          quantity: qty,
          original_price: Number(ticketForm.originalPrice) || 0,
          selling_price: Number(ticketForm.sellingPrice) || 0,
          transfer_method: 'In-App Handover',
          status: 'active',
        };

        console.log('[SubShare] ticket payload user_id:', payload.user_id);

        const { data: insertedData, error: insertError } = await supabase
          .from('tickets')
          .insert(payload)
          .select();

        if (insertError) {
          console.error('[SUPABASE INSERT ERROR: tickets]', insertError);
          setCreateError(insertError.message || 'Failed to insert ticket into database.');
          return;
        }

        // Update Zustand/local state ONLY after successful insert
        await fetchFromSupabase();
        setActionSuccess('Ticket listing published successfully!');
      } else if (activeCategory === 'rides') {
        const availSeats = Number(rideForm.seatsAvailable) || 3;
        const totSeats = Number(rideForm.seatsTotal) || 3;
        const payload = {
          user_id: currentUserId,
          pickup_location: rideForm.origin.trim(),
          destination: rideForm.destination.trim(),
          departure_date: safeDate(rideForm.date) || new Date().toISOString().split('T')[0],
          departure_time: safeTime(rideForm.time),
          available_seats: availSeats,
          total_seats: totSeats,
          price_per_person: Number(rideForm.pricePerSeat) || 0,
          vehicle_type: rideForm.vehicleModel.trim() || 'Car',
          gender_preference: rideForm.genderPreference === 'Women only' ? 'female' : 'anyone',
          status: 'active',
        };

        console.log('[SubShare] ride payload user_id:', payload.user_id);

        const { data: insertedData, error: insertError } = await supabase
          .from('rides')
          .insert(payload)
          .select();

        if (insertError) {
          console.error('[SUPABASE INSERT ERROR: rides]', insertError);
          setCreateError(insertError.message || 'Failed to insert ride into database.');
          return;
        }

        // Update Zustand/local state ONLY after successful insert
        await fetchFromSupabase();
        setActionSuccess('Carpool ride published successfully!');
      } else if (activeCategory === 'blood') {
        const units = Number(bloodForm.unitsRequired) || 1;
        const payload = {
          user_id: currentUserId,
          blood_group: bloodForm.bloodGroup || 'O+',
          units_needed: units,
          hospital_name: bloodForm.hospital.trim(),
          hospital_location: bloodForm.location.trim() || null,
          contact_person: bloodForm.patientName.trim(),
          contact_phone: bloodForm.attenderContact.trim() || null,
          reason: bloodForm.notes.trim() || 'Urgent Requirement',
          urgency: bloodForm.urgency.toLowerCase().includes('immediate') ? 'critical' : 'normal',
          required_before: bloodForm.requiredBefore ? new Date().toISOString() : null,
          status: 'active',
        };

        console.log('[SubShare] blood payload user_id:', payload.user_id);

        const { data: insertedData, error: insertError } = await supabase
          .from('blood_requests')
          .insert(payload)
          .select();

        if (insertError) {
          console.error('[SUPABASE INSERT ERROR: blood_requests]', insertError);
          setCreateError(insertError.message || 'Failed to insert blood request into database.');
          return;
        }

        // Update Zustand/local state ONLY after successful insert
        await fetchFromSupabase();
        setActionSuccess('Emergency Blood SOS posted to nearby network.');
      } else if (activeCategory === 'food') {
        const meals = Number(foodForm.approxMeals) || 10;
        const payload = {
          user_id: currentUserId,
          food_type: foodForm.foodType || 'Cooked Meals',
          is_vegetarian: foodForm.dietaryType === 'Vegetarian',
          meals_count: meals,
          cooked_time: new Date().toISOString(),
          pickup_deadline: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
          pickup_location: foodForm.pickupLocation.trim(),
          description: foodForm.notes.trim() || null,
          status: 'active',
        };

        console.log('[SubShare] food payload user_id:', payload.user_id);

        const { data: insertedData, error: insertError } = await supabase
          .from('food_donations')
          .insert(payload)
          .select();

        if (insertError) {
          console.error('[SUPABASE INSERT ERROR: food_donations]', insertError);
          setCreateError(insertError.message || 'Failed to insert food donation into database.');
          return;
        }

        // Update Zustand/local state ONLY after successful insert
        await fetchFromSupabase();
        setActionSuccess('Food donation registered for NGO pickup.');
      } else if (activeCategory === 'subscriptions') {
        const totalSlots = Number(subForm.totalSlots) || 4;
        const monthlyShare = Number(subForm.monthlyShare) || 0;
        const payload = {
          owner_id: currentUserId,
          service_name: subForm.serviceName.trim(),
          plan_type: 'Family Plan',
          max_members: totalSlots,
          current_members: 1,
          monthly_share: monthlyShare,
          billing_cycle: subForm.billingCycle || 'monthly',
          is_private: true,
          status: 'active',
        };

        console.log('[SubShare] subscription payload owner_id:', payload.owner_id);

        const { data: insertedData, error: insertError } = await supabase
          .from('subscription_groups')
          .insert(payload)
          .select();

        if (insertError) {
          console.error('[SUPABASE INSERT ERROR: subscription_groups]', insertError);
          setCreateError(insertError.message || 'Failed to insert subscription group into database.');
          return;
        }

        // Update Zustand/local state ONLY after successful insert
        await fetchFromSupabase();
        setActionSuccess('Subscription sharing group created.');
      }

      // Close modal and switch subtab ONLY after success
      setShowCreateModal(false);
      setSubTab('available');
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      console.error('[UNEXPECTED ERROR IN PUBLISH HANDLER]', err);
      setCreateError(err.message || 'An unexpected error occurred while publishing listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabColors: Record<ServiceCategory, string> = {
    tickets: 'text-blue-600 bg-blue-50 border-blue-200',
    rides: 'text-violet-600 bg-violet-50 border-violet-200',
    blood: 'text-rose-600 bg-rose-50 border-rose-200',
    food: 'text-amber-600 bg-amber-50 border-amber-200',
    subscriptions: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  };

  return (
    <div className="flex flex-col min-h-full bg-[#F6F8FB] relative">
      {/* Sticky Search & Tab Navigation Header */}
      <div className="sticky top-14 z-20 bg-white border-b border-slate-100 px-4 pt-3 pb-2 shadow-2xs">
        {/* Smart Search Bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-slate-100 rounded-xl px-3 h-10 border border-slate-200/60 focus-within:border-primary focus-within:bg-white transition-all">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search or ask intent (e.g. 'O- blood near me', 'Ride to Trichy')"
              className="flex-1 bg-transparent text-xs text-slate-900 placeholder-slate-400 outline-none font-medium"
            />
            {localSearch && (
              <button onClick={() => handleSearchChange('')} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 5 Category Navigation Tabs */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pt-2.5 pb-0.5 -mx-1 px-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex-shrink-0 ${
                activeCategory === id
                  ? tabColors[id]
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {id === 'blood' && bloodRequests.some((b) => b.status === 'urgent') && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 ml-0.5 animate-ping" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Location Access & Radius Controls Bar */}
      <div className="bg-slate-50 border-b border-slate-200/80 px-4 py-2.5 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          {/* Location button / status */}
          <button
            onClick={handleDetectLocation}
            disabled={isDetectingLocation}
            className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-primary font-semibold truncate max-w-[200px] sm:max-w-xs transition-colors"
            title="Click to detect or refresh GPS location"
          >
            <Navigation className={`w-3.5 h-3.5 text-primary shrink-0 ${isDetectingLocation ? 'animate-spin' : ''}`} />
            <span className="truncate">
              {isDetectingLocation ? 'Detecting GPS...' : user?.location || 'Set GPS Location'}
            </span>
          </button>

          {/* List / Map View Toggle */}
          <div className="flex items-center bg-white rounded-xl border border-slate-200 p-0.5 shadow-2xs">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'map'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Map</span>
            </button>
          </div>
        </div>

        {/* Radius Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pt-0.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Radius:
          </span>
          {[
            { label: 'All', value: null },
            { label: '2 km', value: 2 },
            { label: '5 km', value: 5 },
            { label: '10 km', value: 10 },
            { label: '25 km', value: 25 },
            { label: '50 km', value: 50 },
          ].map(({ label, value }) => (
            <button
              key={label}
              onClick={() => setRadiusKm(value)}
              className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-all shrink-0 ${
                radiusKm === value
                  ? 'bg-primary text-white border-primary shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {locationError && (
        <div className="mx-4 mt-2 px-3.5 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{locationError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="mx-4 mt-2 px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* MAP VIEW OR LIST VIEW */}
      {viewMode === 'map' ? (
        <div className="px-4 py-3 pb-28 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              {mapItems.length} nearby {activeCategory} within {radiusKm ? `${radiusKm} km` : 'any distance'}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Interactive GPS map</span>
          </div>
          <ServiceMapView
            userLat={user?.latitude}
            userLon={user?.longitude}
            radiusKm={radiusKm}
            items={mapItems}
            onDetectLocation={handleDetectLocation}
            isDetectingLocation={isDetectingLocation}
          />
        </div>
      ) : (
        <>
          {/* Sub-Tab Navigation */}
          <div className="px-4 pt-4 pb-1 flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSubTab('available')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                subTab === 'available' ? 'bg-slate-800 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {activeCategory === 'blood' ? 'Urgent Requests' : activeCategory === 'food' ? 'Available Donations' : activeCategory === 'subscriptions' ? 'Available Groups' : 'Available'}
            </button>
            <button
              onClick={() => setSubTab('mine')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                subTab === 'mine' ? 'bg-slate-800 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {activeCategory === 'blood' ? 'All Requests' : activeCategory === 'food' ? 'My Donations' : activeCategory === 'subscriptions' ? 'My Groups' : activeCategory === 'rides' ? 'My Rides' : 'My Listings'}
            </button>
            <button
              onClick={() => setSubTab('requests')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                subTab === 'requests' ? 'bg-slate-800 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {activeCategory === 'blood' ? 'My Requests' : activeCategory === 'food' ? 'Accepted Donations' : activeCategory === 'subscriptions' ? 'Requests' : 'My Requests'}
            </button>
          </div>

          {/* Main Listings Feed */}
      <div className="px-4 flex flex-col gap-3 pb-24 mt-2">
        {/* ══════════════════════════════════════════════
            1. TICKETS MODULE
           ══════════════════════════════════════════════ */}
        {activeCategory === 'tickets' && (
          <>
            {/* 1A: Available SubTab */}
            {subTab === 'available' && (
              tickets.filter((t) => t.status === 'available').length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-2xs my-4">
                  <Ticket className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h3 className="font-bold text-slate-800 text-sm">
                    {searchQuery ? 'No matching results found.' : 'No tickets available nearby'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Have extra movie, cricket, or concert passes? List them at face value for verified peers.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 inline-flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    Create Ticket Listing
                  </button>
                </div>
              ) : (
                tickets
                  .filter((t) => t.status === 'available' && (!searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase())) && isWithinRadius(t.latitude, t.longitude))
                  .map((ticket) => {
                    const dist = formatProximity(user?.latitude, user?.longitude, ticket.latitude, ticket.longitude, `${ticket.venue}, ${ticket.city}`);
                    return (
                      <Link
                        key={ticket.id}
                        to={`/services/${ticket.id}`}
                        className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden active:scale-[0.98] transition-transform"
                      >
                        <div className="relative">
                          <img src={ticket.image} alt={ticket.title} className="w-full h-36 object-cover" />
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 rounded-full px-2 py-0.5 border border-blue-100">
                                {ticket.eventType}
                              </span>
                              <h3 className="font-bold text-slate-900 text-sm mt-1.5 leading-snug">{ticket.title}</h3>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-base font-black text-slate-900">₹{ticket.sellingPrice.toLocaleString()}</div>
                              <div className="text-[10px] text-slate-400">per ticket</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate">{ticket.venue}, {ticket.city}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{ticket.date} • {ticket.time}</span>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                            <div className="flex items-center gap-2">
                              <img
                                src={ticket.sellerAvatar}
                                alt={ticket.sellerName}
                                className="w-6 h-6 rounded-full object-cover border border-slate-200"
                              />
                              <span className="text-xs font-semibold text-slate-700">{ticket.sellerName}</span>
                              <TrustScoreBadge score={ticket.sellerTrustScore} size="sm" showLabel={false} />
                            </div>
                            <DistancePill distance={dist} size="sm" />
                          </div>
                        </div>
                      </Link>
                    );
                  })
              )
            )}

            {/* 1B: My Listings SubTab */}
            {subTab === 'mine' && (
              tickets.filter((t) => t.sellerId === user?.id).length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-2xs my-4">
                  <Ticket className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h3 className="font-bold text-slate-800 text-sm">You haven't created any listings yet.</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Publish tickets at face-value to exchange safely with verified peers.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 inline-flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    + Create Ticket Listing
                  </button>
                </div>
              ) : (
                tickets
                  .filter((t) => t.sellerId === user?.id)
                  .map((t) => {
                    const reqs = ticketRequests.filter((r) => r.ticketId === t.id);
                    return (
                      <div key={t.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                              {t.eventType}
                            </span>
                            <h3 className="font-bold text-slate-900 text-sm mt-1">{t.title}</h3>
                            <p className="text-xs text-slate-500">{t.venue} • {t.date}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-sm text-slate-900">₹{t.sellingPrice}</span>
                            <div className="mt-1">
                              <StatusPill status={t.status.toUpperCase()} variant={t.status === 'sold' ? 'neutral' : 'success'} size="sm" />
                            </div>
                          </div>
                        </div>

                        {/* Incoming requests */}
                        <div className="pt-2 border-t border-slate-100">
                          <p className="text-[11px] font-bold text-slate-600 mb-2">
                            Incoming Buyer Requests ({reqs.length})
                          </p>
                          {reqs.length === 0 ? (
                            <p className="text-xs text-slate-400">No buyer requests received yet.</p>
                          ) : (
                            <div className="space-y-2">
                              {reqs.map((req) => (
                                <div key={req.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                                  <div>
                                    <span className="font-bold text-xs text-slate-900">{req.buyerName}</span>
                                    <p className="text-[11px] text-slate-500">{req.quantity}x ticket(s) • ₹{req.totalAmount}</p>
                                  </div>
                                  {req.status === 'PENDING' ? (
                                    <div className="flex gap-1.5">
                                      <button
                                        onClick={() => acceptTicketRequest(req.id)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                                      >
                                        <Check className="w-3 h-3" /> Accept
                                      </button>
                                      <button
                                        onClick={() => rejectTicketRequest(req.id)}
                                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold px-2 py-1.5 rounded-lg"
                                      >
                                        <X className="w-3 h-3" /> Reject
                                      </button>
                                    </div>
                                  ) : (
                                    <span className={`text-xs font-bold ${req.status === 'ACCEPTED' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                      {req.status === 'ACCEPTED' ? '✓ Accepted' : 'Declined'}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
              )
            )}

            {/* 1C: My Requests SubTab */}
            {subTab === 'requests' && (
              ticketRequests.filter((r) => r.buyerId === user?.id).length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-2xs my-4">
                  <Ticket className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h3 className="font-bold text-slate-800 text-sm">No requests yet.</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Explore available tickets and request a face-value peer handover.
                  </p>
                  <button
                    onClick={() => setSubTab('available')}
                    className="mt-4 inline-flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs"
                  >
                    Browse Available Tickets
                  </button>
                </div>
              ) : (
                ticketRequests
                  .filter((r) => r.buyerId === user?.id)
                  .map((req) => (
                    <div key={req.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{req.ticketTitle}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{req.quantity} ticket(s) • Total: ₹{req.totalAmount}</p>
                        </div>
                        <StatusPill
                          status={req.status === 'PENDING' ? 'Awaiting Seller' : req.status === 'ACCEPTED' ? 'Accepted ✓' : 'Declined'}
                          variant={req.status === 'ACCEPTED' ? 'success' : req.status === 'PENDING' ? 'warning' : 'error'}
                          size="sm"
                        />
                      </div>
                      {req.status === 'ACCEPTED' && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                          <span className="text-xs text-emerald-700 font-semibold">Escrow Active</span>
                          <Link to="/activity" className="text-xs font-bold text-primary hover:underline">
                            View in Activity →
                          </Link>
                        </div>
                      )}
                    </div>
                  ))
              )
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════
            2. RIDES MODULE
           ══════════════════════════════════════════════ */}
        {activeCategory === 'rides' && (
          <>
            {/* 2A: Available SubTab */}
            {subTab === 'available' && (
              rides.filter((r) => (r.seatsAvailable ?? 0) > 0).length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-2xs my-4">
                  <Car className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h3 className="font-bold text-slate-800 text-sm">
                    {searchQuery ? 'No matching results found.' : 'No carpools available nearby'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Traveling somewhere? Publish your empty seats to share fuel costs with peers.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 inline-flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    Publish a Ride
                  </button>
                </div>
              ) : (
                rides
                  .filter((r) => (r.seatsAvailable ?? 0) > 0 && (!searchQuery || `${r.origin} ${r.destination}`.toLowerCase().includes(searchQuery.toLowerCase())) && isWithinRadius(r.latitude, r.longitude))
                  .map((ride) => {
                    const dist = formatProximity(user?.latitude, user?.longitude, ride.latitude, ride.longitude, ride.origin);
                    return (
                      <Link
                        key={ride.id}
                        to={`/services/${ride.id}`}
                        className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-4 active:scale-[0.98] transition-transform"
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 bg-violet-50 rounded-full px-2 py-0.5 border border-violet-100">
                                Carpool
                              </span>
                              {ride.genderPreference !== 'Everyone' && (
                                <span className="text-[10px] font-bold text-pink-600 bg-pink-50 rounded-full px-2 py-0.5 border border-pink-100">
                                  {ride.genderPreference}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                                <span className="text-sm font-bold text-slate-900 truncate">{ride.origin}</span>
                              </div>
                              <div className="ml-1 w-px h-3 bg-slate-200" />
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                                <span className="text-sm font-bold text-slate-900 truncate">{ride.destination}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-base font-black text-slate-900">₹{ride.pricePerSeat}</div>
                            <div className="text-[10px] text-slate-400">per seat</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {ride.date} {ride.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {ride.seatsAvailable} of {ride.seatsTotal} seats free
                          </span>
                          <DistancePill distance={dist} size="sm" />
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                          <div className="flex items-center gap-2">
                            <img
                              src={ride.driverAvatar}
                              alt={ride.driverName}
                              className="w-6 h-6 rounded-full object-cover border border-slate-200"
                            />
                            <span className="text-xs font-semibold text-slate-700">{ride.driverName}</span>
                            <TrustScoreBadge score={ride.driverTrustScore} size="sm" showLabel={false} />
                          </div>
                          <span className="text-xs text-slate-500 font-medium truncate">{ride.vehicleModel}</span>
                        </div>
                      </Link>
                    );
                  })
              )
            )}

            {/* 2B: My Rides SubTab */}
            {subTab === 'mine' && (
              rides.filter((r) => r.driverId === user?.id).length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-2xs my-4">
                  <Car className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h3 className="font-bold text-slate-800 text-sm">You haven't created any listings yet.</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Publish your commute or outstation carpool to connect with passengers.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 inline-flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    + Publish a Ride
                  </button>
                </div>
              ) : (
                rides
                  .filter((r) => r.driverId === user?.id)
                  .map((r) => {
                    const reqs = rideRequests.filter((rq) => rq.rideId === r.id);
                    return (
                      <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-sm font-bold text-slate-900">{r.origin} → {r.destination}</span>
                            <p className="text-xs text-slate-500 mt-0.5">{r.date} at {r.time} • {r.vehicleModel}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-sm text-slate-900">₹{r.pricePerSeat}</span>
                            <p className="text-[11px] font-bold text-emerald-600">{r.seatsAvailable} seats free</p>
                          </div>
                        </div>

                        {/* Passenger booking requests */}
                        <div className="pt-2 border-t border-slate-100">
                          <p className="text-[11px] font-bold text-slate-600 mb-2">
                            Passenger Requests ({reqs.length})
                          </p>
                          {reqs.length === 0 ? (
                            <p className="text-xs text-slate-400">No passenger seat requests yet.</p>
                          ) : (
                            <div className="space-y-2">
                              {reqs.map((req) => (
                                <div key={req.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                                  <div>
                                    <span className="font-bold text-xs text-slate-900">{req.passengerName}</span>
                                    <p className="text-[11px] text-slate-500">{req.seatsRequested} seat(s) requested</p>
                                  </div>
                                  {req.status === 'PENDING' ? (
                                    <div className="flex gap-1.5">
                                      <button
                                        onClick={() => acceptRideRequest(req.id)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                                      >
                                        <Check className="w-3 h-3" /> Accept
                                      </button>
                                      <button
                                        onClick={() => rejectRideRequest(req.id)}
                                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold px-2 py-1.5 rounded-lg"
                                      >
                                        <X className="w-3 h-3" /> Decline
                                      </button>
                                    </div>
                                  ) : (
                                    <span className={`text-xs font-bold ${req.status === 'ACCEPTED' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                      {req.status === 'ACCEPTED' ? '✓ Accepted • Seat Reserved' : 'Declined'}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
              )
            )}

            {/* 2C: My Requests SubTab */}
            {subTab === 'requests' && (
              rideRequests.filter((rq) => rq.passengerId === user?.id).length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-2xs my-4">
                  <Car className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h3 className="font-bold text-slate-800 text-sm">No requests yet.</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Browse open routes and book a seat with a verified driver.
                  </p>
                  <button
                    onClick={() => setSubTab('available')}
                    className="mt-4 inline-flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs"
                  >
                    Browse Available Rides
                  </button>
                </div>
              ) : (
                rideRequests
                  .filter((rq) => rq.passengerId === user?.id)
                  .map((rq) => (
                    <div key={rq.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">Ride Booking #{rq.rideId.slice(-6)}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{rq.seatsRequested} seat(s) requested</p>
                        </div>
                        <StatusPill
                          status={rq.status === 'PENDING' ? 'Driver Reviewing' : rq.status === 'ACCEPTED' ? 'Confirmed ✓' : 'Declined'}
                          variant={rq.status === 'ACCEPTED' ? 'success' : rq.status === 'PENDING' ? 'warning' : 'error'}
                          size="sm"
                        />
                      </div>
                      {rq.status === 'ACCEPTED' && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                          <span className="text-xs text-emerald-700 font-semibold">Seat Confirmed by Driver</span>
                          <Link to="/activity" className="text-xs font-bold text-primary hover:underline">
                            View in Activity →
                          </Link>
                        </div>
                      )}
                    </div>
                  ))
              )
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════
            3. BLOOD DONATION MODULE
           ══════════════════════════════════════════════ */}
        {activeCategory === 'blood' && (
          <>
            {/* Mandatory Medical Disclaimer */}
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-rose-900 leading-relaxed font-medium">
                <strong>Medical Disclaimer:</strong> Final donor eligibility is determined strictly on-site by the hospital/blood bank medical staff. SubShare facilitates emergency community matching only.
              </p>
            </div>

            {/* 3A: Urgent Requests SubTab */}
            {subTab === 'available' && (
              bloodRequests.filter((b) => b.status === 'urgent').length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-2xs my-4">
                  <HeartHandshake className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h3 className="font-bold text-slate-800 text-sm">
                    {searchQuery ? 'No matching results found.' : 'No critical urgent blood requests right now'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    All emergency requirements are currently attended to. You can post a new emergency request anytime.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 inline-flex items-center gap-1.5 bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    Post Emergency Blood Request
                  </button>
                </div>
              ) : (
                bloodRequests
                  .filter((b) => b.status === 'urgent' && (!searchQuery || `${b.bloodGroup} ${b.hospital} ${b.patientName}`.toLowerCase().includes(searchQuery.toLowerCase())))
                  .map((req) => (
                    <Link
                      key={req.id}
                      to={`/services/${req.id}`}
                      className="rounded-2xl border bg-rose-50/50 border-rose-200 shadow-2xs p-4 active:scale-[0.98] transition-transform"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl font-black text-rose-600">{req.bloodGroup}</span>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-100 rounded-full px-2 py-0.5 border border-rose-200 animate-pulse">
                              <Flame className="w-3 h-3" /> URGENT
                            </span>
                          </div>
                          <p className="text-sm font-bold text-slate-900">{req.patientName}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{req.hospital} • {req.location}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-slate-900">{req.unitsRequired} units</div>
                          <div className="text-[10px] text-slate-500">
                            {req.unitsFulfilled > 0 ? `${req.unitsFulfilled} responded` : 'needed'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 mt-3 flex-wrap">
                        <StatusPill status={req.urgency} variant="error" size="sm" />
                        <DistancePill distance={req.distance} size="sm" />
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Before {req.requiredBefore}
                        </span>
                      </div>
                    </Link>
                  ))
              )
            )}

            {/* 3B: All Requests SubTab */}
            {subTab === 'mine' && (
              bloodRequests.filter((b) => b.requesterId === user?.id).length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-2xs my-4">
                  <HeartHandshake className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h3 className="font-bold text-slate-800 text-sm">You haven't created any listings yet.</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Post emergency blood requirements to alert compatible donors nearby.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 inline-flex items-center gap-1.5 bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    + Post Blood Request
                  </button>
                </div>
              ) : (
                bloodRequests
                  .filter((req) => isWithinRadius(req.latitude, req.longitude))
                  .map((req) => (
                  <Link
                    key={req.id}
                    to={`/services/${req.id}`}
                    className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-4 active:scale-[0.98] transition-transform"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-xl font-black text-slate-900 mr-2">{req.bloodGroup}</span>
                        <span className="text-sm font-bold text-slate-900">{req.patientName}</span>
                        <p className="text-xs text-slate-500 mt-0.5">{req.hospital} • {req.location}</p>
                      </div>
                      <span className="text-xs font-black text-slate-900">{req.unitsRequired} units</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <StatusPill status={req.urgency} variant={req.status === 'urgent' ? 'error' : 'warning'} size="sm" />
                      <span className="text-xs text-slate-500">Before {req.requiredBefore}</span>
                    </div>
                  </Link>
                ))
              )
            )}

            {/* 3C: My Requests SubTab */}
            {subTab === 'requests' && (
              bloodRequests.filter((b) => b.requesterId === user?.id).length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-2xs my-4">
                  <HeartHandshake className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h3 className="font-bold text-slate-800 text-sm">No requests yet.</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    In an emergency, post patient and hospital details to alert nearby matched donors.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 inline-flex items-center gap-1.5 bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs"
                  >
                    + Post Blood Request
                  </button>
                </div>
              ) : (
                bloodRequests
                  .filter((b) => b.requesterId === user?.id)
                  .map((b) => {
                    const responses = bloodResponses.filter((r) => r.bloodRequestId === b.id && r.status === 'can_help');
                    return (
                      <div key={b.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-2xl font-black text-rose-600 mr-2">{b.bloodGroup}</span>
                            <span className="font-bold text-slate-900 text-sm">{b.patientName}</span>
                            <p className="text-xs text-slate-500 mt-0.5">{b.hospital}</p>
                          </div>
                          <StatusPill status={b.status.toUpperCase()} variant={b.status === 'urgent' ? 'error' : 'primary'} size="sm" />
                        </div>
                        <div className="pt-2 border-t border-slate-100">
                          <p className="text-[11px] font-bold text-slate-600 mb-1.5">
                            Confirmed Donors ({responses.length})
                          </p>
                          {responses.length === 0 ? (
                            <p className="text-xs text-slate-400">Awaiting donor responses.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {responses.map((resp) => (
                                <div key={resp.id} className="bg-rose-50 p-2 rounded-xl flex items-center justify-between text-xs">
                                  <span className="font-bold text-slate-900">{resp.donorName} ({resp.donorPhone})</span>
                                  <Link to={`/services/${b.id}`} className="text-primary font-bold hover:underline">
                                    View SOS →
                                  </Link>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
              )
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════
            4. FOOD DONATION MODULE
           ══════════════════════════════════════════════ */}
        {activeCategory === 'food' && (
          <>
            {/* 4A: Available SubTab */}
            {subTab === 'available' && (
              foodDonations.filter((f) => f.status === 'available').length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-2xs my-4">
                  <Utensils className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h3 className="font-bold text-slate-800 text-sm">
                    {searchQuery ? 'No matching results found.' : 'No food donations available nearby'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Have surplus cooked meals or groceries? Register a donation for verified NGOs.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 inline-flex items-center gap-1.5 bg-amber-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    Register Food Donation
                  </button>
                </div>
              ) : (
                foodDonations
                  .filter((f) => f.status === 'available' && (!searchQuery || `${f.donorName} ${f.foodType}`.toLowerCase().includes(searchQuery.toLowerCase())) && isWithinRadius(f.latitude, f.longitude))
                  .map((food) => {
                    const dist = formatProximity(user?.latitude, user?.longitude, food.latitude, food.longitude, food.pickupLocation);
                    return (
                      <Link
                        key={food.id}
                        to={`/services/${food.id}`}
                        className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden active:scale-[0.98] transition-transform"
                      >
                        <div className="relative">
                          <img src={food.image} alt={food.foodType} className="w-full h-28 object-cover" />
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex gap-1.5 mb-1.5">
                                <StatusPill
                                  status={food.dietaryType}
                                  variant={food.dietaryType === 'Vegetarian' ? 'success' : 'warning'}
                                  size="sm"
                                />
                                <StatusPill status={food.foodType} variant="primary" size="sm" />
                              </div>
                              <p className="font-bold text-slate-900 text-sm truncate">{food.donorName}</p>
                              <p className="text-xs text-slate-500">{food.donorType} • {food.pickupLocation}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-lg font-black text-emerald-600">{food.approxMeals}</div>
                              <div className="text-[10px] text-slate-400">approx meals</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                            <DistancePill distance={dist} size="sm" />
                            <span className="flex items-center gap-1 text-rose-600 font-semibold">
                              Pickup before {food.pickupDeadline}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })
              )
            )}

            {/* 4B: My Donations SubTab */}
            {subTab === 'mine' && (
              foodDonations.filter((f) => f.donorId === user?.id).length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-2xs my-4">
                  <Utensils className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h3 className="font-bold text-slate-800 text-sm">You haven't created any listings yet.</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Donate surplus prepared food to verified orphanages, shelters, and community kitchens.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 inline-flex items-center gap-1.5 bg-amber-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    + Register Food Donation
                  </button>
                </div>
              ) : (
                foodDonations
                  .filter((f) => f.donorId === user?.id)
                  .map((f) => (
                    <div key={f.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-slate-900 text-sm">{f.foodType} ({f.approxMeals} meals)</span>
                          <p className="text-xs text-slate-500">{f.pickupLocation} • Deadline: {f.pickupDeadline}</p>
                        </div>
                        <StatusPill status={f.status.toUpperCase()} variant="primary" size="sm" />
                      </div>
                      {f.assignedOrgName && (
                        <div className="p-2.5 bg-emerald-50 rounded-xl text-xs text-emerald-900 flex justify-between items-center">
                          <span>Claimed by: <strong>{f.assignedOrgName}</strong></span>
                          <Link to={`/services/${f.id}`} className="font-bold text-primary hover:underline">
                            View Details →
                          </Link>
                        </div>
                      )}
                    </div>
                  ))
              )
            )}

            {/* 4C: Accepted Donations SubTab */}
            {subTab === 'requests' && (
              foodDonations.filter((f) => f.status === 'scheduled' || f.status === 'picked_up' || f.status === 'completed').length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-2xs my-4">
                  <Utensils className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h3 className="font-bold text-slate-800 text-sm">No requests yet.</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Verified NGOs claim surplus food donations for distribution.
                  </p>
                </div>
              ) : (
                foodDonations
                  .filter((f) => f.status === 'scheduled' || f.status === 'picked_up' || f.status === 'completed')
                  .map((f) => (
                    <div key={f.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-slate-900 text-sm">{f.foodType} ({f.approxMeals} meals)</span>
                          <p className="text-xs text-slate-500">{f.pickupLocation}</p>
                        </div>
                        <StatusPill status={f.status.toUpperCase()} variant="success" size="sm" />
                      </div>
                      <p className="text-xs text-slate-600 mt-2">
                        Claimed by: <strong>{f.assignedOrgName || 'Verified Organization'}</strong>
                      </p>
                    </div>
                  ))
              )
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════
            5. SUBSCRIPTION SHARING MODULE
           ══════════════════════════════════════════════ */}
        {activeCategory === 'subscriptions' && (
          <>
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <p className="text-[11px] text-emerald-900 leading-snug font-medium">
                Official invitation-link sharing only. <strong>Never share or store passwords</strong> on SubShare.
              </p>
            </div>

            {/* 5A: Available Groups SubTab */}
            {subTab === 'available' && (
              subscriptions.filter((s) => (s.occupiedSlots ?? 0) < s.totalSlots).length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-2xs my-4">
                  <Share2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h3 className="font-bold text-slate-800 text-sm">
                    {searchQuery ? 'No matching results found.' : 'No subscription groups available'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Have open slots in Spotify Family, Netflix, or Canva Pro? Create a family sharing group.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    Create Subscription Group
                  </button>
                </div>
              ) : (
                subscriptions
                  .filter((s) => (s.occupiedSlots ?? 0) < s.totalSlots && (!searchQuery || s.serviceName.toLowerCase().includes(searchQuery.toLowerCase())))
                  .map((sub) => (
                    <Link
                      key={sub.id}
                      to={`/services/${sub.id}`}
                      className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-4 active:scale-[0.98] transition-transform"
                    >
                      <div className="flex items-center gap-3.5 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200 overflow-hidden p-2 flex-shrink-0">
                          <img src={sub.platformLogo} alt={sub.serviceName} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-slate-900 text-sm">{sub.serviceName}</p>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">Owner: {sub.ownerName}</p>
                          <TrustScoreBadge score={sub.ownerTrustScore} size="sm" showLabel={false} />
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-base font-black text-slate-900">₹{sub.monthlyShare}</div>
                          <div className="text-[10px] text-slate-400">/month</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <div className="flex gap-0.5">
                            {Array.from({ length: sub.totalSlots }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-3.5 h-1.5 rounded-full ${
                                  i < sub.occupiedSlots ? 'bg-primary' : 'bg-slate-100 border border-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-slate-500">
                            {sub.totalSlots - sub.occupiedSlots} free slot{sub.totalSlots - sub.occupiedSlots !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <StatusPill status="Official Invite" variant="success" size="sm" />
                      </div>
                    </Link>
                  ))
              )
            )}

            {/* 5B: My Groups SubTab */}
            {subTab === 'mine' && (
              subscriptions.filter((s) => s.ownerId === user?.id).length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-2xs my-4">
                  <Share2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h3 className="font-bold text-slate-800 text-sm">You haven't created any listings yet.</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Share unused slots in family subscriptions safely without password exchanges.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    + Create Group
                  </button>
                </div>
              ) : (
                subscriptions
                  .filter((s) => s.ownerId === user?.id)
                  .map((s) => {
                    const reqs = subscriptionRequests.filter((sr) => sr.groupId === s.id);
                    return (
                      <div key={s.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-900 text-sm">{s.serviceName}</span>
                            <p className="text-xs text-slate-500">{s.occupiedSlots} of {s.totalSlots} slots occupied • ₹{s.monthlyShare}/mo</p>
                          </div>
                        </div>

                        {/* Incoming join requests */}
                        <div className="pt-2 border-t border-slate-100">
                          <p className="text-[11px] font-bold text-slate-600 mb-2">
                            Member Join Requests ({reqs.length})
                          </p>
                          {reqs.length === 0 ? (
                            <p className="text-xs text-slate-400">No member join requests yet.</p>
                          ) : (
                            <div className="space-y-2">
                              {reqs.map((req) => (
                                <div key={req.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                                  <div>
                                    <span className="font-bold text-xs text-slate-900">{req.memberName}</span>
                                    <p className="text-[11px] text-slate-500">{req.memberEmail}</p>
                                  </div>
                                  {req.status === 'PENDING' ? (
                                    <div className="flex gap-1.5">
                                      <button
                                        onClick={() => approveSubscriptionMember(req.id)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                                      >
                                        <Check className="w-3 h-3" /> Approve
                                      </button>
                                      <button
                                        onClick={() => rejectSubscriptionMember(req.id)}
                                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold px-2 py-1.5 rounded-lg"
                                      >
                                        <X className="w-3 h-3" /> Reject
                                      </button>
                                    </div>
                                  ) : (
                                    <span className={`text-xs font-bold ${req.status === 'APPROVED' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                      {req.status === 'APPROVED' ? '✓ Approved' : 'Declined'}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
              )
            )}

            {/* 5C: Requests SubTab */}
            {subTab === 'requests' && (
              subscriptionRequests.filter((sr) => sr.memberId === user?.id).length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-2xs my-4">
                  <Share2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h3 className="font-bold text-slate-800 text-sm">No requests yet.</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Browse open groups to request an official family slot invite.
                  </p>
                  <button
                    onClick={() => setSubTab('available')}
                    className="mt-4 inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs"
                  >
                    Browse Available Groups
                  </button>
                </div>
              ) : (
                subscriptionRequests
                  .filter((sr) => sr.memberId === user?.id)
                  .map((sr) => (
                    <div key={sr.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">Subscription Group Request</h3>
                          <p className="text-xs text-slate-500 mt-0.5">Submitted by {sr.memberName}</p>
                        </div>
                        <StatusPill
                          status={sr.status === 'PENDING' ? 'Awaiting Owner' : sr.status === 'APPROVED' ? 'Approved ✓' : 'Declined'}
                          variant={sr.status === 'APPROVED' ? 'success' : sr.status === 'PENDING' ? 'warning' : 'error'}
                          size="sm"
                        />
                      </div>
                      {sr.status === 'APPROVED' && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                          <span className="text-xs text-emerald-700 font-semibold">Official Invite Ready</span>
                          <Link to="/chat" className="text-xs font-bold text-primary hover:underline">
                            Open Chat for Invite →
                          </Link>
                        </div>
                      )}
                    </div>
                  ))
              )
            )}
          </>
        )}
      </div>
        </>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-24 right-4 md:right-8 w-13 h-13 bg-primary rounded-full flex items-center justify-center shadow-xl shadow-blue-500/30 active:scale-95 transition-transform z-30 text-white"
        title="Create Listing or Request"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* CREATE MODAL FOR ALL 5 SERVICES */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {activeCategory === 'tickets' && 'Create Ticket Listing'}
                  {activeCategory === 'rides' && 'Publish Carpool Ride'}
                  {activeCategory === 'blood' && 'Post Emergency Blood Request'}
                  {activeCategory === 'food' && 'Register Food Donation'}
                  {activeCategory === 'subscriptions' && 'Create Subscription Group'}
                </h3>
                <p className="text-xs text-slate-500">Live active SubShare peer network</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {createError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="font-semibold">{createError}</span>
                </div>
              )}
              {/* 1. Ticket Form */}
              {activeCategory === 'tickets' && (
                <>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Movie / Event Name *</label>
                    <input
                      type="text"
                      required
                      value={ticketForm.title}
                      onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                      placeholder="e.g. Coolie (IMAX First Day) or Coldplay Mumbai"
                      className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Type</label>
                      <select
                        value={ticketForm.eventType}
                        onChange={(e) => setTicketForm({ ...ticketForm, eventType: e.target.value as any })}
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary bg-white"
                      >
                        <option value="movie">Movie</option>
                        <option value="cricket">Cricket</option>
                        <option value="concert">Concert</option>
                        <option value="theater">Theater</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Event Location / City *</label>
                      <input
                        type="text"
                        required
                        value={ticketForm.city}
                        onChange={(e) => setTicketForm({ ...ticketForm, city: e.target.value })}
                        placeholder="Chennai / Bengaluru"
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Venue *</label>
                    <input
                      type="text"
                      required
                      value={ticketForm.venue}
                      onChange={(e) => setTicketForm({ ...ticketForm, venue: e.target.value })}
                      placeholder="e.g. PVR INOX Luxe, Phoenix Marketcity"
                      className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Date *</label>
                      <input
                        type="text"
                        required
                        value={ticketForm.date}
                        onChange={(e) => setTicketForm({ ...ticketForm, date: e.target.value })}
                        placeholder="Friday, Oct 18"
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Time *</label>
                      <input
                        type="text"
                        required
                        value={ticketForm.time}
                        onChange={(e) => setTicketForm({ ...ticketForm, time: e.target.value })}
                        placeholder="04:30 AM"
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Seat Details</label>
                      <input
                        type="text"
                        value={ticketForm.seats}
                        onChange={(e) => setTicketForm({ ...ticketForm, seats: e.target.value })}
                        placeholder="Row J (Seats 14, 15)"
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        max="6"
                        value={ticketForm.quantity}
                        onChange={(e) => setTicketForm({ ...ticketForm, quantity: Number(e.target.value) })}
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Original Price (₹)</label>
                      <input
                        type="number"
                        value={ticketForm.originalPrice}
                        onChange={(e) => setTicketForm({ ...ticketForm, originalPrice: Number(e.target.value) })}
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Selling Price (₹) *</label>
                      <input
                        type="number"
                        required
                        value={ticketForm.sellingPrice}
                        onChange={(e) => setTicketForm({ ...ticketForm, sellingPrice: Number(e.target.value) })}
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary font-bold text-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Ticket Proof (Booking Screenshot / PDF)</label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setTicketForm({ ...ticketForm, proofDocument: file.name });
                      }}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Notes / Transfer Instructions</label>
                    <textarea
                      rows={2}
                      value={ticketForm.notes}
                      onChange={(e) => setTicketForm({ ...ticketForm, notes: e.target.value })}
                      placeholder="e.g. Official BookMyShow in-app account transfer"
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                    />
                  </div>
                </>
              )}

              {/* 2. Ride Form */}
              {activeCategory === 'rides' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Pickup (Origin) *</label>
                      <input
                        type="text"
                        required
                        value={rideForm.origin}
                        onChange={(e) => setRideForm({ ...rideForm, origin: e.target.value })}
                        placeholder="e.g. Koyambedu Chennai"
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Destination *</label>
                      <input
                        type="text"
                        required
                        value={rideForm.destination}
                        onChange={(e) => setRideForm({ ...rideForm, destination: e.target.value })}
                        placeholder="e.g. Trichy Central"
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Date *</label>
                      <input
                        type="text"
                        required
                        value={rideForm.date}
                        onChange={(e) => setRideForm({ ...rideForm, date: e.target.value })}
                        placeholder="Tomorrow, Oct 12"
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Time *</label>
                      <input
                        type="text"
                        required
                        value={rideForm.time}
                        onChange={(e) => setRideForm({ ...rideForm, time: e.target.value })}
                        placeholder="06:30 AM"
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Seats Total</label>
                      <input
                        type="number"
                        min="1"
                        max="6"
                        value={rideForm.seatsTotal}
                        onChange={(e) => setRideForm({ ...rideForm, seatsTotal: Number(e.target.value) })}
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Seats Free</label>
                      <input
                        type="number"
                        min="1"
                        max="6"
                        value={rideForm.seatsAvailable}
                        onChange={(e) => setRideForm({ ...rideForm, seatsAvailable: Number(e.target.value) })}
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Price / Seat (₹)</label>
                      <input
                        type="number"
                        value={rideForm.pricePerSeat}
                        onChange={(e) => setRideForm({ ...rideForm, pricePerSeat: Number(e.target.value) })}
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Vehicle Model *</label>
                    <input
                      type="text"
                      required
                      value={rideForm.vehicleModel}
                      onChange={(e) => setRideForm({ ...rideForm, vehicleModel: e.target.value })}
                      placeholder="e.g. Hyundai Creta (TN 45 BK 2049)"
                      className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Gender Preference</label>
                    <div className="flex gap-2">
                      {(['Everyone', 'Women only', 'Women preferred'] as const).map((pref) => (
                        <button
                          type="button"
                          key={pref}
                          onClick={() => setRideForm({ ...rideForm, genderPreference: pref })}
                          className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold border ${
                            rideForm.genderPreference === pref
                              ? 'border-violet-600 bg-violet-50 text-violet-700 font-bold'
                              : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          {pref}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Notes</label>
                    <textarea
                      rows={2}
                      value={rideForm.notes}
                      onChange={(e) => setRideForm({ ...rideForm, notes: e.target.value })}
                      placeholder="AC car, non-smoking, luggage space available"
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                    />
                  </div>
                </>
              )}

              {/* 3. Blood Form */}
              {activeCategory === 'blood' && (
                <>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Patient Name *</label>
                    <input
                      type="text"
                      required
                      value={bloodForm.patientName}
                      onChange={(e) => setBloodForm({ ...bloodForm, patientName: e.target.value })}
                      placeholder="e.g. V. Rajesh (Emergency Surgery)"
                      className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Blood Group *</label>
                      <select
                        value={bloodForm.bloodGroup}
                        onChange={(e) => setBloodForm({ ...bloodForm, bloodGroup: e.target.value as any })}
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary bg-white font-bold text-rose-600"
                      >
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((grp) => (
                          <option key={grp} value={grp}>{grp}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Units Required</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={bloodForm.unitsRequired}
                        onChange={(e) => setBloodForm({ ...bloodForm, unitsRequired: Number(e.target.value) })}
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Hospital Name *</label>
                    <input
                      type="text"
                      required
                      value={bloodForm.hospital}
                      onChange={(e) => setBloodForm({ ...bloodForm, hospital: e.target.value })}
                      placeholder="e.g. ABC Multi-Speciality Hospital (ICU Block 2)"
                      className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Hospital Locality *</label>
                    <input
                      type="text"
                      required
                      value={bloodForm.location}
                      onChange={(e) => setBloodForm({ ...bloodForm, location: e.target.value })}
                      placeholder="e.g. Trichy Main Road"
                      className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Required Before *</label>
                      <input
                        type="text"
                        required
                        value={bloodForm.requiredBefore}
                        onChange={(e) => setBloodForm({ ...bloodForm, requiredBefore: e.target.value })}
                        placeholder="Today, 8:30 PM"
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Attender Phone *</label>
                      <input
                        type="tel"
                        required
                        value={bloodForm.attenderContact}
                        onChange={(e) => setBloodForm({ ...bloodForm, attenderContact: e.target.value })}
                        placeholder="+91 94432 89012"
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Urgency</label>
                    <select
                      value={bloodForm.urgency}
                      onChange={(e) => setBloodForm({ ...bloodForm, urgency: e.target.value as any })}
                      className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary bg-white"
                    >
                      <option value="Immediate (Critical)">Immediate (Critical)</option>
                      <option value="Within 4 Hours">Within 4 Hours</option>
                      <option value="Within 24 Hours">Within 24 Hours</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Additional Details</label>
                    <textarea
                      rows={2}
                      value={bloodForm.notes}
                      onChange={(e) => setBloodForm({ ...bloodForm, notes: e.target.value })}
                      placeholder="Doctor name, token number, or blood bank counter"
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                    />
                  </div>
                </>
              )}

              {/* 4. Food Form */}
              {activeCategory === 'food' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Food Type</label>
                      <select
                        value={foodForm.foodType}
                        onChange={(e) => setFoodForm({ ...foodForm, foodType: e.target.value as any })}
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary bg-white"
                      >
                        <option value="Cooked Meals">Cooked Meals</option>
                        <option value="Packaged Food">Packaged Food</option>
                        <option value="Bakery & Bread">Bakery & Bread</option>
                        <option value="Produce & Groceries">Produce & Groceries</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Dietary Type</label>
                      <select
                        value={foodForm.dietaryType}
                        onChange={(e) => setFoodForm({ ...foodForm, dietaryType: e.target.value as any })}
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary bg-white"
                      >
                        <option value="Vegetarian">Vegetarian</option>
                        <option value="Non-Vegetarian">Non-Vegetarian</option>
                        <option value="Vegan">Vegan</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Approx Meals *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={foodForm.approxMeals}
                        onChange={(e) => setFoodForm({ ...foodForm, approxMeals: Number(e.target.value) })}
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Cooked Time</label>
                      <input
                        type="text"
                        value={foodForm.cookedTime}
                        onChange={(e) => setFoodForm({ ...foodForm, cookedTime: e.target.value })}
                        placeholder="Prepared at 1:30 PM today"
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Pickup Deadline *</label>
                    <input
                      type="text"
                      required
                      value={foodForm.pickupDeadline}
                      onChange={(e) => setFoodForm({ ...foodForm, pickupDeadline: e.target.value })}
                      placeholder="Strictly before 6:00 PM"
                      className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Pickup Location *</label>
                    <input
                      type="text"
                      required
                      value={foodForm.pickupLocation}
                      onChange={(e) => setFoodForm({ ...foodForm, pickupLocation: e.target.value })}
                      placeholder="Rear Kitchen Gate 4, Velachery"
                      className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Description / Packaging Notes</label>
                    <textarea
                      rows={2}
                      value={foodForm.notes}
                      onChange={(e) => setFoodForm({ ...foodForm, notes: e.target.value })}
                      placeholder="Containers provided, bring insulated boxes"
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                    />
                  </div>
                </>
              )}

              {/* 5. Subscription Form */}
              {activeCategory === 'subscriptions' && (
                <>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Service / Plan Name *</label>
                    <input
                      type="text"
                      required
                      value={subForm.serviceName}
                      onChange={(e) => setSubForm({ ...subForm, serviceName: e.target.value })}
                      placeholder="e.g. Spotify Family or Netflix Premium"
                      className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Maximum Members *</label>
                      <input
                        type="number"
                        min="2"
                        max="10"
                        value={subForm.totalSlots}
                        onChange={(e) => setSubForm({ ...subForm, totalSlots: Number(e.target.value) })}
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Monthly Share (₹) *</label>
                      <input
                        type="number"
                        required
                        value={subForm.monthlyShare}
                        onChange={(e) => setSubForm({ ...subForm, monthlyShare: Number(e.target.value) })}
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary font-bold text-emerald-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Billing Cycle</label>
                    <input
                      type="text"
                      value={subForm.billingCycle}
                      onChange={(e) => setSubForm({ ...subForm, billingCycle: e.target.value })}
                      placeholder="1st of every month"
                      className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Guidelines</label>
                    <textarea
                      rows={2}
                      value={subForm.description}
                      onChange={(e) => setSubForm({ ...subForm, description: e.target.value })}
                      placeholder="Official invite only. Never share or store passwords."
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                    />
                  </div>
                </>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  {isSubmitting ? 'Publishing to Network...' : 'Publish to Network'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
