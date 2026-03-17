# Booker Implementation Plan

Last Updated: 2026-03-17

## Goal
Ship monetizable core features in a safe sequence:
1. Subscription foundation (Basic vs Pro) and branch/workspace limits
2. Customer and debt workflow improvements
3. Email and auth hardening (verification + reset OTP)
4. Team invite and role management
5. Reporting export (CSV) + receipt storage
6. WhatsApp Meta API automation
7. Monitoring and logging for production

## Delivery Principles
- Build backend contract first, then frontend integration
- Keep each phase deployable independently
- Add minimal tests for each backend feature before moving on
- Use feature flags/config where rollout risk exists
- Prefer async/background processing for external integrations (email, WhatsApp)
- Keep secrets in environment variables only (no hardcoded credentials)

## Cross-Cutting Foundation: Infra + Async Processing

### INFRA-1: SMTP + background job pipeline
- Integrate SMTP provider (via Nest mailer service + transport config)
- Add background jobs (queue + worker) for non-blocking email send
- Add retry policy, dead-letter handling, and idempotency key support
- Acceptance:
  - API response is fast while email sends in background
  - Failed sends are retried and observable in logs

### INFRA-2: Object storage (DigitalOcean Spaces)
- Integrate S3-compatible client for DigitalOcean Spaces
- Add file service for uploads, signed URLs, and lifecycle policy hooks
- Target artifacts:
  - Reports CSV exports
  - Receipt files/images (where available)
- Acceptance:
  - Files are stored in Spaces and retrievable by signed/public URL policy
  - App stores metadata only (path/url, content type, size)

### INFRA-3: Observability baseline (monitoring + logging)
- Structured logging across API and workers (request ID, user ID, workspace ID)
- Health/readiness endpoints and key metrics (queue lag, email success rate)
- Error tracking hooks for backend runtime exceptions
- Acceptance:
  - Production incidents can be traced with correlation IDs
  - Queue/email/storage failures are visible with actionable logs

## Phase 1: Subscription + Workspace Limits (In Progress)

### P1-BE-0: 14-day free trial policy (Required)
- Add trial fields on user/subscription domain:
  - `trialStartAt`
  - `trialEndsAt`
  - `trialStatus` (`active` | `expired` | `converted`)
- Default new accounts to `pro` plan with `trialStatus=active` for 14 days
- Enforce feature access by plan + trial state:
  - During trial: Pro-gated features allowed
  - After trial expiry without upgrade: block access and require paid upgrade
- Add endpoint metadata so frontend can show trial countdown (`daysLeft`)
- Acceptance:
  - New users get exactly 14 days free trial on Pro
  - Expired trial users are blocked until they upgrade to a paid plan
  - Existing users are backfilled safely without auth regressions

### P1-BE-1: Add plan field + workspace role migration (In Progress)
- Add `plan` to user domain (`basic` default, `pro` optional)
- Ensure workspace membership role model supports `owner`, `manager`, `staff`
- Add DB migration and backfill existing users to `basic`
- Acceptance:
  - Existing users still log in
  - New users get `basic`
  - Roles persist and are queryable

### P1-BE-2: Enforce workspace/branch limits per plan
- Add centralized plan guard/service in backend
- Rules:
  - `basic`: 1 workspace only
  - `pro`: up to 3 workspaces (or configured limit)
- Enforce on workspace create endpoints
- Return clear 403/422 error payload for UI handling
- Acceptance:
  - Basic user blocked from creating second workspace
  - Pro user can create up to limit, then blocked

### P1-FE-1: Plan badge + Upgrade modal
- Show current plan in Settings/Workspace context
- Add reusable `UpgradeModal` with clear Pro benefits
- Connect modal to upsell trigger points
- Acceptance:
  - Plan always visible
  - Upgrade modal can be launched from blocked actions

### P1-FE-2: Gate branch/workspace create behind plan
- In branch/workspace creation screens, call backend and handle plan-limit errors
- If blocked, show upgrade modal with contextual message
- Acceptance:
  - User sees meaningful reason and next step
  - No silent failures

## Phase 2: Customer + Debt Improvements

### P2-BE-1: Customer entity + CRUD
- Create `Customer` entity tied to workspace/branch
- Fields: name, phone, email(optional), note(optional), status
- Endpoints: create/list/update/delete with workspace scoping
- Acceptance:
  - Customer records isolated by workspace
  - Validation and pagination in list endpoint

### P2-FE-1: Customer management screens
- Add `CustomersListScreen` and `AddCustomerScreen`
- Search by name/phone
- Acceptance:
  - User can add and view customers from app UI

### P2-FE-2: Debt flow integration
- In `RecordDebtScreen`, add customer picker
- Save debt against customer ID
- Add per-customer debt summary in debt views
- Acceptance:
  - Debts are linked and traceable to customer records

