# 🔐 Community Platform v1.1 - 인증 및 신원 확인 계획 (v0.3)

## Overview
This document captures the current interim (mock) multi-provider social authentication scaffolding and the forward plan to evolve it into production-grade OAuth 2.0 / OIDC based login with persistence, security controls, and auditing.

## Current State (v0.3)
Implemented (with `AUTH_ENABLED=1`):
* OAuth Provider integration:
   * Real Google Authorization Code + PKCE + state (one-time) exchange
   * Mock fallback flows for other providers until real integration added
   * Direct Google ID Token login endpoint (`POST /api/auth/google`) for browser Google Identity Services (One Tap / button) -> verifies ID token, issues JWT
* Endpoints:
   * `GET /api/auth/providers` – enabled providers summary
   * `GET /api/auth/login/:provider` – returns authorize URL (Google PKCE) or mock redirect
   * `GET /api/auth/callback/:provider` – code exchange / mock login, first user auto `admin`
   * `POST /api/auth/google` – body `{ idToken }` (Google Identity Services). Test-mode: when `NODE_ENV=test` and token starts with `test-google:` skip remote verification.
   * `GET /api/auth/me` – returns user for Access JWT (preferred) or legacy token
   * `POST /api/auth/refresh` – body refresh rotation
   * `POST /api/auth/refresh-cookie` – cookie-based refresh rotation (when `REFRESH_COOKIE=1`)
* Tokens:
   * Access JWT (HS256) + Refresh JWT (Redis-backed jti store when Redis enabled, memory fallback)
   * Optional HttpOnly `refresh_token` cookie (enable via `REFRESH_COOKIE=1` + `COOKIE_SECURE=1` for TLS)
   * Legacy opaque token (transitional; slated for removal once stable)
* Roles:
   * `admin`, `moderator`, `user` with middleware: `requireAdmin`, `requireModOrAdmin`
   * Moderator can create/update announcements & events but only Admin can delete (soft delete)
* Soft Delete & History:
   * `deleted` flag on announcements/events instead of hard delete
   * Append-only history tables: `announcement_history`, `event_history` (create/update/delete snapshots)
* Account Linking:
   * If an authenticated user hits a second provider callback with `link=1`, identity is attached
* Audit Logging:
   * Table `auth_audit` records login success/fail, refresh, linking (JSON detail)
* Metrics:
   * Counters in `runtimeMetrics`: authLoginSuccess, authLoginFail, authRefresh, authLink surfaced in `/api/metrics` & `/api/metrics-prom`
* Security Controls:
   * PKCE (S256) + state (TTL redis or memory) for Google flow
   * Rate limiting, CSP, secure cookie flags (configurable)
* Tests (manual script style):
   * `tests/auth-admin.test.js` – admin CRUD
   * `tests/auth-linking.test.js` – account linking
   * `tests/moderator-perms.test.js` – role enforcement
   * `tests/refresh-cookie.test.js` – cookie refresh flow

## New Tables (Schema Summary)
### users
| Field        | Type                                                            | Notes                                            |
| ------------ | --------------------------------------------------------------- | ------------------------------------------------ |
| id           | BIGINT AUTO_INCREMENT PK                                        |                                                  |
| display_name | VARCHAR(80/200)*                                                | Provider or chosen handle                        |
| email        | VARCHAR(320) UNIQUE                                             | Nullable (not always returned by provider mock)  |
| role         | VARCHAR(32) DEFAULT 'user'                                      | `admin` auto-assigned to very first user created |
| status       | VARCHAR(32) DEFAULT 'active'                                    | Future: disabled / banned                        |
| created_at   | TIMESTAMP DEFAULT CURRENT_TIMESTAMP                             |                                                  |
| updated_at   | TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |                                                  |

### user_social_identities
| Field                              | Type                                | Notes                                       |
| ---------------------------------- | ----------------------------------- | ------------------------------------------- |
| id                                 | BIGINT AUTO_INCREMENT PK            |                                             |
| user_id                            | BIGINT FK -> users.id               | Index for joins                             |
| provider                           | VARCHAR(40)                         | Lowercase identifier (google, github, etc.) |
| provider_user_id                   | VARCHAR(191)                        | Stable remote ID or subject                 |
| email                              | VARCHAR(191) NULL                   | For uniqueness optional in future           |
| profile_json                       | JSON NULL                           | Raw snapshot subset                         |
| created_at                         | TIMESTAMP DEFAULT CURRENT_TIMESTAMP |                                             |
| UNIQUE(provider, provider_user_id) |                                     | Identity collision prevention               |

