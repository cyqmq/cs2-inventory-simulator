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

## 构建部署

```
本地构建：
  npm run build:client  →  build/client/  (给 Electron)
  npm run build:server  →  build/server/  (给服务器)

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
