import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AccountType, EmergencyContact, PrivacyPreferences } from '../types';
import { mockCurrentUser, mockAdminUser, cleanNewUser } from '../utils/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  phoneOtpSent: boolean;
  pendingPhone: string;
  pendingEmail: string;
  demoMode: boolean;
  authError: string | null;

  // Supabase Auth Actions
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ success: boolean; user?: any; error?: string }>;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; user?: any; error?: string; requiresProfileSetup?: boolean }>;
  mapError: (message: string) => string;
  checkSession: () => Promise<any>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string; requiresProfileSetup: boolean }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; requiresProfileSetup: boolean }>;
  sendEmailOtp: (email: string, pass: string, name: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ success: boolean; error?: string }>;
  completeIndividualProfile: (data: {
    photo?: File;
    city: string;
    latitude?: number;
    longitude?: number;
    dob?: string;
    gender?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  completeOrganizationProfile: (data: {
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
  }) => Promise<{ success: boolean; error?: string }>;
  checkEmailVerified: () => Promise<boolean>;
  sendOtp: (phone: string, email?: string) => boolean;
  verifyOtp: (otp: string) => { success: boolean; requiresProfileSetup: boolean };
  loginAdmin: (email: string, pass: string) => boolean;
  switchToDemoUser: () => void;
  switchToCleanUser: () => void;
  toggleDemoMode: (enabled?: boolean) => void;
  completeProfileSetup: (data: {
    name: string;
    accountType: AccountType;
    location: string;
    latitude?: number;
    longitude?: number;
    phone?: string;
    email?: string;
    orgDetails?: {
      name: string;
      regNumber: string;
      type: 'NGO' | 'Orphanage' | 'Old Age Home' | 'Charitable Trust' | 'Community Org' | 'Other';
      contactPerson?: string;
      documentUrl?: string;
    };
  }) => void;
  updateEmergencyContact: (contact: EmergencyContact) => void;
  updatePrivacyPreferences: (prefs: Partial<PrivacyPreferences>) => void;
  updateProfile: (data: Partial<User>) => void;
  calculateTrustScore: (user: User) => number;
  logout: () => Promise<void>;
  initSupabaseAuth: () => void;
}

async function fetchUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, phone, account_type, is_admin, trust_score, profile_photo_url, city')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch profile:', error);
      return null;
    }
    return data;
  } catch (e) {
    console.error('Error fetching profile:', e);
    return null;
  }
}

