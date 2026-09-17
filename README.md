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
Store Locally
    ↓
Network Available
    ↓
Sync Queue
    ↓
Server
