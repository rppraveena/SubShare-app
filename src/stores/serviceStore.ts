import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ServiceCategory,
  TicketListing,
  RideListing,
  BloodRequest,
  FoodDonation,
  SubscriptionGroup,
  TicketRequest,
  RideRequest,
  BloodResponse,
  FoodAcceptance,
  SubscriptionMemberRequest,
} from '../types';
import {
  mockTickets,
  mockRides,
  mockBloodRequests,
  mockFoodDonations,
  mockSubscriptions,
} from '../utils/mockData';
import { useNotificationStore } from './notificationStore';
import { useChatStore } from './chatStore';
import { useTransactionStore } from './transactionStore';
import { getAllTickets, mapDbTicketToTicketListing } from '../services/ticketsService';
import { getAllRides, mapDbRideToRideListing } from '../services/ridesService';
import { getActiveBloodRequests, mapDbBloodToBloodRequest } from '../services/bloodService';
import { getActiveFoodDonations, mapDbFoodToFoodDonation } from '../services/foodService';
import { getAllGroups, mapDbSubToSubscriptionGroup } from '../services/subscriptionsService';

interface ServiceState {
  activeCategory: ServiceCategory;
  searchQuery: string;
  tickets: TicketListing[];
  rides: RideListing[];
  bloodRequests: BloodRequest[];
  foodDonations: FoodDonation[];
  subscriptions: SubscriptionGroup[];

  // Sub-requests & Responses
  ticketRequests: TicketRequest[];
  rideRequests: RideRequest[];
  bloodResponses: BloodResponse[];
  foodAcceptances: FoodAcceptance[];
  subscriptionRequests: SubscriptionMemberRequest[];

  setActiveCategory: (category: ServiceCategory) => void;
  setSearchQuery: (query: string) => void;

  // Creation actions for all 5 services
  addTicket: (
    ticket: {
      title: string;
      eventType: 'movie' | 'concert' | 'cricket' | 'theater' | 'other';
      venue: string;
      city: string;
      date: string;
      time: string;
      seats: string;
      quantity: number;
      originalPrice: number;
      sellingPrice: number;
      proofDocument?: string;
      notes?: string;
      image?: string;
      latitude?: number;
      longitude?: number;
    },
    user: { id: string; name: string; avatar: string; trustScore: number }
  ) => TicketListing;

  addRide: (
    ride: {
      origin: string;
      destination: string;
      date: string;
      time: string;
      seatsTotal: number;
      seatsAvailable: number;
      pricePerSeat: number;
      vehicleModel: string;
      genderPreference: 'Everyone' | 'Women only' | 'Women preferred';
      notes?: string;
      latitude?: number;
      longitude?: number;
    },
    user: { id: string; name: string; avatar: string; trustScore: number }
  ) => RideListing;

  addBloodRequest: (
    req: {
      patientName: string;
      bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
      unitsRequired: number;
      hospital: string;
      location: string;
      urgency: 'Immediate (Critical)' | 'Within 4 Hours' | 'Within 24 Hours';
      requiredBefore: string;
      attenderContact: string;
      notes?: string;
      latitude?: number;
      longitude?: number;
    },
    user: { id: string; name: string; avatar: string; trustScore: number }
  ) => BloodRequest;

  addFoodDonation: (
    food: {
      foodType: 'Cooked Meals' | 'Packaged Food' | 'Bakery & Bread' | 'Produce & Groceries';
      dietaryType: 'Vegetarian' | 'Non-Vegetarian' | 'Vegan';
      approxMeals: number;
      cookedTime: string;
      pickupDeadline: string;
      pickupLocation: string;
      notes?: string;
      image?: string;
      donorType?: 'Restaurant' | 'Event Hall' | 'Caterer' | 'Individual Donor' | 'Hotel';
      latitude?: number;
      longitude?: number;
    },
    user: { id: string; name: string; avatar: string; trustScore: number }
  ) => FoodDonation;