export const computeTrustScore = (u: Partial<User>): number => {
  let score = 10; // Baseline for registration

  if (u.phoneVerified) score += 15;
  if (u.emailVerified) score += 10;
  if (u.completedExchanges) score += Math.min(u.completedExchanges * 10, 30);
  if (u.completedDonations) score += Math.min(u.completedDonations * 15, 30);
  if (u.completedRides) score += Math.min(u.completedRides * 10, 20);
  if (u.emergencyContact?.phone) score += 5;
  if (u.rating && u.rating >= 4.5) score += 10;
  if (u.reportsCount) score -= u.reportsCount * 25;
  if (u.cancellationsCount) score -= u.cancellationsCount * 10;

  return Math.max(5, Math.min(100, score));
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      phoneOtpSent: false,
      pendingPhone: '',
      pendingEmail: '',
      demoMode: false,
      authError: null,

      initSupabaseAuth: () => {
        if (!isSupabaseConfigured()) return;

        supabase.auth.onAuthStateChange(async (event, session) => {
          const supabaseUser = session?.user;

          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || (supabaseUser && event === 'INITIAL_SESSION')) {
            if (supabaseUser) {
              const profile = await fetchUserProfile(supabaseUser.id);

              const newUser: User = {
                id: supabaseUser.id,
                name: profile?.name || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
                email: supabaseUser.email || '',
                phone: profile?.phone || supabaseUser.phone || '',
                avatar: profile?.profile_photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
                accountType: (profile?.account_type as any) || 'individual',
                role: profile?.is_admin ? 'admin' : 'user',
                is_admin: profile?.is_admin || false,
                isOrganization: profile?.account_type === 'organization',
                verificationStatus: 'verified',
                phoneVerified: true,
                emailVerified: true,
                trustScore: profile?.trust_score || 20,
                location: profile?.city || '',
                rating: 5,
                completedExchanges: 0,
                completedDonations: 0,
                completedRides: 0,
                reportsCount: 0,
                cancellationsCount: 0,
                memberSince: 'Today',
                profileCompleted: true,
                privacyPreferences: {
                  locationSharing: true,
                  notifications: true,
                  dataSharing: false,
                },
              };

              set({
                user: newUser,
                isAuthenticated: true,
                pendingEmail: supabaseUser.email || '',
              });
            }
          } else if (event === 'SIGNED_OUT') {
            set({
              user: null,
              isAuthenticated: false,
              demoMode: false,
            });
          }
        });
      },

      mapError: (message: string): string => {
        const errorMap: Record<string, string> = {
          'Invalid login credentials': 'Incorrect email or password',
          'User already registered': 'This email is already registered. Try signing in.',
          'Email already in use': 'This email is already registered. Try signing in.',
          'Password should be at least 6 characters': 'Password must be at least 6 characters',
          'Unable to validate email address': 'Please enter a valid email address',
          'signup is disabled': 'Signups are currently disabled',
          'Email rate limit exceeded': 'Too many attempts. Please wait a minute.',
          'Network request failed': 'Connection error. Check your internet.',
        };
        return errorMap[message] || message;
      },

      checkSession: async () => {
        if (!isSupabaseConfigured()) return null;
        const { data: { session } } = await supabase.auth.getSession();
        return session;
      },

      signUpWithEmail: async (email: string, password: string, name: string) => {
        set({ authError: null });
        try {
          const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password: password,
            options: {
              data: {
                full_name: name.trim(),
              },
            },
          });

          if (error) {
            const mappedErr = get().mapError(error.message);
            set({ authError: mappedErr });
            return { success: false, error: mappedErr };
          }

          // Detect existing account
          const existingUser = data.user && !data.session && data.user.identities?.length === 0;

          if (existingUser) {
            const msg = 'Email is already registered. Please sign in.';
            set({ authError: msg });
            return { 
              success: false, 
              error: msg 
            };
          }

          if (data.user) {
            const newUser: User = {
              ...cleanNewUser,
              id: data.user.id,
              name: name.trim(),
              email: email.trim(),
              emailVerified: true,
              profileCompleted: false,
              trustScore: computeTrustScore({ emailVerified: true }),
            };

            set({
              user: newUser,
              isAuthenticated: true,
              pendingEmail: email.trim(),
            });

            return { success: true, user: data.user };
          }
          return { success: false, error: 'User signup failed' };
        } catch (e: any) {
          const mappedErr = get().mapError(e.message || 'Signup failed');
          set({ authError: mappedErr });
          return { success: false, error: mappedErr };
        }
      },

      signInWithEmail: async (email: string, password: string) => {
        set({ authError: null });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password,
          });

          if (error) {
            const mappedErr = get().mapError(error.message);
            set({ authError: mappedErr });
            return { success: false, error: mappedErr };
          }

          if (!data.user) {
            return { success: false, error: 'Sign-in failed' };
          }

          // FETCH PROFILE FROM DB
          const profile = await fetchUserProfile(data.user.id);

          const user: User = {
            id: data.user.id,
            name: profile?.name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
            email: data.user.email || '',
            phone: profile?.phone || '',
            avatar: profile?.profile_photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
            accountType: (profile?.account_type as any) || 'individual',
            role: profile?.is_admin ? 'admin' : 'user',
            is_admin: profile?.is_admin || false,
            isOrganization: profile?.account_type === 'organization',
            verificationStatus: 'verified',
            phoneVerified: true,
            emailVerified: true,
            trustScore: profile?.trust_score || 20,
            location: profile?.city || '',
            rating: 5,
            completedExchanges: 0,
            completedDonations: 0,
            completedRides: 0,
            reportsCount: 0,
            cancellationsCount: 0,
            memberSince: 'Today',
            profileCompleted: true,
            privacyPreferences: {
              locationSharing: true,
              notifications: true,
              dataSharing: false,
            },
          };

          set({ user, isAuthenticated: true, authError: null });
          return { success: true, user: data.user, requiresProfileSetup: false };
        } catch (e: any) {
          const mappedErr = get().mapError(e.message || 'Signin failed');
          set({ authError: mappedErr });
          return { success: false, error: mappedErr };
        }
      },

      signUp: async (email: string, password: string) => {
        set({ authError: null });

        try {
          const { data, error } = await supabase.auth.signUp({ email, password });
          if (error) {
            set({ authError: error.message });
            return { success: false, error: error.message, requiresProfileSetup: false };
          }

          if (data.user) {
            const newUser: User = {
              ...cleanNewUser,
              id: data.user.id,
              email,
              emailVerified: !!data.user.email_confirmed_at,
              profileCompleted: false,
              trustScore: computeTrustScore({ emailVerified: true }),
            };

            set({
              user: newUser,
              isAuthenticated: true,
              pendingEmail: email,
            });

            return { success: true, requiresProfileSetup: true };
          }
          return { success: false, error: 'User signup failed', requiresProfileSetup: false };
        } catch (e: any) {
          set({ authError: e.message || 'Signup failed' });
          return { success: false, error: e.message, requiresProfileSetup: false };
        }
      },

      signIn: async (email: string, password: string) => {
        set({ authError: null });

        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            set({ authError: error.message });
            return { success: false, error: error.message, requiresProfileSetup: false };
          }

          if (data.user) {
            const profile = await fetchUserProfile(data.user.id);
            const user: User = {
              id: data.user.id,
              name: profile?.name || data.user.email?.split('@')[0] || 'User',
              email: data.user.email || '',
              phone: profile?.phone || '',
              avatar: profile?.profile_photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
              accountType: (profile?.account_type as any) || 'individual',
              role: profile?.is_admin ? 'admin' : 'user',
              is_admin: profile?.is_admin || false,
              isOrganization: profile?.account_type === 'organization',
              verificationStatus: 'verified',
              phoneVerified: true,
              emailVerified: true,
              trustScore: profile?.trust_score || 20,
              location: profile?.city || '',
              rating: 5,
              completedExchanges: 0,
              completedDonations: 0,
              completedRides: 0,
              reportsCount: 0,
              cancellationsCount: 0,
              memberSince: 'Today',
              profileCompleted: true,
              privacyPreferences: {
                locationSharing: true,
                notifications: true,
                dataSharing: false,
              },
            };

            set({ user, isAuthenticated: true });
            return { success: true, requiresProfileSetup: false };
          }
          return { success: false, error: 'User signin failed', requiresProfileSetup: false };
        } catch (e: any) {
          set({ authError: e.message || 'Signin failed' });
          return { success: false, error: e.message, requiresProfileSetup: false };
        }
      },

      sendEmailOtp: async (email: string, pass: string, name: string) => {
        set({ authError: null, pendingEmail: email });
        try {
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password: pass,
            options: { data: { full_name: name } },
          });

          if (signUpError && !signUpError.message.includes('already registered')) {
            set({ authError: signUpError.message });
            return { success: false, error: signUpError.message };
          }

          const { error: linkError } = await supabase.auth.signInWithOtp({
            email,
            options: {
              shouldCreateUser: true,
              emailRedirectTo: 'app.subshare.app://auth/callback',
            },
          });

          if (linkError) {
            set({ authError: linkError.message });
            return { success: false, error: linkError.message };
          }

          set({ pendingEmail: email });
          return { success: true };
        } catch (e: any) {
          set({ authError: e.message || 'Failed to send verification link' });
          return { success: false, error: e.message };
        }
      },

      verifyEmailOtp: async (email: string, token: string) => {
        set({ authError: null });
        try {
          const verifyRes = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email',
          });

          if (verifyRes.error) {
            set({ authError: verifyRes.error.message });
            return { success: false, error: verifyRes.error.message };
          }

          const sbUser = verifyRes.data?.user;
          const currentUser = get().user;

          const updatedUser: User = {
            ...(currentUser || cleanNewUser),
            id: sbUser?.id || `usr_${Date.now()}`,
            email: email,
            emailVerified: true,
            profileCompleted: true,
            trustScore: computeTrustScore({ emailVerified: true }),
          };

          set({
            user: updatedUser,
            isAuthenticated: true,
            pendingEmail: email,
          });

          return { success: true };
        } catch (e: any) {
          set({ authError: e.message || 'Verification failed' });
          return { success: false, error: e.message };
        }
      },

      completeIndividualProfile: async (data) => {
        set({ authError: null });
        try {
          let photoUrl = get().user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';

          if (data.photo && isSupabaseConfigured()) {
            const ext = data.photo.name.split('.').pop() || 'jpg';
            const fileName = `${Date.now()}_profile.${ext}`;
            const { error: uploadError } = await supabase.storage
              .from('profile-photos')
              .upload(fileName, data.photo);

            if (!uploadError) {
              const { data: pubData } = supabase.storage
                .from('profile-photos')
                .getPublicUrl(fileName);
              if (pubData?.publicUrl) {
                photoUrl = pubData.publicUrl;
              }
            }
          }

          const current = get().user || cleanNewUser;
          const updatedUser: User = {
            ...current,
            avatar: photoUrl,
            location: data.city,
            latitude: data.latitude,
            longitude: data.longitude,
            accountType: 'individual',
            profileCompleted: true,
            verificationStatus: 'verified',
            trustScore: computeTrustScore({ ...current, emailVerified: true, phoneVerified: current.phoneVerified }),
          };

          if (isSupabaseConfigured() && current.id) {
            await supabase.from('profiles').upsert({
              id: current.id,
              name: current.name,
              email: current.email,
              phone: current.phone,
              account_type: 'individual',
              email_verified: true,
              city: data.city,
              profile_photo_url: photoUrl,
              profile_completed: true,
              verification_status: 'verified',
              updated_at: new Date().toISOString(),
            });
          }

          set({ user: updatedUser, isAuthenticated: true });
          return { success: true };
        } catch (e: any) {
          set({ authError: e.message || 'Profile save failed' });
          return { success: false, error: e.message };
        }
      },

      completeOrganizationProfile: async (data) => {
        set({ authError: null });
        try {
          let certUrl = '';
          let govUrl = '';

          if (isSupabaseConfigured()) {
            if (data.certificateFile) {
              const fileName = `cert_${Date.now()}_${data.certificateFile.name}`;
              const { error } = await supabase.storage.from('organization-docs').upload(fileName, data.certificateFile);
              if (!error) {
                certUrl = supabase.storage.from('organization-docs').getPublicUrl(fileName).data.publicUrl;
              }
            }
            if (data.govDocFile) {
              const fileName = `gov_${Date.now()}_${data.govDocFile.name}`;
              const { error } = await supabase.storage.from('organization-docs').upload(fileName, data.govDocFile);
              if (!error) {
                govUrl = supabase.storage.from('organization-docs').getPublicUrl(fileName).data.publicUrl;
              }
            }
          }

          const current = get().user || cleanNewUser;
          const orgDetails = {
            name: data.orgName,
            regNumber: data.regNumber,
            type: data.type as any,
            contactPerson: data.contactPerson,
            documentUrl: certUrl || 'Registration_Document.pdf',
          };

          const updatedUser: User = {
            ...current,
            accountType: 'organization',
            isOrganization: true,
            verificationStatus: 'pending',
            profileCompleted: true,
            location: data.city,
            organizationDetails: orgDetails,
            trustScore: computeTrustScore({ ...current, emailVerified: true }),
          };

          if (isSupabaseConfigured() && current.id) {
            await supabase.from('organizations').insert({
              user_id: current.id,
              name: data.orgName,
              type: data.type,
              registration_number: data.regNumber,
              registration_date: data.regDate || null,
              contact_person: data.contactPerson,
              official_email: data.officialEmail,
              official_phone: data.officialPhone,
              address: data.address,
              city: data.city,
              certificate_url: certUrl,
              government_doc_url: govUrl,
              verification_status: 'pending',
            });

            await supabase.from('profiles').upsert({
              id: current.id,
              name: data.orgName,
              email: current.email,
              phone: data.officialPhone || current.phone,
              account_type: 'organization',
              email_verified: true,
              city: data.city,
              profile_completed: true,
              verification_status: 'pending',
              updated_at: new Date().toISOString(),
            });
          }

          set({ user: updatedUser, isAuthenticated: true });
          return { success: true };
        } catch (e: any) {
          set({ authError: e.message || 'Organization profile save failed' });
          return { success: false, error: e.message };
        }
      },

      checkEmailVerified: async () => {
        if (!isSupabaseConfigured()) return true;
        try {
          const { data } = await supabase.auth.getUser();
          return !!data?.user?.email_confirmed_at;
        } catch {
          return false;
        }
      },

      sendOtp: (phone: string, email = '') => {
        set({
          phoneOtpSent: true,
          pendingPhone: phone,
          pendingEmail: email,
        });
        return true;
      },

      verifyOtp: (otp: string) => {
        if (otp.trim().length >= 4) {
          const currentUser = get().user;
          const phone = get().pendingPhone || '+91 98402 11245';
          const email = get().pendingEmail || '';

          const updatedUser: User = currentUser
            ? {
                ...currentUser,
                phone,
                email: email || currentUser.email,
                phoneVerified: true,
                trustScore: computeTrustScore({ ...currentUser, phoneVerified: true }),
              }
            : {
                ...cleanNewUser,
                id: `usr_${Date.now()}`,
                phone,
                email,
                phoneVerified: true,
                emailVerified: !!email,
                trustScore: computeTrustScore({ phoneVerified: true, emailVerified: !!email }),
              };

          const needsSetup = !updatedUser.profileCompleted || !updatedUser.location;

          set({
            isAuthenticated: true,
            user: updatedUser,
            phoneOtpSent: false,
          });

          return { success: true, requiresProfileSetup: needsSetup };
        }
        return { success: false, requiresProfileSetup: false };
      },

      loginAdmin: (email: string, pass: string) => {
        if (
          (email.trim().toLowerCase() === 'admin@trustshare.org' && pass === 'admin123') ||
          (email.trim().toLowerCase() === 'admin@subshare.app' && pass === 'admin123') ||
          (email.trim().toLowerCase() === 'admin' && pass === 'admin')
        ) {
          set({
            isAuthenticated: true,
            user: mockAdminUser,
          });
          return true;
        }
        return false;
      },

      switchToDemoUser: () => {
        set({
          user: mockCurrentUser,
          isAuthenticated: true,
          demoMode: true,
        });
      },

      switchToCleanUser: () => {
        set({
          user: null,
          isAuthenticated: false,
          demoMode: false,
        });
      },

      toggleDemoMode: (enabled) => {
        const next = enabled !== undefined ? enabled : !get().demoMode;
        if (next) {
          set({
            demoMode: true,
            user: mockCurrentUser,
            isAuthenticated: true,
          });
        } else {
          set({
            demoMode: false,
            user: null,
            isAuthenticated: false,
          });
        }
      },

      completeProfileSetup: (data) => {
        const current = get().user || cleanNewUser;
        const isOrg = data.accountType === 'organization';

        const updatedUser: User = {
          ...current,
          name: data.name,
          accountType: data.accountType,
          location: data.location,
          latitude: data.latitude,
          longitude: data.longitude,
          phone: data.phone || current.phone,
          email: data.email || current.email,
          isOrganization: isOrg,
          verificationStatus: isOrg ? 'pending' : (current.phoneVerified ? 'verified' : 'unverified'),
          profileCompleted: true,
          organizationDetails: isOrg && data.orgDetails ? {
            name: data.orgDetails.name,
            regNumber: data.orgDetails.regNumber,
            type: data.orgDetails.type,
            contactPerson: data.orgDetails.contactPerson,
            documentUrl: data.orgDetails.documentUrl || 'Registration_Document.pdf',
            verifiedDate: undefined,
          } : undefined,
        };

        updatedUser.trustScore = computeTrustScore(updatedUser);

        set({
          user: updatedUser,
          isAuthenticated: true,
        });
      },

      updateEmergencyContact: (contact) => {
        const user = get().user;
        if (user) {
          const updated = { ...user, emergencyContact: contact };
          updated.trustScore = computeTrustScore(updated);
          set({ user: updated });
        }
      },

      updatePrivacyPreferences: (prefs) => {
        const user = get().user;
        if (user) {
          set({
            user: {
              ...user,
              privacyPreferences: { ...user.privacyPreferences, ...prefs },
            },
          });
        }
      },

      updateProfile: (data) => {
        const user = get().user;
        if (user) {
          const updated = { ...user, ...data };
          updated.trustScore = computeTrustScore(updated);
          set({ user: updated });
        }
      },

      calculateTrustScore: (user) => computeTrustScore(user),

      logout: async () => {
        if (isSupabaseConfigured()) {
          try {
            await supabase.auth.signOut();
          } catch (e) {
            console.error('Supabase signout error:', e);
          }
        }

        set({
          user: null,
          isAuthenticated: false,
          phoneOtpSent: false,
          pendingPhone: '',
          pendingEmail: '',
        });
      },
    }),
    {
      name: 'trustshare_auth_storage',
    }
  )
);
