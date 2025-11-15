# Development & System Guide (Sections 11–13)

This document covers Development and Deployment (11), a System Demonstration Guide (12), and Evaluation Metrics & Testing (13). Placeholders are included where project-specific results or links should be filled in.

## 11. Development and Deployment

### 11.1 Installation Guide

- **Prerequisites**:
  - Node.js (recommended v20+)
  - pnpm (or npm/yarn, but commands below use `pnpm`)
  - Git
  - A database (Postgres/MySQL) if you need server-side data (see `scripts/` for SQL seeds)

- **Clone repository**:

```powershell
git clone <REPO_URL>
cd weatherhub
```

- **Install dependencies**:

```powershell
pnpm install
```

- **Environment variables**:
  - Create a `.env.local` file from `.env.example` (if available) or add required env vars. Typical vars:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `DATABASE_URL` (if using server DB)
    - `SOME_API_KEY`

- **Run development server**:

```powershell
pnpm dev
```

- **Build for production**:

```powershell
pnpm build
pnpm start
```

> Note: `package.json` currently provides `dev`, `build`, `start`, and `lint` scripts. There is no `test` script configured—see Section 13.

### 11.2 Version Control

- **Repository**: Replace `<REPO_URL>` above with the actual GitHub/GitLab URL for this project.
- **Branching strategy (recommended)**:
  - `main` — production-ready code only
  - `develop` — integration branch for completed features (optional)
  - `feature/<name>` — feature branches off `develop` or `main`
  - `release/<version>` — prepare a release
  - `hotfix/<name>` — urgent fixes applied to `main`

- **PR process**:
  - Create PR from `feature/*` to `develop` (or `main` if no `develop` exists)
  - Require at least one code review and passing CI checks before merge

### 11.3 Deployment

- **Recommended hosting (Next.js aware)**:
  - Vercel (recommended) — automatic Next.js support and preview deployments
  - Netlify — supports Next.js with adapter; use Next on Netlify docs
  - Firebase Hosting — possible for static frontends or when using serverless functions

- **Vercel quick deploy**:
  1. Connect repository to Vercel.
  2. Set build command: `pnpm build` (or `npm run build`/`yarn build`).
  3. Set output directory: default Next.js behavior (no change).
  4. Add environment variables in Vercel dashboard matching `.env.local`.
  5. Enable Preview Deployments for PRs.

- **CI/CD / GitHub Actions (example outline)**:
  - On push or pull_request to `main`/`develop`:
    1. Checkout
    2. Install Node and pnpm
    3. Install dependencies (`pnpm install`)
    4. Run lint (`pnpm lint`)
    5. Run tests (if configured)
    6. Build (`pnpm build`)
    7. Deploy (to Vercel via Vercel Git integration or upload artifacts)

  Example workflow steps (high level) — add a `.github/workflows/ci.yml` to implement.

## 12. System Demonstration Guide

This section is a step-by-step demo flow intended for product demos, stakeholder walkthroughs, or QA handoffs.

- **Prep**:
  - Ensure environment variables are set for the demo environment.
  - If demoing admin features, use seeded admin credentials from `scripts/05_seed_admin_user.sql` or create an admin account.

- **Demo flow (suggested)**:
  1. **Login**
     - Show the login screen (use `responder-login` / `volunteer-login` or `login` pages as appropriate).
     - Demo social or alternative logins if implemented.
  2. **Main features**
     - Show the dashboard/home page: weather cards, indices, risk predictions.
     - Open a `weather-card` and explain data sources and update cadence.
     - Show map view (`map/page.tsx`) and pan/zoom capabilities.
  3. **Reports**
     - Navigate to `reports/page.tsx` and demonstrate generating or viewing reports.
     - Export or filter results (show how filters work).
  4. **Responder/Volunteer flows**
     - Show responder login (`app/responder`) and the primary actions they can take (accept task, update status).
  5. **Admin functions**
     - Show admin-only pages (`app/admin`) — user management, notifications, system settings.
     - Demonstrate creating or editing emergency broadcasts, seeding users, or managing volunteers.

- **Checklist for a successful demo**:
  - Seeded data exists for users, responders, and volunteers.
  - Map tiles and external APIs reachable from the demo environment.
  - Demo account credentials available and tested.

## 13. Evaluation Metrics and Testing

This section lists the recommended tests and a sample results summary format. Replace the sample results with measured outcomes for your environment.

### 13.1 Functional Tests

- **Unit tests**: Validate small, isolated functions (e.g., `lib/` utilities, translators)
  - Tooling suggestion: Jest + React Testing Library
  - Command (example): `pnpm test` (not currently configured)
- **Integration tests**: Test interactions between components and services (pages, API calls)
  - Tooling suggestion: Playwright or Cypress for end-to-end UI flows.

Sample functional results:
- Unit tests: 0 tests configured — add Jest and write tests for `lib/*` and components. (Target: 80%+ coverage)
- Integration/E2E: Manual smoke tests performed for core flows — pass/fail per scenario.

### 13.2 Performance Tests

- **Load & responsiveness**:
  - Tooling suggestion: Lighthouse, WebPageTest, k6 for API load testing
- **Sample results**:
  - Lighthouse (Home page): Performance: 75, Accessibility: 92, Best Practices: 86, SEO: 90
  - API load test: 100 RPS sustained with average latency 120ms (example placeholder)

### 13.3 Security Tests

- **Dependency scanning**: GitHub Dependabot or `npm audit`/`pnpm audit` to surface known CVEs.
- **Static analysis / SAST**: Use tools like `eslint` with security plugins or third-party scanners.
- **Penetration tests**: OWASP ZAP or third-party pentest reports.

Sample security summary:
- Dependency scan: 0 critical CVEs in current dependency snapshot (replace with real scan results)
- OWASP ZAP baseline: No high-risk issues found in quick scan (detailed pentest recommended)

### 13.4 Usability & Accessibility Tests

- **Accessibility**: Run Lighthouse accessibility and axe-core checks; manually verify keyboard and screen-reader navigation.
- **Usability**: Conduct short user tests with 3–5 participants and aggregate qualitative feedback.

Sample usability summary:
- Lighthouse accessibility: 92
- Manual keyboard navigation: Minor issues on modals (tab order) — recommend fix

### How to add automated tests (quick start)

- Add Jest and test scripts:

```powershell
pnpm add -D jest @testing-library/react @testing-library/jest-dom ts-jest
# add a `test` script to package.json: "test": "jest"
```

- Add Playwright for E2E:

```powershell
pnpm add -D @playwright/test
npx playwright install
# add a script: "test:e2e": "playwright test"
```

---

If you'd like, I can:
- add a basic `test` script and Jest configuration,
- create a sample GitHub Actions CI workflow that lints and builds on PRs,
- or commit this README to the repository and open a PR.

File created: `README_DEVELOPMENT.md` (update `<REPO_URL>` and test results placeholders).
