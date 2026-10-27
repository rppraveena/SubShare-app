import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

// Layout
import { AppLayout } from '../components/layout/AppLayout';

// Auth screens
import { SplashWelcomePage } from '../features/auth/SplashWelcomePage';
import { AuthFlowPage } from '../features/auth/AuthFlowPage';
import { ProfileSetupPage } from '../features/auth/ProfileSetupPage';
import { VerificationPendingPage } from '../features/auth/VerificationPendingPage';
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../features/auth/ResetPasswordPage';
import { ResetPasswordOtpPage } from '../features/auth/ResetPasswordOtpPage';
import { OAuthCallbackPage } from '../features/auth/OAuthCallbackPage';

// Main app screens
import { HomeDashboardPage } from '../features/home/HomeDashboardPage';
import { ServiceListingFeedPage } from '../features/services/ServiceListingFeedPage';
import { ListingDetailPage } from '../features/services/ListingDetailPage';
import { ActivityStatusPage } from '../features/activity/ActivityStatusPage';
import { ProfileTrustPage } from '../features/profile/ProfileTrustPage';
import { PublicProfilePage } from '../features/profile/PublicProfilePage';
import { MyListingsPage } from '../features/profile/MyListingsPage';

// Organization feature screens
import { OrgHomePage } from '../features/organization/OrgHomePage';

import { OrgFoodDonationsPage } from '../features/organization/OrgFoodDonationsPage';
import { OrgBloodRequestsPage } from '../features/organization/OrgBloodRequestsPage';
import { OrgDrivesPage } from '../features/organization/OrgDrivesPage';
import { OrgProfilePage } from '../features/organization/OrgProfilePage';
import { PendingApprovalPage } from '../features/organization/PendingApprovalPage';
import { RejectedPage } from '../features/organization/RejectedPage';

// Support screens
import { ContactAdminPage } from '../features/support/ContactAdminPage';
import { MyQueriesPage } from '../features/support/MyQueriesPage';

// Requests & Chat features
import { RequestsPage } from '../features/requests/RequestsPage';
import { OwnerRequestsPage } from '../features/requests/OwnerRequestsPage';
import { ChatListPage } from '../features/chat/ChatListPage';
import { ChatRoomPage } from '../features/chat/ChatRoomPage';

// Notifications, Payments, Reports
import { NotificationCenterPage } from '../features/notifications/NotificationCenterPage';
import { PaymentLedgerPage } from '../features/payments/PaymentLedgerPage';
import { MyReportsPage } from '../features/reports/MyReportsPage';

// Tickets feature
import { TicketsPage } from '../features/tickets/TicketsPage';
import { MyTicketsPage } from '../features/tickets/MyTicketsPage';
import { CreateTicketPage } from '../features/tickets/CreateTicketPage';

// Rides feature
import { RidesPage } from '../features/rides/RidesPage';
import { CreateRidePage } from '../features/rides/CreateRidePage';

// Blood feature
import { BloodPage } from '../features/blood/BloodPage';
import { CreateBloodRequestPage } from '../features/blood/CreateBloodRequestPage';

// Food feature
import { FoodPage } from '../features/food/FoodPage';
import { CreateFoodDonationPage } from '../features/food/CreateFoodDonationPage';

// Subscriptions feature
import { SubscriptionsPage } from '../features/subscriptions/SubscriptionsPage';
import { CreateGroupPage } from '../features/subscriptions/CreateGroupPage';

// Admin screens & guards
import { AdminDashboardPage } from '../features/admin/AdminDashboardPage';
import { AdminOrgsPage } from '../features/admin/AdminOrgsPage';
import { OrganizationReviewPage } from '../features/admin/OrganizationReviewPage';
import { AdminReportsPage } from '../features/admin/AdminReportsPage';
import { ReportReviewPage } from '../features/admin/ReportReviewPage';
import { AdminQueriesPage } from '../features/admin/AdminQueriesPage';
import { QueryDetailPage } from '../features/admin/QueryDetailPage';
import { AdminUsersPage } from '../features/admin/AdminUsersPage';
import { AdminUserDetailPage } from '../features/admin/AdminUserDetailPage';
import { AdminLoginPage } from '../features/admin/AdminLoginPage';

export interface AppRoutesProps {}

const ProtectedRoute: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return <Outlet />;
};

