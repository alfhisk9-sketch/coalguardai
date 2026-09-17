# 🛡️ CoalGuard AI

### AI-Powered Smart Governance & Compliance Monitoring System for Coal Mines

> **Smart India Hackathon 2026 — Problem Statement SIH26024**  
> **Ministry of Coal / Coal India Limited**

CoalGuard AI is an AI-powered governance and compliance monitoring platform designed to help coal-mining organizations monitor statutory compliance, inspections, safety incidents, corrective actions, contractors, environmental data, production, and field operations through a unified digital platform.

The system combines **AI-powered risk intelligence, role-based governance, GIS visualization, offline field operations, multilingual support, and centralized compliance management**.

---

## 🚀 Key Highlights

- 🤖 **Gemini AI-powered intelligence**
- 📊 Compliance and operational dashboards
- ⚠️ AI-based risk scoring
- 🔎 Anomaly detection
- 🧠 AI governance assistant
- 📋 Digital inspections and observations
- 🛠️ Corrective Action / CAPA management
- 🚨 Incident and safety management
- 🗺️ GIS-based mine visualization
- 📄 Document and OCR intelligence
- 👷 Contractor and workforce management
- 🌱 Environmental monitoring
- ⛏️ Production monitoring
- 🔔 Notifications and workflow management
- 🔐 Role-Based Access Control (RBAC)
- 🛡️ Supabase Row-Level Security (RLS)
- 📱 Offline-first mobile field application
- 🌐 English, Hindi and Telugu support
- 📜 Audit logging
- 📈 Reports and governance analytics

---

# 🎯 Problem Statement

**SIH26024 — AI-Based Smart Governance & Compliance Monitoring System for Coal Mines**

Coal-mining operations involve complex regulatory requirements, safety inspections, environmental monitoring, contractor management, production reporting, and corrective actions.

Traditional workflows can result in:

- fragmented compliance records
- delayed identification of risks
- manual inspection processes
- limited visibility across mines
- difficulty tracking corrective actions
- disconnected field and management workflows
- delayed escalation of critical issues

CoalGuard AI addresses these challenges through a centralized digital governance platform.

---

# 💡 Our Solution

CoalGuard AI provides a unified platform where authorized users can:

1. Monitor mine compliance.
2. Conduct digital inspections.
3. Record safety observations.
4. Track incidents.
5. Create and monitor corrective actions.
6. Manage contractors and workers.
7. Monitor environmental readings.
8. Track production performance.
9. Visualize mine information using GIS.
10. Analyze compliance and operational risks using AI.
11. Detect anomalies and emerging risk patterns.
12. Access governance information through an AI assistant.
13. Work in low-connectivity field environments.
14. Operate the platform in English, Hindi and Telugu.
15. Maintain an auditable record of important activities.

---

# 🧠 AI Capabilities

CoalGuard AI integrates Google's Gemini API through a server-side AI abstraction.

### AI Risk Intelligence

The system evaluates operational signals such as:

- compliance deficits
- overdue requirements
- observation severity
- incident severity
- corrective-action backlog

The result provides a structured risk assessment with:

- Risk Score
- Risk Level
- Contributing Factors
- Recommended Actions
- AI Explanation

### Anomaly Detection

The platform can identify patterns such as:

- unusual compliance delays
- incident clusters
- critical observations
- emerging operational risks

### Inspection Intelligence

Inspection observations can be analyzed by AI to generate:

- executive findings
- important observations
- risk interpretation
- recommended actions

The system uses real observation identifiers rather than inventing database records.

### AI Governance Assistant

The AI Assistant provides domain-focused governance assistance while respecting:

- user permissions
- mine scope
- RBAC
- data access restrictions
- prompt-injection defenses

The assistant is designed to prevent unauthorized SQL/data access and credential disclosure.

### AI Fallback

CoalGuard AI maintains a deterministic fallback service so the application remains functional when Gemini is unavailable.

---

# 👥 Role-Based Governance

CoalGuard AI supports six major roles:

| Role | Purpose |
|---|---|
| SUPER_ADMIN | Organization-wide administration |
| CORPORATE_ADMIN | Corporate governance and multi-mine oversight |
| MINE_MANAGER | Mine-level management |
| INSPECTOR | Field inspections and observations |
| CONTRACTOR | Contractor-specific operations |
| REGULATOR | Regulatory oversight |

Access is controlled using application-level RBAC together with Supabase Row-Level Security.

---

# 👨‍💻 SIH Demo Accounts

The project includes six named demonstration personas representing the SIH team.

| Team Member | Role |
|---|---|
| **Alfhi** | Super Admin |
| **Rabbani** | Corporate Admin |
| **Akshay** | Mine Manager |
| **Krishna** | Inspector |
| **Koushik** | Contractor |
| **Hema** | Regulator |

> **Demo accounts are for SIH demonstration purposes only.**

---

# 🌐 Multilingual Support

CoalGuard AI supports:

- 🇬🇧 English (`en`)
- 🇮🇳 Hindi (`hi`)
- 🇮🇳 Telugu (`te`)

### Web

A language selector is available in the application interface.

The selected language is persisted locally.

### Mobile

The CoalGuard Field mobile application provides a touch-friendly language picker and persists the selected language for offline use.

---

# 📱 CoalGuard Field

**CoalGuard Field** is the mobile field-operations application built with React Native and Expo.

It is designed for inspectors and field personnel working in environments where network connectivity may be limited.

