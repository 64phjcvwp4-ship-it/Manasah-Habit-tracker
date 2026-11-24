/**
 * Phase 0: Security Rules Verification Suite (Dirty Dozen Adversarial Payloads)
 * Run against the Firebase Emulator Suite (`@firebase/rules-unit-testing`) when testing locally.
 */

export const DIRTY_DOZEN_CASES = [
  {
    name: '1. Unauthenticated Write',
    auth: null,
    op: 'create',
    path: 'users/alice/habits/h1',
    expect: 'PERMISSION_DENIED',
  },
  {
    name: '2. Unverified Email Write',
    auth: { uid: 'alice', token: { email_verified: false } },
    op: 'create',
    path: 'users/alice/habits/h1',
    expect: 'PERMISSION_DENIED',
  },
  {
    name: '3. Cross-User Ownership Spoof (ownerId mismatch)',
    auth: { uid: 'bob', token: { email_verified: true } },
    op: 'create',
    path: 'users/bob/habits/h1',
    payload: { ownerId: 'alice', name: 'Meditation' },
    expect: 'PERMISSION_DENIED',
  },
  {
    name: '4. Cross-User Subcollection Intrusion',
    auth: { uid: 'bob', token: { email_verified: true } },
    op: 'get',
    path: 'users/alice/habits/h1',
    expect: 'PERMISSION_DENIED',
  },
  {
    name: '5. PII Leak Attempt',
    auth: { uid: 'bob', token: { email_verified: true } },
    op: 'get',
    path: 'users/alice/private/info',
    expect: 'PERMISSION_DENIED',
  },
  {
    name: '6. Shadow / Ghost Field Injection',
    auth: { uid: 'alice', token: { email_verified: true } },
    op: 'create',
    path: 'users/alice/habits/h1',
    payload: { ownerId: 'alice', isAdmin: true },
    expect: 'PERMISSION_DENIED',
  },
  {
    name: '7. Self-Granted Freeze Tokens on Update',
    auth: { uid: 'alice', token: { email_verified: true } },
    op: 'update',
    path: 'users/alice/habits/h1',
    payload: { streakFreeze: 10 },
    expect: 'PERMISSION_DENIED',
  },
  {
    name: '8. Invalid ID Poisoning',
    auth: { uid: 'alice', token: { email_verified: true } },
    op: 'create',
    path: 'users/alice/habits/bad$id!',
    expect: 'PERMISSION_DENIED',
  },
  {
    name: '9. Spoofed Client Timestamp',
    auth: { uid: 'alice', token: { email_verified: true } },
    op: 'create',
    path: 'users/alice/habits/h1',
    payload: { createdAt: '2020-01-01T00:00:00Z' },
    expect: 'PERMISSION_DENIED',
  },
  {
    name: '10. Immutable Field Mutation (ownerId)',
    auth: { uid: 'alice', token: { email_verified: true } },
    op: 'update',
    path: 'users/alice/habits/h1',
    payload: { ownerId: 'bob' },
    expect: 'PERMISSION_DENIED',
  },
  {
    name: '11. Array & String Exhaustion (name > 80 chars, notes > 50, tags > 15 or > 24 chars, invalid reminderTime)',
    auth: { uid: 'alice', token: { email_verified: true } },
    op: 'update',
    path: 'users/alice/habits/h1',
    payload: { name: 'a'.repeat(81), tags: Array.from({ length: 16 }, (_, i) => `t${i}`), reminderTime: '99:99' },
    expect: 'PERMISSION_DENIED',
  },
  {
    name: '12. Unfiltered List Query Scraping',
    auth: { uid: 'bob', token: { email_verified: true } },
    op: 'list',
    path: 'users/alice/habits',
    expect: 'PERMISSION_DENIED',
  },
] as const;
