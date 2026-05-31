# Privatin — Features

Dev-facing inventory mapping the product vision in [general-idea.md](general-idea.md) to the code that implements it. Each feature links to its source and carries a status flag.

**Legend:** ✅ Done · 🟡 Partial · ⬜ Planned

## Overview

Privatin is a SaaS for the owner of a private-lesson house (a teacher). The teacher used to track classes, students, monthly schedules, and payments on paper. The app exists to answer two questions instantly:

1. **Who hasn't paid this month?**
2. **Who hasn't completed their sessions this month?**

Indonesian-facing: timezone `Asia/Jakarta`, Rupiah amounts stored with `decimal_places=0`.

Two **separate** frontends, two **separate** auth systems:

- **Django server-rendered** ([core/views.py](../core/views.py), [templates/](../templates/)) — superuser-only admin surface, Django session auth.
- **React SPA** ([frontend/](../frontend/)) — teacher-facing app, DRF token auth, talks only to `/api/v1/`.

## Core product capabilities

The reason the product exists. Domain logic lives in [classes/queries.py](../classes/queries.py).

| Capability | Implementation | Backend | SPA |
|---|---|---|---|
| Who hasn't paid this month | `unpaid_this_month(owner, period)` — calls `ensure_month_payments` first, returns unpaid `MonthlyPayment` rows ordered by student name ([classes/queries.py](../classes/queries.py)) | ✅ | ⬜ |
| Who hasn't completed sessions this month | `incomplete_schedule_this_month(owner, period)` — active enrollments whose held-session count is below `target_sessions` ([classes/queries.py](../classes/queries.py)) | ✅ | ⬜ |
| Monthly payment ledger | `ensure_month_payments(owner, period)` — idempotently bulk-creates one `MonthlyPayment` per active enrollment per month; safe to call repeatedly ([classes/queries.py](../classes/queries.py)) | ✅ | ⬜ |
| Session logging vs. target | `SessionLog` rows (one per held lesson) counted against `enrollment.target_sessions` ([classes/models.py](../classes/models.py)) | ✅ | ⬜ |

Notes:
- `month_start(d)` normalizes any date to day-1 of its month — the `period` key for payments.
- `incomplete_schedule_this_month` filters in **Python**, not SQL, so the `Enrollment.target_sessions` fallback property stays the single source of truth.
- Payments are marked paid **manually** by the teacher (`is_paid`), not by any gateway.

## Domain model

All domain rows are **multi-tenant by `owner`** (FK to `auth.User` = the teacher) — always scope queries by `owner`. All inherit a **BSON ObjectId string PK** plus `created_on` / `updated_on` / `actor` from `BaseModel` ([core/models.py](../core/models.py)). (`auth.User` itself keeps integer PKs.)

| Model | Purpose | Key fields | File |
|---|---|---|---|
| `UserProfile` | Teacher account + their Mayar SaaS subscription state | `user` (1:1), `full_name`, `phone_number`, `subscription_status` (`trial`/`active`/`expired`), `subscription_until` | [profiles/models.py](../profiles/models.py) |
| `Student` | A pupil owned by a teacher | `owner`, `name`, `phone_number` | [students/models.py](../students/models.py) |
| `Class` | A lesson type with pricing + schedule defaults | `owner`, `name`, `price`, `default_sessions_per_month` | [classes/models.py](../classes/models.py) |
| `Enrollment` | Student↔Class pair with per-pair overrides | `student`, `lesson_class`, `monthly_target_sessions`, `monthly_price`, `active`; unique `(student, lesson_class)` | [classes/models.py](../classes/models.py) |
| `MonthlyPayment` | One row per enrollment per month | `enrollment`, `period` (day-1), `amount`, `is_paid`, `paid_on`; unique `(enrollment, period)` | [classes/models.py](../classes/models.py) |
| `SessionLog` | One row per lesson actually held | `enrollment`, `held_on`, `note` | [classes/models.py](../classes/models.py) |

`Enrollment` fallback properties (single source of truth for targets/pricing):
- `.target_sessions` → `monthly_target_sessions` if set, else `lesson_class.default_sessions_per_month`.
- `.price` → `monthly_price` if set, else `lesson_class.price`.

The FK is named `lesson_class` because `class` is a reserved word.

## API (`/api/v1/`)

DRF defaults to `IsAuthenticated` globally ([core/settings.py](../core/settings.py)) — new endpoints are auth-required unless decorated `@permission_classes([AllowAny])`. SPA sends the header **`Authorization: Token <key>`** (DRF token auth, **not** Bearer) — see [frontend/src/lib/api.ts](../frontend/src/lib/api.ts).

Routes in [api/v1/urls.py](../api/v1/urls.py).

