# 15. Interview preparation

[Contents](README.md)

Answer each prompt aloud before opening its model answer. Distinguish what the project implements from what you would improve.

## 1. Why TanStack Query instead of Zustand or Redux?

First explain who owns posts and how they differ from a theme preference.

<details>
<summary>Model answer</summary>

Posts, likes, and saves are owned by Appwrite and can change outside this browser. I use TanStack Query to cache snapshots, share requests, refetch, and synchronize after mutations. A client-state library can hold objects, but I would still need those server-state behaviors. Search input and form drafts stay in client state.

Evidence: [query hooks](../src/lib/react-query/queriesAndMutation.ts), [Explore](../src/_root/pages/Explore.tsx), [PostForm](../src/components/forms/PostForm.tsx).

</details>

## 2. Why infinite query for Explore?

First explain `pages`, `pageParams`, and the backend cursor.

<details>
<summary>Model answer</summary>

Explore loads incrementally. The infinite query stores loaded pages and continuation parameters together. The first page uses null; subsequent pages pass the preceding page's final row ID to Appwrite `cursorAfter`. I flatten pages for rendering rather than keeping another list in state.

Evidence: `useGetPosts`, `getInfinitePosts`, [Explore](../src/_root/pages/Explore.tsx).

</details>

## 3. How do you handle stale data?

First distinguish stale from removed from cache.

<details>
<summary>Model answer</summary>

I currently use browser defaults: successful query data becomes stale immediately but stays cached. It can render during background refetch on mount, focus, or reconnect. Mutations invalidate affected queries. My gaps are omitted Explore/search invalidations and no deliberate per-query freshness policy.

Evidence: [QueryProvider](../src/lib/react-query/QueryProvider.tsx), [hooks](../src/lib/react-query/queriesAndMutation.ts).

</details>

## 4. How do you synchronize cache after mutation?

First trace an edit through Home, Explore, search, and detail.

<details>
<summary>Model answer</summary>

I mostly invalidate and refetch. Editing currently invalidates detail and Home, but should also invalidate Explore/search because they contain the same post. TanStack Query does not automatically normalize those copies. A shared post-list key prefix would make coverage reliable.

Evidence: `useUpdatePostById` in [hooks](../src/lib/react-query/queriesAndMutation.ts).

</details>

## 5. What optimistic updates have you implemented?

First explain whether the query cache changes.

<details>
<summary>Model answer</summary>

Likes use UI-level optimism: while pending, PostStats renders the proposed likes from mutation variables. Shared cache is unchanged. Failure falls back to props. This is simple, but only updates the clicked instance immediately. I need to await the relevant refetch so old props do not flash back.

Evidence: [PostStats](../src/components/shared/PostStats.tsx), `useLikePost`.

</details>

## 6. What if the backend succeeds but the client times out?

First distinguish request failure from operation failure.

<details>
<summary>Model answer</summary>

The outcome is uncertain. Retrying createPost can create another post because it generates fresh IDs. Its catch block can also delete uploaded media even if the row committed. I would use stable operation identity, reconcile the result, and move durable cleanup to the backend.

Evidence: `createPost` and `updatePost` in [api.ts](../src/lib/appwrite/api.ts).

</details>

## 7. Why cursor rather than offset pagination?

First describe an insertion between two requests.

<details>
<summary>Model answer</summary>

Offsets refer to positions that shift when rows arrive or disappear, causing repeated or skipped posts. My cursor continues after a known row in newest-first order. It handles head insertions better, but still needs deterministic ordering and defined deleted-cursor behavior. It does not freeze the dataset.

Evidence: `getInfinitePosts` in [api.ts](../src/lib/appwrite/api.ts).

</details>

## 8. How do you prevent duplicate likes?

First separate click protection from database guarantees.

<details>
<summary>Model answer</summary>

I ignore clicks while this PostStats mutation is pending, but that does not protect across tabs/devices. My full-list write can also lose concurrent likes. I would store likes independently, enforce unique user/post pairs, and expose authenticated idempotent like/unlike operations.

Evidence: [PostStats](../src/components/shared/PostStats.tsx), `likePost`.

</details>

## 9. Who owns the source of truth?

First explain what invalidation cannot do.

<details>
<summary>Model answer</summary>

Appwrite owns persisted truth. TanStack Query owns cached representations in this browser. Invalidation marks them stale and can refetch active queries; it cannot repair a lost database write or notify every device. Optimistic state is a prediction until reconciled.

Evidence: independent Home/Explore/search/detail keys in [queryKey.ts](../src/lib/react-query/queryKey.ts).

</details>

## 10. What belongs on the backend versus frontend?

First use media cleanup and hidden delete controls as examples.

<details>
<summary>Model answer</summary>

The frontend owns drafts, previews, pending feedback, optimistic presentation, and cache synchronization. The backend owns authorization, identity, uniqueness, concurrency rules, and durable workflows. Hiding delete controls improves UX; backend permissions prevent unauthorized deletion. Browser cleanup is best effort, so durable media lifecycle management belongs server-side.

Evidence: [PostDetails](../src/_root/pages/PostDetails.tsx), [FileUploader](../src/components/shared/FileUploader.tsx), [API workflows](../src/lib/appwrite/api.ts).

</details>
