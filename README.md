# CS2 Inventory Simulator

A Counter-Strike 2 **Inventory Simulator** for the web and desktop, built with TypeScript and React Router (Remix).

<img src="https://raw.githubusercontent.com/ianlucas/cs2-inventory-simulator/main/screenshot1.png" alt="Inventory Simulator homepage" title="CS2 Inventory Simulator" />

<img src="https://raw.githubusercontent.com/ianlucas/cs2-inventory-simulator/main/screenshot3.png" alt="Inventory Simulator applying sticker" title="CS2 Inventory Simulator" />

<img src="https://raw.githubusercontent.com/ianlucas/cs2-inventory-simulator/main/screenshot2.png" alt="Inventory Simulator case opening" title="CS2 Inventory Simulator" />

## Features

- **Authentication is optional:** most features work without authentication.
- **Steam authentication:** enables Steam players to sync their inventories.
- **Craft Items:** add items to your inventory, including Weapons, Knives, Gloves, Stickers, Agents, Patches, Music Kits, Graffiti, Collectibles, Cases, Keys, and Tools.
- **Equip Items:** equip items as you would do in-game.
- **Case Opening:** unlock cases by using Cases and their Keys.
- **Item Renaming:** use the Name Tag tool to rename items.
- **Apply/Scrape Stickers:** apply and scrape Stickers items.
- **Apply/Remove Patches:** apply and remove Patches on agents.
- **Storage Units:** organize and store items in Storage Units.
- **API for developers:** fetch a user inventory and equipped items by using HTTP endpoints.
- **Desktop App:** run as a native desktop application via Electron (Windows, macOS, Linux).
- **Partial support for mobile devices**

## Desktop App (Electron)

This project includes a desktop build powered by **Electron**, wrapping the Remix application as a native desktop app.

### Prerequisites

- Node.js >= 24.0.0
- PostgreSQL database
- Steam API key (optional, for inventory sync)

### Quick Start

```bash
# 1. Configure environment variables
cp .env.example .env
# Edit .env: set DATABASE_URL, SESSION_SECRET, and optionally STEAM_API_KEY

# 2. Install dependencies
npm install

# 3. Initialize database
npx prisma migrate deploy

# 4. Build the application
npm run build

# 5. Start the desktop app
npm run electron:start
```

### Development Mode (with HMR)

```bash
npm run electron:dev
```

This starts the Vite dev server on port 3000 and opens an Electron window connected to it.

### Package for Distribution

```bash
npm run electron:package
```

Builds a distributable installer:
- **Windows**: NSIS installer (`dist-electron/CS2 Inventory Simulator-Setup-x.x.x.exe`)
- **macOS**: DMG image
- **Linux**: AppImage and deb

### Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run electron:dev` | Development mode with HMR |
| `npm run electron:start` | Production mode (requires `npm run build` first) |
| `npm run electron:package` | Build and package for distribution |
| `npm run electron:build-types` | Compile Electron TypeScript files only |

### Architecture

The desktop app embeds a local Express server that uses the Remix build output:

```
Electron Main Process
  ├── Express Server (localhost:3456)
  │   ├── Static files (build/client, public/)
  │   └── Remix request handler (SSR + API)
  ├── Window Management
  ├── Application Menu
  └── IPC Bridge
Electron Renderer Process
  └── Loads http://localhost:3456
```

Steam OAuth works seamlessly: the Electron window directly navigates to Steam's login page and handles the callback locally.

## CS2 Server Plugin (CounterStrikeSharp)

To use your Inventory Simulator skins in-game on a CS2 server, **the server must have the [cs2-css-inventory-simulator](https://github.com/ianlucas/cs2-css-inventory-simulator) plugin installed**. This is a [CounterStrikeSharp](https://github.com/roflmuffin/CounterStrikeSharp) plugin that bridges your inventory to the game.

### Features

- **Weapon skins, knives, gloves, and agents** from your inventory appear in-game.
- **StatTrak** tracks kills and updates counters automatically.
- **Graffiti sprays** using your equipped spray (`!spray`).
- **Custom weapon names** displayed in-game.
- **WebSocket live sync** — changes apply without restart.

### Installation

1. Install [CounterStrikeSharp](https://github.com/roflmuffin/CounterStrikeSharp) on your CS2 server (requires Runtime Identifier `linux-x64`).
2. Download the latest `InventorySimulator` release from [cs2-css-inventory-simulator/releases](https://github.com/ianlucas/cs2-css-inventory-simulator/releases).
3. Extract the plugin into:  
   `game/csgo/addons/counterstrikesharp/plugins/InventorySimulator/`
4. Configure the plugin at:  
   `game/csgo/addons/counterstrikesharp/configs/plugins/InventorySimulator/InventorySimulator.json`

### Configuration

```json
{
  "invsim_url": "https://your-instance.com",
  "invsim_apikey": "your-api-key",
  "invsim_ws_enabled": true,
  "invsim_ws_immediately": true,
  "invsim_stattrak_ignore_bots": true,
  "invsim_spray_enabled": true
}
```

| Setting | Default | Description |
|---------|---------|-------------|
| `invsim_url` | `https://inventory.cstrike.app` | Your Inventory Simulator URL |
| `invsim_apikey` | `""` | API key for authentication |
| `invsim_ws_enabled` | `false` | Allow `!ws` command to refresh inventory |
| `invsim_ws_immediately` | `false` | Apply skins instantly (no respawn) |
| `invsim_stattrak_ignore_bots` | `true` | Ignore bot kills for StatTrak |
| `invsim_spray_enabled` | `true` | Enable `!spray` graffiti command |

### Player Commands

| Command | Description |
|---------|-------------|
| `!ws` | Refresh and apply your inventory skins |
| `!spray` | Use your equipped graffiti spray |

> **Desktop app users**: If self-hosting with the desktop app, set `invsim_url` to `http://localhost:3456` and generate an API key in the application settings under API Credentials.

## Bugs and Feature Requests

Please be sure to add the following prefixes in the title when opening an issue:

- [BUG] for issues you have found within the core functionality.
- [REQ] for requesting a feature not currently implemented.
- [REQ/RULE] for requesting [a rule](https://github.com/ianlucas/cs2-inventory-simulator/blob/main/docs/rules.md) to be implemented.
- For questions or help, please use the [Discussions tab](https://github.com/ianlucas/cs2-inventory-simulator/discussions).

## Documentation

The documentation is divided into several sections:

- [Self-hosting](https://github.com/ianlucas/cs2-inventory-simulator/blob/main/docs/self-hosting.md)
- [Rules](https://github.com/ianlucas/cs2-inventory-simulator/blob/main/docs/rules.md)
- [API for Developers](https://github.com/ianlucas/cs2-inventory-simulator/blob/main/docs/api.md)
