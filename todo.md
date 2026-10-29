# TODO

最后更新：2026-10-29。MVP 大约完成 70–80%，项目暂停中。下面按阶段排序，回来时从第一阶段开始。

## 产品决策（已确定）

- **首页合并**：没有关注功能，Home 和 Explore 展示的内容几乎一样，所以合并成一个首页，提供「卡片 / 网格」切换（方案 C）。手机端以后可以做成类似抖音的上下滑动浏览
- **Profile 作为容器页**：下面分三个 tab：Posts（该用户发的帖子）、Liked（点赞过的）、Saved（收藏的）。LikedPosts 和 Saved 不再是独立页面
- **不在 MVP 范围**：评论、分享、关注

---

## 第一阶段 · 让核心流程完整可靠

- [ ] **1. 路由守卫**
  - AuthLayout：`src/_auth/AuthLayout.tsx` 里的 `isAuth = false` 是写死的，已登录用户还能打开 `/sign-in`。改用 `useUserContext().isAuthenticated`，已登录时跳回 `/`
  - RootLayout：`src/_root/RootLayout.tsx` 现在没有守卫。加上：未登录时 `<Navigate to="/sign-in" replace />`
  - 删掉 `src/context/AuthContext.tsx` 里挂载时的 `navigate("/sign-in")`，跳转统一交给上面两个守卫。现在的 bug：未登录用户直接打开 `/sign-up` 会被踢到 `/sign-in`
  - 守卫要处理 loading：用户还在恢复时先不要判断成"未登录"（`isLoading` 初始值已经是 `useState(hasSession)`）
  - 注意：守卫只负责"确认未登录后跳转"，不要用全屏 loader 挡住整个页面（见「MVP 之后 · UX 优化」）

- [ ] **2. Explore 点赞后图标状态闪烁**
  - 现象：在 Explore 页点赞，like 状态会依次变成 false → true → false → true，一共变化四次；取消点赞也一样
  - 对比：收藏没有这个问题
  - 在合并首页之前先修，这样能确认问题和合并无关

- [ ] **3. GridPostList 里的 PostStats 需要改造**
  - 需求：在 grid 里只显示 like，或者 like + save，其他内容（评论、分享、时间等）不显示
  - 现状：`GridPostList` 只有 `showStats` 一个开关，PostStats 本身没有精简模式

- [ ] **4. 合并 Home 和 Explore（第一阶段收尾）**
  - 做法：首页 = 现在的 Explore（搜索 + 无限滚动），加「卡片 / 网格」切换。卡片模式用 PostCard，网格模式用 GridPostList
  - 路由：`/` 指向合并后的页面；`/explore` 删除或重定向到 `/`
  - 导航：`src/constants/index.ts` 里 sidebar 和底部导航的 Explore 链接删掉
  - 数据层清理（把相关代码都找出来一起整理）：
    - `getRecentPosts` / `useGetRecentPosts` / `QUERY_KEYS.GET_RECENT_POSTS` 删除
    - 所有 mutation 里 invalidate `GET_RECENT_POSTS` 的地方改成 `GET_POSTS` 或删除（点赞、收藏、取消收藏、编辑、删除帖子）
    - **`useCreatePost` 现在只 invalidate 了 `GET_RECENT_POSTS`**，要改成 `GET_POSTS`，否则发帖后回到首页看不到新帖子
    - **`useLikePost` 的 `onSuccess` 里 `return` 的那个 invalidate**（用来避免乐观更新闪回旧值）要改成 `GET_POSTS`
  - 文案："Search Posts"、"Popular Today" 等标题按首页重新写
  - 旧的 `Home.tsx` 删除，`Explore.tsx` 改名为 `Home.tsx`

## 第二阶段 · 补齐 MVP 页面

- [ ] **5. Profile 页（容器 + 三个 tab）**
  - 路由已有 `/profile/:id/*`，tab 可以用嵌套路由（`/profile/:id`、`/profile/:id/liked`、`/profile/:id/saved`）
  - 头部：头像、名字、username、bio、帖子数；本人显示「编辑资料」按钮
  - Posts tab：查 `creator = id` 的帖子，复用 GridPostList
  - Liked tab：该用户点赞过的帖子（posts ↔ users 的 likes 关系，查询时要 `Query.select` 关系列）
  - Saved tab：`currentUser.save`，需要 `select` 到 `save.post.*` 才能拿到帖子内容
  - 决定：Liked / Saved 是否只有本人能看（建议只对本人显示这两个 tab）
  - 清理：删除独立的 `/saved` 路由和导航链接，`Saved.tsx`、`LikedPosts.tsx` 改成 tab 组件

