# TODO

基于 `feature/auth` 分支当前代码的检查结果，按优先级排序。

## P0 · 路由与登录态（阻塞功能）

- [ ] **RootLayout 不渲染子路由**
  - 位置：`src/_root/RootLayout.tsx`
  - 现状：只返回 `<div>RootLayout</div>`，没有 `<Outlet />`，所以 `/` 下的 Home 永远不显示
  - 处理：渲染 `<Outlet />`，并加鉴权守卫：未登录时 `<Navigate to="/sign-in" />`

- [ ] **AuthLayout 的登录判断写死**
  - 位置：`src/_auth/AuthLayout.tsx:7`
  - 现状：`const isAuth = false`
  - 处理：改用 `useUserContext().isAuthenticated`；已登录时访问 `/sign-in` 或 `/sign-up` 跳回 `/`

- [ ] **刷新页面后登录态丢失**
  - 位置：`src/context/AuthContext.tsx:41`
  - 现状：mount 时只检查 `localStorage.cookieFallback`，不调用 `checkAuthUser()`，刷新后 `user` 一直是 `INITIAL_USER`
  - 处理：mount 时调用 `checkAuthUser()`，不再用 `cookieFallback` 判断登录态（同域部署时 session 在 cookie 里，`cookieFallback` 永远为空）

- [ ] **AuthProvider 里的跳转要移到路由层**
  - 位置：`src/context/AuthContext.tsx:41-49`
  - 现状：Provider 挂载时不看当前路由就 `navigate("/sign-in")`，未登录用户直接打开 `/sign-up` 会被踢到 `/sign-in`
  - 处理：Provider 只负责提供登录态，删掉这个 `navigate`；跳转交给 RootLayout / AuthLayout 的守卫（见上面两条）

- [ ] 删除 `src/context/AuthContext.tsx:59-61` 的调试代码 `window.__auth = value`

- [ ] **守卫需要处理 loading 状态**
  - 现状：`isLoading` 初始为 `false`，会话恢复完成前守卫就会认为用户"未登录"并跳走
  - 处理：初始值设为 `true`，或增加 `isInitialized` 标记；loading 期间渲染 Loader

- [ ] **登录态改由 React Query 管理（统一解决上面"刷新丢失"和"loading 状态"两条）**
  - 原则：登录态的唯一数据源是 React Query 缓存 `["currentUser"]`，Provider 和消费层都只读它，不保存副本
  - Query：新增 `useGetCurrentUser`（`useQuery({ queryKey: ["currentUser"], queryFn: getCurrentUser, retry: false })`），row → `IUser` 的映射放在 `select` 里（顺带完成 P2 的 `toUser(row)`）
  - Provider：删掉 `useState(user / isLoading / isAuthenticated)`、`setUser`、`setIsAuthenticated`、`checkAuthUser`；从 query 推导出 `user = data ?? null`、`isAuthenticated = !!data`、`isLoading = isPending`、`isError`；同步更新 `IContextType` 和 `INITIAL_STATE`
  - 消费层：组件只通过 `useUserContext()` 读取，不复制到本地 state；写操作走 mutation，`onSuccess` 时 sign-in 调用 `invalidateQueries(["currentUser"])`，sign-out 调用 `removeQueries(["currentUser"])`
  - SigninForm：去掉 `checkAuthUser()`，改为 `fetchQuery(["currentUser"])` 判断结果；或者只 invalidate，让 AuthLayout 在 `isAuthenticated` 变为 true 时自动跳到 `/`
  - 守卫：依次处理 `isLoading` → Loader，`isError` → 错误页（网络或服务器出错不等于未登录），`!isAuthenticated` → `<Navigate to="/sign-in" replace />`

## P1 · 数据一致性与安全

- [ ] **users 行的 ID 改用 accountId（幂等）**
  - 位置：`src/lib/appwrite/api.ts` 的 `saveUserToDB`
  - 现状：`rowId: ID.unique()`，重试或重复提交会写出多行
  - 处理：改成 `rowId: user.accountId`，重复写入会返回 409，从结构上保证一个 Account 对应一行
  - 注意：旧的测试数据用的是随机 ID，所以 `getCurrentUser` 暂时继续用 `listRows` 按 `accountId` 查；清掉旧数据之后可以改成 `getRow`

- [ ] **getCurrentUser 区分"未登录"和"出错了"**
  - 位置：`src/lib/appwrite/api.ts` 的 `getCurrentUser`
  - 现状：所有错误都被吞掉，返回 `null`，网络错误会被当成未登录；`if (!currentUser)` 永远不会成立
  - 处理：try 只包住 `account.get()`，只有 `AppwriteException` 且 `code === 401` 时返回 `null`，其他错误抛出；`listRows` 不放在 try 里；最后 `return rows[0] ?? null`

- [ ] **孤儿账号自愈（MVP 方案）**
  - 现状：`account.create()` 成功、`saveUserToDB()` 失败时，会留下一个没有 users 行的 Account
  - 处理：登录后如果 `getCurrentUser` 拿到了 Account 却没有 users 行，就补写一行（`rowId = accountId`，重复写入也是安全的）
  - 长期方案见下方「已知技术缺陷 → 注册流程非原子」