### Mobile capabilities

- Authentication
- Inspection workflows
- GPS/location capture
- Observation recording
- Photo/evidence capture
- Offline inspection queue
- Retry and synchronization
- Incident reporting
- Attendance workflows
- Multilingual interface

### Offline-first workflow

```text
Field User
    ↓
Create Inspection
    ↓
Capture GPS
    ↓
Record Observation
    ↓
Attach Evidence
    ↓
Store Locally (AsyncStorage)
    ↓
Network Available
    ↓
Sync Queue (Idempotent clientOperationId)
    ↓
Supabase Server
```

---

# 🔑 Demo Account Credentials & Scope

All six named demonstration personas are provisioned with real-world mining scopes:

| Persona | Role Key | Email Address | Operational Scope |
|---|---|---|---|
| **Alfhi** | `SUPER_ADMIN` | `alfhi.demo@sih26024.test` | Organization-wide (All 4 Mines, Audit Logs, Settings) |
| **Rabbani** | `CORPORATE_ADMIN` | `rabbani.demo@sih26024.test` | Corporate Governance (Multi-Mine Oversight, Compliance) |
| **Akshay** | `MINE_MANAGER` | `akshay.demo@sih26024.test` | Scoped to **Shakti Open Cast Mine** (`SHK-DEMO`) |
| **Krishna** | `INSPECTOR` | `krishna.demo@sih26024.test` | Field Safety & Statutory Inspections |
| **Koushik** | `CONTRACTOR` | `koushik.demo@sih26024.test` | Scoped to **Alpha Mining Services** (`REG-DEMO-001`) |
| **Hema** | `REGULATOR` | `hema.demo@sih26024.test` | Statutory Regulatory Oversight (DGMS / SPCB Returns) |

> **Universal Password:** `demo123`  
> Evaluators may also use the **One-Click Demo Workspace Persona Selector** on the web login screen for instant role switching without typing.

---

# 🏗️ Monorepo Architecture

```
coalguardai/
├── apps/
│   ├── web/                    # Next.js 14 App Router web platform
│   │   ├── app/                # Pages & Server Route Handlers (/api/*)
│   │   ├── components/         # UI Design System, GIS Leaflet map, Dashboards
│   │   └── lib/                # Supabase SSR client, Gemini AI engine, auth context
│   └── mobile/                 # Expo (React Native) cross-platform mobile app
│       ├── src/                # Offline queue state machine, GPS capture, screens
│       └── tests/              # Offline transition & idempotency unit tests
├── packages/
│   ├── types/                  # Shared TypeScript domain contracts & DTOs
│   ├── validation/             # Shared Zod validation schemas
│   └── config/                 # Roles, permissions, constants, and locale dictionaries
├── supabase/
│   └── migrations/             # 11 PostgreSQL schema migrations with RLS policies
├── scripts/                    # Idempotent database seeding & verification utilities
└── docs/                       # Architectural specifications, AI security, API specs
```

---

# 🧪 Verified Quality Gates

| Gate | Status | Command | Details |
|---|:---:|---|---|
| **Web Typecheck** | **PASS** | `npm run typecheck --workspace=apps/web` | TypeScript 5.5, 0 errors |
| **Mobile Typecheck** | **PASS** | `npm run typecheck --workspace=apps/mobile` | TypeScript 5.5, 0 errors |
| **Web Linter** | **PASS** | `npm run lint --workspace=apps/web` | Next.js ESLint, 0 warnings/errors |
| **Web Unit & Contract Tests** | **PASS** | `npm run test --workspace=apps/web` | **92 unit & API contract tests passed** |
| **Mobile Offline Queue Tests** | **PASS** | `npm run test --workspace=apps/mobile` | **15 offline state machine tests passed** |
| **Production Web Build** | **PASS** | `npm run build --workspace=apps/web` | **25 static/dynamic pages + 30 API routes compiled** |

---

# ⚡ Quickstart Guide

### Prerequisites
- [Node.js](https://nodejs.org/) v20.x or later
- npm v10.x or later

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/alfhisk9-sketch/coalguardai.git
cd coalguardai
npm install
```

### 2. Configure Environment Variables
Copy the template configuration:
```bash
cp .env.example apps/web/.env.local
```

Populate keys in `apps/web/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GEMINI_API_KEY=your-gemini-api-key
GEMINI_ENABLED=true
NEXT_PUBLIC_DEMO_MODE=true
```

### 3. Run Automated Tests & Verifications
```bash
# Run web contract & AI integration tests
npm run test --workspace=apps/web

# Run mobile offline queue resilience tests
npm run test --workspace=apps/mobile
```

### 4. Launch Development Servers

#### Web Application (Next.js)
```bash
npm run dev --workspace=apps/web
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Mobile Field Application (Expo)
```bash
npm run start --workspace=apps/mobile
```
Scan the QR code via Expo Go on Android/iOS.

---

# 👥 Team Attribution

Developed with pride for **Smart India Hackathon 2024 / 2026 (SIH26024)**  
**Team Personas & Engineering Leads:**  
- **Alfhi** — *System Architecture & Full-Stack Integration*
- **Rabbani** — *Frontend Engineering & Mobile Client*
- **Akshay** — *Mine Operations & Statutory Compliance Workflow*
- **Krishna** — *Field Safety & Inspection Framework*
- **Koushik** — *Contractor Management & Security*
- **Hema** — *Regulatory Affairs & Environmental Analytics*

