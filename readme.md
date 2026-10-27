# 🚀 SubShare: Smart Subscription Slot Sharing and Payment Tracking System

![Flutter](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

> **📱 Published on Google Play Store (India)**
> SubShare is a hyper-local, community-driven platform designed to connect individuals and organizations to share resources, save money, and help the community. 

## 🌟 Overview

In today's digital age, we pay for multiple subscriptions (Netflix, Spotify, Canva) but often don't use them to their full potential. Additionally, sharing rides, event tickets, or donating surplus food/blood is often disorganized, relying on scattered WhatsApp messages. 

**SubShare** solves this by providing a centralized, secure, and location-aware mobile application. Unlike traditional marketplaces, SubShare does not process payments; instead, it focuses on **Trust**, **Verification**, and **Payment Tracking** (via external UPI apps).

## ✨ Key Features

### 👥 Three Distinct Roles
1. **Individual User:** Can create listings for 5 services, browse nearby items, send join requests, and chat with matched users.
2. **Organization (NGO):** Must undergo a strict Admin verification process. Once verified, they can accept food donations and respond to blood emergency requests.
3. **Admin:** Has access to a dedicated dashboard to verify NGOs, manage users, review safety reports, and monitor platform metrics.

### 🛍️ 5 Core Services
- 🎟️ **Subscription Sharing:** Split costs for Netflix, Spotify, Canva, etc.
- 🎬 **Event & Movie Tickets:** Sell or share extra tickets at face value.
- 🚗 **Ride Sharing:** Post daily commutes or intercity travel to share fuel costs.
- 🩸 **Blood Donation:** Post emergency requests and connect with nearby donors.
- 🍲 **Food Donation:** Connect surplus food from events with verified NGOs.

### 🛡️ Trust & Safety
- **Dynamic Trust Scores:** Users earn trust scores based on completed transactions, reviews, and identity verification.
- **Admin Verification:** NGOs are vetted manually before they can receive donations.
- **Secure In-App Chat:** Chat only opens *after* a request is accepted, ensuring privacy.
- **Report System:** Users can flag fraudulent listings or abusive behavior.

### 💳 External Payment Tracking
- No in-app money processing. Users pay via **UPI (Google Pay, PhonePe, Paytm)**.
- The app features a **Payment Ledger** where users can "Mark as Paid" and hosts can "Confirm Payment" to maintain a clear transaction history.

### 📍 Location-Aware Discovery
- Users can see listings filtered by their city/locality.
- Radius-based filters help find nearby rides and events.

## 🛠️ Technology Stack

**Frontend (Mobile)**
- **Framework:** React.js (v18+)
- **Language:** TypeScript
- **Mobile Wrapper:** Capacitor (Compiles to native Android)
- **UI/Styling:** Tailwind CSS, Lucide Icons
- **State Management:** React Hooks & Context API

**Backend & Database (BaaS)**
- **Provider:** Supabase
- **Database:** PostgreSQL (Relational structure for complex joins)
- **Authentication:** Supabase Auth (Email/Password)
- **Realtime:** Supabase Realtime (WebSockets for instant chat & notifications)
- **Storage:** Supabase Storage (Listing images, NGO documents)
- **Security:** PostgreSQL Row Level Security (RLS) policies to protect user data.

## 📂 Project Structure
```text
subshare/
├── src/
│   ├── core/           # Themes, constants
│   ├── features/       # 5 Services, Auth, Admin, Chat, Profile
│   ├── services/       # Supabase API calls (authService, chatService, etc.)
│   ├── stores/         # Zustand/Context state
│   └── App.tsx         # Main routing
├── android/            # Capacitor native Android project
├── supabase/           # Database schema & Edge Functions
└── package.json