- [ ] **users 表需要开放 guest 写权限（安全隐患，MVP 可修）**
  - 现状：写 users 表发生在登录之前，请求是 guest 身份，所以该表必须给 `Any` 开 create 权限，任何人都能往用户表里写数据
  - 处理（不依赖 Function）：调整顺序为 `account.create` → `createEmailPasswordSession` → `createRow`，并给该行设置权限 `Permission.read/update(Role.user(accountId))`；然后在 Appwrite 控制台把表级的 create 权限从 `Any` 收紧到 `Users`
  - 剩余风险：任何已登录的用户仍然可以自己调用 API，写入 `accountId` 不是自己的行。这一点要等服务端方案才能彻底解决（见下方）

## P1 · 登录页

- [ ] **登录校验字段和 API 对不上**
  - 位置：`src/lib/validation/index.ts` 的 `SigninValidation`
  - 现状：校验的是 `username`，但 `createEmailPasswordSession` 需要 `email`
  - 处理：改成 `email: z.email()`，表单字段同步修改

- [ ] **SigninForm 还没接上 API**
  - 位置：`src/_auth/forms/SigninForm.tsx:37`
  - 现状：`onSubmit` 是空的，`isLoading` 是本地 state
  - 处理：参照 SignupForm，接入 `useSignInAccount` 和 `checkAuthUser`，成功后 `navigate("/")`，失败时弹 toast

- [ ] **缺少登出**
  - 处理：在 api 层新增 `signOutAccount`（`account.deleteSession({ sessionId: "current" })`），并提供 `useSignOutAccount`；登出后重置 AuthContext，跳转到 `/sign-in`
  - 同时用在 `SigninForm` 的 "Authentication failed" 分支：session 已创建但 `checkAuthUser` 返回 false 时要删掉 session，避免服务端已登录、前端未登录的不一致状态

- [ ] **signInAccount 每次都先删除旧 session**
  - 位置：`src/lib/appwrite/api.ts` 的 `signInAccount`
  - 现状：先 `deleteSession("current")` 再创建；已登录用户输错密码时旧 session 已被删掉，等于被登出；没有旧 session 时还多发一次必定失败的请求
  - 处理：AuthLayout 守卫做好后（已登录用户进不了 `/sign-in`），删掉这行；如需兜底，只在 `user_session_already_exists` 时删除并重试

## P2 · 代码整理

- [ ] `src/lib/appwrite/config.ts`：删除已废弃的 `Databases`，只保留 `TablesDB`
- [ ] `src/lib/react-query/queriesAndMutation.ts`：删除未使用的导入 `useQuery`、`useQueryClient`、`useInfiniteQuery`（等真正用到时再加）
- [ ] `src/constants/auth.ts`：`INITIAL_STATE` 缺少 `setIsLoading`，和 Provider 实际提供的 value 不一致；同步更新 `IContextType`
- [ ] `src/_auth/AuthLayout.tsx`、`SigninForm.tsx`、`RootLayout.tsx`、`Home.tsx`：删除空的 `type Props = {}` 和未使用的 `props` / `React` 导入
- [ ] `checkAuthUser` 把 Appwrite 的 row 映射成 `IUser` 时没有类型约束：给 `listRows` 传泛型，或写一个 `toUser(row)` 函数
- [ ] 登录参数类型统一用 `ILoginUser`：`api.ts` 的 `signInAccount` 和 `queriesAndMutation.ts` 的 `useSignInAccount` 目前各写了一遍 `{ email; password }`
- [ ] SigninForm 输入框：邮箱改成 `type="email"` + `autoComplete="email"`，密码加 `autoComplete="current-password"`（SignupForm 用 `new-password`）
- [ ] `QueryClient` 用的是默认配置：根据需要设置 `staleTime` 和 `retry`（比如 mutation 失败不重试，401 不重试）
- [ ] **Post 类型整理（做首页 feed 时一起做）**
  - 现状：`Post` 类型写在 `PostForm.tsx` 里，继承的是 `Models.Document`；`createRow` 没传泛型，`data` 是 `Record<string, any>`，写错列名 TS 不会报错
  - 处理：挪到 `src/types`，改为继承 `Models.Row`（用的是 `tablesDB`）；`createRow` / `listRows` 传泛型
  - 注意：`creator` 是关系列，写入时传 user id 字符串，读出来可能是整个 user 对象，读和写的类型可能要分开定义

## P2 · 统一错误处理（功能开发完后再迁移）

