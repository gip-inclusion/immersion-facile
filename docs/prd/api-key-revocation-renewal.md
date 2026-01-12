# PRD: API Key Revocation and Renewal

## Problem Statement

Currently, API consumers (external partners using our API) receive a JWT token that cannot be invalidated before its expiration date. If an API key is leaked or compromised, administrators have no way to:
1. **Revoke** access immediately
2. **Rotate** the key (issue a new one while invalidating the old)

This creates a security risk where compromised keys remain valid until natural expiration.

## Goals

- Allow admins to **revoke** an API consumer, immediately blocking all API access
- Allow admins to **renew** an API key, generating a new JWT while invalidating the old one
- Provide clear UI feedback for these operations
- Maintain audit trail via domain events

## Non-Goals

- Token history tracking (showing all previously issued tokens)
- Un-revoke functionality (restoring a revoked consumer)
- Automatic key rotation

## User Stories

### US1: Revoke API Consumer
**As an** admin
**I want to** revoke an API consumer's access
**So that** compromised or deprecated consumers cannot use the API

**Acceptance Criteria:**
- "Revoke" button visible for active consumers
- Confirmation modal with warning message
- After revocation: consumer marked with red "Revoked" badge
- All API calls with that consumer's JWT return 401
- Action is permanent (no undo)

### US2: Renew API Key
**As an** admin
**I want to** generate a new API key for a consumer
**So that** I can rotate keys after a potential leak without losing the consumer configuration

**Acceptance Criteria:**
- "Renew Key" button visible for active consumers
- Confirmation modal warning that old key will be invalidated
- New JWT displayed for copying (reuse existing token display component)
- Old JWT immediately stops working
- Consumer configuration (rights, scopes, contact) preserved

## Technical Approach

### Key Mechanism: JWT `iat` Timestamp Validation

JWT tokens include an `iat` (issued-at) claim. We store `currentKeyIssuedAt` in the database:
- On key renewal: update `currentKeyIssuedAt` to now, generate new JWT
- Middleware validates: `jwt.iat >= consumer.currentKeyIssuedAt`
- Old JWTs have older `iat`, fail validation

### Database Changes

Add to `api_consumers` table:
| Column | Type | Description |
|--------|------|-------------|
| `revoked_at` | TIMESTAMPTZ NULL | Null = active, timestamp = revoked |
| `current_key_issued_at` | TIMESTAMPTZ NOT NULL | Timestamp of current valid JWT |

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/api-consumers/:id/revoke` | POST | Revoke consumer |
| `/admin/api-consumers/:id/renew-key` | POST | Renew key, returns new JWT |

### Middleware Validation

```
1. Verify JWT signature
2. Get consumer from DB by ID
3. If consumer.revokedAt → 401 "api consumer revoked"
4. If jwt.iat < consumer.currentKeyIssuedAt → 401 "key renewed, use new key"
5. Continue to route handler
```

### UI Changes

**API Consumers table (admin/technical-options):**
- Add "Revoke" button (red) - opens confirmation modal
- Add "Renew Key" button - opens confirmation modal
- Show red "Revoked" badge for revoked consumers
- Disable all action buttons for revoked consumers

**Modals:**
- Revoke: "This action is permanent. The consumer will immediately lose API access."
- Renew: "The current key will be invalidated immediately. Share the new key with the consumer."

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Revocation permanence | Permanent only | Simpler model, create new consumer if needed |
| Revoked consumer visibility | Show with badge | Audit trail, prevents confusion |
| Token history | Not tracked | Complexity vs value tradeoff |
| Key validation mechanism | iat timestamp | Uses standard JWT claim, no new concepts |

## Success Metrics

- Admins can revoke a consumer and API calls fail within seconds
- Admins can renew a key and old token fails immediately
- Zero false positives (valid tokens rejected)

---

# Implementation Plan

## Phase 1: Database & Shared Types

### 1.1 Database Migration
Create migration adding to `api_consumers`:
- `revoked_at: TIMESTAMPTZ NULL`
- `current_key_issued_at: TIMESTAMPTZ NOT NULL DEFAULT NOW()`

For existing consumers: set `current_key_issued_at = created_at`.

### 1.2 Kysely Model
File: `back/src/config/pg/kysely/model/database.ts`
- Add `revoked_at: Timestamp | null`
- Add `current_key_issued_at: Timestamp`

### 1.3 Shared Types
File: `shared/src/apiConsumer/ApiConsumer.ts`
```typescript
export type ApiConsumer = ReplaceTypeAtKey<...> & {
  createdAt: DateString;
  revokedAt: DateTimeIsoString | null;
  currentKeyIssuedAt: DateTimeIsoString;
};
```

File: `shared/src/apiConsumer/apiConsumer.schema.ts`
- Add zod schemas for new fields

---

## Phase 2: Repository Updates

### 2.1 PgApiConsumerRepository
File: `back/src/domains/core/api-consumer/adapters/PgApiConsumerRepository.ts`
- Add fields to SELECT, INSERT, UPDATE
- Update `#rawPgToApiConsumer` mapper

### 2.2 InMemoryApiConsumerRepository
File: `back/src/domains/core/api-consumer/adapters/InMemoryApiConsumerRepository.ts`
- Add default values

### 2.3 Test Builders
- Update `ApiConsumerBuilder` with new fields

---

## Phase 3: Backend Use Cases

### 3.1 RevokeApiConsumer
Create: `back/src/domains/core/api-consumer/use-cases/RevokeApiConsumer.ts`

1. `throwIfNotAdmin(currentUser)`
2. Get consumer, check exists and not already revoked
3. Set `revokedAt = now()`
4. Save to repository
5. Emit `ApiConsumerRevoked` event

