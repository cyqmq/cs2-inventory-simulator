# CS2 Inventory Simulator

<p>
  <a href="https://github.com/cyqmq/cs2-inventory-simulator/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="许可证"></a>
  <a href="https://github.com/cyqmq/cs2-inventory-simulator"><img src="https://img.shields.io/badge/node-%3E%3D24.0.0-brightgreen" alt="Node 版本"></a>
  <a href="https://github.com/cyqmq/cs2-inventory-simulator"><img src="https://img.shields.io/badge/electron-latest-9cf" alt="Electron"></a>
</p>

基于 [inventory.cstrike.app](https://inventory.cstrike.app/) 改造的 **CS2 库存模拟器桌面客户端**，前后端分离架构。

<div align="center">
  <img src="https://github.com/cyqmq/cs2-inventory-simulator/raw/master/screenshot1.png" alt="库存模拟器首页" width="30%" />
  <img src="https://github.com/cyqmq/cs2-inventory-simulator/raw/master/screenshot3.png" alt="应用贴纸" width="30%" />
  <img src="https://github.com/cyqmq/cs2-inventory-simulator/raw/master/screenshot2.png" alt="开箱" width="30%" />
</div>

## 架构

```
┌─── 桌面端（Electron） ─────────────────────────────────────────────┐
│                                                                     │
│  本地 HTTP 服务器加载 SPA                                            │
│  Steam 登录：主窗口跳转 → 验证 → 回调                                  │
│  所有 API 请求指向远程服务器                                           │
└─────────────────────────────────────────────────────────────────────┘
                              ↕ API JSON
┌─── 服务器（纯 API）──────────────────────────────────────────────────┐
│                                                                     │
│  纯 API 服务器，不返回任何 HTML/网页                                  │
│  非 /api/* 路径一律返回 404                                          │
│  PostgreSQL + Prisma + PM2 + Cloudflare Tunnel                      │
└─────────────────────────────────────────────────────────────────────┘
```

**关键原则：**
- 服务器和 Steam 之间**零直接通信**，所有 Steam 请求由桌面端发起，绕过 GFW
- 没有浏览器 web 版，只有 Electron 桌面客户端
- `build/client/` 只存在于 Electron 本地，不部署到服务器

## 功能

- **Steam 登录**：通过 OpenID 2.0 认证，同窗口跳转登录
- **饰品编辑**：支持武器、刀、手套、贴纸、探员、印花、音乐盒、涂鸦、收藏品、箱子、钥匙、工具
- **装备系统**：像游戏中一样自由装备物品
- **开箱模拟**：使用钥匙开启箱子，含转盘动画
- **物品重命名**：使用命名标签自定义物品名称
- **贴纸系统**：应用/刮除贴纸，支持旋转和偏移
- **印花系统**：应用/移除探员印花
- **收纳盒**：整理和分类存放物品
- **StatTrak 计数器交换**：在两个武器之间交换计数数据
- **检视装备**：3D 预览检视链接
- **开发者接口**：HTTP API 获取用户库存和装备
- **25+ 语言支持**
- **桌面客户端**：原生窗口，无浏览器限制

## 快速开始

### 环境要求

- Node.js >= 24.0.0
- PostgreSQL
- npm

### 安装

```bash
git clone https://github.com/cyqmq/cs2-inventory-simulator.git
cd cs2-inventory-simulator
npm install --legacy-peer-deps
```

### 配置

复制 `.env.example` 为 `.env`，填写配置：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/cs2_inventory"
SESSION_SECRET="your-secret-key"
STEAM_API_KEY="your-steam-api-key"
PORT=4445
```

### 数据库

```bash
npx prisma migrate dev
```

### 开发模式运行

```bash
# 终端 1：启动后端 API
npm run dev

# 终端 2：启动桌面客户端
npm run dev:electron
```

### 构建

```bash
# 构建桌面客户端（SPA + Electron）
npm run build:electron

# 打包为安装程序
npx electron-builder
```

## 登录流程

桌面端使用 **OpenID 2.0** 通过 Steam 登录，全程无需服务器参与 Steam 通信：

1. 用户点击 Sign In → 主窗口跳转到 `https://steamcommunity.com/openid/login`
2. Steam 回调到 `http://127.0.0.1:{port}/steam-callback?openid.*`
3. 桌面端直接 POST 到 Steam 验证 OpenID
4. 桌面端直接 GET Steam API 拿用户名、头像
5. 桌面端调用服务器 `POST /api/auth/electron` 创建 session
6. 跳回 App，携带 cookie 请求 `/api/init`，渲染用户数据

> 首次登录后 Steam 会话持久化在 Electron 中，下次登录无需重新输入密码。

## 部署

### 后端部署（纯 API 服务器）

```bash
# 在服务器上
git clone https://github.com/cyqmq/cs2-inventory-simulator.git
cd cs2-inventory-simulator
npm install --legacy-peer-deps

# 配置环境变量
cp .env.example .env
# 编辑 .env 填写数据库连接、Steam API Key 等

# 初始化数据库
npx prisma migrate dev

# 构建
npm run build

# 使用 PM2 启动
npm install -g pm2
pm2 start server.prod.mjs --name cs2-inventory
```

**注意：** 服务器是纯 API 服务器，`build/client/` 无需部署到服务器。

### 桌面客户端打包

```bash
npm run build:electron
npx electron-builder
```

安装包生成在 `release/` 目录，用户直接安装即可运行。

## 项目结构

```
cs2-inventory-simulator/
├── app/                    # React 前端代码 + API 路由
│   ├── components/         # UI 组件
│   ├── routes/             # 路由页面 + API 端点
│   │   ├── api.*.tsx       # API 路由（服务端 loader/action）
│   │   └── *.tsx           # 页面路由（客户端 SPA）
│   ├── utils/              # 工具函数
│   ├── translations/       # 多语言翻译 (25+)
│   ├── models/             # 数据库模型
│   ├── api-client.ts       # API 客户端（桌面模式使用）
│   ├── root.tsx            # 根布局
│   └── entry.client.tsx    # 客户端入口
├── electron/               # Electron 主进程
│   ├── main.ts             # 本地 HTTP 服务器 + Steam 登录
│   └── preload.ts          # 预加载脚本
├── build/
│   ├── client/             # SPA 静态文件（仅 Electron 使用）
│   └── server/             # API handler（仅服务器使用）
├── prisma/                 # 数据库模型 + 迁移文件
├── server.prod.mjs         # 生产服务器入口
├── dist-electron/          # Electron 编译产物
├── scripts/                # 构建脚本
└── ARCHITECTURE.md         # 架构详细说明
```

## API 端点

| 路径 | 方法 | 说明 |
|------|------|------|
| `/api/init` | GET | 客户端初始化数据（规则、偏好、用户信息） |
| `/api/auth/electron` | GET | 桌面端 Steam 登录写 session |
| `/api/auth/electron-config` | GET | 返回 steamApiKey（需 secret 参数） |
| `/api/action/sync` | POST | 同步库存操作 |
| `/api/action/resync` | GET | 重新同步库存 |
| `/api/action/unlock-case` | POST | 开箱 |
| `/api/action/reset-inventory` | GET | 重置库存 |
| `/api/action/preferences` | POST | 更新偏好设置 |
| `/api/action/import-inspect-link` | POST | 导入检视链接 |
| `/api/inventory/:userId.json` | GET | 获取用户库存 JSON |
| `/api/equipped/v5/:userId.json` | GET | 获取装备 JSON |
| `/api/add-item` | POST | 通过 API Key 认证添加物品 |
| `/api/sign-in` | POST | 通过 API Key 登录 |

## 常见问题

### 桌面窗口显示空白

请确保后端 API 服务已启动，且 `.env` 中 `DATABASE_URL` 配置正确。可在设置页面修改后端服务器地址。

### Steam 登录失败

桌面端需要直接访问 `steamcommunity.com`。如果网络受限，需要自行配置 VPN 或代理。

### npm install 失败

可尝试使用国内镜像源：

```bash
npm install --legacy-peer-deps --registry=https://registry.npmmirror.com
```

### 如何更新桌面客户端？

```bash
npm run build:electron
npx electron-builder
```

## 许可证

MIT

## 从原项目迁移

该项目基于 [ianlucas/cs2-inventory-simulator](https://github.com/ianlucas/cs2-inventory-simulator) 改造，主要变化：

1. **前后端分离**：前端拆分为 Electron 桌面客户端，后端作为纯 API 服务
2. **纯 API 服务器**：服务器不返回 HTML，非 API 路径返回 404
3. **桌面端 Steam 登录**：桌面端直连 Steam 验证 OpenID，绕过 GFW
4. **同窗口跳转登录**：主窗口直接跳转 Steam，无需弹出子窗口
