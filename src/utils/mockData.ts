import {
  User,
  TicketListing,
  RideListing,
  BloodRequest,
  FoodDonation,
  SubscriptionGroup,
  Transaction,
  ChatThread,
  AdminVerificationRequest,
  AdminFraudAlert
} from '../types';

export const cleanNewUser: User = {
  id: 'usr_new',
  name: 'New User',
  email: '',
  phone: '',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  accountType: 'individual',
  role: 'user',
  verificationStatus: 'unverified',
  phoneVerified: false,
  emailVerified: false,
  trustScore: 10,
  location: '',
  rating: 0,
  completedExchanges: 0,
  completedDonations: 0,
  completedRides: 0,
  reportsCount: 0,
  cancellationsCount: 0,
  memberSince: 'Today',
  profileCompleted: false,
  privacyPreferences: {
    locationSharing: true,
    notifications: true,
    dataSharing: false,
  },
};

export const mockCurrentUser: User = {
  id: 'usr_001',
  name: 'Arun Kumar',
  email: 'arun.kumar@trustshare.org',
  phone: '+91 98402 11245',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  accountType: 'individual',
  role: 'user',
  verificationStatus: 'verified',
  phoneVerified: true,
  emailVerified: true,
  trustScore: 45, // calculated based on verified phone + email + 2 transactions
  location: 'Anna Nagar, Chennai',
  latitude: 13.0850,
  longitude: 80.2100,
  rating: 5.0,
  completedExchanges: 2,
  completedDonations: 1,
  completedRides: 1,
  reportsCount: 0,
  cancellationsCount: 0,
  memberSince: 'September 2026',
  profileCompleted: true,
  emergencyContact: {
    name: 'Suresh Kumar',
    phone: '+91 98401 55678',
    relationship: 'Brother',
  },
  privacyPreferences: {
    locationSharing: true,
    notifications: true,
    dataSharing: false,
  },
};

export const mockAdminUser: User = {
  id: 'admin_001',
  name: 'SubShare Admin',
  email: 'admin@subshare.org',
  phone: '+91 90000 00001',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
  accountType: 'individual',
  role: 'admin',
  verificationStatus: 'verified',
  phoneVerified: true,
  emailVerified: true,
  trustScore: 100,
  location: 'Admin HQ, Chennai',
  rating: 5.0,
  completedExchanges: 50,
  completedDonations: 20,
  completedRides: 30,
  reportsCount: 0,
  cancellationsCount: 0,
  memberSince: 'January 2024',
  profileCompleted: true,
  privacyPreferences: {
    locationSharing: true,
    notifications: true,
    dataSharing: false,
  },
};

export const mockTickets: TicketListing[] = [];
export const mockRides: RideListing[] = [];
export const mockBloodRequests: BloodRequest[] = [];
export const mockFoodDonations: FoodDonation[] = [];
export const mockSubscriptions: SubscriptionGroup[] = [];


export const mockTransactions: Transaction[] = [
  {
    id: 'txn-101',
    serviceCategory: 'tickets',
    listingId: 'tkt-01',
    title: 'Coolie IMAX Ticket Handover',
    subtitle: 'Karthik Raja • PVR Luxe Phoenix',
    amount: 1200,
    counterpartName: 'Karthik Raja',
    counterpartAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    counterpartTrustScore: 96,
    date: 'Today, 11:20 AM',
    status: 'ACTIVE',
    paymentState: 'PAYMENT_AUTHORIZED',
    stateStep: 3,
    thumbnail: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=150&auto=format&fit=crop&q=80',
    transferDetails: 'Funds held safely by SubShare Escrow. Awaiting ticket transfer confirmation.',
    securityCode: 'SEC-8921-TS'
  },
  {
    id: 'txn-102',
    serviceCategory: 'rides',
    listingId: 'ride-01',
    title: 'Trichy to Chennai Carpool',
    subtitle: 'Vikram Chandran • TN 45 BK 2049',
    amount: 450,
    counterpartName: 'Vikram Chandran',
    counterpartAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    counterpartTrustScore: 98,
    date: 'Tomorrow, 06:30 AM',
    status: 'PENDING',
    paymentState: 'PAYMENT_PENDING',
    stateStep: 2,
    thumbnail: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=150&auto=format&fit=crop&q=80',
    transferDetails: 'Seat requested. Driver confirmation pending.'
  },
  {
    id: 'txn-103',
    serviceCategory: 'food',
    listingId: 'food-01',
    title: 'Surplus Food Redistribution',
    subtitle: 'Hope Foundation Shelter • 65 Meals',
    amount: 0,
    counterpartName: 'Hope Foundation (Verified NGO)',
    counterpartAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    counterpartTrustScore: 100,
    date: 'Yesterday, 05:40 PM',
    status: 'COMPLETED',
    paymentState: 'COMPLETED',
    stateStep: 5,
    thumbnail: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=80',
    transferDetails: 'Picked up and QR verified by Driver Ramanathan.'
  },
  {
    id: 'txn-104',
    serviceCategory: 'subscriptions',
    listingId: 'sub-01',
    title: 'Spotify Family Subscription Slot',
    subtitle: 'Rahul Verma • Monthly Slot #3',
    amount: 35,
    counterpartName: 'Rahul Verma',
    counterpartAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    counterpartTrustScore: 97,
    date: 'Sep 28, 2026',
    status: 'HISTORY',
    paymentState: 'COMPLETED',
    stateStep: 5,
    thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg',
    transferDetails: 'Invite validated and auto-renewed.'
  }
];