- [ ] **mutation 错误统一由 MutationCache 处理**
  - 现状：query 错误已经由 `QueryProvider` 的 `QueryCache.onError` 统一弹 toast；mutation 还在各表单里自己 try/catch 加 toast（SigninForm、SignupForm、CreatePost 等），逻辑重复
  - 处理：
    - `QueryClient` 增加 `mutationCache: new MutationCache({ onError })`，默认弹出通用的错误 toast
    - 新增 `getErrorMessage(error)`，把常见的 `AppwriteException` 翻译成统一文案（429 请求过于频繁、401 登录已过期、其他用通用文案）
    - 声明 `meta` 类型（`declare module "@tanstack/react-query"` 的 `Register.mutationMeta`），支持：
      - `skipGlobalError: true`：调用处自己处理，全局不弹
      - `errorMessages: { 401: "..." }`：按错误码覆盖文案（比如登录时 401 = 密码错误）
    - 迁移各表单：删除重复的 catch 和 toast，只保留特殊情况
  - 注意：全局 `onError` 和单个 mutation 的 `onError` / try-catch **会同时执行**，迁移时要用 `meta` 避免弹两次 toast
  - 迁移前准备：错误 toast 统一用 `toast.add({ type: TOAST_TYPE.ERROR, ... })` 的写法，方便全局搜索；特殊错误码处理加注释标记

## P1 · Explore 页待处理问题

- [ ] **Explore 点赞后图标状态闪烁**
  - 现象：在 Explore 页点赞，like 状态会依次变成 false → true → false → true，一共变化四次；取消点赞也一样
  - 对比：收藏没有这个问题

- [ ] **GridPostList 里的 PostStats 需要改造**
  - 需求：在 grid 里只显示 like，或者 like + save，其他内容（评论、分享、时间等）不显示

## P3 · UX 优化（MVP 完成后再做）

- [ ] **刷新时点赞和收藏图标从"未点"跳到"已点"**
  - 原因：AuthContext 恢复用户和 Home 拉取帖子是并行的两个请求。帖子先回来时 `user.id` 还是 `""`，`checkIsLiked(likes, "")` 得出了错误的 `false`；收藏依赖的 `useGetCurrentUser()` 是另一个独立请求，也有同样的问题
  - 原则：不要让整页等用户数据（网络慢时用户会完全看不到页面），只让依赖用户的那一小块等待

- [ ] **方法 1：用户加载期间图标显示中性状态（先做这个，改动最小）**
  - 位置：`src/components/shared/PostStats.tsx`
  - 处理：`isLiked = !isUserLoading && checkIsLiked(likes, userId)`；加载期间图标设成 `opacity-40 pointer-events-none`，加上 `transition-opacity` 让变化更柔和
  - 收藏图标同样处理，用 `useGetCurrentUser()` 的 `isPending` 判断

- [ ] **方法 2：缓存当前用户，刷新时直接使用（stale-while-revalidate）**
  - 处理：拿到用户时写入 `localStorage.cachedUser`；AuthProvider 的 `useState` 初始值从缓存读取（读取要包 try/catch）；后台的 `getCurrentUser()` 返回后用最新数据覆盖，session 失效时清掉缓存并跳转登录
  - 注意：**登出时必须清掉 `cachedUser`**，否则下一个登录的人会先看到上一个人的数据
  - 当前用户改由 React Query 管理之后（见 P0），改用 `initialData` / `placeholderData` 或 `persistQueryClient` 实现

- [ ] **RootLayout 守卫不要挡住整个页面**
  - 现状建议：守卫只负责"确认未登录后跳转 `/sign-in`"；用户还在加载时先渲染页面，不要显示全屏 loader

## 已知技术缺陷（MVP 阶段接受）

当前架构是纯 SPA + Appwrite BaaS，所有业务逻辑都跑在浏览器里。以下缺陷是有意接受的，并记录了改进方案。

| 缺陷 | 影响 | MVP 缓解措施 | 长期改进方案 |
|---|---|---|---|
| **注册流程非原子**：建 Account 和写 users 表是两次独立请求 | 第二步失败时留下孤儿账号 | `rowId = accountId` 保证幂等，登录时自愈补写 | Appwrite Function 监听 `users.*.create` 事件，在服务端用 API Key 写 users 行（最终一致，自愈逻辑保留作兜底） |
| **客户端不可信**：zod 校验和按钮禁用都可以被绕过，任何人都能用 projectId 直接调用 API | 可能写入不合法的数据；已登录用户可以伪造 `accountId` 写入他人的行 | 表级和行级权限（`Role.user(...)`）、数据库唯一索引（例如 `username`） | 关键写操作改由 Function 执行，在服务端读取 `x-appwrite-user-id` 来校验身份和业务规则 |
| **跨用户数据无法安全计算**：比如点赞数、关注数 | 前端做 +1 在并发时会出错，也可以被篡改 | 先不存计数，展示时按关联表 count | Function 或事件触发器在服务端维护计数 |

待确认：
- [ ] Appwrite Cloud 免费版的 Functions 额度（执行次数、超时、冷启动）是否满足需求，以官方定价页为准

## 后续功能（types 和 env 已就绪）

- [x] posts：图片上传到 Storage → 拿到 `fileId` 和预览 URL → 写 posts 表
- [ ] feed：用 `useInfiniteQuery` 加 Appwrite `Query.cursorAfter` 做分页
- [ ] saves：user ↔ post 关联表，mutation 成功后 `invalidateQueries`
- [ ] 个人资料更新（`IUpdateUser`）：替换头像时删除旧文件
