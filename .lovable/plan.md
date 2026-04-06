

# North Star Sanctuary — Premium Nonprofit Platform

## Overview
A production-quality frontend application for North Star Sanctuary, a nonprofit supporting survivors of abuse and trafficking. The design will be editorial, emotional, and human-centered — inspired by Apple/Stripe-level polish blended with high-end nonprofit storytelling.

## Branding & Design System
- **Colors**: Navy `#0B1F3A`, Gold `#E6B857`, Cream `#F4F0E8`, Terracotta `#D98472`, Sage `#779688`
- **Typography**: Playfair Display (headings), Inter (body/UI)
- **Style**: Soft navy→cream gradients, asymmetric layouts, layered depth, generous whitespace, warm and human tone
- **Dark mode** toggle with localStorage persistence

## Pages & Features

### 1. Public Landing Page (Hero)
- Full-bleed hero with emotionally powerful headline, subtle parallax/gradient background, and dual CTAs (Donate Now, Learn More)
- Impact stats woven into an asymmetric, editorial layout (not cards) — e.g., large typography with animated counters
- Storytelling section with survivor narratives (anonymized, respectful), using pull-quotes and editorial photography placeholders
- Programs & services presented with illustrated icons and staggered layout
- Trust section: financials transparency, partner logos, certifications
- Final full-width CTA band for donations

### 2. Public Impact Dashboard
- Donor-facing transparency page with animated charts (recharts): funds raised, survivors helped, program outcomes
- Campaign progress bars with storytelling context
- "Your Dollar at Work" visual breakdown
- Testimonials interleaved with data

### 3. Login Page
- Split layout: left side with branded emotional imagery/gradient, right side with clean login form
- Subtle entrance animations, social login buttons (simulated), forgot password link

### 4. Admin / Staff Dashboard
- Calm, focused layout with overview cards: residents count, monthly donations, active alerts
- Priority alerts panel (urgent cases highlighted with terracotta accents)
- Program utilization donut/bar charts
- **AI Insights panel**: donor churn predictions, resident risk scores, recommended actions — surfaced as actionable cards

### 5. Data Management Pages (5 sub-pages)
- **Donors & Contributions**: Searchable/filterable table with donor profiles, donation history, AI-predicted churn risk badges
- **Caseload Inventory**: Resident list with status indicators, risk/progress tracking, AI-flagged attention items
- **Process Recordings**: Document list with metadata, status tags, upload simulation
- **Home Visitations**: Schedule view + log entries with filters
- **Reports & Analytics**: Chart-heavy page with date range filters, export buttons, social media performance insights (AI)

### 6. Privacy Policy + Cookie Consent
- Clean, well-structured privacy policy page with table of contents
- Subtle slide-up cookie consent banner with accept/customize options

## Cross-Cutting Features
- **Responsive**: Mobile-first, all pages work beautifully on phone/tablet/desktop
- **Accessibility**: Proper contrast ratios, focus states, semantic HTML, aria labels
- **Loading states**: Skeleton loaders on all data-heavy views
- **Empty states**: Illustrated, helpful empty states with CTAs
- **Microinteractions**: Hover lifts, button transitions, smooth page transitions
- **Simulated data**: Realistic mock data with simulated API calls (delays, loading, occasional error states)
- **Navigation**: Public nav (Home, Impact, Login) + Admin sidebar with collapsible groups

## Component Architecture
- Reusable: `StatCard`, `MetricChart`, `DataTable`, `AIInsightCard`, `StoryCard`, `CookieBanner`, `SkeletonLoader`, `EmptyState`
- Layout wrappers: `PublicLayout`, `AdminLayout` with sidebar
- Theme provider with dark mode context
- Mock data service layer (simulating API calls with delays)

