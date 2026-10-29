# 5. The limits of frontend state

[Contents](README.md)

Sources: [PostStats](../src/components/shared/PostStats.tsx), [API workflows](../src/lib/appwrite/api.ts), [AuthContext](../src/context/AuthContext.tsx), and [PostDetails](../src/_root/pages/PostDetails.tsx).

| Problem | Frontend can do | Frontend cannot guarantee | Backend should guarantee |
|---|---|---|---|
| Repeated like clicks | Ignore clicks while component is pending | One operation across tabs/devices | User-scoped, idempotent like operation |
| Concurrent likes | Show this user's intention | Preserve others when replacing stale list | Independent records and uniqueness |
| Duplicate saves | Disable action while pending | One save globally per user/post | Unique user/post pair |
| Create timeout | Keep draft and show uncertainty | Whether server committed | Replay-safe identity and result lookup |
| Interrupted media workflow | Attempt cleanup | Cleanup after tab closure/crash | Durable cleanup/reconciliation |
| Two tabs edit post | Warn about stale content | Prevent remote overwrite | Version check or documented last-write-wins |
| Delete races with edit | Update local UI | Coordinate remote writers | Defined conflict/not-found semantics |
| Another device changes post | Refetch on focus/reconnect | Immediate awareness everywhere | Read consistency; optional events |
| Feed changes during scrolling | Use cursors | Immutable cross-request snapshot | Defined ordering/cursor semantics |
| Forged creator/user IDs | Hide buttons and validate forms | Authentic ownership | Server-derived actor and authorization |
| Expired session | Refresh identity/navigation | Continued permission | Verify protected requests |

The distinction is:

```text
Frontend: avoid sending an unnecessary request.
Backend: preserve valid data even when requests arrive twice or concurrently.
```

## Why local pending flags are insufficient

`PostStats` guards `isLiking`, `isSaving`, and `isDeleting`. These flags protect one mounted mutation instance. Another card, tab, device, or direct API caller has independent state.

Even perfect button disabling cannot prove that a timed-out request was never processed.

## Why rollback does not reverse server work

After an uncertain like response, the optimistic icon can revert. The server may still have persisted the like. A UI rollback restores a local presentation, not remote truth.

Read again to reconcile. For retried creation, use an operation identity so reconciliation does not create another resource.

## Why authorization cannot live in React

`PostDetails` conditionally renders edit/delete controls when `user.id === post.creator.$id`. This is good UX. It does not stop a caller from invoking Appwrite directly.

The backend must independently authorize the actual row/file and derive the actor from the session. Client-supplied `creator`, `user`, or `imageId` values are not proof of ownership.