export const mockChatThreads: ChatThread[] = [
  {
    id: 'chat-01',
    counterpartName: 'Karthik Raja',
    counterpartAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    counterpartTrustScore: 96,
    isVerified: true,
    serviceCategory: 'tickets',
    contextTitle: 'Coolie IMAX First Day Ticket Transfer',
    contextSubtitle: '₹1,200 Held in Protected Escrow',
    contextStatus: 'Payment Authorized',
    lastMessage: 'I have uploaded the BookMyShow transfer link. Please check your email.',
    lastMessageTime: '11:22 AM',
    unreadCount: 1,
    messages: [
      {
        id: 'm1',
        senderId: 'system',
        text: '🛡️ SubShare Escrow Active: Payment of ₹1,200 is held securely. Do not exchange private WhatsApp or direct cash.',
        timestamp: '11:15 AM',
        isMe: false,
        isSystem: true
      },
      {
        id: 'm2',
        senderId: 'usr-92',
        text: 'Hi Arun! Thanks for booking. Are you ready for me to trigger the transfer to your registered mobile?',
        timestamp: '11:18 AM',
        isMe: false
      },
      {
        id: 'm3',
        senderId: 'usr_001',
        text: 'Yes Karthik! My number is +91 98402 11245. Ready on BookMyShow app right now.',
        timestamp: '11:20 AM',
        isMe: true
      },
      {
        id: 'm4',
        senderId: 'usr-92',
        text: 'I have initiated the transfer through official portal. Please confirm receipt so funds release!',
        timestamp: '11:22 AM',
        isMe: false
      }
    ]
  },
  {
    id: 'chat-02',
    counterpartName: 'Dr. Meenakshi (ABC Hospital)',
    counterpartAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    counterpartTrustScore: 100,
    isVerified: true,
    serviceCategory: 'blood',
    contextTitle: 'Urgent O- Blood Emergency Coordination',
    contextSubtitle: 'ABC Hospital ICU Block 2',
    contextStatus: 'Confirmed Donor En Route',
    lastMessage: 'Please head directly to 2nd Floor Blood Bank Counter 4.',
    lastMessageTime: '10:45 AM',
    unreadCount: 0,
    messages: [
      {
        id: 'mb1',
        senderId: 'system',
        text: '🚨 Emergency Dispatch: You confirmed response for O- Blood donation at ABC Hospital.',
        timestamp: '10:30 AM',
        isMe: false,
        isSystem: true
      },
      {
        id: 'mb2',
        senderId: 'usr_001',
        text: 'Hello Doctor, I am 1.2 km away. ETA is 10 minutes on two-wheeler.',
        timestamp: '10:35 AM',
        isMe: true
      },
      {
        id: 'mb3',
        senderId: 'hosp-1',
        text: 'Thank you Arun! Please head directly to 2nd Floor Blood Bank Counter 4. Mention Token #O-EMERGENCY.',
        timestamp: '10:45 AM',
        isMe: false
      }
    ]
  }
];

export const mockAdminVerifications: AdminVerificationRequest[] = [
  {
    id: 'req-01',
    orgName: 'Anbagam Children Haven & Shelter',
    type: 'Orphanage',
    regNumber: 'TN-NGO-2018-8831',
    submittedAt: 'Today, 09:15 AM',
    contactPerson: 'Rev. Daniel Thomas',
    email: 'contact@anbagamchildren.org',
    phone: '+91 94440 91822',
    documentName: '12A_80G_Govt_Registration_Cert.pdf',
    status: 'PENDING'
  },
  {
    id: 'req-02',
    orgName: 'Karunai Senior Citizens Care Home',
    type: 'Old Age Home',
    regNumber: 'TN-TRUST-2021-4512',
    submittedAt: 'Yesterday, 03:40 PM',
    contactPerson: 'Mrs. Jayanthi Raman',
    email: 'admin@karunaitrust.in',
    phone: '+91 98401 22930',
    documentName: 'Social_Welfare_Deed_Verification.pdf',
    status: 'PENDING'
  }
];

export const mockAdminFraudAlerts: AdminFraudAlert[] = [
  {
    id: 'frd-01',
    targetType: 'Listing',
    targetName: 'Suspicious Coldplay VIP Passes (Bulk 8 Tickets)',
    riskScore: 'High',
    reason: 'Duplicate barcode detected matching previously flagged Mumbai ticket',
    reportedBy: 'AI Fraud Engine OCR Filter',
    date: '10 mins ago',
    status: 'OPEN'
  },
  {
    id: 'frd-02',
    targetType: 'User',
    targetName: 'User #99812 (Quick Cancellation Rate: 85%)',
    riskScore: 'Medium',
    reason: 'Rapid booking & cancellation pattern observed across 4 carpools',
    reportedBy: 'Trip Reliability Monitor',
    date: '1 hour ago',
    status: 'INVESTIGATING'
  }
];

