# 4. Mutation and cache consistency review

[Contents](README.md)

Sources: [query/mutation hooks](../src/lib/react-query/queriesAndMutation.ts), [API functions](../src/lib/appwrite/api.ts), [PostStats](../src/components/shared/PostStats.tsx), and [PostForm](../src/components/forms/PostForm.tsx).

Invalidation is a reasonable default for this project. Directly patching every representation would add complexity. Current problems are incomplete coverage, optimistic lifecycle timing, and unsafe write assumptions.

## Create post

```ts
onSuccess: () => {
  queryClient.invalidateQueries({
    queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
  });
}
```

- **UI knows:** draft, local file, Context user ID.
- **Server knows:** whether file/row persisted, canonical IDs/timestamps, permissions.
- **Success:** Home becomes stale; active Home refetches. Explore/search remain untouched.
- **Failure:** error toast; API attempts file cleanup.
- **Success followed by timeout:** row may exist despite failure feedback; cleanup can delete its image.
- **Duplicate requests:** each invocation generates fresh IDs and can create another post.
- **Multiple cached copies:** Explore/search remain outdated until another trigger.
- **Classification:** invalidate/refetch; incomplete invalidation is a **bug**.
- **Recommendation:** invalidate post lists; keep creation pessimistic during upload. Add stable operation identity before enabling automatic write retries.

Invalidation is not awaited, so navigation may briefly render older cached Home data. This is an acceptable UX trade-off only if intentional.

## Edit post

`useUpdatePostById` invalidates detail and Home only.

- **UI knows:** draft based on the originally fetched version.
- **Server knows:** latest fields/version and media reference.
- **Success:** Explore/search may retain old caption/image.
- **Failure:** draft remains; uploaded replacement is cleaned up.
- **Success followed by timeout:** catch block can delete the committed replacement image.
- **Duplicates/concurrency:** repeated scalar assignment can be harmless in isolation; repeated uploads/cleanup are not. Two editors can overwrite each other.
- **Classification:** invalidate/refetch; missing list coverage is a **bug**; absent concurrency version is a **design weakness**.
- **Recommendation:** pessimistic save; optionally update detail from a compatible canonical response; invalidate lists.

Even a caption-only edit sends the draft's old `imageId` and `imageUrl`. An older tab can overwrite a newer image reference. Send only changed fields and use a server-checked version when stale edits must be prevented.

## Delete post

`useDeletePost` invalidates Home and current user, then the page navigates home.

- **UI knows:** cached post and image IDs.
- **Server knows:** existence, actual media reference, dependencies, authorization.
- **Success:** Explore/search/detail may retain the deleted post.
- **Failure:** request outcome can remain uncertain.
- **Success followed by timeout:** row can be absent while file cleanup never runs.
- **Duplicates:** final desired state is absent; a repeated SDK delete can still return not found.
- **Classification:** invalidate/refetch; incomplete cache cleanup is a **bug**.
- **Recommendation:** pessimistic delete, remove detail cache after success, invalidate lists. Backend resolves media/dependencies.

README requires cascading saves when a post is deleted. That is required configuration, not proof it is deployed.

## Like / unlike

Current optimistic display:

```tsx
const likes =
  isLiking && likeVariables
    ? likeVariables.likesArray
    : (post.likes?.map((user) => user.$id) ?? []);
```

- **UI knows:** cached likes and this user's intended change.
- **Server knows:** current relationship after concurrent writes.
- **Success:** detail, Explore, current user, Home invalidated; search omitted.
- **Failure:** pending display disappears and falls back to props; no mutation-specific error feedback.
- **Success followed by timeout:** UI falls back even if the like committed; no failure-path reconciliation.
- **Duplicates:** identical replacement is idempotent in isolation, but can overwrite concurrent changes.
- **Multiple copies:** only the clicked component has immediate optimism.
- **Classification:** UI-level optimistic update plus invalidation.
- **Recommendation:** preserve simple optimism, replace the backend list-write contract, reconcile affected post views.

### Pending-lifetime race

```ts
queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GET_POSTS] });

return queryClient.invalidateQueries({
  queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
});
```

Explore refetch begins, but only Home invalidation is awaited. If Home is inactive, that promise can resolve before Explore updates:

```text
old props → optimistic likes → pending ends → old props → refetched props
```

This is a concrete explanation for the Explore flicker in `todo.md`, although the deployed transition sequence was not reproduced during static review.

With current keys, a proposed fix is:

```ts
onSuccess: async (data) => {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.GET_POST_BY_ID, data.$id],
    }),
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GET_POSTS] }),
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GET_RECENT_POSTS] }),
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SEARCH_POSTS] }),
  ]);
}
```

Current-user invalidation after liking appears unnecessary for its selected fields: the query loads saves, not liked-post membership.

## Save / unsave

```tsx
const isSaved = isSaving || (!isDeleting && !!savedPostRecord);
```

- **UI knows:** cached save record, if loaded.
- **Server knows:** all save records and ownership.
- **Success:** current-user refetch is awaited, extending pending display.
- **Failure:** display falls back to cached membership; no mutation-specific feedback.
- **Success followed by timeout:** cached membership can be wrong; no error-path reconciliation.
- **Duplicates:** fresh random row IDs permit duplicate user/post saves unless backend uniqueness prevents them.
- **Multiple copies:** shared current-user query eventually updates consumers; immediate optimism is local.
- **Classification:** UI-level optimism plus invalidation.
- **Recommendation:** synchronize membership rather than refetching feeds that do not contain save state; enforce uniqueness.

Until current-user data resolves, `currentUser?.save?.find(...)` treats unknown as unsaved. Clicking can create an unnecessary save. Gate the action until required data is known.

## Authentication mutations

- Registration performs Account creation and profile creation separately; the second can fail after the first succeeds.
- Sign-in updates Context through `checkAuthUser`, not the current-user cache.
- Sign-out reloads the document, normally discarding in-memory state/cache.
- Session timeouts need reconciliation: failure feedback does not always prove session creation/deletion failed.

**Classification:** no explicit query synchronization; sign-out relies on reload. The reload is an **acceptable temporary trade-off**, not a complete SPA authentication-cache lifecycle.

## Optimistic lifecycle checklist

| Mechanism | Present? | Meaning |
|---|---|---|
| `cancelQueries` | No | No optimistic cache write to protect |
| `getQueryData` snapshot | No | Cached state is not snapshotted |
| `setQueryData` | No | Shared cache is not optimistically patched |
| Rollback | Display fallback | Reverts prediction, not a committed operation |
| Invalidation | Success only | Ambiguous failures remain unreconciled |

Your approach is valid; missing cache rollback is not itself a bug because no cache write occurs. TanStack supports both [UI-based and cache-based optimism](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates).

If adopting shared-cache optimism, learn cancellation, snapshots, immutable patches, rollback, and settled reconciliation together. Restoring an entire old snapshot can overwrite another mutation's newer work.