| Method | Path | Auth | Purpose | File | Status |
|---|---|---|---|---|---|
| POST | `auth/google/` | AllowAny | Verify Google `credential`, get-or-create `User` by email, return DRF token + user | [api/v1/auth_api.py](../api/v1/auth_api.py) | ✅ |
| POST | `auth/logout/` | Authenticated | Revoke the user's token | [api/v1/auth_api.py](../api/v1/auth_api.py) | ✅ |
| GET | `auth/me/` | Authenticated | Current user + `onboarded` flag | [api/v1/auth_api.py](../api/v1/auth_api.py) | ✅ |
| POST | `payments/mayar/webhook/` | AllowAny (token-verified) | Mayar SaaS callback; `X-Callback-Token` checked vs. `MAYAR_WEBHOOK_TOKEN` | [api/v1/payments_api.py](../api/v1/payments_api.py) | 🟡 |

Serializers (`UserSerializer`, `GoogleAuthSerializer`) in [api/v1/serializers.py](../api/v1/serializers.py). The Mayar webhook verifies the token and recognizes paid statuses, but the subscription-activation branch is a `pass` stub — see [Billing](#billing-mayar-saas).

## Authentication & onboarding

SPA flow: Google sign-in → DRF token in `localStorage` → token attached to every `/api/v1/` request.

- `me/` reports `onboarded`, derived from whether `UserProfile.full_name` is set.
- AuthGate ([frontend/src/features/auth/components/auth-gate.tsx](../frontend/src/features/auth/components/auth-gate.tsx)) redirects: unauthenticated → `/login`, authenticated-but-not-onboarded → `/onboarding`, onboarded on an auth page → `/dashboard`. Clears session on 401.
- Hooks `useMe` / `useGoogleSignIn` / `useLogout` ([frontend/src/features/auth/hooks.ts](../frontend/src/features/auth/hooks.ts)); state in Jotai atoms `tokenAtom` / `userAtom` ([frontend/src/features/auth/state.ts](../frontend/src/features/auth/state.ts)).

Status: Google sign-in + token session + gate ✅. Onboarding form 🟡 — the `/onboarding` page is a placeholder with no fields yet.

## Web app (React SPA)

React 19 + TanStack Router (file-based) + TanStack Query + Jotai + Tailwind v4 / shadcn. Routes in [frontend/src/routes/](../frontend/src/routes/).

| Route | Page | Status |
|---|---|---|
| `__root.tsx` | Root layout wrapping app in AuthGate | ✅ |
| `/` (`index.tsx`) | Welcome/splash placeholder | 🟡 |
| `/login` | Google Sign-In card | ✅ |
| `/onboarding` | Onboarding form (placeholder, no fields) | 🟡 |
| `/dashboard` | Authenticated home; currently only shows user email | 🟡 |
| Students / Classes / Enrollments / Payments / Sessions | — | ⬜ |

Authenticated layout shell (`AppShell`) provides sidebar nav + logout ([frontend/src/components/layout/app-shell.tsx](../frontend/src/components/layout/app-shell.tsx)). HTTP client + `ApiError` in [frontend/src/lib/api.ts](../frontend/src/lib/api.ts).

No teacher-facing domain pages exist yet — students, classes, payment status, and session logging are all Planned.

## Admin (Django server-rendered)

Superuser-only operator surface, Django session auth, styled by the Tailwind CLI output (`static/output.css`).

- `DashboardView` ([core/views.py](../core/views.py)) — superuser-only via `SuperuserRequiredMixin`; renders `dashboard.html` with empty context. Shell ✅, content ⬜.
- `AdminLoginView` ([core/views.py](../core/views.py)) — session login form at `/login/`, redirects to `/dashboard/`. ✅
- Routing in [core/urls.py](../core/urls.py); `/admin/` is the standard Django admin (only `AppSetting` is registered).

## Billing (Mayar SaaS) {#billing-mayar-saas}

Two unrelated "payments" — don't conflate:

- **Mayar** — the teacher paying **us** for the SaaS subscription ([core/payments/mayar.py](../core/payments/mayar.py)).
- **`MonthlyPayment`** — the student paying the **teacher** (tracked in-app).

Mayar helpers:

| Function | Purpose | Status |
|---|---|---|
| `create_payment_link(...)` | Create a one-time Mayar checkout link for subscription purchase/renewal | ✅ |
| `get_payment_status(payment_id)` | Query normalized payment status from Mayar | ✅ |
| `verify_webhook(request)` | Validate `X-Callback-Token` against `MAYAR_WEBHOOK_TOKEN` | ✅ |

Subscription activation 🟡: the webhook verifies the token and recognizes `PAID_STATUSES`, but the activation branch is currently a `pass` stub ([api/v1/payments_api.py](../api/v1/payments_api.py)) — `UserProfile.subscription_status` / `subscription_until` are **not** yet updated on payment.

## Status roadmap (Planned)

- SPA teacher-facing pages: students, classes, enrollments, monthly payment status ("who hasn't paid"), session logging ("who hasn't completed").
- Wire Mayar webhook activation → update `UserProfile.subscription_status` / `subscription_until`.
- Build the onboarding form (capture `full_name` / `phone_number`).
- Fill the Django superuser dashboard content.
