# CoalGuard AI — Demonstration Accounts & Configuration
**Smart India Hackathon 2024 (SIH26024)**  
**Organization:** Ministry of Coal / Coal India Limited  
**System:** AI-Powered Smart Governance & Compliance Monitoring System for Coal Mines  

> [!CAUTION]
> **SIH DEMONSTRATION ONLY — NOT FOR PRODUCTION USE**  
> The credentials and accounts described in this document are strictly designed for Smart India Hackathon operational evaluation and evaluation judging sessions. Do not use in production.

---

## 1. Named SIH Team Demonstration Accounts

The system is configured with six named demo accounts corresponding to the Smart India Hackathon team personas. Each account illustrates a dedicated role in the multi-tier governance hierarchy under Coal India Limited.

| Persona Name | Email Address | Role Key | Role Label | Operational Scope |
|---|---|---|---|---|
| **Alfhi** | `alfhi.demo@sih26024.test` | `SUPER_ADMIN` | Super Admin | Organization-wide (All 4 Mines, System Admin, Audit Logs) |
| **Rabbani** | `rabbani.demo@sih26024.test` | `CORPORATE_ADMIN` | Corporate Admin | Corporate Governance (Multi-Mine Oversight, Compliance) |
| **Akshay** | `akshay.demo@sih26024.test` | `MINE_MANAGER` | Mine Manager | Scoped to **Shakti Open Cast Mine** (`SHK-DEMO`) |
| **Krishna** | `krishna.demo@sih26024.test` | `INSPECTOR` | Inspector | Field Safety & Statutory Inspections (Shakti OCP) |
| **Koushik** | `koushik.demo@sih26024.test` | `CONTRACTOR` | Contractor | Scoped to **Alpha Mining Services** (`REG-DEMO-001`) |
| **Hema** | `hema.demo@sih26024.test` | `REGULATOR` | Regulator | Statutory Regulatory Oversight (DGMS / SPCB Returns) |

**Demo Password for All Six Accounts:**
```
demo123
```

---

## 2. Authentication Methods

Judges and evaluators can authenticate into CoalGuard AI via two supported mechanisms:

### Method A: Direct Supabase Authentication
1. Navigate to the login screen at `http://localhost:3000/login`.
2. Enter the team member's email address (e.g., `akshay.demo@sih26024.test`).
3. Enter password: `demo123`.
4. Click **Sign in**. The live session will authenticate against Supabase GoTrue Auth, enforce Row-Level Security (RLS), and redirect to `/dashboard`.

### Method B: One-Click Demo Workspace Selector
1. On the login screen or in the top navigation bar, use the **Demo persona** dropdown selector.
2. Select any of the six team personas:
   - `Alfhi — Super Admin`
   - `Rabbani — Corporate Admin`
   - `Akshay — Mine Manager`
   - `Krishna — Inspector`
   - `Koushik — Contractor`
   - `Hema — Regulator`
3. Click **Enter demo workspace** to immediately explore the role-tailored dashboard and permissions.

---

## 3. Multilingual Support (English, Hindi, Telugu)

CoalGuard AI provides complete internationalization across both the Next.js web application and the React Native / Expo field mobile application.

### Supported Language Codes:
1. **English (`en`)** — Default statutory language
2. **Hindi (`hi`)** — हिन्दी (Official Central Government Language)
3. **Telugu (`te`)** — తెలుగు (Regional Coal Mining Belt Language: SCCL / Godavari Valley)

### Language Switching & Persistence:
- **Web Application:** Select language from the Globe dropdown in the top header. The preference is persisted across browser refreshes via `localStorage` (`coalguard.locale`).
- **Mobile Application:** Select language directly on the login screen or field workspace dashboard. Preferences are stored persistently via `AsyncStorage` and function completely offline in low-connectivity underground/open-cast mine environments.

---

## 4. Multi-Role Demonstration Walkthroughs

### Flow A: Super Admin (Alfhi)
- **Login:** `alfhi.demo@sih26024.test` / `demo123`
- **Focus Areas:**
  - View full organization hierarchy: Coal India Limited -> SECL -> 4 Mines (`SHK-DEMO`, `SUR-DEMO`, `PRG-DEMO`, `ADT-DEMO`).
  - View full system audit logs (`/audit`), AI governance models, and corporate reports.

### Flow B: Corporate Admin (Rabbani)
- **Login:** `rabbani.demo@sih26024.test` / `demo123`
- **Focus Areas:**
  - Multi-mine compliance health monitoring (`/compliance`).
  - Cross-subsidiary safety KPIs and environmental returns.

### Flow C: Mine Manager (Akshay)
- **Login:** `akshay.demo@sih26024.test` / `demo123`
- **Focus Areas:**
  - Shakti Open Cast Mine dashboard (`/dashboard` scoped to Shakti).
  - Review open Corrective and Preventive Actions (CAPA) (`/corrective-actions`).
  - Review live production vs. statutory target metrics (`/production`).

### Flow D: Inspector (Krishna)
- **Login:** `krishna.demo@sih26024.test` / `demo123`
- **Focus Areas:**
  - Routine statutory safety inspections (`/inspections`).
  - Capture field safety observations with severity ratings (`/observations`).
  - Offline mobile inspection sync in the Expo field app.

### Flow E: Contractor (Koushik)
- **Login:** `koushik.demo@sih26024.test` / `demo123`
- **Focus Areas:**
  - Contractor dashboard isolated to Alpha Mining Services (`/contractors`).
  - Restricted from administrative mutation, mine management, or unrelated contractor records under strict Row-Level Security.

### Flow F: Regulator (Hema)
- **Login:** `hema.demo@sih26024.test` / `demo123`
- **Focus Areas:**
  - Regulatory returns review (DGMS safety compliance & SPCB environmental clearances).
  - Inspection audit trail and statutory compliance verifications.
