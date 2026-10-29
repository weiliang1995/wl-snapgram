# 8. Pagination and infinite queries

[Contents](README.md)

Sources: [useGetPosts](../src/lib/react-query/queriesAndMutation.ts), [getInfinitePosts](../src/lib/appwrite/api.ts), and [Explore](../src/_root/pages/Explore.tsx).

## Current implementation

```ts
initialPageParam: null as string | null,
getNextPageParam: (lastPage) =>
  lastPage.rows.length < 10
    ? null
    : (lastPage.rows.at(-1)?.$id ?? null),
```

The API uses:

```ts
Query.orderDesc("$createdAt"),
Query.limit(10),
// Subsequent requests:
Query.cursorAfter(pageParam)
```

This is already **cursor pagination**.

`pageParam` means continue after the preceding page's final row in this query's order:

```text
null → first 10
last ID of page 1 → next 10
last ID of page 2 → next 10
```

Cached data has this shape:

```ts
{
  pages: [page1, page2, ...],
  pageParams: [null, cursor1, ...]
}
```

Explore correctly derives rows with `pages.flatMap(page => page.rows)` instead of maintaining another list.

## What works well

- Cursor uses the final returned row.
- Ordinary caption edits do not change creation-time ordering.
- Next-page fetching is guarded while searching or fetching another page.
- Page parameters belong to the infinite query.

## Trade-offs and weaknesses

1. **Exactly 10 final rows cause one extra request.** A full page does not prove another page exists. Acceptable MVP trade-off.
2. **No explicit tie-breaker is expressed.** Verify deterministic ordering for equal timestamps and express a supported secondary order if needed.
3. **Deleted anchor behavior is unspecified in application code.** Test what happens if the cursor row disappears.
4. **Cursor pagination is not snapshot isolation.** It does not freeze a changing dataset.
5. **New posts above the cursor do not appear by fetching older pages.** Refresh the head or offer a new-post indicator.
6. **The effect guards `isFetchingNextPage`, not all background fetching.** Consider `isFetching` to avoid competing work on the same entry. [TanStack infinite-query guidance](https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries).
7. **Loaded pages grow in memory.** Consider `maxPages` only if long sessions become costly and navigation behavior is planned.

## Offset versus cursor in this feed

```text
Page 1: A B C
New post X arrives
OFFSET 3 now returns C D E
```

An insertion repeats C; a deletion can instead skip a row. Continuing after C is more stable under head insertion. Deep offsets also require more skipping work. [Appwrite pagination](https://appwrite.io/docs/products/databases/tablesdb/pagination).

## Optional backend improvement

```json
{
  "items": [],
  "nextCursor": "opaque-token-or-null"
}
```

Use an ordered tuple such as `(createdAt, id)` internally so position need not depend on an existing anchor row. Fetch `limit + 1` to determine whether another page exists.

This redesign is optional for the current MVP. The existing choice of cursor pagination is fundamentally appropriate.
