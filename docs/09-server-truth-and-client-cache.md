# 9. Server truth versus client cache

[Contents](README.md)

Appwrite owns persisted truth. TanStack Query owns cached representations observed by this browser.

| Concept | Meaning in this application |
|---|---|
| Stale | Eligible for revalidation; not necessarily incorrect |
| Refetch | Another observation of server state |
| Invalidation | Marks local representation stale; not a broadcast to every device |
| Optimism | Prediction of the operation's outcome |
| Rollback | Reverses prediction, not committed server work |
| Mutation response | Reconciliation input if shape/semantics are sufficient |
| Separate keys | Independent representations even when containing the same entity |

## No automatic normalization

```text
Home contains post 123
Explore contains post 123
Search contains post 123
Detail contains post 123
```

These are independently cached copies in [query hooks](../src/lib/react-query/queriesAndMutation.ts). Updating or invalidating one does not automatically change the others.

That is why mutation coverage matters, and why [hierarchical keys](03-query-key-design.md) help.

## Where cached data is treated as authoritative

[PostStats](../src/components/shared/PostStats.tsx) computes the next list from its snapshot:

```tsx
const newLikes = likes.includes(userId)
  ? likes.filter((id) => id !== userId)
  : [...likes, userId];
```

[likePost](../src/lib/appwrite/api.ts) writes that whole list remotely. The browser assumes its cached knowledge of everyone's likes is complete enough to replace shared state. This is unsafe under concurrency.

Two subtler assumptions:

- Missing current-user query data is treated as no save, although it can mean still loading or failed.
- [AuthContext](../src/context/AuthContext.tsx) uses a local `cookieFallback` marker as a prerequisite for authentication recovery. A marker is a hint, not proof of server session validity or absence.

The frontend should send user intent and reconcile server results. It should not replace shared truth using an incomplete snapshot when a narrower operation is possible.
