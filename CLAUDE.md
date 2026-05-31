# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Privatin — a SaaS for owners of private-lesson houses (a teacher). It tracks classes, students, monthly schedules, and payments so the teacher can instantly answer the two questions they used to flip paper for: **who hasn't paid this month** and **who hasn't completed their sessions this month**. Indonesian-facing (TZ `Asia/Jakarta`, Rupiah amounts as `decimal_places=0`).

## Commands

Backend (Python is managed by `uv`; run via the `Makefile`):

- `make dev` — Django dev server on :8000 (`uv run manage.py runserver`)
- `make mmg` / `make migrate` — makemigrations / migrate
- `make lint` — `ruff format .` then `ruff check . --fix` (line length 100, rules `E,F,I,B,UP`)
- `make tw-run` / `make tw-build` — Tailwind CLI watch/build for the **Django templates** (`static/input.css` → `static/output.css`)
- `make dock` — full docker-compose rebuild + logs (uses `.env.docker`)
- Single test: `uv run manage.py test classes.tests.SomeTest.test_method` (per-app `tests.py` files exist but are currently empty stubs)

Frontend (separate React SPA in `frontend/`, package manager is **pnpm**):

- `make web` or `cd frontend && pnpm run dev` — Vite dev server on :5173 (proxies `/api` → :8000)
- `cd frontend && pnpm run build` — `tsc -b && vite build`
- `cd frontend && pnpm run lint` — eslint

## Architecture

### Two separate frontends — don't conflate them

1. **Django server-rendered** (`templates/`, `core/views.py`): an admin/operator surface. `DashboardView` is **superuser-only** (`SuperuserRequiredMixin`), session-authenticated via `/login/`. Styled with the Tailwind CLI output (`static/output.css`).
2. **React SPA** (`frontend/`): the teacher-facing app. TanStack Router (file-based, auto code-split) + TanStack Query + Jotai + shadcn/radix. Talks only to `/api/v1/` with **DRF Token auth**.

These use different auth systems. The Django side is Django sessions + superuser checks. The SPA side is token-based: Google sign-in → token in `localStorage` → `Authorization: Token <key>` (see `frontend/src/lib/api.ts` and `frontend/src/features/auth/`).

### Auth flow (SPA)

`POST /api/v1/auth/google/` verifies a Google `credential` (`GoogleAuthSerializer` calls `google.oauth2.id_token`), gets-or-creates a `User` keyed by email, and returns a DRF token. `me/` reports an `onboarded` flag derived from whether the user's `UserProfile.full_name` is set. DRF defaults to `IsAuthenticated` globally (`core/settings.py`), so new API endpoints are auth-required unless decorated `@permission_classes([AllowAny])`.

### React SPA structure (`frontend/src/`) — feature-sliced

The SPA is organized **by domain feature, not by file type**. Mirror this layout when adding a resource:

- `features/<domain>/` (e.g. `students/`, `classes/`, `enrollments/`, `dashboard/`, `profile/`, `auth/`) — each owns:
  - `api.ts` — thin functions calling the central `api<T>()` wrapper (one per CRUD verb).
  - `hooks.ts` — TanStack Query hooks wrapping those functions, plus a **query-key factory** (`export const studentKeys = { all: ["students"] }`). Mutations `invalidateQueries` on success; cross-feature effects invalidate the other feature's key too (e.g. deleting a student invalidates `["enrollments"]`).
  - `types.ts` — the domain types and `*Input` shapes.
  - `components/` — the feature's UI, including its `*-page.tsx`.
- `routes/<name>.tsx` — **thin** file-based TanStack Router stubs; each just maps a path to a feature page component via `createFileRoute`. Don't put logic here.
- `components/ui/` — shadcn/radix primitives (button, dialog, table, select…). `components/common/` — shared app widgets (e.g. `delete-confirm-dialog`). `components.json` configures shadcn.
- `lib/api.ts` — the single fetch wrapper: prepends `/api/v1`, injects `Authorization: Token <localStorage token>` (skippable via `{ skipAuth: true }`), treats 204 as `undefined`, and flattens DRF error shapes (`{detail}` or field-keyed arrays) into one string via `ApiError`. Route all network calls through it.
- `lib/format.ts` — `formatRupiah` (uses `id-ID` locale, `Rp` prefix, no decimals). `lib/utils.ts` — the shadcn `cn` helper.
- `app/query-client.ts` — the shared `QueryClient`.
- Imports use the `@/` alias for `frontend/src/`, and the codebase style is **named path-imports** (`@/features/students/api`), not barrel/index re-exports.

