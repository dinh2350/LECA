# Guest Session Design Spec

**Feature**: Guest Access + 3-Session Limit (Issue #3)
**Date**: 2026-05-29
**Status**: Approved
**Blocked by**: Issue #2 (conversation session module)

---

## Summary

Allow unauthenticated users to start a conversation without registering. The system tracks sessions per device using a server-issued HttpOnly cookie (UUID) and enforces a hard limit of 3 guest sessions before prompting account creation.

---

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Endpoint path | `POST /api/v1/conversations` | Domain language (not auth sessions); scaffolds Issue #2's module |
| Device fingerprint | Server-issued HttpOnly cookie (`device-id`) | Harder to spoof than client-controlled header; OWASP-safe |
| Implementation approach | New `ConversationsModule` + `GuestLimitGuard` | Clean domain separation; guard is independently testable; Redis wired once |
| Guest token storage (frontend) | React state (in-memory) | Not persisted — session ends on page reload; Redis counter persists via cookie |

---

## Architecture

### New Files — API (`apps/api/src/`)

```
redis/
  redis.module.ts            Global module; provides ioredis client via REDIS_CLIENT token
  redis.constants.ts         Injection token constant

conversations/
  conversations.module.ts
  conversations.controller.ts
  conversations.service.ts
  guards/
    guest-limit.guard.ts     Enforces 3-session Redis cap; sets device cookie
  dto/
    create-guest-conversation.dto.ts
```

### New Files — Web (`apps/web/src/`)

```
services/
  guest-session/
    use-guest-session.ts       Hook: POST /api/v1/conversations, stores token in state
    guest-session-context.ts   Context: guest token + limitReached state
    guest-session-provider.tsx

components/
  guest-limit-modal.tsx        Modal shown on 4th attempt; links to sign-up
```

### Modified Files

- `apps/api/src/app.module.ts` — import `RedisModule`, `ConversationsModule`
- `apps/web/src/app/[language]/layout.tsx` — wrap with `GuestSessionProvider`

---

## Data Flow

### Request: `POST /api/v1/conversations`

```
1. Cookie: device-id present?
     No  → generate crypto.randomUUID(), Set-Cookie (HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000)
     Yes → read deviceId from cookie

2. req.user present (OptionalJwtGuard decoded a valid JWT)?
     authenticated real user → GuestLimitGuard short-circuits (no Redis read)
     absent / guest           → GuestLimitGuard runs:
                                  INCR guest:limit:<deviceId>
                                  On first INCR: EXPIRE guest:limit:<deviceId> 2592000  (30 days)
                                  count > 3 → 403 GUEST_LIMIT_REACHED
                                  count ≤ 3 → continue

3. ConversationsService.createGuestSession(deviceId)
     → signs JWT: { sub: null, guest: true, deviceId }, expiresIn: '24h'
     → returns { token, expiresAt }
```

### Redis Schema

| Key | Type | Value | TTL |
|-----|------|-------|-----|
| `guest:limit:<deviceId>` | string (counter) | `1`–`N` | 30 days |

Counter is atomic `INCR` — no transactions needed.

### Guest JWT Payload

```ts
{
  sub: null,
  guest: true,
  deviceId: string,
  iat: number,
  exp: number   // iat + 24h
}
```

---

## Frontend Flow

1. Home page has "Start Practicing" button — no login gate.
2. Button calls `POST /api/v1/conversations` (no auth header).
3. `useGuestSession` stores the returned token in React state.
4. Token is used as Bearer for subsequent conversation API calls within the same page session.
5. On 403 `GUEST_LIMIT_REACHED` → `limitReached: true` → `GuestLimitModal` renders.
6. `GuestLimitModal` links to `/[language]/sign-up`. Dismissed only by signing up.
7. If user is authenticated, `AuthProvider` JWT is used instead; guest hook is inert.

---

## Error Handling

| Scenario | HTTP | Body |
|----------|------|------|
| Guest limit reached | 403 | `{ code: 'GUEST_LIMIT_REACHED', message: '...' }` |
| Redis unavailable | 503 | `{ code: 'SERVICE_UNAVAILABLE' }` — fail closed |
| Malformed cookie | — | Treat as absent → generate fresh device ID |

---

## Test Plan

### API Unit Tests

**`GuestLimitGuard`**
- 1st call → INCR returns 1 → passes
- 3rd call → INCR returns 3 → passes
- 4th call → INCR returns 4 → throws ForbiddenException
- Authenticated user → guard bypasses Redis entirely
- No cookie → UUID generated, Set-Cookie set, INCR + EXPIRE called

**`ConversationsService`**
- `createGuestSession()` returns JWT with `guest: true`, `deviceId`, exp ≤ now+24h+1s

### Frontend Tests

**`useGuestSession`**
- Success → token in state, guest mode active
- 403 GUEST_LIMIT_REACHED → `limitReached: true`
- `GuestLimitModal` renders when `limitReached === true`

---

## Acceptance Criteria

| Criterion | Implementation |
|-----------|---------------|
| Unauthenticated user can complete 3 sessions end-to-end | INCR 1→3 passes guard |
| 4th attempt renders account creation prompt | 403 → `limitReached: true` → modal |
| Guest JWT expires at session end | 24h JWT TTL |
| Device limit in Redis, not DB | `guest:limit:<deviceId>` key only |
| Authenticated users unaffected | Guard short-circuits on non-guest user |