- [ ] **6. People 页（AllUsers）+ 用户搜索**
  - 和 Explore 的搜索同一个模式：`useDebounce` + query key 带上搜索词 + `enabled: !!term`
  - Appwrite 控制台：users 表的 `name` / `username` 要建 fulltext 索引，否则 `Query.search` 会报错
  - 用户卡片点进 Profile

- [ ] **7. UpdateProfile 页**
  - 表单：name、username、bio、头像
  - 换头像参考 `updatePost` 的顺序：上传新图 → 更新行 → 失败时删新图；成功后再删旧图（`.catch` 吞掉清理失败）
  - 类型：`IUpdateUser.imageUrl` 现在是 `URL | string`，改成 `string`
  - 更新成功后 invalidate `GET_CURRENT_USER`；AuthContext 里的 `user` 也要同步（第三阶段统一到 React Query 后就不用手动同步了）

## 第三阶段 · MVP 收尾

- [ ] **8. 登录态改由 React Query 管理**
  - 原因：现在 AuthContext 的 `user`（登录时取一次，存在 state）和 PostStats 用的 `useGetCurrentUser()` 是两份独立的数据，不会同步
  - 原则：登录态的唯一数据源是 React Query 缓存 `GET_CURRENT_USER`，Provider 和消费层都只读它，不保存副本
  - Provider：删掉 `useState(user / isLoading / isAuthenticated)`、`setUser`、`setIsAuthenticated`、`checkAuthUser`；从 query 推导 `user`、`isAuthenticated = !!data`、`isLoading = isPending`、`isError`；同步更新 `IContextType` 和 `INITIAL_STATE`
  - row → `IUser` 的映射放在 query 的 `select` 里
  - 写操作：sign-in 成功后 `invalidateQueries`，sign-out 后 `removeQueries`
  - SigninForm：去掉 `checkAuthUser()`，改为 `fetchQuery` 判断结果，或者只 invalidate，让 AuthLayout 在 `isAuthenticated` 变成 true 时自动跳转
  - 守卫：`isLoading` → 先渲染页面；`isError` → 错误页（网络或服务器出错不等于未登录）；`!isAuthenticated` → 跳转登录
  - 放在最后做的原因：涉及所有用到 `user` 的组件，等页面都写完再迁移，只需要做一次

- [ ] **9. users 表权限 + 孤儿账号自愈**
  - 现状：注册顺序是 `account.create` → `saveUserToDB`，写 users 表时是 guest 身份，所以表必须给 `Any` 开 create 权限，任何人都能往用户表写数据
  - 处理：顺序改成 `account.create` → `createEmailPasswordSession` → `createRow`，给该行设置 `Permission.read/update(Role.user(accountId))`；控制台把表级 create 权限从 `Any` 收紧到 `Users`
  - 孤儿账号自愈：`account.create()` 成功但写 users 行失败时，会留下没有 users 行的 Account。登录后如果拿到了 Account 却没有 users 行，就补写一行（`rowId = accountId`，重复写入安全）
  - 剩余风险：已登录用户仍然可以自己调 API 写入别人的 `accountId`，要等服务端方案（见「已知技术缺陷」）

- [ ] **10. 统一错误处理（mutation）**
  - 现状：query 错误已经由 `QueryProvider` 的 `QueryCache.onError` 统一弹 toast；mutation 还在各表单里自己 try/catch 加 toast，逻辑重复
  - `QueryClient` 增加 `mutationCache: new MutationCache({ onError })`，默认弹通用错误 toast
  - 新增 `getErrorMessage(error)`，把常见的 `AppwriteException` 翻译成统一文案（429 请求过于频繁、401 登录已过期、其他用通用文案）
  - 声明 `meta` 类型（`declare module "@tanstack/react-query"` 的 `Register.mutationMeta`），支持：
    - `skipGlobalError: true`：调用处自己处理，全局不弹
    - `errorMessages: { 401: "..." }`：按错误码覆盖文案（比如登录时 401 = 密码错误）
  - 注意：全局 `onError` 和单个 mutation 的 `onError` / try-catch **会同时执行**，迁移时要用 `meta` 避免弹两次 toast

