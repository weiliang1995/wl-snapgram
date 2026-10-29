# 6. Backend concepts exposed by this project

[Contents](README.md)

All examples below are anchored in [api.ts](../src/lib/appwrite/api.ts).

| Frontend problem | Backend concept |
|---|---|
| Retry creates another post/save | Idempotency |
| Concurrent likes overwrite one another | Lost updates and concurrency control |
| Duplicate user/post relationship | Unique constraint |
| Relationship write plus stored count | Transaction or explicit eventual consistency |
| Browser upload/write/cleanup fails halfway | Durable compensation and reconciliation |
| Deleted post leaves dependent saves | Referential integrity / cascade |
| User supplies another creator ID | Authorization and trusted identity |
| Feed/search becomes expensive | Query-driven indexing and rate limiting |

## Lost updates

Current `likePost` replaces all likes:

```ts
data: { likes: likesArray }
```

Two browsers read `[A]`. B sends `[A, B]`; C sends `[A, C]`. The later replacement can remove the earlier like.

Refetching only reveals the final overwritten state. It cannot reconstruct lost intent.

Use independent likes identified by `(postId, userId)`, with backend uniqueness and an operation scoped to the authenticated user.

## Idempotency

`savePost` and `createPost` generate IDs inside each invocation. Retrying invokes a new creation rather than completing the same operation.

- Post creation: generate one operation identifier per submission and reuse it after uncertain outcomes. Backend stores/replays the outcome and rejects incompatible reuse.
- Saving: natural identity is this user's save of this post. Repeating “ensure saved” should not create another relationship.
- `rowId = accountId` prevents duplicate profile identities, but repeated `createRow` may still conflict. The entire registration workflow is not automatically retry-safe.

## Transactions and their limits

If liking creates a row and increments a stored count, both database changes should succeed together unless delayed count consistency is explicitly accepted and repairable.

Your media workflow crosses database and storage APIs. A database transaction does not automatically roll back an uploaded file or an Account operation.

## Durable compensation

Your catch-block deletion is compensation. It is best effort while browser code is running.

A production workflow needs persisted operation state, retryable cleanup, and reconciliation of unreferenced files. It must also avoid deleting media referenced by a write whose response was lost.

## Referential integrity

README requires cascading saves when a post is deleted. Backend relationships should define this behavior; the browser should not reliably enumerate and delete every dependent row.

## Authorization

Appwrite access can be granted at table or row level. Broad table grants are not narrowed by restrictive row permissions, and row permissions require Row Security. [Official permission semantics](https://appwrite.io/docs/products/databases/tablesdb/permissions).

Inspect deployed configuration; hiding controls is not evidence of enforcement.

## Indexes follow actual queries

- Caption search: fulltext index, already required by README.
- Newest posts: index supporting the chosen order.
- Save/like membership: lookup plus unique user/post identity.
- Future profile posts: creator plus chronological ordering.

Add indexes for demonstrated access patterns rather than speculative scale.
