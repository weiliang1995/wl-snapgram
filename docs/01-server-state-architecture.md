# 1. Map the server-state architecture

[Contents](README.md)

All TanStack Query hooks live in [queriesAndMutation.ts](../src/lib/react-query/queriesAndMutation.ts). Their API functions live in [api.ts](../src/lib/appwrite/api.ts), and the shared client is created in [QueryProvider.tsx](../src/lib/react-query/QueryProvider.tsx).

Mutation hooks do not configure mutation keys. Keys listed for mutations below identify the query caches they invalidate.

| Feature | Hook | Query key | API / mutation | Cache strategy | Notes |
|---|---|---|---|---|---|
| Home feed | `useGetRecentPosts` | `['getRecentPosts']` | `getRecentPosts` | Standard query | Latest 20 posts, newest first |
| Explore / infinite scrolling | `useGetPosts` | `['getPosts']` | `getInfinitePosts` | Infinite query | 10 rows per page; cursor is last row ID |
| Search | `useSearchPosts` | `['searchPosts', searchTerm]` | `searchPosts` | Cache per term | Enabled for nonempty term; input debounced 500 ms |
| Post detail / edit source | `useGetPostById` | `['getPostById', postId]` | `getPostById` | Shared detail query | Disabled without ID |
| Current user / saved membership | `useGetCurrentUser` | `['getCurrentUser']` | `getCurrentUser` | Shared query | Used by each `PostStats` |
| Registration | `useCreateUserAccount` | — | Account creation → profile creation | No query synchronization | Form then signs in and updates Context |
| Sign-in | `useSignInAccount` | — | Create session | No query synchronization | Form calls Context's `checkAuthUser` |
| Sign-out | `useSignOutAccount` | — | Delete current session | No explicit synchronization | Header/sidebar reload document |
| Create post | `useCreatePost` | Recent posts | Upload → create row | Invalidate/refetch | Explore/search omitted |
| Like / unlike | `useLikePost` | Detail, Explore, current user, Home | Replace `likes` relation | Optimistic display + invalidation | Search omitted; waits only for Home |
| Save | `useSavePost` | Home, Explore, current user | Create save row | Optimistic display + invalidation | Waits for current user |
| Unsave | `useDeleteSavePost` | Same as save | Delete save row | Optimistic display + invalidation | Needs save-record ID |
| Edit post | `useUpdatePostById` | Detail, Home | Optional upload → update → cleanup | Invalidate/refetch | Explore/search omitted |
| Delete post | `useDeletePost` | Home, current user | Delete row → delete file | Invalidate/refetch | Explore/search/detail omitted |

There is no `setQueryData`, `setQueriesData`, `getQueryData`, `cancelQueries`, or cache-level optimistic rollback in the reviewed implementation.

## Implemented versus placeholder features

- Comments and sharing: [PostStats](../src/components/shared/PostStats.tsx) has empty handlers and hardcoded counts.
- Follows: no implemented query, mutation, or API function.
- Profile, profile editing, saved-post page, people page, and liked-post page: placeholder components under [pages](../src/_root/pages).

These notes do not evaluate hypothetical implementations as if they existed.

## Read flow

```text
Home / Explore / PostDetails / PostStats
    → custom TanStack Query hook
    → api.ts
    → Appwrite browser SDK
    → Appwrite session / permissions / TablesDB
    → database
    → selected rows and relationships
    → query cache
    → subscribed components
```

Image bytes follow a separate path:

```text
<img src={post.imageUrl}>
    → Appwrite Storage
```

TanStack Query caches post metadata, not image bytes.

## Deviations

1. [AuthContext](../src/context/AuthContext.tsx) calls `getCurrentUser()` directly and stores another user snapshot outside the query cache.
2. Multi-step business workflows run in browser JavaScript: uploading, creating/updating the post row, and deleting files.

The first deviation creates duplicated state ownership. The second creates durability and partial-failure problems that frontend state management cannot solve alone.