### announcements / events
Public read endpoints plus admin CRUD now implemented. Future: version history / soft-delete.

## Environment Variables (Planned Set)
| Purpose                 | Variable                                                                | Notes                                |
| ----------------------- | ----------------------------------------------------------------------- | ------------------------------------ |
| Master toggle           | `AUTH_ENABLED`                                                          | `1` to enable auth router            |
| Google OAuth            | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                              | Secret required for real flow        |
| Apple Sign In           | `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` | Requires JWT client secret assembly  |
| Microsoft               | `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`                        | Azure AD app registration            |
| GitHub                  | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`                              | GitHub OAuth app                     |
| Naver                   | `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`                                | Naver login API                      |
| Kakao                   | `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`                                | Kakao developers                     |
| Session secret (future) | `SESSION_HMAC_SECRET`                                                   | Derive HMAC for stateless tokens     |
| Public site origin      | `PUBLIC_ORIGIN`                                                         | For redirect URI construction        |
| JWT secret              | `JWT_SECRET`                                                            | HS256 signing secret (rotate w/ kid) |
| Access TTL (sec)        | `JWT_ACCESS_TTL_SEC`                                                    | Default 900 (15m)                    |
| Refresh TTL (sec)       | `JWT_REFRESH_TTL_SEC`                                                   | Default 1209600 (14d)                |
| Session TTL (ms)        | `SESSION_TTL_MS`                                                        | Legacy opaque token expiry (1h dft)  |
| Redis URL (future)      | `REDIS_URL`                                                             | For refresh/session persistence      |

## Startup Validation (Planned)
- When `AUTH_ENABLED=1` log a summary table of providers: status (enabled/missing vars).
- Warn (not fail) if enabled provider missing its SECRET (still mockable but not real).

## Incremental Roadmap (Next)
1. Additional Providers: Implement real flows (GitHub, Microsoft, Naver, Kakao, Apple) with provider-specific scopes.
2. Refresh Revocation: Maintain revocation / device list (Redis sets keyed by user) & logout endpoint.
3. Key Rotation: Introduce `kid` + JWKS endpoint for HS->RS/EC migration or HMAC key rotation policy.
4. Email / Profile Sync: Periodic re-fetch or on-demand revalidation endpoint.
5. Advanced Security: Brute-force / anomaly detection, IP reputation, optional MFA layer.
6. Legacy Removal: Deprecate opaque tokens once front-end fully migrated.
7. Pagination & Query for Audit: Filter by `user_id`, `event`, time range.

## Token Strategy
Current:
* Access JWT (HS256) 15m
* Refresh JWT 14d with in-memory jti store
* Legacy opaque tokens (backward compatibility) 1h TTL

Target (production refinement):
* Add `kid` for key rotation (JWKS endpoint) & rotate every 3–6 months
* Refresh token stored HttpOnly Secure cookie (not JSON body) + rotation on each use
* Redis-backed refresh jti store w/ active device tracking
* Optional email claim & verified flag

## Recently Completed (v0.3)
* Google PKCE + state real exchange
* Redis-backed refresh jti store
* Account linking mechanics
* Moderator role & enforcement
* Soft delete + history logging (announcements/events)
* Audit log insertion + metrics counters
* Cookie-based refresh endpoint & tests

## Open Questions
- Need multi-region session replication? (If scaling horizontally quickly, skip to stateless JWT path.)
- Email verification requirement? (Depends on providers; may add `email_verified` boolean.)

## Appendix: Announcements & Events Usage
- `GET /api/announcements` filtered by active + window.
- `GET /api/events?status=published` upcoming events (ends_at >= now).

---
Document version: 0.3 (Google PKCE, Redis, Linking, Moderator, History, Audit, Metrics, Cookie Refresh)
