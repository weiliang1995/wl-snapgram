# 12. Architecture improvements at three levels

[Contents](README.md)

## Level 1 — Keep the current architecture

1. Add loading-aware route guards; move navigation decisions out of AuthContext's mount effect.
2. Add missing Explore/search invalidation after create/edit/delete/like.
3. Await reconciliation relevant to optimistic display.
4. Add mutation errors and separate search/next-page error handling.
5. Gate actions until required identity/membership is known.
6. Consolidate current-user fetching into one query-backed owner.
7. Classify retryable query errors.
8. Version Appwrite schema, indexes, and permissions.
9. Address whole-list like writes before treating the app as multi-user safe.

Concrete routing issues:

- [RootLayout](../src/_root/RootLayout.tsx) has no guard.
- [AuthLayout](../src/_auth/AuthLayout.tsx) hardcodes `isAuth = false`.
- [AuthContext](../src/context/AuthContext.tsx) redirects signed-out users on mount, including from `/sign-up` to `/sign-in`.

Guards improve navigation. Backend authorization remains required.

## Level 2 — Better production architecture

- Domain-oriented query-key factories.
- Independent likes/saves with enforced unique identities.
- Appwrite Functions for sensitive business writes where necessary.
- Actor derived from authenticated request.
- Bounded read models: counts and viewer flags.
- Compatible canonical mutation responses.
- Replay-safe creation and version-aware editing.
- Durable media cleanup/reconciliation.
- Explicit cancellation/reset of private caches during session changes.
- Defined cursor ordering and continuation behavior.

Continue using invalidation broadly. Add direct patches only when UX or measured bandwidth costs justify them.

## Level 3 — A larger social product

| Existing feature | Eventual backend concern |
|---|---|
| Global newest feed | Indexed chronological reads; later following-based assembly |
| Future follows | Start with read-time queries; fan-out only when needed |
| Photos | Object storage delivery, CDN, thumbnails, background processing |
| Likes/saves | Efficient membership, counts, contention handling |
| Future notifications | Durable events/jobs without blocking original writes |
| Other-device changes | Appwrite realtime, SSE, or WebSocket-driven invalidation |
| Search | Fulltext tuning before separate search infrastructure |
| Expensive requests / abuse | Rate limits and measured backend caching |
| Multi-step operations | Retryable jobs and reconciliation |
| Async counts/feed updates | Explicit eventual-consistency expectations |

Introduce these systems when existing requirements demand them. The immediate goal is safe writes and intentional synchronization, not hyperscale infrastructure.
