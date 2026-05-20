# EduSpace — Frontend Web App

Admin web application for **EduSpace**, a classroom management platform developed as an academic IoT project. Deployed on Vercel; backend is a .NET API on Azure Container Apps (Brazil South).

Web access is admin-only. Teachers and other roles use the mobile app — the web app displays a warning toast when a non-admin JWT is returned.

## Documentation

- `PROJECT.md` — exhaustive reference: every service method, every route, every guard rule, every known issue. Read this before touching any feature. It supersedes this README where they conflict.
- `CLAUDE.md` — Vue/Options API conventions for this repo and AI-assistant guidance.
- `../CLAUDE.md` — workspace overview, sub-project map, cross-project decisions.

## Tech Stack

| Layer | Library / Version |
|-------|-------------------|
| Framework | Vue 3 (Options API exclusively) |
| Build | Vite 6 |
| UI components | PrimeVue 4 (Aura preset) |
| State | Vuex 4 |
| Routing | Vue Router 4 |
| HTTP | Axios 1.7 |
| Calendar | FullCalendar 6 (Vue 3 adapter) |
| Charts | Chart.js 4 (via `<pv-chart>`) |

No test framework is installed. No i18n library is installed. All UI strings are hardcoded Spanish.

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Backend API running (see `../eduspace-platform/`)

### Install and Run

```bash
git clone https://github.com/DesarrolloSolucionIoT/eduspace-frontend-web-app.git
cd eduspace-frontend-web-app
npm install
npm run dev
```

App runs at `http://localhost:5173`.

### Environment

Create `.env.local` at the repo root:

```env
VITE_API_BASE_URL=https://localhost:7238/api/v1
```

If the variable is missing, Axios falls back to `/api/v1`. In local dev this hits the Vite dev server with no proxy configured — all API calls return 404. The variable is required for local development.

In production (Vercel), `VITE_API_BASE_URL` is intentionally absent. Calls go to `/api/v1`, which `vercel.json` rewrites to the Azure backend, avoiding CORS issues.

A committed `.env.example` contains the local value for reference.

### Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Serve the built output |
| `npm run lint` | ESLint with `--fix` over `.vue`, `.js`, `.jsx` |

There is no `test` script. No test runner is configured.

## Project Structure

DDD-aligned bounded contexts mirror the backend.

```
src/
├── iam/                                    # Authentication (sign-in, activation, registration)
│   ├── login/
│   │   ├── components/login-form.component.vue
│   │   └── pages/activate.component.vue    # /activate — reads ?token from email link
│   ├── register/
│   │   ├── components/register-form.component.vue
│   │   ├── pages/register.component.vue    # dead code — not routed
│   │   └── services/register.services.js
│   ├── shared/pages/auth-split-screen.component.vue  # actual /login + /register page
│   ├── model/
│   └── services/
│       ├── authentication.service.js       # used by Vuex action and activate page
│       ├── authentication.guard.js         # dead code — never imported
│       └── authentication.interceptor.js   # dead code — never imported
├── dashboard-admin/pages/                  # Admin dashboard pages (no domain-level model/services)
│   ├── home-admin.component.vue
│   ├── personal-data.component.vue
│   ├── teachers-management.component.vue
│   ├── classroom-changes-meetings.component.vue
│   └── classrooms-shared-spaces.component.vue
├── classroom-space-resource-management/    # Classrooms, shared spaces, resources — CRUD
│   ├── components/
│   ├── model/
│   ├── pages/
│   └── services/
├── meeting-management/                     # Meetings — CRUD + teacher assignment
│   ├── components/
│   ├── model/
│   ├── pages/
│   └── services/
├── personal-data/                          # Teacher profiles — admin-managed
│   ├── components/
│   ├── model/
│   └── services/
├── profiles/                               # Stub — administrator.service.js only, no pages/routes
├── iot-monitoring/                         # IoT sensor monitoring — mock data only
│   ├── components/space-sensor-card.component.vue
│   ├── model/iot-space.entity.js
│   ├── pages/iot-monitoring.component.vue
│   └── services/
│       ├── iot-monitoring.service.js       # reads db.json, zero HTTP calls
│       └── db.json                         # 20 hardcoded spaces — Sprint 1 mock
├── public/pages/home.component.vue         # Placeholder landing, no auth required
├── shared/
│   ├── components/
│   ├── pages/
│   │   └── not-found.component.vue         # 404 catch-all — shows path, routes to login or home-admin
│   ├── services/
│   │   ├── http-common.js                  # single Axios instance + interceptors
│   │   └── classroom.service.js            # shared aggregate, used by multiple domains
│   └── utils/
│       ├── value-object-unwrapper.js
│       └── date-utils.js
├── store/
│   ├── index.js
│   └── modules/user.js                     # Vuex auth state (namespaced)
├── router/index.js                         # all routes + beforeEach guard (inline)
├── app.vue                                 # sidenav shell + router-view
└── main.js                                 # bootstrap, plugin registration, global components
```

## Architecture

### API style

Options API only. Every component uses `export default { data(), computed, methods, created(), watch }`. There is no `<script setup>`, no `setup()` function, no Composition API anywhere in the codebase.

### PrimeVue conventions

All PrimeVue components are globally registered with the `pv-` prefix (`<pv-button>`, `<pv-data-table>`, `<pv-dialog>`, `<pv-chart>`, etc.). FullCalendar is registered as `<fc-calendar>`. Never use raw PascalCase component names in templates. Theme: Aura preset, dark mode disabled. `this.$toast`, `this.$confirm`, and `this.$dialog` are globally available.

