# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Aphelion is a Kanban-style board for tracking abandoned, paused, and sidelined projects. The name references the furthest point in a planet's orbit — a metaphor for drifted-but-not-forgotten projects.

## Commands

### Frontend (`fe/`)
```bash
npm start       # Dev server (ng serve) — proxies /api to localhost:3000
npm run build   # Production build
npm test        # Karma + Jasmine tests
npm run watch   # Build in watch mode
```

### Backend (`be/`)
```bash
npm run dev          # Dev server with auto-reload (tsx watch)
pnpm db:generate     # Generate Drizzle migration files from schema
pnpm db:migrate      # Apply pending migrations against DATABASE_URL
```

### Deployment (`scripts/`)
```bash
./scripts/start.sh                        # Build + migrate + run on port 3000
./scripts/start.sh --be-port 4000 --fe-port 80   # Custom ports
./scripts/teardown.sh                     # Stop and remove the Docker container
```

Run a single test: use `--include` with Karma or focus tests with `fdescribe`/`fit` in spec files.

## Architecture

### Frontend (Angular 20, standalone components)

**State management:** Angular Signals. `BoardService` owns HTTP calls; `Board` component owns the `boardData` signal. On init the board fetches `GET /api/board`; mutations call the API and update the signal (optimistic for drag-drop, server-first for create/edit/delete).

**Component tree:**
```
App → Home | Board
Board
├── BoardHeader
├── KanbanBoard (CDK drag-drop container)
│   └── KanbanColumn × 4  (active | paused | abandoned | done)
│       └── ProjectCard[]  (⋯ button opens edit modal)
└── AddProjectModal         (handles both add and edit modes)
```

**Data flow:** KanbanColumn emits drag-drop / edit events → KanbanBoard → Board calls BoardService → signal updated.

**Data model** (`fe/src/app/models/project.model.ts`):
- `ProjectStatus`: `'active' | 'paused' | 'abandoned' | 'done'`
- `Project`: `{ id, title, description, status, date, dateLabel, position }`
- `BoardData`: `{ columns: KanbanColumn[] }` — always exactly 4 columns

**Key files:**
- `fe/src/app/services/board.service.ts` — all HTTP calls (`loadBoard`, `createProject`, `patchProject`, `deleteProject`, `clearBoard`)
- `fe/src/app/pages/board/board.ts` — board state signal, event handlers, wires service calls
- `fe/src/app/components/kanban-column/kanban-column.ts` — drag-drop logic (reorder vs. cross-column move)
- `fe/src/app/components/add-project-modal/add-project-modal.ts` — Reactive Form; supports `open()` (add) and `openEdit(project)` (edit + delete)

**UI library:** ng-zorro-antd (Ant Design). Theme overrides in `fe/src/theme.less`. Component styles in SCSS.

### Backend (Express 5, TypeScript, Drizzle ORM)

**Database:** PostgreSQL, connected via `DATABASE_URL` env var. Single `projects` table managed by Drizzle ORM.

**Schema** (`be/src/db/schema.ts`): `id` (uuid PK), `title`, `description`, `status` (pgEnum), `date`, `date_label`, `position` (int), `created_at`, `updated_at`.

**API endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/board` | Full board — all projects grouped into 4 columns, ordered by position |
| `POST` | `/api/projects` | Create project (server sets `id`, `date`, `dateLabel`, `position: 0`) |
| `PATCH` | `/api/projects/:id` | Edit fields, move column (`status`), or reorder (`position`) — all in one transaction |
| `DELETE` | `/api/projects/:id` | Delete and re-normalise column positions |
| `DELETE` | `/api/board` | Wipe all projects (dev/admin) |
| `GET` | `/api/docs` | Scalar interactive API documentation |
| `GET` | `/api/openapi.json` | Raw OpenAPI 3.1 spec |

**Key files:**
- `be/src/app.ts` — Express server, all routes, static file serving for production
- `be/src/db/schema.ts` — Drizzle table definition and `ProjectStatus` enum
- `be/src/db/index.ts` — pool + db exports
- `be/src/openapi.ts` — OpenAPI 3.1 spec object (single source of truth for `/api/docs`)
- `be/src/migrate.ts` — standalone migration runner (used by Docker entrypoint)
- `be/drizzle/` — generated SQL migration files (commit these)

In production (Docker), Express also serves the Angular static bundle from `./public` and falls back to `index.html` for any non-`/api` path.

### Deployment

```
scripts/
├── Dockerfile    — 3-stage build: fe-builder → be-deps → final image
├── start.sh      — checks env + ports, builds image, runs migrations, starts container
└── teardown.sh   — stops and removes the container
```

`start.sh` checks in order: env file exists → `DATABASE_URL` set → `be/drizzle/` non-empty → host port free → stale container removed → build → migrate → run.

Config: copy `be/.env.example` → `be/.env`, set `DATABASE_URL`.

## UI Design System

The app uses a dark, minimal aesthetic. All custom styles fight ng-zorro's light-mode defaults — follow these rules to stay consistent.

### Color palette
| Role | Value |
|---|---|
| Background | `#0a0a0a` |
| Surface (cards, modals) | `rgba(15–20, 15–20, 15–20, 0.6–0.95)` |
| Border default | `rgba(255, 255, 255, 0.08–0.1)` |
| Border interactive | `rgba(255, 255, 255, 0.2)` → `0.8` on hover |
| Text primary | `#ffffff` / `rgba(255,255,255,0.9–0.95)` |
| Text secondary | `rgba(255,255,255,0.5–0.7)` |
| Text muted | `rgba(255,255,255,0.3–0.4)` |
| Accent (active/focus) | `rgba(120, 119, 198, …)` (muted indigo) |
| Danger | `rgba(255, 87, 87, …)` |
| Warning / paused | `rgba(255, 193, 7, …)` |
| Success / done | `rgba(76, 175, 80, …)` |

