# North Star Sanctuary

A full-stack nonprofit management platform built for INTEX W26 (BYU IS 401 / IS 413 / IS 414 / IS 455). Inspired by [Lighthouse Sanctuary](https://lighthousesanctuary.org), North Star Sanctuary helps organizations protect and rehabilitate survivors of abuse and trafficking by combining case management, donor engagement, and AI-driven insights into a single system.

## Project Context

The client needed technology to solve three core problems before launch:

1. **Donor retention & growth** — Understanding which donors are at risk of lapsing, which campaigns drive real donations vs. just engagement, and how to connect donor generosity to resident outcomes.
2. **Case management** — Tracking residents across the full rehabilitation lifecycle (intake → counseling → education → health → reintegration) so no one falls through the cracks.
3. **Social media strategy** — Making data-driven decisions about what to post, where, and when to maximize donation conversions without a dedicated marketing team.

All of this must be done with security and privacy as a first-class concern, given the sensitive nature of the data involving minor abuse survivors.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Routing | React Router v6 |
| UI | Tailwind CSS, shadcn/ui (Radix UI), Framer Motion, Recharts |
| State / Data | TanStack React Query v5, React Hook Form, Zod |
| Backend | ASP.NET Core (.NET 10), Entity Framework Core |
| Database | SQLite (development) / Azure SQL, MySQL, or PostgreSQL (production) |
| Auth | ASP.NET Identity with RBAC |
| API Docs | OpenAPI / Swagger |
| Deployment | Microsoft Azure |

## Project Structure

```
Intex2026/
├── frontend/                  # React/TypeScript SPA
│   ├── src/
│   │   ├── pages/             # Route-level page components
│   │   ├── components/        # Shared UI components
│   │   ├── services/          # API / mock data layer
│   │   └── lib/               # Utilities
│   └── public/
├── backend/
│   └── Intex2026/             # ASP.NET Core Web API (.NET 10)
├── ML pipelines/              # Jupyter notebooks and CSV datasets
│   └── lighthouse_csv_v7/    # 17 source CSV files
├── INTEXInstructions/         # Case study PDF
└── README.md
```

## Application Pages

### Public (Unauthenticated)

| Route | Description |
|---|---|
| `/` | Landing page — mission, impact stats, programs, calls to action |
| `/impact` | Donor-facing dashboard — anonymized aggregate outcomes |
| `/about` | About the organization |
| `/privacy` | GDPR-compliant privacy policy |
| `/login` | Username/password authentication |

### Admin / Staff Portal (Authenticated)

| Route | Description |
|---|---|
| `/admin` | Command center — active residents, recent donations, upcoming conferences |
| `/admin/donors` | Supporter profiles, contribution tracking (monetary, in-kind, time, skills, social media), donation allocations |
| `/admin/caseload` | Core case management — resident profiles, case categories, demographics, reintegration tracking; filterable by status, safehouse, and case category |
| `/admin/recordings` | Process recordings — dated counseling session notes (emotional state, narrative, interventions, follow-up) |
| `/admin/visitations` | Home visitation logs and case conference history |
| `/admin/reports` | Donation trends, resident outcome metrics, safehouse performance, reintegration success rates |
| `/admin/insights` | AI-powered donor churn predictions and resident risk scores |

## Security Requirements (IS 414)

- **HTTPS/TLS** with HTTP → HTTPS redirect
- **ASP.NET Identity** authentication with hardened password policy
- **Role-based access control (RBAC)** — admin, donor, and public roles
- All CUD API endpoints require authentication and appropriate authorization
- **Confirmation required** before any data deletion
- **Credentials** stored outside the repository (`.env` / environment variables / secrets manager)
- **GDPR-compliant privacy policy** linked from site footer
- **Cookie consent** notification (functional)
- **Content-Security-Policy (CSP)** HTTP header configured
- Publicly deployed to cloud provider

## Machine Learning Pipelines (IS 455)

ML pipelines live in `ml-pipelines/` as self-contained Jupyter notebooks. Each pipeline follows the full end-to-end lifecycle:

1. Problem Framing
2. Data Acquisition, Preparation & Exploration
3. Modeling & Feature Selection
4. Evaluation & Interpretation
5. Causal and Relationship Analysis
6. Deployment Notes

Each pipeline targets a different business problem across the three data domains.

### Data Domains & Tables

**Donor and Support Domain**

| Table | Description |
|---|---|
| `safehouses` | Physical safehouse locations (Philippines) |
| `partners` | Service delivery organizations and individuals |
| `partner_assignments` | Partner → safehouse → program area assignments |
| `supporters` | Donors, volunteers, skills contributors, advocates |
| `donations` | All donation events (monetary, in-kind, time, skills, social media) |
| `in_kind_donation_items` | Line-item details for in-kind donations |
| `donation_allocations` | How donations are split across safehouses and program areas |

**Case Management Domain**

| Table | Description |
|---|---|
| `residents` | Case records for girls served (modeled after Philippine social welfare agency format) |
| `process_recordings` | Structured counseling session notes |
| `home_visitations` | Home and field visit records |
| `education_records` | Monthly education progress and attendance |
| `health_wellbeing_records` | Monthly physical health, nutrition, sleep, and energy |
| `intervention_plans` | Individual goals and services per resident |
| `incident_reports` | Safety and behavioral incident records |

**Outreach and Communication Domain**

| Table | Description |
|---|---|
| `social_media_posts` | Posts with content, metadata, and engagement metrics across all platforms |
| `safehouse_monthly_metrics` | Pre-aggregated monthly outcome metrics per safehouse |
| `public_impact_snapshots` | Anonymized monthly aggregate reports for public/donor communication |

## Getting Started

### Prerequisites

- Node.js 20+
- .NET 10 SDK

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173`.

### Backend

```bash
cd backend/Intex2026
dotnet restore
dotnet run
```

Swagger UI available at `http://localhost:<port>/swagger`.

## Design System

| Token | Value |
|---|---|
| Navy | `#0B1F3A` |
| Gold | `#E6B857` |
| Cream | `#F4F0E8` |
| Terracotta | `#D98472` |
| Sage | `#779688` |

Headings use **Playfair Display**; body/UI uses **Inter**. The design follows a soft editorial style with navy-to-cream gradients, generous whitespace, and warm human-centered tone. All pages are responsive and target a Lighthouse accessibility score of 90%+.

## Submission Details

- **Due:** Friday, April 10, 2026 at 10:00 AM
- **Presentation:** 20-minute tech demo + 5-minute Q&A panel
- **Peer eval:** Required by April 10 at 11:59 PM
- GitHub repository must be set to **Public** for grading