### Auth flow

1. User submits username + password in `AuthSplitScreen` (the only reachable login page, at `/login`).
2. Vuex action calls `AuthenticationService.signIn()` → `POST /authentication/sign-in`.
3. If the account is not yet activated, the backend returns `403` with `{ code: 'AccountNotActivated' }`. No JWT is issued. The component shows a toast instructing the user to check their email.
4. On valid credentials for an activated account, the backend returns `200` with `{ id, profileId, role, token, username, profile, classrooms, meetings }`. A JWT is issued immediately — there is no second step.
5. The Vuex action validates `profileId`, `role`, and `token`, writes them to `localStorage`, and commits the mutations.
6. `RoleAdmin` users are redirected to `/dashboard-admin/home-admin`. Non-admin roles receive a toast and are not redirected.

Account activation is a separate pre-requisite:
- Backend emails an activation link like `/activate?token=<uuid>`.
- `ActivateComponent` reads the `?token` query param and calls `POST /authentication/activate` with body `{ token }`.
- On success the account is enabled; no JWT is returned. The user must then sign in manually.

### HTTP layer

`src/shared/services/http-common.js` is the single Axios instance. Every service file imports from it.

- Request interceptor: reads `store.getters["user/userToken"]` and injects `Authorization: Bearer <token>`.
- Response interceptor: extracts a user-facing Spanish message from `data.detail` → `data.errors` → `data.title` → `data.message`, attaches it as `error.userMessage`. On `401`, dispatches `user/signOut` and pushes to `/login` with a "Sesión expirada" message.

### Backend value-object unwrapping

The .NET backend serializes value objects as `{ value: X }`. Use `shared/utils/value-object-unwrapper.js` to flatten responses before binding to the UI. Missing this is the most common cause of `[object Object]` in templates.

```js
import { unwrapValueObjects } from '../../shared/utils/value-object-unwrapper.js';
const items = unwrapValueObjects(response.data || []);
```

Note: `vite.config.js` does not configure a `@` path alias. All imports use relative paths.

### State

Single Vuex module (`store/modules/user.js`, namespaced). Holds `user`, `id` (= `profileId`, not `accountId`), `role`, `token`, and `isAuthenticated`. Rehydrated from `localStorage` on every page load. No token refresh exists — expired tokens trigger auto-signout via the 401 interceptor.

### Routing

All routes are lazy-loaded via dynamic `import()`. The `beforeEach` guard reads `isAuthenticated` and `userRole` from Vuex. Only `RoleAdmin` can access `/dashboard-admin/*` routes. A catch-all `/:pathMatch(.*)*` route renders `src/shared/pages/not-found.component.vue`, showing the unmatched path and a button that routes to `home-admin` (if authenticated as admin) or `login`.

### Vercel deployment

`vercel.json` defines two rules:
1. `/api/:path*` rewrites to the Azure Container Apps backend (Brazil South). This is the production API proxy.
2. `/(.*)` rewrites to `/index.html` for SPA client-side routing.

## Known Issues and Dead Code

### Dead code

- `src/iam/register/pages/register.component.vue` — not routed. `/register` resolves to `auth-split-screen.component.vue`. Dead code candidate.
- `src/iam/services/authentication.guard.js` — exports `authenticationGuard` but is never imported. The real guard is inline in `router/index.js`.
- `src/iam/services/authentication.interceptor.js` — never imported. If it were, it would add a duplicate request interceptor to the Axios instance.

### Stub module

- `src/profiles/` contains only `services/administrator.service.js`. No model, no pages, no routes. The service is used by `dashboard-admin` pages directly.

### Mock-only module

- `src/iot-monitoring/` makes zero HTTP calls. `IotMonitoringService` reads `db.json` (20 hardcoded spaces) and wraps results in `Promise.resolve()`. Real ESP32/Edge API integration is deferred to Sprint 2.
- `home-admin.component.vue` hardcodes `MOCK_BREAKDOWNS` (5 entries) as a `const` inside the component — not sourced from any service.

### Other known debt

- No token refresh — expired JWT causes immediate signout on next API call.
- JWT stored in `localStorage` (XSS risk — intentional for this academic project, do not change without team agreement).
- ESLint has no CI or pre-commit hook — run `npm run lint` manually before committing.
- `dashboard-teacher/`, `reservation-management/`, and `breakdown-report-management/` do not exist in the frontend codebase. Any documentation referencing them is incorrect.
- `data-meet.component.vue` has a string interpolation bug: confirmation messages use single-quoted strings with `${this.title.plural}` — the variable is never evaluated.
- `index.html` title is "Vite + Vue" — the router guard corrects `document.title` after first navigation, but the initial paint shows the wrong title.

## Library Docs

Before touching PrimeVue, Vue Router, Vuex, Axios, FullCalendar, Chart.js, or Vite APIs, use Context7 (`resolve-library-id` → `query-docs`). Training data is often stale relative to PrimeVue 4 / Vue Router 4 / Vite 6.

## Contributing

1. Branch from `main` (`git checkout -b feat/your-feature`).
2. Use Conventional Commits in English, single line.
3. Run `npm run lint` before opening a PR.

## License

MIT — see [LICENSE](LICENSE).