- [ ] **11. QueryClient 配置**
  - `retry`：4xx（404、401、403 等）不重试，只重试网络错误和 5xx。现在打开不存在的帖子会请求 4 次、等约 7 秒才显示错误
    ```ts
    retry: (failureCount, error) =>
      error instanceof AppwriteException && error.code >= 400 && error.code < 500
        ? false
        : failureCount < 3,
    ```
  - mutation 默认就是 `retry: 0`，不用另外设置
  - 按需要设置 `staleTime`

- [ ] **12. Playwright E2E 自动化测试**
  - 搭建 Playwright（可以用项目里的 `/e2e-test` skill：含 istanbul 分支覆盖率和 Playwright MCP）
  - 测试环境：单独的 Appwrite 测试 project 或 database，以及固定的测试账号，不要跑在开发数据上
  - 优先覆盖的流程：
    - 注册、登录、登出、刷新后保持登录、守卫跳转
    - 发帖（含图片上传）、编辑（换图 / 不换图）、删除
    - 点赞 / 取消点赞、收藏 / 取消收藏（包括乐观更新和失败回滚）
    - 搜索帖子（debounce）、无限滚动加载下一页
    - 不存在的帖子 ID 显示错误状态，不能误建新帖
  - 之后接到 CI（比如 GitHub Actions），提交前自动跑

- [ ] **13. 代码整理**
  - 登录参数类型统一用 `ILoginUser`：`api.ts` 的 `signInAccount` 和 `useSignInAccount` 各写了一遍 `{ email; password }`
  - SigninForm 输入框：邮箱改成 `type="email"` + `autoComplete="email"`，密码 `autoComplete="current-password"`（SignupForm 用 `new-password`）
  - 占位页面和 `Loader.tsx` 里的 `type Props = {}`、未使用的 `props` / `React` 导入
  - `AuthContext.tsx` 未使用的 `useMemo` 导入
  - `searchPosts` 里的 `if (!post) throw` 永远不会触发；`deletePost` 的 `throw new Error()` 没有 message
  - 新增 `.env.example`，列出所有 `VITE_APPWRITE_*` 变量（见 README）

---

## MVP 之后

### UX 优化

- [ ] **刷新时点赞和收藏图标从"未点"跳到"已点"**
  - 原因：AuthContext 恢复用户和拉取帖子是并行的两个请求。帖子先回来时 `user.id` 还是 `""`，`checkIsLiked(likes, "")` 得出了错误的 `false`；收藏依赖的 `useGetCurrentUser()` 是另一个独立请求，也有同样的问题
  - 原则：不要让整页等用户数据（网络慢时用户会完全看不到页面），只让依赖用户的那一小块等待
  - 方法 1（改动最小）：`isLiked = !isUserLoading && checkIsLiked(likes, userId)`；加载期间图标 `opacity-40 pointer-events-none` + `transition-opacity`。收藏图标用 `useGetCurrentUser()` 的 `isPending` 同样处理
  - 方法 2：缓存当前用户（stale-while-revalidate）。登录态迁移到 React Query 后，用 `initialData` / `placeholderData` 或 `persistQueryClient` 实现。**登出时必须清掉缓存**，否则下一个登录的人会先看到上一个人的数据

- [ ] **手机端上下滑动浏览**（类似抖音）

### 国际化与主题（P3）

- [ ] **i18n 多语言（locale）**
  - 界面文案（按钮、标题、toast、空状态、校验错误）抽成语言包，先支持英文和中文
  - 时间显示跟着 locale 走：`formatPostTime` 里 date-fns 的 `formatDistanceToNow` / `format` 传入对应的 `locale`
  - 记住用户的语言选择，默认跟随浏览器语言

- [ ] **主题切换（theme）**
  - 现在只有深色配色。支持浅色 / 深色 / 跟随系统
  - 颜色统一走 CSS 变量，避免组件里写死 `bg-dark-2` 这类只适用深色的 class
  - 记住用户的选择；页面加载时尽早应用主题，避免先闪一下默认主题

### 功能

- [ ] 关注用户，以及基于关注关系的首页 feed
- [ ] 评论
- [ ] 分享

### 架构改进

