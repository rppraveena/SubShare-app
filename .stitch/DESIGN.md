# SubShare Design System (DESIGN.md)

## 1. Visual Vibe & Principles
- **Aesthetic:** Modern, trustworthy, consumer-grade (Airbnb/Uber/Fintech quality). High visual polish, clean hierarchy, reassuring colors.
- **Form factor:** Mobile-first responsive app with sticky bottom navigation and thumb-friendly touch targets (min 44x44px).
- **Subtlety:** Crisp micro-borders, soft pill badges, and refined elevation shadows without excessive glassmorphism.

## 2. Color Tokens
```css
:root {
  /* Brand Primary */
  --color-primary: #2563EB;
  --color-primary-dark: #1D4ED8;
  --color-primary-light: #DBEAFE;

  /* Semantic Feedback */
  --color-success: #16A34A;
  --color-success-light: #DCFCE7;
  --color-warning: #D97706;
  --color-warning-light: #FEF3C7;
  --color-error: #DC2626;
  --color-error-light: #FEE2E2;

  /* Neutral & Surfaces */
  --color-background: #F6F8FB;
  --color-surface: #FFFFFF;
  --color-text-primary: #172033;
  --color-text-secondary: #667085;
  --color-border: #E5E7EB;

  /* Dark Theme Surfaces */
  --color-dark-bg: #0F172A;
  --color-dark-surface: #111827;
  --color-dark-text: #F8FAFC;
}
```

## 3. Typography
- **Font Family:** Inter, system-ui, -apple-system, sans-serif
- **Scale:**
  - Display: `40px` (Weight: 800)
  - H1: `32px` (Weight: 700)
  - H2: `24px` (Weight: 600)
  - H3: `20px` (Weight: 600)
  - Body: `16px` (Weight: 400/500)
  - Small: `14px` (Weight: 400/500)
  - Caption: `12px` (Weight: 500)

## 4. Spacing & Geometry
- **Base Grid:** 4px grid (4, 8, 12, 16, 20, 24, 32, 40, 48px)
- **Radii:**
  - Small: `8px`
  - Medium: `12px`
  - Large: `16px`
  - Card: `18px`
  - Modal: `20px`
  - Pill: `999px`
- **Shadows:**
  - `0 1px 3px rgba(15, 23, 42, 0.05)`
  - `0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.05)`

## 5. Reusable Component Patterns
- **Trust Score Badge:** `98/100` circular progress ring or colored pill badge.
- **Verification Chip:** `✓ Verified Individual` or `✓ Verified Organization` with blue badge.
- **Distance Pill:** Soft gray pill with map pin icon and distance (e.g. `📍 1.2 km away`).
- **Status Pills:**
  - Pending: Warning yellow `#FEF3C7` text `#D97706`
  - Active/Accepted: Primary light `#DBEAFE` text `#1D4ED8`
  - Completed: Success light `#DCFCE7` text `#16A34A`
  - Urgent: Error light `#FEE2E2` text `#DC2626`
- **Bottom Navigation (Mobile):** 5-icon bar: Home, Services, Activity, Chat, Profile.

## 6. Shared Stitch Style Guide Block
```markdown
App name: SubShare (TrustShare)
Tagline: "Share Resources. Help Communities."
Platform: Mobile app (deviceType: MOBILE)
Aesthetic: Modern, trustworthy, consumer-grade (Airbnb/Uber/Fintech caliber). Clean white surfaces, subtle borders, soft cards.
Primary color: #2563EB (Dark #1D4ED8, Light #DBEAFE)
Success: #16A34A (Light #DCFCE7), Warning: #D97706 (Light #FEF3C7), Error: #DC2626 (Light #FEE2E2)
Background: #F6F8FB, Surface: #FFFFFF, Text: #172033, Muted: #667085, Border: #E5E7EB
Typography: Inter font with crisp hierarchy (H1 32px, H2 24px, Body 16px, Small 14px, Caption 12px)
Radius: 18px cards, 12px inputs/buttons, 999px pill badges.
Navigation: Mobile layout with top header, content area, and fixed bottom navigation bar (Home, Explore, Activity, Messages, Profile).
UI Elements: Trust badges (✓ Verified), Trust Score chips (e.g. 98/100), distance tags, and prominent primary blue CTAs.
```
