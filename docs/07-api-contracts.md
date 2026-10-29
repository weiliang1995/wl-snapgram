# 7. API design from the frontend perspective

[Contents](README.md)

The application calls generic Appwrite operations through [api.ts](../src/lib/appwrite/api.ts). There are no custom social-media handlers to inspect.

Several mutations already return rows. The main weakness is not an empty success object; it is generic resource operations leaving business semantics in the browser.

## Read and mutation shapes differ

Reads explicitly request:

```ts
Query.select(["*", "creator.*", "likes.$id"])
```

Writes do not request the same expanded representation. Do not blindly put an `updateRow` result into a cache expecting a fully expanded `IPost`. Return a compatible DTO or merge only known scalar fields.

## Proposed business contracts

These are recommendations, not existing endpoints. Appwrite Functions could implement them without replacing Appwrite.

| Operation | Current contract | Proposed contract |
|---|---|---|
| Like | Replace all liker IDs | `PUT /posts/:id/likes/me` |
| Unlike | Replace all liker IDs | `DELETE /posts/:id/likes/me` |
| Save | Random-ID row with supplied user | `PUT /posts/:id/saves/me` |
| Unsave | Delete internal save-record ID | `DELETE /posts/:id/saves/me` |
| Create | Browser upload + row creation | `POST /posts` with replay-safe identity and validated media |
| Edit | Draft fields plus old media metadata | `PATCH /posts/:id` with changed fields and expected version |
| Delete | Supplied post/image IDs | `DELETE /posts/:id`; backend resolves dependencies |
| Registration | Account then profile from browser | Server-managed provisioning with safe recovery |

Example like response:

```json
{
  "postId": "123",
  "viewerHasLiked": true,
  "likeCount": 104
}
```

The UI can patch relevant fields without transferring every liker. This is canonical at the operation's response point, not a promise that the count never changes afterward.

## Response and error semantics

| Case | Reasonable contract |
|---|---|
| Create post | `201 Created`, canonical post |
| Edit post | `200 OK`, updated entity/fields and version |
| Desired-state like/save | `200 OK`, final membership and relevant counts |
| Delete | `204 No Content` when caller already knows ID |
| No session | `401` |
| Unauthorized | `403`, or deliberate concealment policy |
| Missing post | `404` |
| Stale edit | `412` with `If-Match`, or consistently defined `409` |
| Invalid input | Documented `400`/`422` |
| Rate limiting | `429` with retry guidance |

`deleteSavedPost` names its SDK return value `statusCode`; that name does not establish that it is a numeric HTTP status. `Promise<void>` would express successful completion more clearly when no domain result is needed.

## Registration recovery

`saveUserToDB` uses the account ID as row ID. This is a good uniqueness foundation, but does not make Account creation plus profile creation atomic. Repeated creation can conflict; failed profile provisioning still needs safe recovery.

## Public projections

`creator.*` can include fields such as email from [IUserRow](../src/types/index.ts). Public feed cards need a small creator projection, not all profile fields. Type declarations do not prevent excess fields from being transmitted.
