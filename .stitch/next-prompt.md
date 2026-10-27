---
page: admin-dashboard
title: Admin Moderation, Organization Verification & Fraud Center
deviceType: MOBILE
---

Generate a mobile UI screen showing the **Admin Moderation & Verification Dashboard** for the **SubShare (TrustShare)** platform.

**SHARED STYLE GUIDE:**
App name: SubShare (TrustShare)
Tagline: "Share Resources. Help Communities."
Platform: Mobile app (deviceType: MOBILE)
Aesthetic: Modern, trustworthy, security-grade. Dark slate header (#0F172A), clean white cards (#FFFFFF), crisp borders (#E5E7EB), Inter typography.
Primary color: #2563EB (Dark #1D4ED8, Light #DBEAFE)
Success: #16A34A (Light #DCFCE7), Warning: #D97706 (Light #FEF3C7), Error: #DC2626 (Light #FEE2E2)
Background: #F6F8FB, Surface: #FFFFFF, Text: #172033, Muted: #667085, Border: #E5E7EB
Typography: Inter font with crisp hierarchy (H1 32px, H2 24px, Body 16px, Small 14px, Caption 12px)
Radius: 18px cards, 12px inputs/buttons, 999px pill badges.

**SCREEN SPECIFICATION:**
1. **Admin Header Bar (Dark Slate Style #0F172A):**
   - Title: "TrustShare Admin Console" with red shield / key icon.
   - Admin badge: "SuperAdmin • Fraud & Compliance".
   - Switch to Consumer App button.
2. **KPI Metrics Overview Grid (2x2):**
   - Metric 1: "24,850" Total Users (98.4% Verified).
   - Metric 2: "$142.6k" Escrow Protected (0% Loss).
   - Metric 3: "14" Pending Org Verifications (Needs Review).
   - Metric 4: "3" High-Risk Fraud Alerts (Action Required).
3. **Organization Verification Queue Card:**
   - Card Header: "Pending NGO & Charity Verifications (14)".
   - Organization Item 1: "Hope Haven Food Rescue" (NGO Type).
     - Registration No: #NGO-8839-NY • Tax ID Verified.
     - Document Preview: "501(c)(3) Certificate.pdf" & "City Health Permit.pdf" with preview icons.
     - Action Buttons: "✓ Approve & Grant Badge" (Success green #16A34A) and "Reject / Request Info" (Outlined red #DC2626).
4. **Fraud Risk & Report Queue Card:**
   - Card Header: "AI Fraud Detection & Suspicious Listings".
   - Alert Item 1: "Suspicious Ticket Listing (Taylor Swift Eras Tour)".
     - Risk Score: "89% High Risk • Duplicate Barcode Hash".
     - Seller: "User #99214 (New account • Same IP as flagged user)".
     - Action Buttons: "Suspend Listing" (Solid red #DC2626) and "Investigate User".
5. **Audit Log Snippet:**
   - "10:48 AM: Organization #8839 certificate OCR parsed (Match: 99.4%)"
   - "10:32 AM: Escrow payment #TX-4819 released to seller after gate scan"
6. **Bottom Admin Bar:**
   - Quick Nav: "Overview", "Verifications", "Fraud Risk", "Audit Logs".