### 3.2 RenewApiConsumerKey
Create: `back/src/domains/core/api-consumer/use-cases/RenewApiConsumerKey.ts`

1. `throwIfNotAdmin(currentUser)`
2. Get consumer, check exists and not revoked
3. Update `currentKeyIssuedAt = now()`
4. Save to repository
5. Emit `ApiConsumerKeyRenewed` event
6. Return new JWT

### 3.3 Update SaveApiConsumer
File: `back/src/domains/core/api-consumer/use-cases/SaveApiConsumer.ts`
- On create: set `currentKeyIssuedAt = now()`, `revokedAt: null`
- On update: preserve existing values

---

## Phase 4: Middleware Changes

File: `back/src/config/bootstrap/authMiddleware.ts`

Add after DB lookup:
```typescript
if (apiConsumer.revokedAt) {
  return responseErrorForV2(res, "api consumer revoked", 401);
}

const jwtIssuedAt = new Date(jwtPayload.iat * 1000);
const currentKeyIssuedAt = new Date(apiConsumer.currentKeyIssuedAt);
if (jwtIssuedAt < currentKeyIssuedAt) {
  return responseErrorForV2(res, "api key has been renewed", 401);
}
```

---

## Phase 5: API Routes

### 5.1 Route Definitions
File: `shared/src/admin/admin.routes.ts`

```typescript
revokeApiConsumer: defineRoute({
  method: "post",
  url: "/admin/api-consumers/:consumerId/revoke",
  ...withAuthorizationHeaders,
  responses: { 200, 401, 403, 404, 409 },
}),

renewApiConsumerKey: defineRoute({
  method: "post",
  url: "/admin/api-consumers/:consumerId/renew-key",
  ...withAuthorizationHeaders,
  responses: { 200: apiConsumerJwtSchema, 401, 403, 404, 409 },
}),
```

### 5.2 Router Implementation
File: `back/src/adapters/primary/routers/admin/createAdminRouter.ts`
- Wire routes to use cases

---

## Phase 6: Frontend Changes

### 6.1 Redux Slice
File: `front/src/core-logic/domain/apiConsumer/apiConsumer.slice.ts`
- Add: `revokeApiConsumerRequested/Succeeded/Failed`
- Add: `renewApiConsumerKeyRequested/Succeeded/Failed`

### 6.2 Redux Epics
File: `front/src/core-logic/domain/apiConsumer/apiConsumer.epics.ts`
- Add epics for revoke and renew

### 6.3 AdminGateway
Files: `front/src/core-logic/ports/AdminGateway.ts`, `HttpAdminGateway.ts`
- Add `revokeApiConsumer$()` and `renewApiConsumerKey$()`

### 6.4 UI Components
File: `front/src/app/contents/admin/apiConsumer.tsx`
- Add "Revoke" and "Renew Key" buttons
- Show red "Revoked" badge

File: `front/src/app/pages/admin/technical-options-sections/ApiConsumersSection.tsx`
- Add confirmation modals
- Reuse `ShowApiKeyToCopy` for new key display
- Disable buttons for revoked consumers

### 6.5 DOM Element IDs
File: `shared/src/domElementIds.ts`
- Add IDs for new buttons and modals

---

## Phase 7: Events & Errors

### 7.1 Domain Events
File: `back/src/domains/core/events/events.ts`
- Add `ApiConsumerRevoked` event
- Add `ApiConsumerKeyRenewed` event

### 7.2 Error Types
- Add `apiConsumer.notFound`, `alreadyRevoked`, `isRevoked`

---

## Phase 8: Testing

### Unit Tests
- `RevokeApiConsumer.unit.test.ts`
- `RenewApiConsumerKey.unit.test.ts`
- `authMiddleware` revocation/renewal checks

### E2E Tests
- Revoke endpoint + consumer blocked
- Renew endpoint + old JWT blocked

---

## Critical Files

| Layer | File |
|-------|------|
| Types | `shared/src/apiConsumer/ApiConsumer.ts` |
| Schema | `shared/src/apiConsumer/apiConsumer.schema.ts` |
| Routes | `shared/src/admin/admin.routes.ts` |
| Middleware | `back/src/config/bootstrap/authMiddleware.ts` |
| Repository | `back/src/domains/core/api-consumer/adapters/PgApiConsumerRepository.ts` |
| Use Cases | `back/src/domains/core/api-consumer/use-cases/` |
| Router | `back/src/adapters/primary/routers/admin/createAdminRouter.ts` |
| Redux | `front/src/core-logic/domain/apiConsumer/apiConsumer.slice.ts` |
| UI | `front/src/app/pages/admin/technical-options-sections/ApiConsumersSection.tsx` |

---

## Verification Plan

1. **Unit tests**: Use case tests pass
2. **E2E tests**: Endpoint tests pass
3. **Manual testing**:
   - Create consumer, use JWT to call API
   - Revoke consumer → API returns 401
   - Create new consumer, renew key → old JWT fails, new JWT works
4. **Frontend**: Buttons work, modals display, token copyable

---

## Implementation Order

**Backend (can deploy independently):**
1. ~~Phase 1: DB + types~~ ✅ DONE
2. ~~Phase 2: Repositories~~ ✅ DONE
3. ~~Phase 3: Use cases~~ ✅ DONE
4. ~~Phase 4: Middleware~~ ✅ DONE
5. ~~Phase 5: Routes~~ ✅ DONE
6. ~~Phase 7: Events/errors~~ ✅ DONE
7. ~~Backend tests~~ ✅ DONE (unit + e2e)

**Frontend:**
8. Phase 6: UI - TODO
9. Frontend tests + manual testing - TODO
