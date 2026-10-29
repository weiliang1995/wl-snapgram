# 13. TanStack Query skill assessment

[Contents](README.md)

**Strict assessment: Level 3, with partial Level 4 evidence.** This evaluates implemented code, not planned TODOs or architectural vocabulary.

| Level | Definition | Assessment |
|---|---|---|
| 1 | Can use `useQuery` | Demonstrated |
| 2 | Can use queries/mutations correctly | Core usage demonstrated; consistency bugs remain |
| 3 | Understands keys, invalidation, infinite queries | Demonstrated working foundation |
| 4 | Can design cache strategies and optimistic updates | Early evidence; not consistently complete |
| 5 | Understands client/server consistency and designs APIs around it | Not yet demonstrated in implemented contracts |

## Evidence for Level 3

[queriesAndMutation.ts](../src/lib/react-query/queriesAndMutation.ts) demonstrates:

- Queries and mutations separated from components.
- Parameters included in keys.
- Conditionally enabled detail query.
- Related-query invalidation.
- Infinite queries using backend cursors.

[Explore](../src/_root/pages/Explore.tsx) derives lists instead of copying them; [QueryProvider](../src/lib/react-query/QueryProvider.tsx) centralizes query errors.

## Evidence toward Level 4

[PostStats](../src/components/shared/PostStats.tsx) uses mutation variables for optimistic display and derives save membership. Returning an invalidation promise demonstrates awareness of pending duration.

## Missing before full Level 4

- Complete mutation-to-cache dependency coverage.
- Correct pending lifetime across different views.
- Single ownership of authentication data.
- Reconciliation after ambiguous failures.
- Demonstrated handling of concurrency if shared-cache optimism is introduced.

## Missing before Level 5

[api.ts](../src/lib/appwrite/api.ts) still replaces a shared likes list, generates fresh creation IDs per invocation, and assumes a thrown write means uploaded media can be deleted. Authorization/schema guarantees cannot be established from versioned deployment configuration.

## Best next exercise

Implement one complete like/save workflow:

```text
User intent
→ optimistic display
→ safe backend operation
→ canonical response
→ cache reconciliation
→ ambiguous-failure recovery
→ concurrency verification
```

Doing this well teaches more than adding several unrelated hooks.
