# Super Admin Dashboard (Next.js 14 + Tailwind CSS)

Platform governance control center for managing the Multi-Tenant Virtual Try-On ecosystem.

## Technology Stack
- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS & Dark Glassmorphism
- Icons: Lucide React

## Standalone Execution

### 1. Install Dependencies & Configure Environment
```bash
npm install
cp .env.example .env
```

### 2. Development Mode
```bash
npm run dev
# Dashboard runs at http://localhost:3002
```

### 3. Production Build & Start
```bash
npm run build
npm start
```

## Features
- **Platform Overview:** Global tenant counts (Active vs. Suspended), platform GMV, total AI fittings
- **Tenant Access Governance:** Searchable directory with instantaneous one-click Suspend / Reactivate controls
- **AI Infrastructure Monitor:** Status of `ai-service`, active adapter, latency metrics, and success rates
- **Subscription Quotas:** Free, Pro, and Enterprise entitlement management
- **Audit Logs:** Immutable trail of administrative actions
