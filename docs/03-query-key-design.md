# 3. Query keys as cache architecture

[Contents](README.md)

Your [query keys](../src/lib/react-query/queryKey.ts) consistently use API-operation names:

```ts
['getRecentPosts']
['getPosts']
['searchPosts', searchTerm]
['getPostById', postId]
['getCurrentUser']
```

Including `postId` and `searchTerm` is correct: different resources/result sets must not collide.

The weakness is that related post representations have unrelated roots. Every mutation must enumerate them, and the current omissions show the cost.

| Current design | Problem | Better design | Benefit |
|---|---|---|---|
| Separate post roots | No common invalidation boundary | `['posts', ...]` | Invalidate all post representations |
| Recent and infinite list roots | Must remember every list | `['posts', 'lists', ...]` | Refresh lists without necessarily refreshing detail |
| `['getPostById', id]` | Disconnected from domain hierarchy | `['posts', 'detail', id]` | Precise detail invalidation within post family |
| Search has separate root | Mutations currently omit search | `['posts', 'lists', 'search', {...}]` | Search participates in list invalidation |
| Current user implies session identity | Same key can refer to different users after login change | Explicit session lifecycle and viewer-scoped private keys | Avoid private-cache reuse |
| Feed has no options | Fine now; future filters/sort can collide | Include response-changing options | Keep different datasets distinct |

## Proposed factory

```ts
export const postKeys = {
  all: ['posts'] as const,
  lists: () => ['posts', 'lists'] as const,
  recent: () => ['posts', 'lists', 'recent'] as const,
  explore: (sort = 'newest') =>
    ['posts', 'lists', 'infinite', { sort }] as const,
  search: (term: string) =>
    ['posts', 'lists', 'search', { term }] as const,
  detail: (id: string) => ['posts', 'detail', id] as const,
};
```

Then list changes can use:

```ts
queryClient.invalidateQueries({ queryKey: postKeys.lists() });
```

One detail uses:

```ts
queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
```

Important rules:

- Regular and infinite queries need distinct keys because their data shapes differ.
- Infinite-query cursors belong in `pageParams`, not a top-level key per page.
- Include every variable that changes the returned representation: filters, ordering, and viewer scope where relevant.
- A singleton `['auth', 'current-user']` is valid if session transitions explicitly cancel/reset relevant work.
- Future private saved-post data can use `['users', userId, 'saved-posts']`.

A key identifies a server representation, not just a function call. A prefix defines a family that can be invalidated together.