### Buttons
All buttons use **`nzType="default"`** (never `text` or `primary`) and are fully restyled via `::ng-deep .my-class.ant-btn { … }` in component SCSS. This is required because ng-zorro is a light-theme library — using `primary` or `text` nzTypes causes hover/focus states to revert to Ant Design's blue/dark defaults.

Ghost-outline button spec (used everywhere):
- `background: transparent`
- `border: 1px solid rgba(255,255,255,0.2)` → `rgba(255,255,255,0.8)` on hover
- `color: rgba(255,255,255,0.9)` → `#ffffff` on hover
- `border-radius: 0` (no rounding — geometric aesthetic)
- `text-transform: uppercase`, `letter-spacing: 1.2–1.5px`, `font-weight: 500`
- Hover: `background: rgba(255,255,255,0.05)`
- Transition: `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`

Sizes in use:
- **Header action** (e.g., "New Project"): `height: 40px`, `padding: 0 24px`, `font-size: 12px`
- **Hero CTA** (e.g., home page): `height: 48px`, `padding: 0 32px`, `font-size: 13px`

Danger variant (confirm dialogs):
- `border: 1px solid rgba(255,87,87,0.4)` → `rgba(255,87,87,0.7)` on hover
- `color: rgba(255,87,87,0.9)` → `rgba(255,87,87,1)` on hover

### ng-zorro override pattern

**Rule:** `nz-modal` renders in a CDK overlay portal — a `<div>` appended directly to `<body>`, outside any component's DOM tree. This means component-level `::ng-deep` styles are never applied to modal content (the attribute selector from Angular's view encapsulation doesn't match). All modal/confirm dialog overrides **must live in `fe/src/styles.scss`** (the global stylesheet).

Use `!important` on all ng-zorro overrides in `styles.scss`. Without it, specificity ties fall to cascade order, which is unpredictable across build configurations (ng-zorro's bundled `theme.less` may load after the global `styles.scss`).

For non-modal component overrides (e.g., standalone buttons NOT inside a modal), use `::ng-deep .my-class.ant-btn` (double class selector, no space) in the component's own SCSS. The extra class improves specificity over ng-zorro's base `.ant-btn-default:hover`.

### Typography
- Headings: `font-weight: 200`, `text-transform: uppercase`, large `letter-spacing` (4–8px for hero, 2–4px for section titles)
- Labels / nav: `font-weight: 500`, `text-transform: uppercase`, `letter-spacing: 1–1.5px`, `font-size: 12–13px`
- Body: `font-weight: 300–400`, normal case, `line-height: 1.6–1.8`

## Conventions

- All Angular components are **standalone** (no NgModules).
- State via **Angular Signals**; use `input()` / `output()` for component communication.
- **Reactive Forms** for all form validation.
- **Strict TypeScript** enabled everywhere (backend: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
- Prettier config: 100-char print width, single quotes, Angular HTML parser.
- Projects use UUIDs for `id` and a numeric `position` field for ordering within columns.
- Dev-only "Clear Board" button calls `DELETE /api/board` (guarded by `isDevMode()`).
- The OpenAPI spec in `be/src/openapi.ts` is the single source of truth — update it whenever API routes change.
