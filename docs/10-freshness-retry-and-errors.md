# 10. Freshness, garbage collection, refetching, retry, and errors

[Contents](README.md)

[QueryProvider](../src/lib/react-query/QueryProvider.tsx) configures a global query-error toast. It does not configure freshness, retention, retry, or refetch defaults; neither do the individual hooks.

## Browser defaults

| Setting | Default | Application meaning |
|---|---|---|
| `staleTime` | `0` | Successful data immediately becomes eligible for revalidation |
| `gcTime` | 5 minutes | Unobserved entries remain cached temporarily |
| `refetchOnMount` | `true` | Stale query can refetch on mount |
| `refetchOnWindowFocus` | `true` | Returning can refresh stale active data |
| `refetchOnReconnect` | `true` | Reconnection can refresh stale active data |

These are event-driven, not polling. Immediate staleness does not create an endless request loop. [TanStack defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults).

Browser queries retry three times by default with increasing delays. A nonexistent post can cause four attempts including the initial request. [Query retries](https://tanstack.com/query/latest/docs/framework/react/guides/query-retries).

Mutations have no configured automatic retries. `signInAccount` separately implements one explicit recovery for `user_session_already_exists`.

## Lifecycle vocabulary

```text
Fresh: Explore is recent enough for the chosen policy.
Stale: cache remains usable but may be revalidated on a trigger.
Inactive: no mounted component observes that query.
Garbage collected: unused retention expires and entry is removed.
```

Freshness and retention are different. Increasing `gcTime` does not fix missing invalidation.

## Suggested starting policies

These values are experiments grounded in the data's volatility, not universal rules.

| Query | Starting policy | Trade-off |
|---|---|---|
| Home / Explore | 15–30 seconds fresh; keep focus/reconnect refetch | Less repeated navigation traffic; briefly old feed accepted |
| Detail | Similar short freshness | Reuse across detail/edit while stats may change |
| Search | 30–60 seconds per term | Repeated searches reuse results; mutations still invalidate |
| Current profile | About 1 minute; explicit auth transitions | Frequent reads are cheap; identity transitions remain active events |
| Save membership | Mutation synchronization plus focus refresh | Immediate local action; reconcile other devices |
| Future profile | 1–5 minutes for profile fields | Slower-changing data; edits explicitly invalidate |
| Future comments/notifications | Short freshness plus polling/events if needed | Staleness alone does not discover new activity |
| Static reference data | Long freshness only with known update rules | No such query currently exists |

Keep default garbage collection initially.

## Retry permanent and transient failures differently

Proposed example, adapted to Appwrite errors:

```ts
retry: (failureCount, error) => {
  if (error instanceof AppwriteException) {
    if ([400, 401, 403, 404].includes(error.code)) return false;
    if (error.code === 429) return false; // explicit backoff guidance instead
  }
  return failureCount < 2;
}
```

Refine this to actual error types. Do not globally enable write retries before making operations replay-safe.

## Current error handling

- **Good:** `getCurrentUser` returns null only for Account 401 and rethrows other failures.
- **Design weakness:** AuthContext collapses network failures into failed authentication/navigation.
- **Bug:** `PostStats` has no like/save/unsave error feedback; `QueryCache.onError` does not cover mutations.
- **Bug:** [Explore](../src/_root/pages/Explore.tsx) does not pass search errors to [SearchResults](../src/components/shared/SearchResults.tsx); failure may look empty.
- **Design weakness:** pages often replace all content on `isError`, including after background failure with usable cached data.
- **Design weakness:** next-page errors lack a dedicated retry affordance preserving loaded posts.

Separate initial loading, background fetching, initial failure, and background failure. A failed refresh need not remove already useful content.