const RequireIndividual: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const user = useAuthStore((s) => s.user);
  if (user?.is_admin === true || user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  if (user?.accountType === 'organization') {
    return <Navigate to="/organization/home" replace />;
  }
  return children;
};

const RequireOrganization: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const user = useAuthStore((s) => s.user);
  if (user?.is_admin === true || user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  if (user?.accountType !== 'organization') {
    return <Navigate to="/home" replace />;
  }
  return children;
};

const RequireAdmin: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (user.is_admin !== true && user.role !== 'admin') {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Standalone public screens */}
      <Route path="/" element={<SplashWelcomePage />} />
      <Route path="/auth" element={<AuthFlowPage />} />
      <Route path="/profile-setup" element={<ProfileSetupPage />} />
      <Route path="/verification-pending" element={<VerificationPendingPage />} />
      <Route path="/organization/pending" element={<PendingApprovalPage />} />
      <Route path="/organization/rejected" element={<RejectedPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password-otp" element={<ResetPasswordOtpPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/callback" element={<OAuthCallbackPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminDashboardPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/orgs"
        element={
          <RequireAdmin>
            <AdminOrgsPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/orgs/:id"
        element={
          <RequireAdmin>
            <OrganizationReviewPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/org/:id"
        element={
          <RequireAdmin>
            <OrganizationReviewPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RequireAdmin>
            <AdminUsersPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/users/:id"
        element={
          <RequireAdmin>
            <AdminUserDetailPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <RequireAdmin>
            <AdminReportsPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/reports/:id"
        element={
          <RequireAdmin>
            <ReportReviewPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/queries"
        element={
          <RequireAdmin>
            <AdminQueriesPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/queries/:id"
        element={
          <RequireAdmin>
            <QueryDetailPage />
          </RequireAdmin>
        }
      />

      {/* Protected app routes inside AppLayout (with bottom nav) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Individual Home */}
          <Route
            path="/home"
            element={
              <RequireIndividual>
                <HomeDashboardPage />
              </RequireIndividual>
            }
          />

          {/* Organization Home & Pages */}
          <Route
            path="/organization/home"
            element={
              <RequireOrganization>
                <OrgHomePage />
              </RequireOrganization>
            }
          />
          <Route
            path="/organization/donations"
            element={
              <RequireOrganization>
                <OrgFoodDonationsPage />
              </RequireOrganization>
            }
          />
          <Route
            path="/organization/blood"
            element={
              <RequireOrganization>
                <OrgBloodRequestsPage />
              </RequireOrganization>
            }
          />
          <Route
            path="/organization/drives"
            element={
              <RequireOrganization>
                <OrgDrivesPage />
              </RequireOrganization>
            }
          />
          <Route
            path="/organization/profile"
            element={
              <RequireOrganization>
                <OrgProfilePage />
              </RequireOrganization>
            }
          />

          {/* User Support / Contact Admin */}
          <Route path="/help/contact" element={<ContactAdminPage />} />
          <Route path="/help/queries" element={<MyQueriesPage />} />

          {/* Shared Features */}
          <Route path="/services" element={<ServiceListingFeedPage />} />
          <Route path="/services/:id" element={<ListingDetailPage />} />
          <Route path="/activity" element={<ActivityStatusPage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/requests/owner" element={<OwnerRequestsPage />} />
          <Route path="/chat" element={<ChatListPage />} />
          <Route path="/notifications" element={<NotificationCenterPage />} />
          <Route path="/payments" element={<PaymentLedgerPage />} />
          <Route path="/reports/my" element={<MyReportsPage />} />
          <Route path="/profile" element={<ProfileTrustPage />} />
          <Route path="/user/:userId" element={<PublicProfilePage />} />
          <Route path="/my-listings" element={<MyListingsPage />} />

          {/* Service Pages */}
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/tickets/mine" element={<MyTicketsPage />} />
          <Route path="/rides" element={<RidesPage />} />
          <Route path="/blood" element={<BloodPage />} />
          <Route path="/food" element={<FoodPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
        </Route>

        {/* Full screen routes (without bottom nav) */}
        <Route path="/chat/:roomId" element={<ChatRoomPage />} />
        <Route path="/tickets/create" element={<CreateTicketPage />} />
        <Route path="/rides/create" element={<CreateRidePage />} />
        <Route path="/blood/create" element={<CreateBloodRequestPage />} />
        <Route path="/food/create" element={<CreateFoodDonationPage />} />
        <Route path="/subscriptions/create" element={<CreateGroupPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