### Domain model (`profiles/`, `students/`, `classes/`)

All domain rows are **multi-tenant by `owner`** (FK to `auth.User` = the teacher). Always scope queries by `owner`.

- `UserProfile` (profiles) — the teacher account; also holds **their** Mayar SaaS subscription state (`subscription_status`, `subscription_until`).
- `Student` (students) — a pupil owned by a teacher.
- `Class` (classes) — a lesson type with `price` and `default_sessions_per_month`; M2M to students through `Enrollment`.
- `Enrollment` — student↔class pair. Per-pair overrides for target sessions and price; `.target_sessions` / `.price` fall back to the class defaults. The class FK is named `lesson_class` because `class` is a reserved word.
- `MonthlyPayment` — one row per enrollment per month (`period` normalized to day-1). Marked paid **manually** by the teacher.
- `SessionLog` — one row per lesson actually held; schedule completion = count of these vs `enrollment.target_sessions`.

### The core domain logic lives in `classes/queries.py`

This file implements the product's reason to exist:
- `ensure_month_payments(owner, period)` — idempotently bulk-creates a `MonthlyPayment` for every active enrollment for a month. Call before reading payment status for a period.
- `unpaid_this_month(owner, period)` — unpaid rows (ensures first).
- `incomplete_schedule_this_month(owner, period)` — active enrollments whose held-session count is below target. Filtered in Python (not SQL) so the `target_sessions` fallback property stays the single source of truth.

### REST API surface (`api/v1/`)

Routing (`api/v1/urls.py`) is a DRF `DefaultRouter` for CRUD plus flat `path(...)` routes for non-CRUD; literal paths are registered to win over router detail lookups.

- **CRUD viewsets** (`viewsets.py`) all extend `OwnerScopedModelViewSet`: `get_queryset()` narrows to `owner=request.user` and `perform_create()` forces `owner=request.user` server-side — clients can't set or cross owners. Subclass this for any new tenant-scoped resource; don't re-implement scoping.
- Method restrictions are intentional: `SessionLogViewSet` has no PATCH (lessons are created/deleted, not edited); `MonthlyPaymentViewSet` is GET/POST only with custom `mark-paid` / `mark-unpaid` `@action`s, and its `.list()` calls `ensure_month_payments` first so the period's ledger is materialized before reading.
- **Period parsing**: `_common.parse_period(request)` accepts `?period=`/`?month=` as `YYYY-MM` or `YYYY-MM-DD` and defaults to the current Jakarta month. Reuse it for any period-filtered endpoint instead of parsing dates ad hoc.
- Dashboard endpoints (`dashboard_api.py`): `GET dashboard/unpaid/` and `dashboard/incomplete/` wrap the `classes/queries.py` functions — the two questions the product exists to answer.

### Two unrelated "payments"

Be careful: **Mayar** (`core/payments/mayar.py`) is the teacher paying *us* for the SaaS subscription. **`MonthlyPayment`** is the student paying the *teacher*. They are independent. The Mayar webhook (`api/v1/payments_api.py`) is verified by the `X-Callback-Token` header against `MAYAR_WEBHOOK_TOKEN`; the subscription-activation hook is currently a `pass` stub.

### Primary keys

`core/models.BaseModel` gives every domain model a **BSON ObjectId string PK** (`make_object_id`), plus `created_on`/`updated_on`/`actor`. Don't assume integer PKs for domain rows. (`auth.User` still uses integer PKs.)

### Config & deployment

- `core/settings.py` loads `.env`. **DB auto-switches**: Postgres if `POSTGRES_HOST` is set, else SQLite (`db.sqlite3`, WAL mode). See `.env.example` for all vars.
- Production refuses to boot if `DEBUG=False` with the insecure default `SECRET_KEY`.
- WhiteNoise serves static; `collectstatic` runs in the docker entrypoint. Gunicorn (gthread) is the prod server.
- `update.sh` is the deploy script: git pull → compose build/up → wait for Postgres healthy → migrate.
