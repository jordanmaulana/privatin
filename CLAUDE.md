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

### Two unrelated "payments"

Be careful: **Mayar** (`core/payments/mayar.py`) is the teacher paying *us* for the SaaS subscription. **`MonthlyPayment`** is the student paying the *teacher*. They are independent. The Mayar webhook (`api/v1/payments_api.py`) is verified by the `X-Callback-Token` header against `MAYAR_WEBHOOK_TOKEN`; the subscription-activation hook is currently a `pass` stub.

### Primary keys

`core/models.BaseModel` gives every domain model a **BSON ObjectId string PK** (`make_object_id`), plus `created_on`/`updated_on`/`actor`. Don't assume integer PKs for domain rows. (`auth.User` still uses integer PKs.)

### Config & deployment

- `core/settings.py` loads `.env`. **DB auto-switches**: Postgres if `POSTGRES_HOST` is set, else SQLite (`db.sqlite3`, WAL mode). See `.env.example` for all vars.
- Production refuses to boot if `DEBUG=False` with the insecure default `SECRET_KEY`.
- WhiteNoise serves static; `collectstatic` runs in the docker entrypoint. Gunicorn (gthread) is the prod server.
- `update.sh` is the deploy script: git pull → compose build/up → wait for Postgres healthy → migrate.
