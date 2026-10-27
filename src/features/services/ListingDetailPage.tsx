import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  MessageSquare,
  HeartHandshake,
  Car,
  Utensils,
  Share2,
  Send,
  CheckCircle,
} from 'lucide-react';
import { useServiceStore } from '../../stores/serviceStore';
import { useAuthStore } from '../../stores/authStore';
import { StatusPill } from '../../components/ui/StatusPill';
import { DistancePill } from '../../components/ui/DistancePill';
import { formatProximity } from '../../utils/distance';
import { SendRequestModal } from '../../components/SendRequestModal';
import { requestsService } from '../../services/requestsService';
import { chatService } from '../../services/chatService';

export const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const {
    tickets,
    rides,
    bloodRequests,
    foodDonations,
    subscriptions,
  } = useServiceStore();

  const [actionSuccessMessage, setActionSuccessMessage] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [hasPending, setHasPending] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);

  // Find item in any category
  const ticket = tickets.find((t) => t.id === id);
  const ride = rides.find((r) => r.id === id);
  const blood = bloodRequests.find((b) => b.id === id);
  const food = foodDonations.find((f) => f.id === id);
  const sub = subscriptions.find((s) => s.id === id);

  const serviceType = ticket ? 'tickets' : ride ? 'rides' : blood ? 'blood' : food ? 'food' : sub ? 'subscriptions' : 'tickets';
  const listingTitle = ticket?.title || ride?.destination || blood?.patientName || food?.foodType || sub?.serviceName || 'Listing';
  const ownerId = ticket?.sellerId || ride?.driverId || blood?.requesterId || food?.donorId || sub?.ownerId || '';

  const isOwner = Boolean(user?.id && ownerId && user.id === ownerId);

  useEffect(() => {
    if (id && serviceType) {
      requestsService.checkPendingRequest(id, serviceType).then(setHasPending);
    }
  }, [id, serviceType]);

  if (!ticket && !ride && !blood && !food && !sub) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 p-8 text-center bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <Shield className="w-12 h-12 text-slate-300 dark:text-slate-700" />
        <h3 className="font-bold text-base">Listing Not Found</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">This item may have been transferred, completed, or removed.</p>
        <Link to="/services" className="text-blue-600 font-bold text-xs mt-2 bg-blue-50 dark:bg-slate-900 px-4 py-2 rounded-xl">
          ← Back to All Services
        </Link>
      </div>
    );
  }

  // TASK 2: Navigation to specific chat with ownerId
  const handleOpenMessageOwner = async () => {
    if (!ownerId) return;
    if (isOwner) {
      navigate('/chat');
      return;
    }

    setOpeningChat(true);
    try {
      const room = await chatService.createOrGetRoom(ownerId, id);
      if (room?.id) {
        navigate(`/chat/${room.id}`);
      } else {
        navigate('/chat');
      }
    } catch (err: any) {
      console.error('Error opening chat room:', err);
      navigate('/chat');
    } finally {
      setOpeningChat(false);
    }
  };

  const computedDistance = formatProximity(
    user?.latitude,
    user?.longitude,
    ticket?.latitude ?? ride?.latitude ?? blood?.latitude ?? food?.latitude,
    ticket?.longitude ?? ride?.longitude ?? blood?.longitude ?? food?.longitude,
    ticket?.city || ride?.origin || blood?.location || food?.pickupLocation || 'Local Locality'
  );

  return (
    <div className="flex flex-col min-h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-36">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 h-14 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition">
          <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        </button>
        <span className="font-bold text-sm">
          {ticket ? 'Event Ticket' : ride ? 'Ride Share' : blood ? 'Emergency Blood SOS' : food ? 'Food Aid Donation' : 'Subscription Group'}
        </span>
        <button onClick={handleOpenMessageOwner} disabled={openingChat} className="p-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-900 transition">
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>

      {actionSuccessMessage && (
        <div className="bg-emerald-50 border-b border-emerald-100 text-emerald-800 text-xs font-semibold px-4 py-3 flex items-center justify-between">
          <span>✓ {actionSuccessMessage}</span>
          <button onClick={() => setActionSuccessMessage('')} className="text-emerald-600 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Main Listing Detail View */}
      {ticket && (
        <div className="p-5 flex flex-col gap-4">
          <div className="relative rounded-2xl overflow-hidden h-48 border border-slate-200 dark:border-slate-800 shadow-xs">
            <img src={ticket.image} alt={ticket.title} className="w-full h-full object-cover" />
            <div className="absolute top-3 right-3">
              <StatusPill status={ticket.status} size="sm" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black">{ticket.title}</h1>
            <p className="text-xs text-slate-500 mt-1">{ticket.venue} • {ticket.date} • {ticket.time}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div><span className="text-slate-500 font-medium">Quantity:</span> <span className="font-bold">{ticket.quantity} Available</span></div>
            <div><span className="text-slate-500 font-medium">Selling Price:</span> <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{ticket.sellingPrice}</span></div>
            <div><span className="text-slate-500 font-medium">Proximity:</span> <DistancePill distance={computedDistance} size="sm" /></div>
            <div><span className="text-slate-500 font-medium">Transfer:</span> <span className="font-bold">{ticket.transferMethod}</span></div>
          </div>
        </div>
      )}

      {ride && (
        <div className="p-5 flex flex-col gap-4">
          <div className="bg-violet-50 dark:bg-slate-900 border border-violet-200 dark:border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Car className="w-4 h-4 text-violet-600" />
              <span className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase">Carpool Ride</span>
            </div>
            <p className="font-black text-base">{ride.origin} → {ride.destination}</p>
            <p className="text-xs text-slate-500 mt-1">{ride.date} • {ride.time} • ₹{ride.pricePerSeat}/seat</p>
          </div>
        </div>
      )}

      {blood && (
        <div className="p-5 flex flex-col gap-4">
          <div className="bg-rose-50 dark:bg-slate-900 border border-rose-200 dark:border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <HeartHandshake className="w-4 h-4 text-rose-600" />
              <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase">SOS Blood Emergency</span>
            </div>
            <p className="font-black text-rose-600 text-2xl">{blood.bloodGroup} Needed</p>
            <p className="text-xs font-semibold mt-1">{blood.patientName} • {blood.hospital}</p>
          </div>
        </div>
      )}

      {food && (
        <div className="p-5 flex flex-col gap-4">
          <div className="bg-amber-50 dark:bg-slate-900 border border-amber-200 dark:border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Utensils className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase">Food Aid Donation</span>
            </div>
            <p className="font-black text-lg">{food.foodType}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Quantity: {food.approxMeals} meals • Prepared: {food.cookedTime}</p>
          </div>
        </div>
      )}

      {sub && (
        <div className="p-5 flex flex-col gap-4">
          <div className="bg-emerald-50 dark:bg-slate-900 border border-emerald-200 dark:border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">Subscription Sharing</span>
            </div>
            <p className="font-black text-lg">{sub.serviceName}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">₹{sub.monthlyShare}/month • {sub.billingCycle} billing</p>
          </div>
        </div>
      )}

      {/* TASK 1 & TASK 2: Sticky Bottom Action Bar */}
      <div className="fixed bottom-16 left-0 right-0 max-w-lg mx-auto bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-3 z-40 flex items-center gap-2.5 shadow-xl">
        {/* Message Owner Button */}
        <button
          type="button"
          onClick={handleOpenMessageOwner}
          disabled={openingChat}
          className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 transition"
        >
          <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Message Owner</span>
        </button>

        {/* Action Button: OWNER -> Accept Requests | BUYER -> Give Request */}
        {isOwner ? (
          <button
            type="button"
            onClick={() => navigate(`/requests/owner?listingId=${id}`)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-transform"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Accept Requests</span>
          </button>
        ) : hasPending ? (
          <button
            type="button"
            disabled
            className="flex-1 bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-not-allowed"
          >
            <span>⏳ Request Pending</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowRequestModal(true)}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-[0.98] transition-transform"
          >
            <Send className="w-4 h-4" />
            <span>Give Request</span>
          </button>
        )}
      </div>

      {/* Request Modal */}
      {id && ownerId && (
        <SendRequestModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          receiverId={ownerId}
          serviceType={serviceType}
          listingId={id}
          listingTitle={listingTitle}
          onRequestSent={() => {
            setHasPending(true);
            setActionSuccessMessage('Request sent to owner!');
          }}
        />
      )}
    </div>
  );
};
