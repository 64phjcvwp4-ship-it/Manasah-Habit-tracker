# Security Specification — Maloxie Habit Tracker

## 1. Data Invariants
1. **Default Deny**: All paths outside `/users/{userId}`, `/users/{userId}/private/{docId}`, and `/users/{userId}/habits/{habitId}` are denied by default.
2. **Owner-Only Isolation & Verified Identity**: Only an authenticated user whose `request.auth.uid == userId` and `request.auth.token.email_verified == true` may create or mutate records under `/users/{userId}`.
3. **Master Gate Relational Sync**: Any document in `/users/{userId}/private/{docId}` or `/users/{userId}/habits/{habitId}` requires the parent `/users/{userId}` document to exist and have `ownerId == request.auth.uid`.
4. **PII Split Collection**: User `email` and `photoURL` live exclusively in `/users/{userId}/private/info` and are strictly readable only by the owner (`request.auth.uid == userId`).
5. **Immutable Ownership & Creation Timestamps**: `ownerId` and `createdAt` cannot be modified after creation. All `createdAt` and `updatedAt` timestamps must equal `request.time`.
6. **Strict Bounds & Total Array Guarding**: `history` must contain exactly 7 booleans; `notes` may contain at most 50 entries, each a non-empty string up to 280 characters; `tags` may contain at most 15 entries, each a non-empty string up to 24 characters; `lastActiveDate` matches `^\d{4}-\d{2}-\d{2}$`; `reminderTime` (optional) is `""` or matches `^([01]\d|2[0-3]):[0-5]\d$`; strings enforce `maxLength` and hex/ID regexes.
7. **Action-Based Updates**: Habit updates must match one of the explicit allowed actions (`toggle`, `freeze`, `addNote`, `updateTags`, `editDetails`, `rollover`, `setReminder`) verified via `affectedKeys().hasOnly(...)` and `isValidHabit(incoming())`.
8. **Secure List Queries**: `allow list` on `/users/{userId}/habits` evaluates `request.auth.uid == userId && resource.data.ownerId == request.auth.uid` without calling `get()` or `exists()`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Write**: Create habit in `/users/alice/habits/h1` with `auth: null`. -> `PERMISSION_DENIED`
2. **Unverified Email Write**: Create habit as `alice` with `email_verified: false`. -> `PERMISSION_DENIED`
3. **Cross-User Ownership Spoof (Path vs Data)**: `bob` creates `/users/bob/habits/h1` with `ownerId: "alice"`. -> `PERMISSION_DENIED`
4. **Cross-User Subcollection Intrusion**: `bob` reads or writes `/users/alice/habits/h1`. -> `PERMISSION_DENIED`
5. **PII Leak Attempt**: `bob` reads `/users/alice/private/info`. -> `PERMISSION_DENIED`
6. **Shadow / Ghost Field Injection**: `alice` creates or updates a habit adding `isAdmin: true` or `streakFreeze: 999` via a ghost key. -> `PERMISSION_DENIED`
7. **Self-Granted Freeze Tokens**: `alice` updates `streakFreeze` directly from `1` to `50` in an update. -> `PERMISSION_DENIED`
8. **Invalid ID Poisoning**: `alice` creates `/users/alice/habits/bad.id$with/chars` or >128 chars. -> `PERMISSION_DENIED`
9. **Spoofed Client Timestamp**: `alice` sets `createdAt` or `updatedAt` to a past/future hardcoded timestamp instead of `request.time`. -> `PERMISSION_DENIED`
10. **Immutable Field Mutation**: `alice` updates `ownerId` or `createdAt` on an existing habit. -> `PERMISSION_DENIED`
11. **Array & String Exhaustion**: `alice` submits a `name` > 80 chars, `history` with length != 7 or non-booleans, or > 50 notes / note > 280 chars. -> `PERMISSION_DENIED`
12. **Unfiltered List Query Scraping**: `bob` lists `/users/alice/habits` without `where('ownerId', '==', 'bob')`. -> `PERMISSION_DENIED`