  addSubscription: (
    sub: {
      serviceName: string;
      totalSlots: number;
      monthlyShare: number;
      billingCycle?: string;
      description?: string;
      platformLogo?: string;
    },
    user: { id: string; name: string; avatar: string; trustScore: number }
  ) => SubscriptionGroup;

  // Two-sided approval workflows
  requestTicket: (ticketId: string, quantity: number, buyer: { id: string; name: string; avatar: string; trustScore: number }) => boolean;
  acceptTicketRequest: (requestId: string) => void;
  rejectTicketRequest: (requestId: string) => void;

  requestRideSeat: (rideId: string, seats: number, passenger: { id: string; name: string; avatar: string; trustScore: number }) => boolean;
  acceptRideRequest: (requestId: string) => void;
  rejectRideRequest: (requestId: string) => void;

  respondToBloodRequest: (
    bloodId: string,
    status: 'can_help' | 'unavailable',
    donor: { id: string; name: string; phone: string; bloodGroup: string; trustScore: number }
  ) => void;

  claimFoodDonation: (foodId: string, org: { id: string; name: string; contactPerson: string; phone: string }) => boolean;
  updateFoodStatus: (foodId: string, status: 'scheduled' | 'picked_up' | 'completed') => void;

  requestSubscriptionJoin: (subId: string, member: { id: string; name: string; email: string; avatar: string }) => boolean;
  approveSubscriptionMember: (requestId: string) => void;
  rejectSubscriptionMember: (requestId: string) => void;

  // Supabase sync
  fetchFromSupabase: () => Promise<void>;

  // Demo toggle
  loadDemoData: () => void;
  clearToCleanState: () => void;
}


