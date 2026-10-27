# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Strict Path & ID Validation (`isValidId`)**: Every document ID (`{lotId}`, `{reservationId}`, `{visitId}`, `{adminUid}`) must be a string of length `<= 128` matching `^[a-zA-Z0-9_\-]+$`.
2. **Verified Identity Enforcement**: Every write operation requires `request.auth != null` and `request.auth.token.email_verified == true`.
3. **Owner & PII Isolation**: `reservations` and `siteVisits` contain PII (`nomClient`, `cin`, `telephone`, `email`, `nomVisiteur`). Reading (`get` and `list`) is strictly restricted to `resource.data.ownerId == request.auth.uid || isAdmin()`. No blanket `isSignedIn()` reads are allowed.
4. **Anti-Update-Gap & Action-Based Updates**: Every `create` and `update` invokes `isValid[Entity](incoming())`, enforces exact key allowlists via `hasAll` and `hasOnly`, locks immutable fields (`id`, `ownerId`, `lotId`, `createdAt`), and enforces terminal state locking (`Validée`, `Refusée`, `Effectuée`, `Annulée`) unless overridden by `isAdmin()`.
5. **Temporal Integrity**: `createdAt == request.time` on creation and `updatedAt == request.time` on update.

## 2. The "Dirty Dozen" Payloads
1. **Payload 1 (Identity Spoofing on Reservation Create)**: Authenticated user `user_A` attempts to create `/reservations/res_1` with `ownerId: "user_B"`. -> `PERMISSION_DENIED`.
2. **Payload 2 (Unverified Email Spoof)**: User with `email: "ifleh2002@gmail.com"` and `email_verified: false` attempts to approve a reservation or update `/lots/A-001`. -> `PERMISSION_DENIED`.
3. **Payload 3 (Shadow Field Injection on Reservation Create)**: Payload includes extra ghost field `"isApprovedByAdmin": true` not in `hasOnly`. -> `PERMISSION_DENIED`.
4. **Payload 4 (PII Blanket Read / Cross-User Scraping)**: Authenticated `user_B` attempts `get` or `list` on `/reservations/res_owned_by_A`. -> `PERMISSION_DENIED`.
5. **Payload 5 (Terminal State Mutation)**: Owner attempts to update `/reservations/res_1` after `statut` is already `"Validée"` or `"Refusée"`. -> `PERMISSION_DENIED`.
6. **Payload 6 (State Escalation by Non-Admin)**: Regular owner attempts to set `statut: "Validée"` on `/reservations/res_1` during `create` or `update`. -> `PERMISSION_DENIED`.
7. **Payload 7 (Immutable Field Tampering)**: Owner updates `/siteVisits/vis_1` and modifies `createdAt` or `ownerId`. -> `PERMISSION_DENIED`.
8. **Payload 8 (Client Timestamp Forgery)**: Client supplies a past or future timestamp for `createdAt` or `updatedAt` instead of `request.time`. -> `PERMISSION_DENIED`.
9. **Payload 9 (Denial-of-Wallet Oversized String)**: Client sends a 5,000-character string in `nomClient` (exceeding `maxLength: 120`). -> `PERMISSION_DENIED`.
10. **Payload 10 (ID Poisoning)**: Client attempts to create a document with an invalid ID containing spaces or special characters. -> `PERMISSION_DENIED`.
11. **Payload 11 (Value Poisoning on Update)**: Client updates an allowed key (`creneau` on `/siteVisits/vis_1`) with an integer `12345` instead of a bounded string. -> `PERMISSION_DENIED`.
12. **Payload 12 (Self-Privilege Escalation in `/admins`)**: Non-admin user attempts to write their own UID into `/admins/{uid}`. -> `PERMISSION_DENIED`.
