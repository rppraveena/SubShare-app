# SubShare (TrustShare) Constitution

## 1. Core Identity
- **Name:** SubShare (TrustShare)
- **Tagline:** "Share Resources. Help Communities."
- **Stitch Project ID:** `14619210777894459015`
- **Design System Asset:** `assets/8b524a330e5847a3a81e5edb9aa37031`
- **Mission:** A unified trusted community resource-sharing and emergency-support platform combining 5 services with one verified identity, AI matching, secure communication, and transaction protection.
- **Voice & Tone:** Trustworthy, modern, clean, reassuring, fast for emergencies, consumer-grade (Airbnb/Uber/Fintech caliber).

## 2. Core Services
1. **Movie & Event Ticket Sharing:** Secondary ticket transfer with verification score, fraud detection, and held-release payment protection.
2. **Travel / Ride Sharing:** Proximity-based pickup (100m–500m), route compatibility, women-preferred safety, and SOS emergency sharing.
3. **Blood Donation Network:** Priority emergency dispatch (1km → 3km → 5km), medical eligibility guidance, and real-time donor response.
4. **Food Donation & NGO Matching:** Surplus food redistribution matching verified NGOs/shelters with pickup deadlines and QR verification.
5. **Subscription Sharing:** Private subscription groups (e.g. Spotify/Netflix family slots) with contribution tracking and verified member approval.

## 3. Architecture & File Structure
```text
subshare/
├── .stitch/
│   ├── SITE.md              # Project constitution & roadmap
│   ├── DESIGN.md            # Semantic design tokens & style guide
│   ├── metadata.json        # Stitch project & screen registry
│   ├── next-prompt.md       # Build loop baton
│   └── designs/             # Generated screens (.html & .png)
```

## 4. Sitemap & Screens
| Screen # | Screen ID | Name | Status | Description |
|---|---|---|---|---|
| 1 | `splash-welcome` | Splash & Welcome | Completed | Brand splash + Welcome with Google/Email auth CTA |
| 2 | `auth-flow` | Authentication (Login/Signup/OTP) | Completed | Multi-state auth with Phone OTP verification |
| 3 | `profile-setup` | Mandatory Profile Setup | Completed | Step-by-step Individual vs Verified Organization setup |
| 4 | `home-dashboard` | Home Dashboard | Completed | AI Smart Search, 5 Service Cards, Recommended listings |
| 5 | `service-listings` | Service Listing Feed | Completed | Service-tailored feeds with filters, trust indicators, and action cards |
| 6 | `listing-detail` | Listing Detail | Completed | Hero details, seller trust score, verification badges, sticky CTA |
| 7 | `activity-status` | Activity & Transaction Status | Completed | State-machine tabs (Active, Pending, Completed, History) |
| 8 | `private-chat` | Private Chat & Context | Completed | Secure messaging with transaction context header |
| 9 | `profile-trust` | Profile, Trust Center & Settings | Completed | 0-100 Trust Score ring breakdown, verification status & settings |
| 10 | `admin-dashboard` | Admin Verification & Fraud Center | Completed | Dark-themed moderation dashboard with NGO approvals & fraud flags |

## 5. Roadmap & Build Backlog
- [x] Initial design system & constitution definition
- [x] Screen 1: Splash & Welcome (`.stitch/designs/splash-welcome.html`)
- [x] Screen 2: Auth Flow & OTP (`.stitch/designs/auth-flow.html`)
- [x] Screen 3: Mandatory Profile Setup (`.stitch/designs/profile-setup.html`)
- [x] Screen 4: Home Dashboard (`.stitch/designs/home-dashboard.html`)
- [x] Screen 5: Service Listing Feed (`.stitch/designs/service-listings.html`)
- [x] Screen 6: Listing Detail (`.stitch/designs/listing-detail.html`)
- [x] Screen 7: Activity / Transaction Status (`.stitch/designs/activity-status.html`)
- [x] Screen 8: Private Chat (`.stitch/designs/private-chat.html`)
- [x] Screen 9: Profile & Trust Center (`.stitch/designs/profile-trust.html`)
- [x] Screen 10: Admin Dashboard (`.stitch/designs/admin-dashboard.html`)
