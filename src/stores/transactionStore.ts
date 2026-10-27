import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Transaction, TransactionStatus, PaymentState, ServiceCategory } from '../types';
import { mockTransactions } from '../utils/mockData';
import { useNotificationStore } from './notificationStore';
import { useAuthStore } from './authStore';

interface TransactionState {
  transactions: Transaction[];
  activeTab: TransactionStatus;
  setActiveTab: (tab: TransactionStatus) => void;
  confirmPaymentRelease: (id: string) => void;
  advanceTransactionStep: (id: string) => void;
  createTransactionFromListing: (
    title: string,
    subtitle: string,
    amount: number,
    counterpartName: string,
    counterpartAvatar: string,
    counterpartTrustScore: number,
    serviceCategory: ServiceCategory,
    listingId: string,
    thumbnail: string
  ) => string;
  clearTransactions: () => void;
  loadDemoTransactions: () => void;
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [], // Clean state default: empty
      activeTab: 'ACTIVE',

      setActiveTab: (tab) => set({ activeTab: tab }),

      confirmPaymentRelease: (id: string) => {
        const tx = get().transactions.find((t) => t.id === id);
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id
              ? {
                  ...t,
                  paymentState: 'COMPLETED',
                  status: 'COMPLETED',
                  stateStep: 5,
                  transferDetails: 'Transaction completed. Escrow funds safely settled.',
                }
              : t
          ),
        }));

        if (tx) {
          const user = useAuthStore.getState().user;
          if (user) {
            useAuthStore.getState().updateProfile({
              completedExchanges: (user.completedExchanges || 0) + 1,
            });
          }

          useNotificationStore.getState().addNotification({
            title: 'Exchange Completed',
            message: `Exchange "${tx.title}" finalized. Escrow released.`,
            type: tx.serviceCategory,
            link: '/activity',
          });
        }
      },

      advanceTransactionStep: (id: string) => {
        let completedTx: Transaction | null = null;

        set((state) => ({
          transactions: state.transactions.map((tx) => {
            if (tx.id !== id) return tx;
            const nextStep = Math.min(tx.stateStep + 1, 5);
            let nextPaymentState: PaymentState = tx.paymentState;
            let nextStatus: TransactionStatus = tx.status;
            let details = tx.transferDetails;

            if (nextStep === 3) {
              nextPaymentState = 'ITEM_TRANSFERRED';
              details = 'Item or service transferred by owner. Awaiting recipient confirmation.';
            } else if (nextStep === 4) {
              nextPaymentState = 'BUYER_CONFIRMED';
              details = 'Recipient confirmed receipt. Releasing escrow funds.';
            } else if (nextStep === 5) {
              nextPaymentState = 'COMPLETED';
              nextStatus = 'COMPLETED';
              details = 'Funds released successfully. Exchange completed.';
              completedTx = tx;
            }

            return {
              ...tx,
              stateStep: nextStep,
              paymentState: nextPaymentState,
              status: nextStatus,
              transferDetails: details,
            };
          }),
        }));

        if (completedTx) {
          const user = useAuthStore.getState().user;
          if (user) {
            useAuthStore.getState().updateProfile({
              completedExchanges: (user.completedExchanges || 0) + 1,
            });
          }
        }
      },

      createTransactionFromListing: (
        title,
        subtitle,
        amount,
        counterpartName,
        counterpartAvatar,
        counterpartTrustScore,
        serviceCategory,
        listingId,
        thumbnail
      ) => {
        const newId = `txn-${Date.now()}`;
        const newTx: Transaction = {
          id: newId,
          serviceCategory,
          listingId,
          title,
          subtitle,
          amount,
          counterpartName,
          counterpartAvatar,
          counterpartTrustScore,
          date: 'Just now',
          status: 'ACTIVE',
          paymentState: 'PAYMENT_AUTHORIZED',
          stateStep: 2,
          thumbnail,
          transferDetails: 'Escrow active. Funds held securely pending handover.',
          securityCode: `TS-${Math.floor(1000 + Math.random() * 9000)}`,
        };

        set((state) => ({
          transactions: [newTx, ...state.transactions],
          activeTab: 'ACTIVE',
        }));

        useNotificationStore.getState().addNotification({
          title: 'Escrow Payment Authorized',
          message: `₹${amount} held safely for "${title}". Transfer pending.`,
          type: serviceCategory,
          link: '/activity',
        });

        return newId;
      },

      clearTransactions: () => {
        set({ transactions: [] });
      },

      loadDemoTransactions: () => {
        set({ transactions: mockTransactions });
      },
    }),
    {
      name: 'trustshare_transactions_storage',
    }
  )
);
