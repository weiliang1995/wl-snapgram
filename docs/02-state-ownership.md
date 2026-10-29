# 2. Why TanStack Query is useful and who owns state

[Contents](README.md)

Home's posts are not React-owned data. Another user can create, edit, or delete a post without changing anything in this component. The frontend holds a **snapshot of a shared, remotely changing dataset**.

| Usage | Architectural problem solved |
|---|---|
| Home query | Shares and refreshes recent backend-owned posts |
| Detail query | Gives detail/edit routes a common snapshot addressed by post identity |
| Current-user query | Shares profile/save information among many `PostStats` instances |
| Search query | Separates backend result sets by search term |
| Infinite query | Stores ordered pages together with continuation parameters |
| Mutations | Tracks remote operation lifecycles and affected reads |
| `useQueryClient` | Lets mutations coordinate the shared cache |

Multiple `useGetCurrentUser()` calls do not inherently create independent caches or one request per card. The shared key enables cache sharing and in-flight deduplication. Immediately stale data can still cause later background refetches when observers mount.

## Four kinds of state

| Kind | Actual examples | Appropriate owner |
|---|---|---|
| Local component state | Search input, file preview, form draft | Component / React Hook Form |
| Global client state | Future theme or card/grid preference | Context or a small client-state mechanism |
| URL state | Post/profile ID and route; optionally search/filter | Router |
| Server state | Posts, likes, saves, authenticated profile/session status | Query cache backed by Appwrite |

Current ownership is mostly appropriate:

- [Explore](../src/_root/pages/Explore.tsx) derives rows from query pages rather than copying them into state.
- [PostStats](../src/components/shared/PostStats.tsx) derives saved membership.
- [PostForm](../src/components/forms/PostForm.tsx) keeps unsent edits in form state.
- [FileUploader](../src/components/shared/FileUploader.tsx) keeps browser object URLs locally and revokes them.

An editable draft is deliberately separate from server state. Refetching should not silently replace text the user is typing.

**Optional improvement:** put Explore search in URL parameters if it should survive refresh or support links/back navigation. Component state is otherwise reasonable.

## Duplicated authentication ownership

[AuthContext](../src/context/AuthContext.tsx) stores:

```tsx
const [user, setUser] = useState<IUser>(INITIAL_USER);
const [isLoading, setIsLoading] = useState(hasSession);
const [isAuthenticated, setIsAuthenticated] = useState(false);
```

Meanwhile `useGetCurrentUser` stores another current-user snapshot:

```text
AuthContext.user
queryCache['getCurrentUser']
```

Invalidating one does not update the other. Future profile edits would need manual synchronization in two places.

**Design weakness:** server identity data has two owners.

Keep Context if it makes consumption convenient, but derive its value from one current-user query. Derive authentication from the resolved result while preserving separate loading and error states. Context need not disappear; independent fetching and copied server state should.

Redux or Zustand would not resolve this ownership problem by themselves.
