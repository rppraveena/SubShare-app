import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AdminVerificationRequest, AdminFraudAlert } from '../types';
import { mockAdminVerifications, mockAdminFraudAlerts } from '../utils/mockData';
import { useNotificationStore } from './notificationStore';
import { useAuthStore } from './authStore';

interface AdminState {
  verifications: AdminVerificationRequest[];
  fraudAlerts: AdminFraudAlert[];
  addVerificationRequest: (req: Omit<AdminVerificationRequest, 'id' | 'submittedAt' | 'status'>) => void;
  approveOrganization: (id: string) => void;
  rejectOrganization: (id: string, reason?: string) => void;
  resolveFraudAlert: (id: string) => void;
  flagItem: (
    targetType: 'User' | 'Listing' | 'Transaction',
    targetName: string,
    reason: string,
    riskScore?: 'High' | 'Medium' | 'Low'
  ) => void;
  resetAdminData: () => void;
  loadDemoAdminData: () => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      verifications: [], // Clean state default: empty
      fraudAlerts: [], // Clean state default: empty

      addVerificationRequest: (req) => {
        const newReq: AdminVerificationRequest = {
          ...req,
          id: `req-${Date.now()}`,
          submittedAt: 'Just now',
          status: 'PENDING',
        };
        set((state) => ({
          verifications: [newReq, ...state.verifications],
        }));

        useNotificationStore.getState().addNotification({
          title: 'Organization Verification Pending',
          message: `${req.orgName} submitted registration documents for Admin review.`,
          type: 'admin',
          link: '/admin',
        });
      },

      approveOrganization: (id) => {
        const v = get().verifications.find((req) => req.id === id);
        set((state) => ({
          verifications: state.verifications.map((req) =>
            req.id === id ? { ...req, status: 'APPROVED' } : req
          ),
        }));

        if (v) {
          const user = useAuthStore.getState().user;
          if (
            user &&
            (user.name === v.contactPerson ||
              user.email === v.email ||
              user.organizationDetails?.name === v.orgName)
          ) {
            useAuthStore.getState().updateProfile({
              verificationStatus: 'verified',
              organizationDetails: user.organizationDetails
                ? {
                    ...user.organizationDetails,
                    verifiedDate: 'Today',
                  }
                : undefined,
            });
          }

          useNotificationStore.getState().addNotification({
            title: 'Organization Approved',
            message: `${v.orgName} is officially verified. Verified Organization badge issued.`,
            type: 'admin',
          });
        }
      },

      rejectOrganization: (id, reason = 'Document clarification required') => {
        const v = get().verifications.find((req) => req.id === id);
        set((state) => ({
          verifications: state.verifications.map((req) =>
            req.id === id ? { ...req, status: 'REJECTED', notes: reason } : req
          ),
        }));

        if (v) {
          useNotificationStore.getState().addNotification({
            title: 'Organization Verification Update',
            message: `${v.orgName} verification was rejected: ${reason}.`,
            type: 'admin',
          });
        }
      },

      resolveFraudAlert: (id) => {
        set((state) => ({
          fraudAlerts: state.fraudAlerts.map((a) =>
            a.id === id ? { ...a, status: 'RESOLVED' } : a
          ),
        }));
      },

      flagItem: (targetType, targetName, reason, riskScore = 'Medium') => {
        const alert: AdminFraudAlert = {
          id: `frd-${Date.now()}`,
          targetType,
          targetName,
          riskScore,
          reason,
          reportedBy: 'Trust & Safety Monitor',
          date: 'Just now',
          status: 'OPEN',
        };
        set((state) => ({
          fraudAlerts: [alert, ...state.fraudAlerts],
        }));
      },

      resetAdminData: () => {
        set({ verifications: [], fraudAlerts: [] });
      },

      loadDemoAdminData: () => {
        set({ verifications: mockAdminVerifications, fraudAlerts: mockAdminFraudAlerts });
      },
    }),
    {
      name: 'trustshare_admin_storage',
    }
  )
);