export const useServiceStore = create<ServiceState>()(
  persist(
    (set, get) => ({
      activeCategory: 'tickets',
      searchQuery: '',
      // Clean state default: empty feeds
      tickets: [],
      rides: [],
      bloodRequests: [],
      foodDonations: [],
      subscriptions: [],

      ticketRequests: [],
      rideRequests: [],
      bloodResponses: [],
      foodAcceptances: [],
      subscriptionRequests: [],

      fetchFromSupabase: async () => {
        try {
          const [dbTickets, dbRides, dbBlood, dbFood, dbSubs] = await Promise.all([
            getAllTickets().catch(() => []),
            getAllRides().catch(() => []),
            getActiveBloodRequests().catch(() => []),
            getActiveFoodDonations().catch(() => []),
            getAllGroups().catch(() => []),
          ]);

          set({
            tickets: dbTickets.map(mapDbTicketToTicketListing),
            rides: dbRides.map(mapDbRideToRideListing),
            bloodRequests: dbBlood.map(mapDbBloodToBloodRequest),
            foodDonations: dbFood.map(mapDbFoodToFoodDonation),
            subscriptions: dbSubs.map(mapDbSubToSubscriptionGroup),
          });
        } catch (err) {
          console.error('Failed to sync serviceStore with Supabase:', err);
        }
      },

      setActiveCategory: (category) => set({ activeCategory: category }),
      setSearchQuery: (query) => set({ searchQuery: query }),

      addTicket: (data, user) => {
        const newTicket: TicketListing = {
          id: `tkt-${Date.now()}`,
          title: data.title,
          eventType: data.eventType,
          venue: data.venue,
          city: data.city || 'Local Locality',
          date: data.date,
          time: data.time,
          seats: data.seats || 'General Admission',
          quantity: Number(data.quantity) || 1,
          originalPrice: Number(data.originalPrice) || 0,
          sellingPrice: Number(data.sellingPrice) || 0,
          sellerId: user.id,
          sellerName: user.name,
          sellerAvatar: user.avatar,
          sellerTrustScore: user.trustScore,
          isVerified: true,
          verificationScore: 98,
          verificationConfidence: 'High',
          image:
            data.image ||
            'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
          proofDocument: data.proofDocument,
          notes: data.notes,
          status: 'available',
          transferMethod: 'Direct In-App Booking Handover',
          latitude: data.latitude,
          longitude: data.longitude,
          isDemo: false,
        };

        set((state) => ({
          tickets: [newTicket, ...state.tickets],
        }));

        useNotificationStore.getState().addNotification({
          title: 'Ticket Listing Published',
          message: `Your ticket for "${newTicket.title}" is now available to nearby peers.`,
          type: 'tickets',
          link: `/services/${newTicket.id}`,
        });

        return newTicket;
      },

      addRide: (data, user) => {
        const newRide: RideListing = {
          id: `ride-${Date.now()}`,
          driverId: user.id,
          driverName: user.name,
          driverAvatar: user.avatar,
          driverTrustScore: user.trustScore,
          origin: data.origin,
          destination: data.destination,
          date: data.date,
          time: data.time,
          seatsTotal: Number(data.seatsTotal) || 3,
          seatsAvailable: Number(data.seatsAvailable) || 3,
          pricePerSeat: Number(data.pricePerSeat) || 0,
          vehicleModel: data.vehicleModel || 'Personal Vehicle',
          genderPreference: data.genderPreference || 'Everyone',
          isVerifiedDriver: true,
          distancePickup: data.origin || 'Nearby locality',
          notes: data.notes || '',
          status: 'available',
          latitude: data.latitude,
          longitude: data.longitude,
          isDemo: false,
        };

        set((state) => ({
          rides: [newRide, ...state.rides],
        }));

        useNotificationStore.getState().addNotification({
          title: 'Carpool Route Published',
          message: `Ride from ${newRide.origin} to ${newRide.destination} is published.`,
          type: 'rides',
          link: `/services/${newRide.id}`,
        });

        return newRide;
      },

      addBloodRequest: (data, user) => {
        const newReq: BloodRequest = {
          id: `bld-${Date.now()}`,
          requesterId: user.id,
          patientName: data.patientName,
          bloodGroup: data.bloodGroup,
          unitsRequired: Number(data.unitsRequired) || 1,
          unitsFulfilled: 0,
          hospital: data.hospital,
          location: data.location || 'Hospital Ward',
          distance: data.location || 'GPS Matched Locality',
          urgency: data.urgency,
          requiredBefore: data.requiredBefore,
          attenderContact: data.attenderContact,
          isVerifiedHospital: true,
          verifiedByDoc: true,
          notes: data.notes,
          status: data.urgency.includes('Immediate') ? 'urgent' : 'open',
          createdAt: 'Just now',
          respondedDonorIds: [],
          latitude: data.latitude,
          longitude: data.longitude,
          isDemo: false,
        };

        set((state) => ({
          bloodRequests: [newReq, ...state.bloodRequests],
        }));

        useNotificationStore.getState().addNotification({
          title: `Blood SOS: ${newReq.bloodGroup} Needed`,
          message: `Emergency request for ${newReq.patientName} at ${newReq.hospital} dispatched to nearby donors.`,
          type: 'blood',
          link: `/services/${newReq.id}`,
        });

        return newReq;
      },

      addFoodDonation: (data, user) => {
        const newFood: FoodDonation = {
          id: `food-${Date.now()}`,
          donorId: user.id,
          donorName: user.name,
          donorType: data.donorType || 'Individual Donor',
          donorAvatar: user.avatar,
          donorTrustScore: user.trustScore,
          foodType: data.foodType,
          dietaryType: data.dietaryType,
          approxMeals: Number(data.approxMeals) || 10,
          cookedTime: data.cookedTime,
          pickupDeadline: data.pickupDeadline,
          pickupLocation: data.pickupLocation,
          distance: data.pickupLocation || 'Nearby',
          image:
            data.image ||
            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
          notes: data.notes,
          status: 'available',
          latitude: data.latitude,
          longitude: data.longitude,
          isDemo: false,
        };

        set((state) => ({
          foodDonations: [newFood, ...state.foodDonations],
        }));

        useNotificationStore.getState().addNotification({
          title: 'Food Donation Registered',
          message: `${newFood.approxMeals} surplus meals registered for pickup at ${newFood.pickupLocation}.`,
          type: 'food',
          link: `/services/${newFood.id}`,
        });

        return newFood;
      },

      addSubscription: (data, user) => {
        let logo = data.platformLogo;
        if (!logo) {
          const name = data.serviceName.toLowerCase();
          if (name.includes('spotify'))
            logo = 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg';
          else if (name.includes('netflix'))
            logo = 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg';
          else if (name.includes('youtube'))
            logo = 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg';
          else if (name.includes('canva'))
            logo = 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Canva_Logo.png';
          else
            logo = 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg';
        }

        const newSub: SubscriptionGroup = {
          id: `sub-${Date.now()}`,
          serviceName: data.serviceName,
          platformLogo: logo,
          ownerId: user.id,
          ownerName: user.name,
          ownerAvatar: user.avatar,
          ownerTrustScore: user.trustScore,
          totalSlots: Number(data.totalSlots) || 4,
          occupiedSlots: 1, // Owner occupies slot 1
          monthlyShare: Number(data.monthlyShare) || 50,
          billingCycle: data.billingCycle || '1st of every month',
          requiresApproval: true,
          isOfficialInvite: true,
          description: data.description || 'Verified family sharing slot. Zero password sharing.',
          status: 'available',
          isDemo: false,
        };

        set((state) => ({
          subscriptions: [newSub, ...state.subscriptions],
        }));

        useNotificationStore.getState().addNotification({
          title: 'Subscription Group Published',
          message: `${newSub.serviceName} group with ${newSub.totalSlots - 1} open slots is published.`,
          type: 'subscriptions',
          link: `/services/${newSub.id}`,
        });

        return newSub;
      },

      // ─── 1. TICKET FLOW: Request → Owner Accepts/Rejects → Booking Confirmed ───
      requestTicket: (ticketId, quantity, buyer) => {
        const ticket = get().tickets.find((t) => t.id === ticketId);
        if (!ticket || ticket.status !== 'available') return false;

        const req: TicketRequest = {
          id: `tkt-req-${Date.now()}`,
          ticketId,
          ticketTitle: ticket.title,
          buyerId: buyer.id,
          buyerName: buyer.name,
          buyerAvatar: buyer.avatar,
          buyerTrustScore: buyer.trustScore,
          quantity,
          totalAmount: ticket.sellingPrice * quantity,
          status: 'PENDING',
          createdAt: 'Just now',
        };

        set((state) => ({
          ticketRequests: [req, ...state.ticketRequests],
        }));

        useNotificationStore.getState().addNotification({
          title: 'Ticket Request Sent',
          message: `Request for ${quantity}x "${ticket.title}" submitted to seller (${ticket.sellerName}). Awaiting approval.`,
          type: 'tickets',
        });

        useNotificationStore.getState().addNotification({
          title: 'Incoming Ticket Request',
          message: `${buyer.name} has requested ${quantity}x "${ticket.title}". Please review to accept or decline.`,
          type: 'tickets',
          link: `/services/${ticket.id}`,
        });

        return true;
      },

      acceptTicketRequest: (requestId) => {
        const req = get().ticketRequests.find((r) => r.id === requestId);
        if (!req) return;

        const ticket = get().tickets.find((t) => t.id === req.ticketId);

        set((state) => ({
          ticketRequests: state.ticketRequests.map((r) =>
            r.id === requestId ? { ...r, status: 'ACCEPTED' } : r
          ),
          tickets: state.tickets.map((t) =>
            t.id === req.ticketId ? { ...t, status: 'sold' } : t
          ),
        }));

        if (ticket) {
          // Create Escrow Transaction
          useTransactionStore.getState().createTransactionFromListing(
            `${ticket.title} Handover`,
            `${ticket.sellerName} • ${ticket.venue}`,
            req.totalAmount,
            ticket.sellerName,
            ticket.sellerAvatar,
            ticket.sellerTrustScore,
            'tickets',
            ticket.id,
            ticket.image
          );

          // Create Chat Thread between Buyer and Seller
          useChatStore.getState().createOrOpenThread(
            req.buyerName,
            req.buyerAvatar,
            req.buyerTrustScore,
            'tickets',
            ticket.title,
            `Booking Confirmed • ₹${req.totalAmount} in Escrow`
          );
        }

        useNotificationStore.getState().addNotification({
          title: 'Ticket Request Accepted',
          message: `Ticket request for "${req.ticketTitle}" accepted. Booking confirmed and escrow active.`,
          type: 'tickets',
          link: '/activity',
        });
      },

      rejectTicketRequest: (requestId) => {
        const req = get().ticketRequests.find((r) => r.id === requestId);
        set((state) => ({
          ticketRequests: state.ticketRequests.map((r) =>
            r.id === requestId ? { ...r, status: 'REJECTED' } : r
          ),
        }));

        if (req) {
          useNotificationStore.getState().addNotification({
            title: 'Ticket Request Declined',
            message: `Seller was unable to confirm ticket request for "${req.ticketTitle}".`,
            type: 'tickets',
          });
        }
      },

      // ─── 2. RIDE FLOW: Request Seat (DO NOT decrement seats immediately!) → Driver Accepts (decrements seats) ───
      requestRideSeat: (rideId, seats, passenger) => {
        const ride = get().rides.find((r) => r.id === rideId);
        if (!ride || ride.seatsAvailable < seats) return false;

        const req: RideRequest = {
          id: `ride-req-${Date.now()}`,
          rideId,
          passengerId: passenger.id,
          passengerName: passenger.name,
          passengerAvatar: passenger.avatar,
          passengerTrustScore: passenger.trustScore,
          seatsRequested: seats,
          status: 'PENDING',
          createdAt: 'Just now',
        };

        set((state) => ({
          rideRequests: [req, ...state.rideRequests],
        }));

        useNotificationStore.getState().addNotification({
          title: 'Ride Request Submitted',
          message: `Requested ${seats} seat(s) on ${ride.origin} → ${ride.destination}. Awaiting driver approval.`,
          type: 'rides',
        });

        useNotificationStore.getState().addNotification({
          title: 'New Passenger Seat Request',
          message: `${passenger.name} requested ${seats} seat(s) for ${ride.origin} → ${ride.destination}.`,
          type: 'rides',
          link: `/services/${ride.id}`,
        });

        return true;
      },

      acceptRideRequest: (requestId) => {
        const req = get().rideRequests.find((r) => r.id === requestId);
        if (!req) return;

        const ride = get().rides.find((r) => r.id === req.rideId);
        if (!ride) return;

        const updatedSeats = Math.max(0, ride.seatsAvailable - req.seatsRequested);

        set((state) => ({
          rideRequests: state.rideRequests.map((r) =>
            r.id === requestId ? { ...r, status: 'ACCEPTED' } : r
          ),
          rides: state.rides.map((r) =>
            r.id === req.rideId
              ? {
                  ...r,
                  seatsAvailable: updatedSeats,
                  status: updatedSeats === 0 ? 'full' : 'available',
                }
              : r
          ),
        }));

        // Create transaction & chat
        useTransactionStore.getState().createTransactionFromListing(
          `${ride.origin} → ${ride.destination}`,
          `${ride.driverName} • ${ride.vehicleModel}`,
          ride.pricePerSeat * req.seatsRequested,
          ride.driverName,
          ride.driverAvatar,
          ride.driverTrustScore,
          'rides',
          ride.id,
          'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=150&auto=format&fit=crop&q=80'
        );

        useChatStore.getState().createOrOpenThread(
          req.passengerName,
          req.passengerAvatar,
          req.passengerTrustScore,
          'rides',
          `${ride.origin} → ${ride.destination}`,
          `${req.seatsRequested} seat(s) confirmed • Co-travel coordination active`
        );

        useNotificationStore.getState().addNotification({
          title: 'Ride Booking Confirmed!',
          message: `Driver confirmed ${req.seatsRequested} seat(s) for ${ride.origin} → ${ride.destination}.`,
          type: 'rides',
          link: '/activity',
        });
      },

      rejectRideRequest: (requestId) => {
        const req = get().rideRequests.find((r) => r.id === requestId);
        set((state) => ({
          rideRequests: state.rideRequests.map((r) =>
            r.id === requestId ? { ...r, status: 'REJECTED' } : r
          ),
        }));

        if (req) {
          useNotificationStore.getState().addNotification({
            title: 'Ride Request Declined',
            message: 'Driver was unable to accept your carpool seat request.',
            type: 'rides',
          });
        }
      },

      // ─── 3. BLOOD DONATION FLOW: "I CAN HELP" → Notifies Requester + Opens Coordination Chat ───
      respondToBloodRequest: (bloodId, status, donor) => {
        const req = get().bloodRequests.find((b) => b.id === bloodId);
        if (!req) return;

        const response: BloodResponse = {
          id: `bld-resp-${Date.now()}`,
          bloodRequestId: bloodId,
          donorId: donor.id,
          donorName: donor.name,
          donorPhone: donor.phone,
          donorBloodGroup: donor.bloodGroup,
          donorTrustScore: donor.trustScore,
          status,
          respondedAt: 'Just now',
        };

        set((state) => ({
          bloodResponses: [response, ...state.bloodResponses],
          bloodRequests: state.bloodRequests.map((b) =>
            b.id === bloodId
              ? {
                  ...b,
                  respondedDonorIds: [...(b.respondedDonorIds || []), donor.id],
                  unitsFulfilled: status === 'can_help' ? b.unitsFulfilled + 1 : b.unitsFulfilled,
                }
              : b
          ),
        }));

        if (status === 'can_help') {
          useNotificationStore.getState().addNotification({
            title: 'Blood Response Confirmed',
            message: `Hospital attender at ${req.hospital} notified of your response for ${req.bloodGroup} blood.`,
            type: 'blood',
            link: `/services/${bloodId}`,
          });

          useChatStore.getState().createOrOpenThread(
            `${req.hospital} Attender (${req.patientName})`,
            'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=150&auto=format&fit=crop&q=80',
            100,
            'blood',
            `Emergency Blood Aid: ${req.bloodGroup} for ${req.patientName}`,
            `Attender: ${req.attenderContact} • Coordination active`
          );
        }
      },

      // ─── 4. FOOD DONATION FLOW: Claim → Scheduled → Picked Up → Completed ───
      claimFoodDonation: (foodId, org) => {
        const food = get().foodDonations.find((f) => f.id === foodId);
        if (!food || food.status !== 'available') return false;

        const acceptance: FoodAcceptance = {
          id: `food-acc-${Date.now()}`,
          foodDonationId: foodId,
          organizationId: org.id,
          organizationName: org.name,
          contactPerson: org.contactPerson,
          phone: org.phone,
          scheduledPickupTime: 'Today within 2 hours',
          status: 'ACCEPTED',
        };

        set((state) => ({
          foodAcceptances: [acceptance, ...state.foodAcceptances],
          foodDonations: state.foodDonations.map((f) =>
            f.id === foodId
              ? { ...f, status: 'scheduled', assignedOrgId: org.id, assignedOrgName: org.name }
              : f
          ),
        }));

        useNotificationStore.getState().addNotification({
          title: 'Food Donation Claimed',
          message: `${org.name} has claimed the ${food.approxMeals} meals. Pickup scheduled.`,
          type: 'food',
          link: `/services/${foodId}`,
        });

        useChatStore.getState().createOrOpenThread(
          food.donorName,
          food.donorAvatar,
          food.donorTrustScore,
          'food',
          `Food Redistribution: ${food.approxMeals} Meals (${food.foodType})`,
          `Claimed by ${org.name} • Pickup scheduled`
        );

        return true;
      },

      updateFoodStatus: (foodId, status) => {
        set((state) => ({
          foodDonations: state.foodDonations.map((f) =>
            f.id === foodId ? { ...f, status } : f
          ),
          foodAcceptances: state.foodAcceptances.map((a) =>
            a.foodDonationId === foodId
              ? {
                  ...a,
                  status: status === 'picked_up' ? 'PICKED_UP' : status === 'completed' ? 'COMPLETED' : a.status,
                }
              : a
          ),
        }));

        useNotificationStore.getState().addNotification({
          title: 'Food Pickup Update',
          message: `Food donation status updated to: ${status.replace('_', ' ').toUpperCase()}.`,
          type: 'food',
        });
      },

      // ─── 5. SUBSCRIPTION FLOW: Request Join → Owner Approves (occupies slot) ───
      requestSubscriptionJoin: (subId, member) => {
        const sub = get().subscriptions.find((s) => s.id === subId);
        if (!sub || sub.occupiedSlots >= sub.totalSlots) return false;

        const req: SubscriptionMemberRequest = {
          id: `sub-req-${Date.now()}`,
          groupId: subId,
          memberId: member.id,
          memberName: member.name,
          memberEmail: member.email,
          memberAvatar: member.avatar,
          status: 'PENDING',
          createdAt: 'Just now',
        };

        set((state) => ({
          subscriptionRequests: [req, ...state.subscriptionRequests],
        }));

        useNotificationStore.getState().addNotification({
          title: 'Subscription Request Submitted',
          message: `Join request for ${sub.serviceName} submitted to owner (${sub.ownerName}). Awaiting approval.`,
          type: 'subscriptions',
        });

        useNotificationStore.getState().addNotification({
          title: 'New Member Request for Group',
          message: `${member.name} requested to join your ${sub.serviceName} group.`,
          type: 'subscriptions',
          link: `/services/${sub.id}`,
        });

        return true;
      },

      approveSubscriptionMember: (requestId) => {
        const req = get().subscriptionRequests.find((r) => r.id === requestId);
        if (!req) return;

        const sub = get().subscriptions.find((s) => s.id === req.groupId);
        if (!sub) return;

        const newOccupied = Math.min(sub.totalSlots, sub.occupiedSlots + 1);

        set((state) => ({
          subscriptionRequests: state.subscriptionRequests.map((r) =>
            r.id === requestId ? { ...r, status: 'APPROVED' } : r
          ),
          subscriptions: state.subscriptions.map((s) =>
            s.id === req.groupId
              ? {
                  ...s,
                  occupiedSlots: newOccupied,
                  status: newOccupied >= s.totalSlots ? 'full' : 'available',
                }
              : s
          ),
        }));

        useChatStore.getState().createOrOpenThread(
          req.memberName,
          req.memberAvatar,
          90,
          'subscriptions',
          `${sub.serviceName} Official Invite`,
          `Approved membership • Official link sent to ${req.memberEmail}`
        );

        useNotificationStore.getState().addNotification({
          title: 'Subscription Membership Approved!',
          message: `You are approved for ${sub.serviceName}. Official invite sent.`,
          type: 'subscriptions',
        });
      },

      rejectSubscriptionMember: (requestId) => {
        const req = get().subscriptionRequests.find((r) => r.id === requestId);
        set((state) => ({
          subscriptionRequests: state.subscriptionRequests.map((r) =>
            r.id === requestId ? { ...r, status: 'REJECTED' } : r
          ),
        }));

        if (req) {
          useNotificationStore.getState().addNotification({
            title: 'Subscription Request Declined',
            message: 'Group owner declined your membership request.',
            type: 'subscriptions',
          });
        }
      },

      // Demo Mode loader (clearly labelled mock items)
      loadDemoData: () => {
        set({
          tickets: mockTickets.map((t) => ({ ...t, isDemo: true })),
          rides: mockRides.map((r) => ({ ...r, isDemo: true })),
          bloodRequests: mockBloodRequests.map((b) => ({ ...b, isDemo: true })),
          foodDonations: mockFoodDonations.map((f) => ({ ...f, isDemo: true })),
          subscriptions: mockSubscriptions.map((s) => ({ ...s, isDemo: true })),
        });
      },

      // Clean State reset (0 items)
      clearToCleanState: () => {
        set({
          tickets: [],
          rides: [],
          bloodRequests: [],
          foodDonations: [],
          subscriptions: [],
          ticketRequests: [],
          rideRequests: [],
          bloodResponses: [],
          foodAcceptances: [],
          subscriptionRequests: [],
        });
      },
    }),
    {
      name: 'trustshare_services_storage',
    }
  )
);
