# 14. Focused learning checklist

[Contents](README.md)

Only topics arising from this repository are included.

## TanStack Query

- [ ] Hierarchical keys and a mutation-to-affected-query map.
- [ ] Returned mutation callback promises and pending duration.
- [ ] UI-level versus cache-level optimistic updates.
- [ ] Cancellation, snapshots, rollback, and concurrent patches.
- [ ] Infinite-query background refetch and next-page failure handling.
- [ ] Freshness versus retention versus authentication cache lifecycle.

## Frontend architecture

- [ ] One owner for current-user data.
- [ ] Unknown, absent, and failed as distinct states.
- [ ] Preserve content after background errors.
- [ ] Server snapshot versus editable draft.
- [ ] Navigation guards versus authorization.

## Backend

- [ ] Desired-state like/save operations.
- [ ] Successful writes with lost responses.
- [ ] Durable media cleanup/reconciliation.
- [ ] Stale edit and delete/update conflicts.
- [ ] Actor identity from authentication.

## Database

- [ ] Unique user/post pairs.
- [ ] Lost updates and conditional writes.
- [ ] Relationship deletion/cascade behavior.
- [ ] Indexes for actual feed/search/membership queries.
- [ ] Transaction boundaries across database and storage.

## HTTP / API design

- [ ] POST creation versus PUT desired state.
- [ ] Canonical mutation response shapes.
- [ ] Idempotency keys and replay semantics.
- [ ] Versions/ETags and conditional updates.
- [ ] Authentication, validation, conflict, and rate-limit errors.
