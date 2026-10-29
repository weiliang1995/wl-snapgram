# Server State and Full-Stack Architecture Review

Repository-based mentoring notes for a frontend engineer moving toward backend/full-stack development.

Reviewed: **2026-10-29**. These notes describe the implementation at review time, not a promise that subsequent code remains unchanged. This was a static review; the deployed Appwrite project was not exercised. No application code was changed for this review.

The application is a React SPA using Appwrite Account, TablesDB, and Storage directly. There are no custom backend handlers or versioned deployed schema/permission definitions in the reviewed repository. Requests can be assessed from source; deployed constraints and authorization cannot be confirmed.

## Chapters

1. [Map the server-state architecture](01-server-state-architecture.md)
2. [Why TanStack Query is useful and who owns state](02-state-ownership.md)
3. [Query keys as cache architecture](03-query-key-design.md)
4. [Mutation and cache consistency review](04-mutations-and-cache-consistency.md)
5. [The limits of frontend state](05-frontend-state-limitations.md)
6. [Backend concepts exposed by this project](06-backend-concepts.md)
7. [API design from the frontend perspective](07-api-contracts.md)
8. [Pagination and infinite queries](08-pagination-and-infinite-queries.md)
9. [Server truth versus client cache](09-server-truth-and-client-cache.md)
10. [Freshness, garbage collection, refetching, retry, and errors](10-freshness-retry-and-errors.md)
11. [Accidental complexity](11-accidental-complexity.md)
12. [Architecture improvements at three levels](12-architecture-improvements.md)
13. [TanStack Query skill assessment](13-skill-assessment.md)
14. [Focused learning checklist](14-learning-checklist.md)
15. [Interview preparation](15-interview-preparation.md)

## Main finding

The implementation demonstrates **Level 3 TanStack Query skills, with an early Level 4 technique**: parameterized queries, targeted invalidation, cursor-based infinite queries, and mutation variables for optimistic display.

The next step is designing guarantees that a frontend cache cannot provide. Likes are the clearest example: the UI feels immediate, but replacing the entire likes list can lose another user's concurrent like.

## Finding labels

- **Bug:** code can produce incorrect behavior under the described conditions.
- **Design weakness:** the architecture lacks a guarantee or makes change unnecessarily difficult.
- **Acceptable trade-off:** reasonable for the current learning project if its limits are understood.
- **Optional improvement:** useful when requirements or measured costs justify it.

Code snippets describing current behavior come from the repository. Suggested keys, endpoints, and contracts are proposals, not existing implementation.

Source links are relative to this directory so they work when browsing the repository. External documentation is linked where framework or Appwrite behavior is discussed.
