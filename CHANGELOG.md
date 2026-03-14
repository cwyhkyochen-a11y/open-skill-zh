# Changelog

All notable changes to SocialHub Console will be documented in this file.

## [1.5.0] - 2026-03-11

### 🎉 Major: Multi-Platform Publishing Pipeline

First production-ready release with full end-to-end social media publishing.

#### Added
- **Twitter image posting** via Composio `tools.proxy` + Twitter v2 `/2/media/upload` API
  - Composio Twitter toolkit has no native media upload tool; solved with proxy approach
- **Instagram two-step publishing** (CREATE_MEDIA_CONTAINER → CREATE_POST)
- **Facebook text/image/link posting** with automatic page_id resolution
- **Media upload API** (`/api/media/upload`) — local storage with public URL generation
- **Account management enhancements**:
  - `/api/accounts/[id]/facebook-pages` — auto-fetch and store Facebook Page IDs
  - `/api/accounts/[id]/instagram-user-id` — Instagram Business Account ID management
  - `/api/accounts/refresh` — refresh account connection status
- **AccountDetailDialog** — view/edit account platform-specific fields
- **PublishProgressDialog** — real-time publish progress per account
- **DEVELOPMENT.md** — comprehensive developer documentation

#### Fixed
- **Critical: Composio entity mismatch bug** — `getConnectedAccountId()` now strictly matches `user_id + toolkit.slug + ACTIVE` (Composio API ignores `user_id` filter parameter)
- **Instagram tool name** — corrected from `INSTAGRAM_PUBLISH_MEDIA_CONTAINER` to `INSTAGRAM_CREATE_POST`
- **Facebook image posting** — local file paths replaced with public URLs via Caddy static file serving
- **ComposioClient lazy loading** — prevents recursive stack overflow during Next.js server-side construction
- **Import alias collision** — renamed `ComposioClient` import to `ComposioRestClient`

#### Changed
- Publish router completely rewritten with per-platform dedicated methods
- Content type definitions expanded
- Database schema cleaned — removed misplaced facebook/instagram fields from unrelated tables

#### Infrastructure
- Caddy configured to serve `/contentops/uploads/*` as static files (before reverse_proxy)
- PM2 process management with `start.sh`

### Platform Test Results (2026-03-11)

| Platform | Text | Image | Link |
|----------|------|-------|------|
| Twitter (@alphazu_) | ✅ | ✅ | ✅ |
| Instagram (kyochen) | — | ✅ | — |
| Facebook (kyochen) | ✅ | ✅ | pending |

## [1.4.0] - 2026-03-10

### Added
- OAuth configuration page with all platform support
- Initial Composio SDK integration

## [1.3.0] - 2026-03-09

### Initial Release
- Next.js 16 + React 19 project scaffolding
- Dashboard layout with sidebar navigation
- Account management (CRUD)
- Basic publish page
- SQLite + Drizzle ORM setup
- JWT authentication
