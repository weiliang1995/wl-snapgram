# Snapgram

[English](README.md) | 中文

一个以图片为主的社交应用（类似 Instagram 的简化版）。用户可以注册登录、发布带图片的帖子、点赞和收藏、搜索帖子，并通过无限滚动浏览所有人的内容。

前端是纯 SPA（React + TypeScript + Vite），后端完全使用 [Appwrite](https://appwrite.io) Cloud 提供的账号、数据库和文件存储服务，没有自建服务器。

> 状态：MVP 大约完成 70–80%，目前暂停开发。剩余工作和优先级见 [todo.md](todo.md)。

---

## 功能

### 已完成

- **账号**：邮箱注册、登录、登出；刷新页面后自动恢复登录态
- **发帖**：上传图片，填写 caption、地点和标签（逗号分隔）
- **编辑帖子**：可以只改文字，也可以换图；换图成功后自动删除旧图片
- **删除帖子**：同时删除数据和图片文件
- **帖子详情页**：作者本人可以编辑和删除
- **点赞**：乐观更新，点击后立刻显示结果，请求失败时自动恢复
- **收藏 / 取消收藏**
- **Explore**：按 caption 搜索帖子（输入防抖），浏览列表无限滚动
- **加载、错误、空状态**：列表和详情页都有对应的界面；查询失败时统一弹出错误提示

### 计划中（MVP）

- **路由守卫**：未登录时跳转登录页，已登录时不能再进入登录 / 注册页
- **合并首页和 Explore**：没有关注功能时两者内容几乎相同，所以合并成一个首页，提供「卡片 / 网格」两种浏览方式
- **个人主页（Profile）**：作为容器页，下面分三个 tab：发布的帖子、点赞过的、收藏的
- **用户列表与搜索（People）**
- **编辑个人资料**：名字、用户名、简介、头像
- **Playwright 端到端测试**

### 之后可能做

- 关注用户，以及基于关注关系的首页内容
- 评论、分享
- 手机端上下滑动浏览（类似抖音）

---

## 技术栈

| 类别 | 使用 |
|---|---|
| 框架 | React 19、TypeScript、Vite |
| 路由 | React Router 7 |
| 服务端状态 | TanStack Query 5（缓存、乐观更新、无限滚动） |
| 表单与校验 | React Hook Form + Zod |
| 样式 | Tailwind CSS 4、shadcn（基于 Base UI） |
| 后端 | Appwrite Cloud：Account、TablesDB、Storage |
| 其他 | date-fns（时间格式化）、react-dropzone（图片上传）、react-intersection-observer（无限滚动） |
| 代码规范 | ESLint（含 React Hooks 规则、禁止相对路径导入） |

---

## 架构

```
浏览器 (React SPA)
  ├─ 页面 / 组件
  ├─ React Query hooks      src/lib/react-query/queriesAndMutation.ts
  └─ Appwrite API 封装       src/lib/appwrite/api.ts
          │
          ▼
Appwrite Cloud
  ├─ Account   注册、登录、session
  ├─ TablesDB  users / posts / saves 三张表
  └─ Storage   帖子图片
```

**分层原则**

- `api.ts` 只负责发请求，不吞错误：失败时直接抛出，交给 React Query 和界面处理
- 组件不直接调用 `api.ts`，都通过 React Query 的 hook，缓存和刷新由 React Query 统一管理
- 能从已有数据推导出来的状态（比如"是否已收藏"）直接计算，不再另存一份 `useState`

### 数据模型

| 表 | 主要字段 | 说明 |
|---|---|---|
| **users** | `accountId`、`name`、`username`、`email`、`imageUrl`、`bio`、`save` | 行 ID 等于 Appwrite Account 的 ID，保证一个账号只对应一行 |
| **posts** | `creator`、`caption`、`imageId`、`imageUrl`、`location`、`tags[]`、`likes` | `creator` 关联 users；`likes` 是 posts ↔ users 的多对多关系 |
| **saves** | `user`、`post` | 收藏记录，分别关联 users 和 posts |

**关系列不会自动返回。** 在 TablesDB 里，`Query.select(["*"])` 不包含关系列，需要用到的关系都要显式写出来，例如：

```ts
Query.select(["*", "creator.*", "likes.$id"])
```

### 图片

图片上传到 Storage 后，用 `getFileView` 生成访问链接。`getFilePreview` 带的图片变换（缩放、裁剪）在 Appwrite 免费版是付费功能，所以没有使用。

数据库里同时保存 `imageId` 和 `imageUrl`；删除或替换图片时用 `imageId` 找到文件。

---

## 目录结构

```
src/
├─ _auth/                 登录 / 注册页和布局
├─ _root/                 登录后的页面和布局
│  └─ pages/              Home、Explore、PostDetails、CreatePost、EditPost 等
├─ components/
│  ├─ forms/              PostForm（新建和编辑共用）
│  ├─ shared/             PostCard、PostStats、GridPostList、SearchResults、EmptyUI 等
│  └─ ui/                 shadcn 组件
├─ constants/             导航、表单模式、toast 类型等常量
├─ context/AuthContext.tsx  当前用户与登录态
├─ hooks/                 useDebounce
├─ lib/
│  ├─ appwrite/           Appwrite 客户端配置和 API 封装
│  ├─ react-query/        QueryClient、query / mutation hooks、query key
│  └─ validation/         Zod schema
└─ types/                 共用类型（IPost、IUserRow、INewPost、IUpdatePost 等）
```

---

## 本地开发

### 前置条件

- Node.js 和 pnpm
- 一个 Appwrite Cloud 项目

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置 Appwrite

在 Appwrite 控制台里：

1. 新建一个 database，按上面的「数据模型」建立 users、posts、saves 三张表和对应的关系列
2. saves → post 的关系建议把删除行为设为 **cascade**，这样删除帖子时会一起删掉相关的收藏记录
3. 在 posts 表的 `caption` 上建立 **fulltext 索引**，否则帖子搜索会报错
4. 新建一个 Storage bucket 存放帖子图片
5. 设置各表和 bucket 的权限（目前 users 表需要允许未登录用户创建，原因和改进方案见 [todo.md](todo.md)）
6. 在 **Platforms** 里添加 Web 平台，hostname 填你访问开发服务器用的域名

### 3. 环境变量

在项目根目录新建 `.env.local`（已被 `.gitignore` 忽略）：

```bash
VITE_APPWRITE_URL=https://<region>.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=
VITE_APPWRITE_DATABASE_ID=
VITE_APPWRITE_STORAGE_ID=
VITE_APPWRITE_USERS_COLLECTION_ID=
VITE_APPWRITE_POSTS_COLLECTION_ID=
VITE_APPWRITE_SAVES_COLLECTION_ID=
```

### 4. 启动

```bash
pnpm dev
```

开发服务器固定监听 `127.0.0.1:5173`。`vite.config.ts` 里允许通过 `local.snapgram.com` 和 `dev.snapgram.com` 访问；如果使用这两个域名，需要在 `/etc/hosts` 里把它们指向 `127.0.0.1`，并在 Appwrite 的 Platforms 里添加对应的 hostname。

### 常用命令

| 命令 | 作用 |
|---|---|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 类型检查并打包 |
| `pnpm preview` | 预览打包结果 |
| `pnpm lint` / `pnpm lint:fix` | ESLint 检查 / 自动修复 |
| `node scripts/lock-deps.js` | 把 `package.json` 里的依赖版本锁定为精确版本（`--check` 只检查不修改） |

---

## 已知限制

当前所有业务逻辑都在浏览器里执行，以下限制在 MVP 阶段是有意接受的：

- **客户端不可信**：表单校验可以被绕过，任何人都能用 project ID 直接调用 Appwrite API。目前依靠表和行的权限来限制
- **注册不是原子操作**：创建账号和写入 users 表是两次请求，第二步失败会留下没有资料的账号
- **点赞整份写回**：点赞时前端把整个点赞列表写回数据库，多人同时点赞可能互相覆盖

长期方案是把关键的写操作放到 Appwrite Functions（服务端）里执行，点赞拆成独立的表。详细的影响和改进方案见 [todo.md](todo.md) 的「已知技术缺陷」。
