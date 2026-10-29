# Snapgram

English | [中文](README-cn.md)

An image-first social app, a simplified take on Instagram. Users can sign up and sign in, publish posts with photos, like and save posts, search posts, and browse everyone's content with infinite scroll.

The frontend is a pure SPA (React + TypeScript + Vite). The backend is entirely [Appwrite](https://appwrite.io) Cloud, which provides accounts, the database and file storage, so there's no custom server.

> Status: the MVP is roughly 70–80% complete and development is currently paused. Remaining work and priorities are tracked in [todo.md](todo.md) (in Chinese).

---

## Features

### Done

- **Accounts**: email sign-up, sign-in and sign-out; the session is restored after a page refresh
- **Create posts**: upload a photo and add a caption, location and comma-separated tags
- **Edit posts**: change only the text, or replace the photo too; the old photo is deleted automatically once the update succeeds
- **Delete posts**: removes both the post data and its image file
- **Post details page**: the author can edit and delete from here
- **Likes**: optimistic updates show the result immediately and roll back automatically if the request fails
- **Save / unsave posts**
- **Explore**: search posts by caption (with debounced input) and browse with infinite scroll
- **Loading, error and empty states**: lists and the details page each have a matching UI; failed queries show a global error toast

### Planned (MVP)

- **Route guards**: send signed-out users to the sign-in page, and keep signed-in users out of the sign-in and sign-up pages
- **Merge Home and Explore**: without a follow feature the two show almost the same content, so they become a single home page with a card / grid view toggle
- **Profile page**: a container page with three tabs: the user's posts, liked posts and saved posts
- **People page with user search**
- **Edit profile**: name, username, bio and avatar
- **End-to-end tests with Playwright**

### Possible later

- Following users, and a home feed based on who you follow
- Comments and sharing
- Vertical swipe browsing on mobile, similar to TikTok

---

## Tech stack

| Area | Used |
|---|---|
| Framework | React 19, TypeScript, Vite |
| Routing | React Router 7 |
| Server state | TanStack Query 5 (caching, optimistic updates, infinite queries) |
| Forms and validation | React Hook Form + Zod |
| Styling | Tailwind CSS 4, shadcn (built on Base UI) |
| Backend | Appwrite Cloud: Account, TablesDB, Storage |
| Other | date-fns (time formatting), react-dropzone (image upload), react-intersection-observer (infinite scroll) |
| Linting | ESLint (including React Hooks rules and a ban on relative import paths) |

---

## Architecture

```
Browser (React SPA)
  ├─ Pages / components
  ├─ React Query hooks      src/lib/react-query/queriesAndMutation.ts
  └─ Appwrite API layer     src/lib/appwrite/api.ts
          │
          ▼
Appwrite Cloud
  ├─ Account   sign-up, sign-in, sessions
  ├─ TablesDB  users / posts / saves tables
  └─ Storage   post images
```

**Layering rules**

- `api.ts` only makes requests and never swallows errors: failures are thrown and handled by React Query and the UI
- Components never call `api.ts` directly. They go through React Query hooks, so caching and refetching are managed in one place
- State that can be derived from existing data (such as "is this post saved?") is computed, not copied into a separate `useState`

### Data model

| Table | Main fields | Notes |
|---|---|---|
| **users** | `accountId`, `name`, `username`, `email`, `imageUrl`, `bio`, `save` | The row ID equals the Appwrite Account ID, so each account maps to exactly one row |
| **posts** | `creator`, `caption`, `imageId`, `imageUrl`, `location`, `tags[]`, `likes` | `creator` links to users; `likes` is a many-to-many relationship between posts and users |
| **saves** | `user`, `post` | Save records, linking to users and posts |

**Relationship columns are not returned automatically.** In TablesDB, `Query.select(["*"])` doesn't include relationship columns, so every relationship you need has to be listed explicitly, for example:

```ts
Query.select(["*", "creator.*", "likes.$id"])
```

### Images

After an image is uploaded to Storage, its URL comes from `getFileView`. The image transformations offered by `getFilePreview` (resizing, cropping) are a paid feature on Appwrite's free plan, so they aren't used.

The database stores both `imageId` and `imageUrl`. `imageId` is used to find the file when an image is deleted or replaced.

---

## Project structure

```
src/
├─ _auth/                 Sign-in / sign-up pages and layout
├─ _root/                 Pages and layout for signed-in users
│  └─ pages/              Home, Explore, PostDetails, CreatePost, EditPost, etc.
├─ components/
│  ├─ forms/              PostForm (shared by create and edit)
│  ├─ shared/             PostCard, PostStats, GridPostList, SearchResults, EmptyUI, etc.
│  └─ ui/                 shadcn components
├─ constants/             Navigation, form modes, toast types and other constants
├─ context/AuthContext.tsx  Current user and auth state
├─ hooks/                 useDebounce
├─ lib/
│  ├─ appwrite/           Appwrite client config and API layer
│  ├─ react-query/        QueryClient, query / mutation hooks, query keys
│  └─ validation/         Zod schemas
└─ types/                 Shared types (IPost, IUserRow, INewPost, IUpdatePost, etc.)
```

---

## Local development

### Prerequisites

- Node.js and pnpm
- An Appwrite Cloud project

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up Appwrite

In the Appwrite console:

1. Create a database, then create the users, posts and saves tables and their relationship columns as described in [Data model](#data-model)
2. For the saves → post relationship, set the delete behavior to **cascade**, so deleting a post also removes its save records
3. Create a **fulltext index** on `caption` in the posts table, otherwise post search fails
4. Create a Storage bucket for post images
5. Configure permissions on each table and the bucket (for now the users table must allow creation by signed-out users; see [todo.md](todo.md) for why and how this will change)
6. Under **Platforms**, add a Web platform whose hostname matches the domain you use for the dev server

### 3. Environment variables

Create `.env.local` in the project root (it's already ignored by `.gitignore`):

```bash
VITE_APPWRITE_URL=https://<region>.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=
VITE_APPWRITE_DATABASE_ID=
VITE_APPWRITE_STORAGE_ID=
VITE_APPWRITE_USERS_COLLECTION_ID=
VITE_APPWRITE_POSTS_COLLECTION_ID=
VITE_APPWRITE_SAVES_COLLECTION_ID=
```

### 4. Run

```bash
pnpm dev
```

The dev server always listens on `127.0.0.1:5173`. `vite.config.ts` also allows access via `local.snapgram.com` and `dev.snapgram.com`. To use either domain, point it to `127.0.0.1` in `/etc/hosts` and add the hostname under Platforms in Appwrite.

### Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Type-check and build |
| `pnpm preview` | Preview the production build |
| `pnpm lint` / `pnpm lint:fix` | Run ESLint / auto-fix |
| `node scripts/lock-deps.js` | Pin the dependency versions in `package.json` to exact versions (`--check` reports without changing anything) |

---

## Known limitations

All business logic currently runs in the browser. These limitations are accepted on purpose for the MVP:

- **The client can't be trusted**: form validation can be bypassed, and anyone with the project ID can call the Appwrite API directly. For now, table and row permissions are the safeguard
- **Sign-up isn't atomic**: creating the account and writing the users row are two separate requests, so if the second one fails, an account is left without a profile
- **Likes are written back as a whole list**: liking a post writes the entire list of likes back to the database, so simultaneous likes can overwrite each other

The long-term plan is to move important writes into Appwrite Functions (server side) and to give likes their own table. See "已知技术缺陷" (known technical debt) in [todo.md](todo.md) for the full impact and planned fixes.
