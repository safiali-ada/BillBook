# BillBook — Invoice & Inventory Management

A production-quality web application for small businesses to manage products, customers, invoices, and inventory. Runs entirely on free-tier infrastructure.

---

## Features

- **Product & Rate List Management**: Comprehensive catalog management with CSV import and export capabilities.
- **Customer Management**: Maintain customer records, billing addresses, and GSTIN details.
- **Invoice Creation**: Fast invoice authoring with product instant-search, editable prices, multi-level discounts (line-item & invoice-level), and configurable GST.
- **Automatic Inventory Tracking**: Automated stock deduction on finalized invoices, inventory audit logs, and low-stock threshold alerts.
- **PDF Invoice Generation**: Professional, print-ready PDF invoice generation directly from the browser.
- **Reports & Data Export**: Sales reports, customer purchase history, and CSV data export for accounting.
- **Progressive Web App (PWA)**: Installable on desktop and mobile devices for fast, offline-capable access.

---

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, TypeScript
- **Backend**: Cloudflare Workers, Hono, TypeScript
- **Database**: Supabase PostgreSQL (with Row-Level Security)
- **Auth**: Supabase Auth (JWT-based authentication)

---

## Prerequisites

Before setting up the project, ensure you have the following installed and configured:

- **Node.js**: 18.0.0 or higher
- **Package Manager**: `npm` (v9+) or `pnpm`
- **Supabase Account**: [Supabase](https://supabase.com) (free tier)
- **Cloudflare Account**: [Cloudflare](https://cloudflare.com) (free tier)
- **Wrangler CLI**: Install globally via `npm install -g wrangler`

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/BillBook.git
cd BillBook
```

### 2. Set Up Supabase

1. Create a new project in the [Supabase Dashboard](https://supabase.com/dashboard).
2. Open the **SQL Editor** in your Supabase project.
3. Execute the SQL migration files in order:
   - `database/001_schema.sql`
   - `database/002_rls.sql`
   - `database/003_functions.sql`
   - `database/004_triggers.sql`
   - `database/005_seed.sql`
4. Retrieve your project credentials from **Project Settings > API**:
   - Project URL (`SUPABASE_URL`)
   - Project API Anon Key (`SUPABASE_ANON_KEY`)
   - Project Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`)
   - JWT Secret (`SUPABASE_JWT_SECRET`) from **Project Settings > API > JWT Settings**

### 3. Set Up the Frontend

```bash
cd frontend
npm install
cp ../.env.example .env
# Edit .env with your Supabase URL and anon key
npm run dev
```

### 4. Set Up the Backend

```bash
cd backend
npm install
# Create .dev.vars file with Supabase credentials
echo 'SUPABASE_URL=https://your-project-ref.supabase.co' > .dev.vars
echo 'SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key' >> .dev.vars
echo 'SUPABASE_JWT_SECRET=your-supabase-jwt-secret' >> .dev.vars
npm run dev
```

### 5. Access the Application

Open your browser and navigate to [http://localhost:5173](http://localhost:5173).

---

## Deployment

### Frontend (Cloudflare Pages)

```bash
cd frontend
npm run build
# Deploy via Cloudflare Pages dashboard or wrangler CLI
wrangler pages deploy dist
```

Alternatively, connect your GitHub repository directly to Cloudflare Pages:
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Environment variables**: Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_URL`

### Backend (Cloudflare Workers)

```bash
cd backend

# Configure production secrets
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put SUPABASE_JWT_SECRET

# Deploy to Cloudflare Workers
npm run deploy
```

---

## Project Structure

```text
BillBook/
├── .env.example              # Template for environment variables
├── .gitignore                # Git ignore rules
├── README.md                 # Project documentation
├── shared/                   # Shared TypeScript models and utilities
│   ├── types.ts              # Common interfaces and domain types
│   └── calculations.ts       # Shared monetary and invoice calculations
├── frontend/                 # React + Vite frontend application
│   ├── public/               # Static assets & PWA manifest
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── pages/            # Application route views
│   │   ├── services/         # API & Supabase client services
│   │   └── utils/            # Frontend helper functions
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # Cloudflare Workers + Hono REST API
│   ├── src/
│   │   ├── middleware/       # Auth & validation middleware
│   │   ├── routes/           # API route handlers
│   │   └── index.ts          # Worker entry point
│   ├── wrangler.toml         # Cloudflare Worker configuration
│   └── package.json
└── database/                 # Supabase PostgreSQL schema and migrations
    ├── 001_schema.sql        # Tables, relations, and enums
    ├── 002_rls.sql           # Row-level security policies
    ├── 003_functions.sql     # Stored procedures and business logic
    ├── 004_triggers.sql      # Automated triggers (audit, inventory)
    └── 005_seed.sql          # Initial seed data
```

---

## Free Tier Limits

BillBook is architected to operate sustainably within the generous free tiers offered by Cloudflare and Supabase:

| Service | Metric | Free Tier Allowance | BillBook Usage Estimate |
| :--- | :--- | :--- | :--- |
| **Cloudflare Workers** | Daily Requests | 100,000 requests / day | ~500–2,000 requests / day for small shops |
| **Cloudflare Workers** | CPU Time | 10ms per request | < 5ms average execution time |
| **Cloudflare Pages** | Deployments / Builds | 500 builds / month | ~20–50 builds / month |
| **Cloudflare Pages** | Bandwidth & Requests | Unlimited | Static frontend hosting |
| **Supabase Database** | PostgreSQL Storage | 500 MB | ~100,000+ invoices & records |
| **Supabase Auth** | Monthly Active Users | 50,000 MAUs | Multi-user per shop supported |
| **Supabase File Storage**| Asset Storage | 1 GB | Logos and exported reports |
| **Supabase Bandwidth**  | Egress Bandwidth | 2 GB / month | Lightweight JSON API payload |
| **Supabase Edge Functions** | Invocations | 500,000 invocations / month | Fallback / alternative execution |

---

## License

This project is licensed under the [MIT License](LICENSE).
