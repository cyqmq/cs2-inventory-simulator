# CS2 Inventory Simulator

基于 [inventory.cstrike.app](https://inventory.cstrike.app/) 改造的 **CS2 库存模拟器**，支持 **Web 浏览器** 和 **Electron 桌面应用** 两种运行模式。

<img src="screenshot1.png" alt="库存模拟器首页" title="CS2 Inventory Simulator" />
<img src="screenshot3.png" alt="应用贴纸" title="CS2 Inventory Simulator" />
<img src="screenshot2.png" alt="开箱" title="CS2 Inventory Simulator" />

## 架构

前后端分离架构：

```
┌──────────────────────┐     HTTP/JSON     ┌──────────────────────┐
│  Electron 桌面客户端   │ ◄──────────────► │  Node.js 后端服务     │
│  React SPA + Electron │     credentials   │  React Router SSR    │
│                      │                   │  Prisma + PostgreSQL  │
│  3D Viewer / 开箱动画  │                   │  Steam OAuth          │
│  贴纸预览 / 库存编辑    │                   │  CSFloat 集成         │
└──────────────────────┘                   └──────────────────────┘
```

## 功能

- **Steam 登录**：支持 Steam OAuth 认证，同步库存
- **饰品编辑**：添加武器、刀、手套、贴纸、探员、印花、音乐盒、涂鸦、收藏品、箱子、钥匙、工具
- **装备系统**：像游戏中一样装备物品
- **开箱模拟**：使用钥匙开启箱子，炫酷转盘动画
- **物品重命名**：使用命名标签工具
- **贴纸系统**：应用/刮除贴纸，支持旋转和偏移
- **印花系统**：应用/移除探员印花
- **Storage Unit**：收纳盒整理物品
- **StatTrak 交换**：交换 StatTrak 计数器
- **检视装备**：3D 预览检视链接
- **开发者 API**：HTTP 接口获取用户库存和装备
- **25+ 语言支持**
- **桌面端（Electron）**：原生窗口，无浏览器限制

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
```

### 数据库

```bash
npx prisma migrate dev
```

### 运行

#### Web 模式（后端 SSR 服务）

```bash
npm run dev
# 访问 http://localhost:3000
```

#### Electron 桌面模式（需要先启动后端）

```bash
# 终端 1：启动后端服务
npm run dev

# 终端 2：启动 Electron 客户端
npm run dev:electron
```

### 构建

```bash
# 构建 Web 服务
npm run build

# 构建 Electron 桌面应用
npm run build:electron

# 打包为安装包
npx electron-builder
```

## 项目结构

```
cs2-inventory-simulator/
├── app/                    # React 前端代码
│   ├── components/         # UI 组件
│   │   └── hooks/          # 自定义 Hooks
│   ├── routes/             # 路由页面 + API 端点
│   ├── utils/              # 工具函数
│   ├── translations/       # 多语言翻译 (25+)
│   ├── data/               # 数据层
│   ├── models/             # 数据库模型
│   ├── api-client.ts       # API 客户端 (Electron 模式)
│   ├── root.tsx            # 根布局
│   └── entry.client.tsx    # 客户端入口
├── electron/               # Electron 主进程
│   ├── main.ts             # 主进程 (BrowserWindow, IPC)
│   └── preload.ts          # 预加载脚本
├── prisma/                 # Prisma schema + migrations
├── public/                 # 静态资源
├── scripts/                # 构建脚本
├── vite.config.ts          # Vite 配置
├── react-router.config.ts  # React Router 配置 (SSR/SPA 双模式)
└── electron-builder.yml    # Electron 打包配置
```

## 双构建模式

项目支持两种构建模式，通过 `.electron-build` 标记文件切换：

| 模式 | 触发条件 | 行为 |
|------|---------|------|
| **SSR (默认)** | 无 `.electron-build` | 服务端渲染 + API 路由 |
| **SPA (Electron)** | 存在 `.electron-build` | 纯客户端渲染，过滤服务端路由 |

构建脚本 `scripts/build-electron.mjs` 自动管理此标记。

## API 端点

| 路径 | 方法 | 说明 |
|------|------|------|
| `/api/init` | GET | 客户端初始化数据 (rules, preferences, user) |
| `/api/action/sync` | POST | 同步库存操作 |
| `/api/action/resync` | GET | 重新同步库存 |
| `/api/action/unlock-case` | POST | 开箱 |
| `/api/action/reset-inventory` | GET | 重置库存 |
| `/api/action/preferences` | POST | 更新偏好设置 |
| `/api/action/import-inspect-link` | POST | 导入检视链接 |
| `/api/inventory/:userId.json` | GET | 获取用户库存 JSON |
| `/api/equipped/v5/:userId.json` | GET | 获取装备 JSON (v5) |
| `/api/add-item` | POST | API Key 认证添加物品 |
| `/api/sign-in` | POST | API Key 登录 |

## 从原项目迁移

该项目基于 [ianlucas/cs2-inventory-simulator](https://github.com/ianlucas/cs2-inventory-simulator) 改造，主要变化：

1. **前后端分离**：前端为 Electron 桌面客户端，后端为独立 API 服务
2. **SPA 模式**：Electron 模式使用 React Router SPA，无需 SSR
3. **API 客户端**：新增 `api-client.ts` 统一管理 HTTP 请求
4. **Electron 集成**：原生桌面窗口，支持系统托盘、自动更新等

## License

MIT
