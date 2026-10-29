# 11. Accidental complexity

[Contents](README.md)

| Behavior | Frontend responsibility or compensation? |
|---|---|
| Enumerate four roots after liking | Frontend query-key architecture weakness |
| Await Home but not Explore | Frontend lifecycle bug |
| Fetch every liker ID for count/membership | API read-model weakness |
| Write every liker ID for one like | Backend write-contract weakness |
| Embed save membership in current user | Acceptable small-project shortcut; couples identity to growing activity |
| Account fetch then profile list | Domain composition reasonable; list unnecessary with known row ID |
| Context user plus cached user | Frontend ownership duplication |
| Browser upload/write/cleanup | Compensation for absent durable backend workflow |
| Need internal save-record ID to unsave | Storage mechanics leaking into action contract |
| Flatten pages | Genuine frontend responsibility |
| Keep editable draft separate | Genuine frontend responsibility |
| Debounce search | Genuine frontend UX/request-volume responsibility |

Sources: [API](../src/lib/appwrite/api.ts), [hooks](../src/lib/react-query/queriesAndMutation.ts), [AuthContext](../src/context/AuthContext.tsx), and [Explore](../src/_root/pages/Explore.tsx).

## Simplify current-user lookup

`saveUserToDB` sets `rowId: accountId`. After `account.get()`, `getCurrentUser` can directly fetch that row rather than list/filter and take `rows[0]`.

Missing profile and no authenticated account are also different conditions. Keep that distinction when introducing provisioning recovery.

## Avoid unnecessary creator data

```ts
Query.select(["*", "creator.*", "likes.$id"])
```

[IUserRow](../src/types/index.ts) includes email. Use an explicit public creator projection rather than relying on components to ignore fields already sent to the browser.

## Media cleanup: ambiguous outcomes

`createPost` and `updatePost` delete uploaded files when their database write throws.

```text
1. Upload succeeds.
2. Database write commits.
3. Response is lost.
4. Client catches error.
5. Client deletes uploaded file.
6. Stored post references missing media.
```

This is a **correctness bug under ambiguous write outcomes**, not merely an orphan-file concern.

The opposite interruption also exists: close the browser after upload and no catch block executes, leaving an unreferenced file.

The backend should persist operation status, reconcile references, and retry cleanup. Database transactions alone do not encompass storage and session APIs.

Your [TODO](../todo.md) recognizes several architectural limitations. That demonstrates awareness; a planned guarantee is still not an implemented guarantee.
