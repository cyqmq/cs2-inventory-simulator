# CS2 Inventory Simulator

<p>
  <a href="https://github.com/cyqmq/cs2-inventory-simulator/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="许可证"></a>
  <a href="https://github.com/cyqmq/cs2-inventory-simulator"><img src="https://img.shields.io/badge/node-%3E%3D24.0.0-brightgreen" alt="Node 版本"></a>
  <a href="https://github.com/cyqmq/cs2-inventory-simulator"><img src="https://img.shields.io/badge/electron-latest-9cf" alt="Electron"></a>
</p>

基于 [inventory.cstrike.app](https://inventory.cstrike.app/) 改造的 **CS2 库存模拟器**，支持**浏览器**和**桌面客户端**两种运行模式。

<div align="center">
  <img src="https://github.com/cyqmq/cs2-inventory-simulator/raw/master/screenshot1.png" alt="库存模拟器首页" width="30%" />
  <img src="https://github.com/cyqmq/cs2-inventory-simulator/raw/master/screenshot3.png" alt="应用贴纸" width="30%" />
  <img src="https://github.com/cyqmq/cs2-inventory-simulator/raw/master/screenshot2.png" alt="开箱" width="30%" />
</div>

## 架构

前后端分离架构：

```
┌──────────────────────┐     HTTP/JSON     ┌──────────────────────┐
│  桌面客户端（Electron） │ ◄──────────────► │  后端服务（Node.js）  │
│  React 单页应用       │     用户凭证      │  React Router 服务端  │
│                      │                   │  Prisma + PostgreSQL  │
│  3D 预览 / 开箱动画   │                   │  Steam 登录认证       │
│  贴纸预览 / 库存编辑   │                   │  CSFloat 集成         │
└──────────────────────┘                   └──────────────────────┘
```

## 功能

- **Steam 登录**：通过 Steam OAuth 认证，同步游戏库存
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
```

### 数据库

```bash
npx prisma migrate dev
```

### 运行

#### 浏览器模式（后端渲染服务）

```bash
npm run dev
# 访问 http://localhost:3000
```

#### 桌面模式（需先启动后端）

```bash
# 终端 1：启动后端服务
npm run dev

# 终端 2：启动桌面客户端
npm run dev:electron
```

### 构建

```bash
# 构建浏览器服务
npm run build

# 构建桌面客户端
npm run build:electron

# 打包为安装程序
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
│   ├── api-client.ts       # API 客户端（桌面模式使用）
│   ├── root.tsx            # 根布局
│   └── entry.client.tsx    # 客户端入口
├── electron/               # Electron 主进程
│   ├── main.ts             # 主进程（窗口管理、IPC 通信）
│   └── preload.ts          # 预加载脚本
├── prisma/                 # 数据库模型 + 迁移文件
├── public/                 # 静态资源
├── scripts/                # 构建脚本
├── vite.config.ts          # Vite 构建配置
├── react-router.config.ts  # React Router 配置（双模式构建）
└── electron-builder.yml    # 桌面客户端打包配置
```

## 双构建模式

项目支持两种构建模式，通过 `.electron-build` 标记文件切换：

| 模式 | 触发条件 | 行为 |
|------|---------|------|
| **服务端渲染（默认）** | 无 `.electron-build` | 完整服务端渲染 + API 路由 |
| **单页应用（桌面）** | 存在 `.electron-build` | 纯客户端渲染，排除服务端路由 |

构建脚本 `scripts/build-electron.mjs` 自动管理此标记。

## API 端点

| 路径 | 方法 | 说明 |
|------|------|------|
| `/api/init` | GET | 客户端初始化数据（规则、偏好、用户信息） |
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

## 从原项目迁移

该项目基于 [ianlucas/cs2-inventory-simulator](https://github.com/ianlucas/cs2-inventory-simulator) 改造，主要变化：

1. **前后端分离**：前端拆分为桌面客户端，后端作为独立 API 服务
2. **单页应用**：桌面模式使用 React Router 单页应用，无需服务端渲染
3. **API 客户端**：新增 `api-client.ts` 统一管理 HTTP 请求和凭证传递
4. **Electron 集成**：原生桌面窗口，支持系统托盘、文件访问等

## 部署方案

### 方案一：前后端分离部署

后端（API 服务）部署在服务器，桌面客户端分发给用户安装。

#### 后端部署

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

# 构建并启动服务
npm run build
npm start
```

推荐使用 PM2 或 Docker 管理后端进程。

#### 桌面客户端打包

```bash
# 在开发机上构建桌面客户端
npm run build:electron

# 打包为安装程序（生成 .exe / .dmg / .AppImage）
npx electron-builder
```

安装包生成在 `release/` 目录，用户直接安装即可运行，无需安装 Node.js 或 npm。

#### 配置服务器地址

桌面客户端首次启动后，进入**设置**页面，在"后端服务器地址"输入框中填写后端服务器的地址（如 `https://your-server.com`），点击保存即可。配置文件存储在：

- Windows：`%APPDATA%/CS2 Inventory Simulator/config.json`
- macOS：`~/Library/Application Support/CS2 Inventory Simulator/config.json`
- Linux：`~/.config/CS2 Inventory Simulator/config.json`

也可通过环境变量 `API_BASE_URL` 在启动时指定：

```bash
API_BASE_URL=https://your-server.com npx electron-builder
```

### 方案二：本地开发（前后端同机）

```bash
# 终端 1：启动后端
npm run dev

# 终端 2：启动桌面客户端
npm run dev:electron
```

桌面客户端默认连接 `http://localhost:3000`。

## 常见问题

### npm install 失败（网络或 TLS 错误）

如果在安装依赖时遇到 `ERR_TLS_CERT_ALTNAME_INVALID` 或 SSL 连接失败，可尝试使用国内镜像源：

```bash
npm install --legacy-peer-deps --registry=https://registry.npmmirror.com
```

### 桌面窗口显示空白

请确保后端服务已启动，且 `.env` 中 `DATABASE_URL` 配置正确。桌面客户端默认连接 `http://localhost:3000`。可在设置页面修改后端服务器地址。

### 如何更新桌面客户端？

重新执行 `npm run build:electron && npx electron-builder` 生成新版本安装包，分发给用户重新安装。

## 许可证

MIT