## Phase 3: Auth Security (Email Verification + Password Reset OTP)

### P3-BE-1: Registration email verification (6-digit OTP)
- On registration, generate 6-digit verification code and expiry
- Queue email send via background job (SMTP)
- Add verify endpoint to activate account/email status
- Add resend endpoint with cooldown/rate limits
- Acceptance:
  - User cannot use protected flows until email is verified (policy-controlled)
  - Verification code is single-use and expires correctly

### P3-BE-2: Forgot password via 6-digit code
- Generate 6-digit reset code + expiry for forgot password
- Send reset code by background email job
- Add endpoints: request reset, verify code, set new password
- Rate limit reset attempts and protect against enumeration
- Acceptance:
  - Valid code allows password reset
  - Expired/invalid code is rejected with clear error

### P3-FE-1: Verification and reset screens update
- Add OTP input flow for registration verification
- Update forgot password screen to handle 6-digit code verification + new password
- Add resend timer UI and friendly error states
- Acceptance:
  - User can complete verification and reset flows fully on mobile

## Phase 4: Team Invite + Member Management

### P4-BE-1: Invite member endpoint
- Endpoint to invite by email/phone with target role and branch/workspace scope
- For existing user: create pending membership
- For new user: create invitation token flow
- If invite uses email, send invite via SMTP queue worker
- Acceptance:
  - Invite cannot exceed role permissions of inviter
  - Invite audit fields saved

### P4-FE-1: Team members + invite screen
- Add Team screen showing members and roles
- Add Invite form with role selector
- Acceptance:
  - Owner can invite Manager/Staff
  - Manager can invite Staff only (if policy enabled)

## Phase 5: Reports Export + Receipt Storage

### P5-BE-1: CSV generation and upload pipeline
- Generate report CSV on backend (filter/date scoped)
- Upload CSV file to DigitalOcean Spaces
- Return file metadata + signed download URL
- Acceptance:
  - Export link works and expires per policy
  - File generation handles large datasets safely

### P5-BE-2: Receipt storage in Spaces
- Store receipt files/images in Spaces during sale/expense flows where applicable
- Save receipt metadata references on transaction entities
- Acceptance:
  - Receipts can be uploaded and later retrieved securely

### P5-FE-1: Export and receipt UX
- Update Reports screen to request backend export and open/share returned file URL
- Add receipt upload/view controls in transaction recording screens
- Acceptance:
  - CSV export and receipt access work on Android and iOS

## Phase 6: WhatsApp Meta API Integration

### P6-BE-1: Meta WhatsApp API service integration
- Add WhatsApp service module (templates + utility sends)
- Store API credentials in env and validate on boot
- Use queue worker for outgoing messages and retries
- Acceptance:
  - System can send approved template messages reliably

### P6-BE-2: Messaging policies and quotas
- Enforce subscription quotas and overage rules in backend
- Log each message event (queued/sent/failed) for billing/audit
- Acceptance:
  - Message consumption is trackable per workspace and plan

### P6-FE-1: WhatsApp automation settings
- Add settings UI for opt-in toggles and event selection
- Add delivery status indicators where needed
- Acceptance:
  - Users can enable/disable WhatsApp automations clearly

## Phase 7: Monitoring + Logging Hardening

### P7-BE-1: Structured logs and correlation IDs
- Add request/queue correlation IDs through middleware and jobs
- Standardize log format with severity and context fields
- Acceptance:
  - Single operation traceable across API + worker

### P7-BE-2: Dashboards and alerts
  - Team gets proactive alerts for production issues

## Phase 8: Build + Deployment (PlayStore/AppStore Ready)

### P8-1: Expo SDK upgrade to latest
- Update from SDK 49 to latest stable version (SDK 51+)
- Test all core functionality: auth, sync, UI, offline features on real devices
- Update native dependencies (React Native, Android/iOS tools)
- Validate EAS build pipeline works for both Android and iOS
- Acceptance:
  - App builds and runs without crashes on latest SDKs
  - No auth/sync regressions
  - eas build commands succeed for both playstore and appstore profiles

### P8-2: PlayStore compliance prep
- Update app metadata: version code, description, screenshots, privacy policy link
- Add required permissions documentation in app.json
- Validate gradle/signing config for production PlayStore build
- Test APK/AAB generation with production profile
- Acceptance:
  - Build artifacts pass PlayStore validation checks
  - Version increments properly for updates

### P8-3: AppStore compliance prep
- Update iOS build number and version codes
- Configure Apple signing certificates and provisioning profiles
- Add app preview screenshots and metadata
- Test production IPA generation
- Acceptance:
  - IPA builds and can be uploaded to TestFlight
  - Version management is clear for incremental updates

