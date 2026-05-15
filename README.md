# EduSpace — Frontend Web App

[![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D?logo=vue.js)](https://vuejs.org/)
[![PrimeVue](https://img.shields.io/badge/PrimeVue-4.x-41B883)](https://primevue.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite)](https://vitejs.dev/)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.x-FF6384?logo=chartdotjs)](https://www.chartjs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Admin web dashboard for **EduSpace**, the school management platform. Built with Vue 3 (Options API) and PrimeVue 4. Used by administrators to manage classrooms, shared spaces, resources, meetings, teachers, incident reports, and real-time IoT sensor monitoring.

> Web access is **admin-only**. Teachers and other roles use the mobile app.

## Features

- **Admin Dashboard** — institutional overview with IoT KPIs, floor map, alerts feed and telemetry charts
- **IoT Monitoring** — real-time sensor detail per space: occupancy, temperature, humidity, luminosity, CO₂ and energy consumption with threshold bars and interactive Chart.js graphs
- **Classrooms, Shared Spaces & Resources** — CRUD and assignment
- **Meetings** — schedule and coordinate meetings with teachers
- **Teachers (Personal Data)** — register, edit, delete teacher profiles with constraint validation and PII masking
- **Two-factor sign-in** — password + 6-digit email code

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Backend API running (see `eduspace-platform`)

### Install & Run

```bash
git clone https://github.com/DesarrolloSolucionIoT/eduspace-frontend-web-app.git
cd eduspace-frontend-web-app
npm install
npm run dev
```

App runs at `http://localhost:5173`.

### Environment

Create a `.env` file at the repo root:

```env
VITE_API_BASE_URL=http://localhost:5204/api/v1
```

If the variable is missing, Axios calls go to `undefined/...` silently — set it.

### Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Serve the built output |
| `npm run lint` | ESLint with `--fix` over `.vue`, `.js`, `.jsx` |

No test runner is configured.

## Project Structure

DDD-aligned folders mirror the backend bounded contexts.

```
src/
├── iam/                                    # Sign-in + 2FA verify-code
│   ├── model/
│   ├── pages/
│   └── services/
├── dashboard-admin/                        # Admin home dashboard
│   └── pages/
├── classroom-space-resource-management/    # Classrooms, spaces, resources
│   ├── components/
│   ├── model/
│   ├── pages/
│   └── services/
├── meeting-management/                     # Meetings
│   ├── components/
│   ├── model/
│   ├── pages/
│   └── services/
├── personal-data/                          # Teachers (admin-managed)
│   ├── components/
│   ├── model/
│   └── services/
├── iot-monitoring/                         # IoT sensor monitoring
│   ├── components/
│   │   └── space-sensor-card.component.vue
│   ├── model/
│   │   └── iot-space.entity.js
│   ├── pages/
│   │   └── iot-monitoring.component.vue
│   └── services/
│       ├── iot-monitoring.service.js
│       └── db.json                         # Mock sensor data (Sprint 1)
├── profiles/                               # (stub — service only)
├── shared/                                 # Cross-cutting code
│   ├── components/
│   ├── services/http-common.js
│   └── utils/                              # date utils, VO unwrapper
├── store/modules/user.js                   # Vuex auth state
├── router/index.js                         # Lazy-loaded routes + guard
├── app.vue
├── main.js
└── style.css
```

## Architecture

### Conventions

- **Options API only** — no `<script setup>` / Composition API.
- All user-facing strings are **Spanish** (no i18n library installed).
- Component files use the `.component.vue` suffix.
- PrimeVue is globally registered with the `pv-` prefix (`<pv-button>`, `<pv-chart>`, `<pv-data-table>`, `<pv-dialog>`).
- Routes are **lazy-loaded** via dynamic `import()` for code splitting.
- JWT + user blob persist in `localStorage` (academic project — known XSS tradeoff).
- Each bounded context follows the structure: `components/`, `model/`, `pages/`, `services/`.
- Template root must be a **single element** — Vue's `<Transition mode="out-in">` in `app.vue` cannot animate fragment components.

### Auth flow

1. `POST /authentication/sign-in` with email + password.
2. Backend emails a 6-digit code (10 min expiry).
3. `POST /authentication/verify-code` exchanges the code for a JWT (7-day).
4. Token + user are stored in `localStorage` and Vuex.
5. The Axios request interceptor injects `Authorization: Bearer <token>`; the response interceptor signs the user out and redirects to `/login` on `401`.

Only the `RoleAdmin` role is allowed past the guard — other roles are signed out.

### HTTP layer

`src/shared/services/http-common.js` is the single Axios instance. It centralizes:
- Token injection
- Error extraction (`data.detail` / `data.errors` / `data.title` / `data.message`)
- Auto sign-out on `401`

### Backend value-object unwrapping

The .NET backend serializes value objects as `{ value: X }`. Use `shared/utils/value-object-unwrapper.js` to flatten responses before binding to the UI — this is the most common source of `[object Object]` bugs.

```js
import { unwrapValueObjects } from '@/shared/utils/value-object-unwrapper.js';
const items = unwrapValueObjects(response.data || []);
```

### IoT Monitoring module

The `iot-monitoring/` bounded context implements the sensor monitoring layer:

- **`IotSpace` entity** — models a monitored space with sensors, events, device metadata and computed getters (`isOnline`, `hasAlert`, `buildingPrefix`).
- **`IotMonitoringService`** — `getSpaces()`, `getSpaceById()`, `getAlerts()`. Currently backed by `db.json` (21 mock spaces with full sensor data). Swap to real HTTP calls in Sprint 2.
- **`SpaceSensorCard` component** — renders a single sensor (value, delta, threshold bar) as a reusable business component.
- **`IotMonitoringPage`** — full monitoring page: space list, 6-sensor detail grid, interactive Chart.js line chart with tab/range selectors, occupancy strip, device footer and event log.
- **Dashboard widgets** — `home-admin` imports the same service and renders: KPI strip (sparklines), floor map, alerts feed, aggregated telemetry chart, building utilization bars, sensor health table and breakdowns table.

Charts use **Chart.js 4** via PrimeVue's `<pv-chart>` wrapper. Requires `chart.js` to be installed (`npm install` handles this).

### State

Single Vuex module (`store/modules/user.js`) holds `user`, `id`, `role`, `token`, and `isAuthenticated`. State is rehydrated from `localStorage` on boot.

### UI

- **Theme**: PrimeVue Aura preset, dark mode disabled.
- **Services**: `this.$toast`, `this.$confirm`, `this.$dialog` are available globally.
- **Calendar**: FullCalendar Vue 3 integration.
- **Charts**: Chart.js 4 via `<pv-chart>` (line charts for telemetry, sparklines for KPIs).

## Library docs

Before touching PrimeVue, Vue Router, Vuex, Axios, FullCalendar, Chart.js, or Vite APIs, use Context7 (`resolve-library-id` → `query-docs`). Training data is often stale relative to PrimeVue 4 / Vue Router 4 / Vite 6.

## Known debt

- `src/iam/services/authentication.guard.js` — never imported; the real guard is inline in `router/index.js`.
- `src/profiles/` — service-only stub, no pages or routes.
- No 404 / catch-all route — unknown paths render blank.
- ESLint has no CI or pre-commit hook — run `npm run lint` manually before committing.
- IoT data is mocked via `db.json` — real ESP32/Edge API integration deferred to Sprint 2.

## Contributing

1. Branch from `main` (`git checkout -b feat/your-feature`).
2. Use Conventional Commits in English, single line.
3. Run `npm run lint` before opening a PR.

## License

MIT — see [LICENSE](LICENSE).
