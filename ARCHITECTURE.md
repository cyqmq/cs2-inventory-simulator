# 架构总览

> 仓库地址：https://github.com/cyqmq/cs2-inventory-simulator

```
┌─── 桌面端（Electron） ─────────────────────────────────────────────┐
│                                                                     │
│  ① 用户点 Sign In                                                  │
│  ② 主窗口跳转 → https://steamcommunity.com/openid/login            │
│  ③ Steam 回调 → 本地 http://127.0.0.1:{port}/steam-callback        │
│  ④ 桌面端直接 POST 到 Steam 验证 OpenID  ←── 绕过 GFW              │
│  ⑤ 桌面端直接 GET Steam API 拿头像昵称    ←── 绕过 GFW              │
│  ⑥ 桌面端调用服务器 API 创建 session                                │
│  ⑦ 跳回 App → API 请求携带 cookie → 渲染用户数据                    │
│                                                                     │
│  所有 API 调用指向 https://ccs.8385838.xyz                          │
└─────────────────────────────────────────────────────────────────────┘
                              ↕ API JSON
┌─── 服务器（Debian + PM2）──────────────────────────────────────────┐
│                                                                     │
│  纯 API 服务器，不返回任何 HTML/网页                                │
│  非 /api/* 路径一律返回 404                                         │
│                                                                     │
│  提供端点：                                                          │
│  ├─ GET  /api/init               ← 初始化数据（规则/偏好/用户）     │
│  ├─ GET  /api/auth/electron      ← 桌面端 Steam 登录写 session      │
│  │     ?steamId=...&secret=...&nickname=...&avatar=...              │
│  │     → upsertUser + commitSession → { sessionCookie }             │
│  ├─ GET  /api/auth/electron-config ← 返回 steamApiKey               │
│  │     ?secret=... → { steamApiKey }                                │
│  ├─ GET/POST /api/inventory/*    ← 库存 CRUD                        │
│  ├─ GET/POST /api/preferences/*  ← 用户偏好                         │
│  ├─ ...其他现有 /api/* 端点                                         │
│                                                                     │
│  数据库：PostgreSQL                                                 │
│  反向代理：Cloudflare Tunnel → localhost:4445                       │
│  PM2 管理进程                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## 交互协议

> **整个开发与调试过程中，AI 必须遵守以下两条交互规则：**

### 规则一：模糊必问

如果用户的问题有歧义、表述不清晰、或缺少关键上下文，AI **必须停下来先询问用户真正意思**，给出几个可能的方向让用户决定，而不是猜测用户意图并直接执行。

**示例**：
- 用户说"登录有问题" → 具体是什么问题？报错？界面卡住？跳转失败？
- 用户说"改一下那个文件" → 改哪个文件？改成什么样？
- 用户说"部署一下" → 部署到哪？服务器还是本地？

### 规则二：用户侧操作需指引

在任务推进过程中，凡涉及用户侧操作的环节（如运行命令、查看日志、修改配置、提供信息等），**必须第一时间与用户沟通确认**：

1. **说明需求背景**：为什么要做这个操作
2. **给出逐步操作指引**：具体步骤，让用户知道怎么配合
3. **说明预期结果**：用户应该看到什么，应该反馈什么

**典型场景**：
- 需要用户提供浏览器控制台日志 → 说明在哪个窗口看日志、复制哪部分内容
- 需要用户运行某个命令 → 写明完整命令和运行目录
- 需要用户确认某个行为 → 解释利弊，让用户决定

### 规则三：思考过程使用中文

AI 的所有内部思考过程必须使用中文，不得使用英文或其他语言进行思考推理。

### 规则四：每句结尾加喵喵

在每次对话的**最后一句回答**末尾，必须追加一个 `喵喵~`。

## 关键原则

- 服务器和 Steam 之间**零直接通信**，所有 Steam 请求（OpenID 验证、API 调用）由桌面端发起
- 桌面端用户需要自己解决网络问题（VPN/代理）来访问 Steam
- 服务器只认 session cookie，不管用户怎么登录的
- 没有浏览器 web 版，只有 Electron 桌面客户端
- 服务端是纯 API server，不返回 HTML，非 `/api/*` 路径返回 404
- `build/client/`（SPA 静态文件）只存在于 Electron 本地，不部署到服务器
- 服务器只部署 `build/server/`（API handler）+ `server.prod.mjs`（入口）

## 登录流程（方案 B：同窗口跳转）

1. 用户点击 Sign In → 主窗口跳转到 `https://steamcommunity.com/openid/login`
2. Steam 回调到 `http://127.0.0.1:{port}/steam-callback?openid.*`
3. 本地 HTTP 服务器保存 OpenID 参数到 `callbackParams`，返回 "Verifying..." 页面
4. Electron 主进程 `did-navigate` 检测到回调 URL → 调用 `handleSteamCallback()`
5. `handleSteamCallback()` 执行完整流程：

   ```
   桌面端                                   Steam                服务器
     │                                      │                     │
     ├── POST check_authentication ────────→│                     │
     │←── is_valid=true ────────────────────│                     │
     │                                      │                     │
     ├── GET /api/auth/electron-config ─────│────────────────────→│
     │←── { steamApiKey } ←────────────────│────────────────────│
     │                                      │                     │
     ├── GET GetPlayerSummaries ───────────→│                     │
     │←── { personaname, avatarfull } ─────│                     │
     │                                      │                     │
     ├── GET /api/auth/electron ────────────│────────────────────→│
     │   ?steamId=...&secret=...            │       upsertUser()  │
     │   &nickname=...&avatar=...           │       commitSession │
     │←── { sessionCookie } ←──────────────│────────────────────│
     │                                      │                     │
     ├── session.cookies.set()              │                     │
     ├── mainWindow.loadURL("/")            │                     │
     │                                      │                     │
     ├── GET /api/init (with cookie) ───────│────────────────────→│
     │←── { rules, preferences, user } ←───│────────────────────│
   ```

6. **SteamID 写入数据库**：第 5 步中 `upsertUser({ steamID, nickname, avatar })` 执行
   `INSERT INTO users ... ON CONFLICT (steam_id) DO UPDATE`，同一个人重复登录只更新昵称/头像

## 服务器配置（`.env`）

| 变量 | 用途 | 必需 |
|------|------|:----:|
| `DATABASE_URL` | PostgreSQL 连接 | ✅ |
| `SESSION_SECRET` | session 加密密钥 | ✅ |
| `STEAM_API_KEY` | Steam Web API 密钥（桌面端通过 `/api/auth/electron-config` 获取后直连 Steam） | ✅ |
| `STEAM_CALLBACK_URL` | ❌ 纯 API 方案已废弃，桌面端不走这个回调 | ❌ |
| `PORT` | 服务器监听端口（当前 4445） | ✅ |
| `ELECTRON_AUTH_SECRET` | 桌面端认证共享密钥，防止未授权调用 `/api/auth/electron` | ✅ |

## `server.prod.mjs` 改动要点

```js
// 去掉静态文件服务（build/client/ 不在服务器上）
// app.use(express.static("build/client"))  ← 删除

// 非 API 路径返回 404
app.use((req, res, next) => {
  if (req.path.startsWith("/api/") || req.path === "/healthz") {
    return next();
  }
  res.status(404).json({ error: "Not found" });
});

// 保留 React Router handler（API 路由仍由 build/server/index.js 处理）
app.use(createRequestHandler({ build, mode }));
```

## 注意事项

### 1. `ELECTRON_AUTH_SECRET` 必须三端一致

三处代码使用了相同的认证密钥：

| 位置 | 用途 |
|------|------|
| `electron/main.ts` | Electron 发送给服务器的 secret |
| `app/routes/api.auth.electron-config._index.tsx` | 服务端验证 electron-config 请求 |
| `app/routes/api.auth.electron._index.tsx` | 服务端验证 electron 登录请求 |

**三端 fallback 值必须相同**，否则桌面端登录会失败。生产环境通过环境变量 `ELECTRON_AUTH_SECRET` 设置，代码中的 `"change-me-in-production"` 仅为占位符，未设置环境变量时将直接失效。

### 2. 双构建模式冲突

`npm run build:client`（SSR 模式）和 `npm run build:electron`（SPA 模式）都会生成 `build/client/` 和 `build/server/`。**后者会覆盖前者。**

- 部署服务器前必须运行 `npm run build:client`（SSR 模式）
- 打包 Electron 前必须运行 `npm run build:electron`（SPA 模式）
- 顺序：服务器部署 → `build:client` → 部署 `build/server/` → `build:electron` → 打包 Electron

### 3. `build/client/` 只存在于本地

服务器是纯 API 模式，不托管任何静态文件。`build/client/` 仅由 Electron 本地 HTTP 服务器加载。**部署服务器时不需要上传 `build/client/`。**

### 4. Electron 本地 HTTP 服务器无缓存控制

`build/client/index.html` 被 Electron 的 `webview` 加载后可能被缓存。修改 SPA 后需要：
- `npm run build:electron` 重新构建
- 重启 Electron 客户端
- 本地 HTTP 服务器已设置 `Cache-Control: no-store`，但如果浏览器层有缓存需手动清除

### 5. Steam 登录依赖桌面端网络

桌面端必须能直连 `steamcommunity.com` 和 `api.steampowered.com`。如果用户网络受限（例如在中国大陆），需自行配置 VPN 或代理。**服务器不参与任何 Steam 通信，无法代理。**

### 6. 版本号同步

`package.json` 中的 `version` 字段控制：
- electron-builder 生成的安装包文件名（`CS2 Inventory Simulator Setup {version}.exe`）
- GitHub Release 的版本标记

客户端版本与仓库版本当前未自动同步，需手动更新 `package.json` 的 `version` 字段。

### 7. Electron Cookie 设置陷阱

Electron 设置认证 Cookie 时，`cookies.set()` 的 `value` 参数只需要**裸值**，不包含 `_session=` 前缀和属性（如 `; Path=/; HttpOnly`）。

但服务端 `commitSession()` 返回的是完整 Set-Cookie 字符串（如 `_session=eyJ...; Path=/; SameSite=Lax`）。使用前必须先剥离前缀和属性：

```ts
// commitSession 返回的是完整 Set-Cookie 字符串
const { sessionCookie } = await resp.json();
// "_session=eyJ1c2VySWQiOiIxMjMifQ==.signature; Path=/; HttpOnly; SameSite=Lax"

// ❌ 错误：直接传入包含前缀和属性的完整字符串
cookies.set({ name: "_session", value: sessionCookie, ... });

// ✅ 正确：只传入裸值部分
const raw = sessionCookie.split(";")[0].split("=").slice(1).join("=");
cookies.set({ name: "_session", value: raw, ... });
```

### 8. SameSite 跨站问题

SPA 从 `http://127.0.0.1:{port}` 加载，API 在 `https://ccs.8385838.xyz`，属于**跨站请求**。

- 服务端 `session.server.ts` 的 `sameSite: "lax"` —— 适用于浏览器同站访问，正确
- Electron `main.ts` 中的 `cookies.set()` **必须使用** `sameSite: "no_restriction"`（对应 HTTP 的 `None`），否则跨站 fetch 不会携带 Cookie，导致登录后仍显示未登录

```ts
// electron/main.ts
cookies.set({
  url: apiBaseUrl,
  name: "_session",
  value: rawValue,
  secure: true,
  sameSite: "no_restriction"   // ← 必须为 "no_restriction"（对应 None），不能是 "lax"
});
```

### 9. 修改后端 API 后需重新部署

后端的 API handler 位于 `app/routes/api.*.tsx`，修改后需要：
1. `npm run build:client`（重新生成 `build/server/index.js`）
2. 将 `build/server/` 同步到服务器
3. `pm2 restart cs2-inventory`

不需要重新打包 Electron 客户端（除非修改了前端 UI 代码）。

## 构建部署

```
本地构建：
  npm run build:client  →  build/client/  (给 Electron，SSR 模式)
  npm run build:server  →  build/server/  (给服务器)
  npm run build:electron →  build/client/ + dist-electron/ (SPA 模式，含 splash 修复)

部署到服务器：
  build/server/  →  /root/cs2-inventory-simulator/build/server/
  server.prod.mjs  →  /root/cs2-inventory-simulator/server.prod.mjs
  .env  →  /root/cs2-inventory-simulator/.env
  pm2 restart cs2-inventory

不需要部署到服务器：
  build/client/     ← 只给 Electron 本地 HTTP 服务器用
  electron/         ← 只给 Electron 用
  dist-electron/    ← 只给 Electron 用
```