### P8-4: UI/UX improvements and refinements
- Improve dashboard card layouts and spacing on different screen sizes
- Enhance form validation feedback and error messaging
- Add loading state indicators and skeleton screens for data-heavy views
- Refine color contrast and accessibility (WCAG AA compliance)
- Reorganize navigation tab order and screen hierarchy for discoverability
- Add micro-interactions (touch feedback, animations) for key actions
- Improve empty state messaging and call-to-action clarity
- Acceptance:
  - App feels polished and responsive across phones/tablets
  - Users get clear feedback at every interaction point
  - Navigation is intuitive and discoverable

### P8-5: Build artifact versioning and CI/CD pipeline
- Set up automated build triggers on main branch commits
- Auto-increment version codes for PlayStore/AppStore
- Generate release notes from changelog
- Set up TestFlight and PlayStore testing tracks
- Acceptance:
  - Builds are reproducible and version-managed
  - Testers get automatic updates to test versions

## Execution Order (Next 20 Work Items)
1. Implement P1-BE-0 14-day free trial policy
2. Finish P1-BE-1 migration and entity updates
3. Implement P1-BE-2 plan limit guard/service
4. Wire plan-limit guard into workspace create endpoint
5. Add frontend plan badge in settings/workspace area
6. Implement reusable `UpgradeModal`
7. Handle plan-limit backend errors in branch/workspace create UI
8. **PARALLEL START**: Expo SDK upgrade to latest (P8-1)
9. Set up SMTP config + async email queue worker (INFRA-1)
10. Implement registration email verification with 6-digit OTP (P3-BE-1)
11. Implement forgot-password 6-digit OTP reset flow (P3-BE-2)
12. Implement `Customer` backend entity + list/create endpoints
13. Add customer list/create mobile screens
14. Integrate customer picker into debt recording
15. Integrate DigitalOcean Spaces for CSV + receipt storage (INFRA-2, P5)
16. Add WhatsApp Meta API service with queue and quotas (P6)
17. PlayStore metadata + compliance checks (P8-2)
18. AppStore metadata + compliance checks (P8-3)
19. UI/UX refinements and polish (P8-4)
20. CI/CD pipeline setup for automated builds (P8-5)

## API/Error Contract for Plan Limits
Use a consistent payload for blocked actions:

```json
{
  "statusCode": 403,
  "code": "PLAN_LIMIT_REACHED",
  "message": "Your Basic plan allows only 1 workspace. Upgrade to Pro to add more.",
  "meta": {
    "plan": "basic",
    "limit": 1,
    "current": 1,
    "feature": "workspace.create"
  }
}
```

## Definition Of Done (Per Task)
- Code implemented and lint-clean
- Backend endpoint validated manually
- UI path tested on at least one real device/emulator
- No auth/workspace isolation regressions
- Small changelog entry in PR description
- Logs/metrics added for new async/external integration features

## Immediate Start (Current Sprint)
- Active now: `P1-BE-0 14-day free trial policy`
- Next after completion: `P1-BE-1 Add plan field + workspace role migration`
- Then: `P1-BE-2 Enforce workspace limit per plan`
- Completed in parallel: `P8-1 Expo SDK upgrade`

## Environment Variables Checklist
- `CORS_ORIGIN`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `QUEUE_REDIS_URL` (or equivalent queue backend)
- `DO_SPACES_ENDPOINT`
- `DO_SPACES_REGION`
- `DO_SPACES_BUCKET`
- `DO_SPACES_ACCESS_KEY`
- `DO_SPACES_SECRET_KEY`
- `DO_SPACES_CDN_BASE_URL` (optional)
- `WHATSAPP_META_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`




Now (core business logic — no external deps)

#3–6: Subscription plan enforcement + frontend gates — this is the monetization foundation everything else builds on
Then (email infra first, then auth features that need it)

#7: SMTP + async queue — must exist before any OTP emails can be sent
#8–10: Registration OTP + forgot password OTP
Then (customer + debt — self-contained features)

#11–13: Customer entity → screens → debt picker
Then (invites — needs SMTP already set up)

#14–15: Team invite endpoint + screens
Then (file storage, then features that depend on it)

#16: DO Spaces service — must exist before any file uploads
#17: CSV export + receipt storage
Then (WhatsApp — its own integration, comes after core flows are stable)

#18: WhatsApp Meta API
Finally (polish + store prep — done last so there's a complete app to polish/submit)

#19: UI/UX polish
#20: Monitoring + logging
#21–22: PlayStore + AppStore compliance
#23: CI/CD automation
Also — the build ran with exit code 1. Do you want me to check what the build error was before we continue?

Claude Sonnet 4.6 • 0.9x