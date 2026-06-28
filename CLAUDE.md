# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Aphelion is a Kanban-style board for tracking abandoned, paused, and sidelined projects. The name references the furthest point in a planet's orbit — a metaphor for drifted-but-not-forgotten projects.

## Commands

### Frontend (`fe/`)
```bash
npm start       # Dev server (ng serve)
npm run build   # Production build
npm test        # Karma + Jasmine tests
npm run watch   # Build in watch mode
```

### Backend (`be/`)
```bash
npm run dev     # Dev server with auto-reload (tsx watch)
```

Run a single test: use `--include` with Karma or focus tests with `fdescribe`/`fit` in spec files.

## Architecture

### Frontend (Angular 20, standalone components)

**State management:** Angular Signals. The board component owns all state. Board data auto-saves to `localStorage` via an effect whenever signals change. Key: `'stellar-guide-project-board-data'`.

**Component tree:**
```
App → Home | Board
Board
├── BoardHeader
├── KanbanBoard (CDK drag-drop container)
│   └── KanbanColumn × 4  (active | paused | abandoned | done)
│       └── ProjectCard[]
└── AddProjectModal
```

**Data flow:** KanbanColumn emits drag-drop events → KanbanBoard → Board updates signal state → auto-save effect fires.

**Data model** (`fe/src/app/models/project.model.ts`):
- `ProjectStatus`: `'active' | 'paused' | 'abandoned' | 'done'`
- `Project`: `{ id, title, description, status, date, dateLabel, position }`
- `BoardData`: `{ columns: KanbanColumn[] }` — always exactly 4 columns

**Key files:**
- `fe/src/app/pages/board/board.ts` — all board state, persistence, and event handlers
- `fe/src/app/components/kanban-column/kanban-column.ts` — drag-drop logic (reorder vs. cross-column move)
- `fe/src/app/components/add-project-modal/add-project-modal.ts` — Reactive Form for project creation

**UI library:** ng-zorro-antd (Ant Design). Theme overrides in `fe/src/theme.less`. Component styles in SCSS.

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

### Backend (`be/`)

Minimal Express 5 placeholder. Single `GET /` route. Port configurable via `PORT` env var (default 3000). No API endpoints implemented yet — ready for expansion.

## Conventions

- All Angular components are **standalone** (no NgModules).
- State via **Angular Signals**; use `input()` / `output()` for component communication.
- **Reactive Forms** for all form validation.
- **Strict TypeScript** enabled everywhere.
- Prettier config: 100-char print width, single quotes, Angular HTML parser.
- Projects use UUIDs for `id` and a numeric `position` field for ordering within columns.
- Dev-only "nuke" button clears localStorage (guarded from production use).