- [ ] **点赞拆成独立的 likes 表**：现在 `likes` 是帖子上的关系数组，前端每次把整个数组写回去。点赞多了会有传输量问题，两个人同时点赞时后写的会覆盖先写的。改成每个赞一行（`user` + `post`，加唯一索引），点赞 `createRow`、取消 `deleteRow`
- [ ] **PostCard 结构**：整张卡片包在 `<Link>` 里，里面还有作者链接、编辑链接和点赞收藏按钮（`<a>` 里嵌 `<a>` 不是合法 HTML，按钮都要 `preventDefault`）。改成只有图片和文字区域包 `<Link>`
- [ ] 点赞 debounce（连续点击只发最后一次请求），需要配合本地的目标状态做乐观显示

## 已知技术缺陷（MVP 阶段接受）

当前架构是纯 SPA + Appwrite BaaS，所有业务逻辑都跑在浏览器里。以下缺陷是有意接受的，并记录了改进方案。

| 缺陷 | 影响 | MVP 缓解措施 | 长期改进方案 |
|---|---|---|---|
| **注册流程非原子**：建 Account 和写 users 表是两次独立请求 | 第二步失败时留下孤儿账号 | `rowId = accountId` 保证幂等，登录时自愈补写 | Appwrite Function 监听 `users.*.create` 事件，在服务端用 API Key 写 users 行（最终一致，自愈逻辑保留作兜底） |
| **客户端不可信**：zod 校验和按钮禁用都可以被绕过，任何人都能用 projectId 直接调用 API | 可能写入不合法的数据；已登录用户可以伪造 `accountId` 写入他人的行 | 表级和行级权限（`Role.user(...)`）、数据库唯一索引（例如 `username`） | 关键写操作改由 Function 执行，在服务端读取 `x-appwrite-user-id` 来校验身份和业务规则 |
| **跨用户数据无法安全计算**：比如点赞数、关注数 | 前端做 +1 在并发时会出错，也可以被篡改 | 先不存计数，展示时按关联表 count | Function 或事件触发器在服务端维护计数 |
| **点赞整份数组写回** | 并发点赞互相覆盖；可以伪造整个点赞列表 | 请求进行中禁止重复点击 | 拆成独立 likes 表（见「架构改进」） |

待确认：
- [ ] Appwrite Cloud 免费版的 Functions 额度（执行次数、超时、冷启动）是否满足需求，以官方定价页为准

---

## 已完成

**登录与账号**
- [x] RootLayout 渲染 `<Outlet />`
- [x] 刷新页面后恢复登录态（AuthContext 挂载时调用 `getCurrentUser`）
- [x] 删除调试代码 `window.__auth`
- [x] users 行 ID 改用 accountId（幂等）
- [x] `getCurrentUser` 区分"未登录"和"出错"：只有 `account.get()` 的 401 返回 `null`
- [x] 登录校验改为 `email`
- [x] SigninForm 接上 API
- [x] 登出（api、hook，Header / LeftSidebar 已使用）
- [x] `signInAccount` 不再预先删除 session，只在 `user_session_already_exists` 时删除并重试

**帖子**
- [x] 发帖：图片上传到 Storage，用 `getFileView` 生成链接（`getFilePreview` 的图片变换在免费版是付费功能）
- [x] 编辑帖子：可以不换图；换图时先上传新图，更新成功后删旧图，失败时删新图
- [x] 删除帖子：先删行再删图片
- [x] 帖子详情页（作者本人显示编辑 / 删除）
- [x] 点赞（基于 mutation `variables` 的乐观更新，失败自动回滚）
- [x] 收藏 / 取消收藏（`isSaved` 从 `currentUser.save` 推导，不另存 state）
- [x] Explore：帖子搜索（`useDebounce`）、无限滚动（`useInfiniteQuery` + `Query.cursorAfter`）

**代码与类型**
- [x] `config.ts` 删除已废弃的 `Databases`，只用 `TablesDB`
- [x] Post 类型整理：`IPost`（读）、`INewPost` / `IUpdatePost`（写）、`IUserRow`、`ISaveRecord`；`listRows` / `getRow` 传泛型
- [x] 关系列（`creator`、`likes`、`save`）查询时都用 `Query.select` 显式加载
- [x] query 错误由 `QueryCache.onError` 统一弹 toast
- [x] 首页和 Explore 的加载、错误、空状态（EmptyUI）
- [x] toast 显示时间改成 3 秒
