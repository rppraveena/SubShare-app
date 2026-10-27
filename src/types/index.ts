export type ServiceCategory = 'tickets' | 'rides' | 'blood' | 'food' | 'subscriptions';

export type AccountType = 'individual' | 'organization';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export type UserRole = 'user' | 'admin';

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface PrivacyPreferences {
  locationSharing: boolean;
  notifications: boolean;
  dataSharing: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  accountType: AccountType;
  role: UserRole;
  is_admin?: boolean;
  verificationStatus: VerificationStatus;
  phoneVerified: boolean;
  emailVerified: boolean;
  trustScore: number;
  location: string;
  latitude?: number;
  longitude?: number;
  rating: number;
  completedExchanges: number;
  completedDonations: number;
  completedRides: number;
  reportsCount: number;
  cancellationsCount: number;
  memberSince: string;
  profileCompleted: boolean;
  isOrganization?: boolean;
  organizationDetails?: {
    name: string;
    regNumber: string;
    type: 'NGO' | 'Orphanage' | 'Old Age Home' | 'Charitable Trust' | 'Community Org' | 'Other';
    contactPerson?: string;
    documentUrl?: string;
    verifiedDate?: string;
  };
  emergencyContact?: EmergencyContact;
  privacyPreferences: PrivacyPreferences;
}

export interface TicketListing {
  id: string;
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
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  sellerTrustScore: number;
  isVerified: boolean;
  verificationScore: number;
  verificationConfidence: 'High' | 'Medium' | 'Low';
  image: string;
  proofDocument?: string;
  notes?: string;
  status: 'available' | 'requested' | 'reserved' | 'transferred' | 'sold';
  transferMethod: string;
  latitude?: number;
  longitude?: number;
  isDemo?: boolean;
}

export interface TicketRequest {
  id: string;
  ticketId: string;
  ticketTitle: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar: string;
  buyerTrustScore: number;
  quantity: number;
  totalAmount: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CONFIRMED' | 'COMPLETED';
  createdAt: string;
}

export interface RideListing {
  id: string;
  driverId: string;
  driverName: string;
  driverAvatar: string;
  driverTrustScore: number;
  origin: string;
  destination: string;
  date: string;
  time: string;
  seatsTotal: number;
  seatsAvailable: number;
  pricePerSeat: number;
  vehicleModel: string;
  genderPreference: 'Everyone' | 'Women only' | 'Women preferred';
  isVerifiedDriver: boolean;
  distancePickup: string;
  notes: string;
  status?: 'available' | 'full' | 'completed';
  latitude?: number;
  longitude?: number;
  isDemo?: boolean;
}

export interface RideRequest {
  id: string;
  rideId: string;
  passengerId: string;
  passengerName: string;
  passengerAvatar: string;
  passengerTrustScore: number;
  seatsRequested: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CONFIRMED';
  createdAt: string;
}

export interface BloodRequest {
  id: string;
  requesterId: string;
  patientName: string;
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  unitsRequired: number;
  unitsFulfilled: number;
  hospital: string;
  location: string;
  distance: string;
  urgency: 'Immediate (Critical)' | 'Within 4 Hours' | 'Within 24 Hours';
  requiredBefore: string;
  attenderContact: string;
  isVerifiedHospital: boolean;
  verifiedByDoc: boolean;
  status: 'open' | 'fulfilled' | 'urgent';
  createdAt: string;
  notes?: string;
  respondedDonorIds?: string[];
  latitude?: number;
  longitude?: number;
  isDemo?: boolean;
}

export interface BloodResponse {
  id: string;
  bloodRequestId: string;
  donorId: string;
  donorName: string;
  donorPhone: string;
  donorBloodGroup: string;
  donorTrustScore: number;
  status: 'can_help' | 'unavailable' | 'completed';
  respondedAt: string;
}

export interface FoodDonation {
  id: string;
  donorId: string;
  donorName: string;
  donorType: 'Restaurant' | 'Event Hall' | 'Caterer' | 'Individual Donor' | 'Hotel';
  donorAvatar: string;
  donorTrustScore: number;
  foodType: 'Cooked Meals' | 'Packaged Food' | 'Bakery & Bread' | 'Produce & Groceries';
  dietaryType: 'Vegetarian' | 'Non-Vegetarian' | 'Vegan';
  approxMeals: number;
  cookedTime: string;
  pickupDeadline: string;
  pickupLocation: string;
  distance: string;
  image: string;
  notes?: string;
  status: 'available' | 'matched' | 'scheduled' | 'picked_up' | 'completed';
  assignedOrgId?: string;
  assignedOrgName?: string;
  latitude?: number;
  longitude?: number;
  isDemo?: boolean;
}

export interface FoodAcceptance {
  id: string;
  foodDonationId: string;
  organizationId: string;
  organizationName: string;
  contactPerson: string;
  phone: string;
  scheduledPickupTime: string;
  status: 'ACCEPTED' | 'PICKED_UP' | 'COMPLETED';
}

export interface SubscriptionGroup {
  id: string;
  serviceName: 'Spotify Family' | 'Netflix Premium' | 'YouTube Premium' | 'Disney+ Hotstar' | 'Canva Pro' | 'ChatGPT Plus' | string;
  platformLogo: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  ownerTrustScore: number;
  totalSlots: number;
  occupiedSlots: number;
  monthlyShare: number;
  billingCycle: string;
  requiresApproval: boolean;
  isOfficialInvite: boolean;
  description: string;
  status?: 'available' | 'full';
  isDemo?: boolean;
}

export interface SubscriptionMemberRequest {
  id: string;
  groupId: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberAvatar: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export type TransactionStatus = 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'HISTORY';

export type PaymentState = 
  | 'CREATED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_AUTHORIZED'
  | 'TRANSFER_PENDING'
  | 'ITEM_TRANSFERRED'
  | 'BUYER_CONFIRMED'
  | 'RELEASE_REQUESTED'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED';

export interface Transaction {
  id: string;
  serviceCategory: ServiceCategory;
  listingId: string;
  title: string;
  subtitle: string;
  amount: number;
  counterpartName: string;
  counterpartAvatar: string;
  counterpartTrustScore: number;
  date: string;
  status: TransactionStatus;
  paymentState: PaymentState;
  stateStep: number; // 1 to 5
  thumbnail: string;
  transferDetails?: string;
  securityCode?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  isSystem?: boolean;
}

export interface ChatThread {
  id: string;
  counterpartName: string;
  counterpartAvatar: string;
  counterpartTrustScore: number;
  isVerified: boolean;
  serviceCategory: ServiceCategory;
  contextTitle: string;
  contextSubtitle: string;
  contextStatus: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: ChatMessage[];
}

export interface AdminVerificationRequest {
  id: string;
  orgName: string;
  type: string;
  regNumber: string;
  submittedAt: string;
  contactPerson: string;
  email: string;
  phone: string;
  documentName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
}

export interface AdminFraudAlert {
  id: string;
  targetType: 'User' | 'Listing' | 'Transaction';
  targetName: string;
  riskScore: 'High' | 'Medium' | 'Low';
  reason: string;
  reportedBy: string;
  date: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: ServiceCategory | 'system' | 'admin';
  read: boolean;
  link?: string;
}

export interface TrustFactor {
  id: string;
  label: string;
  points: number;
  maxPoints: number;
  earned: boolean;
  reason: string;
}
