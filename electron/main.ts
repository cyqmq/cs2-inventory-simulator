/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { app, BrowserWindow, Menu, dialog, ipcMain, shell } from "electron";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRemixServer } from "./server";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");
const projectRoot = resolve(__dirname, "..");

const DEV_SERVER_URL = "http://localhost:3000";
const PROD_PORT = 3456;
const isDev = process.env.NODE_ENV === "development" || process.argv.includes("--dev");

let mainWindow: BrowserWindow | null = null;
let server: Awaited<ReturnType<typeof createRemixServer>> | null = null;

function getAppVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(resolve(projectRoot, "package.json"), "utf-8")
    );
    return pkg.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

async function startServer(): Promise<string> {
  if (isDev) {
    console.log(`[electron] Dev mode → ${DEV_SERVER_URL}`);
    return DEV_SERVER_URL;
  }
  server = await createRemixServer({ port: PROD_PORT });
  return `http://localhost:${server.port}`;
}

function buildMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "File",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "close" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "GitHub Repository",
          click: () => shell.openExternal("https://github.com/ianlucas/cs2-inventory-simulator"),
        },
      ],
    },
  ];

  if (isDev) {
    template.splice(2, 0, {
      label: "Developer",
      submenu: [
        { role: "toggleDevTools" },
      ],
    });
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function setupIPC() {
  ipcMain.handle("get-app-version", () => getAppVersion());
  ipcMain.on("open-external", (_event, url: string) => {
    shell.openExternal(url);
  });
}

function createWindow(url: string) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: "CS2 Inventory Simulator",
    icon: resolve(projectRoot, "public/favicon.ico"),
    webPreferences: {
      preload: resolve(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    backgroundColor: "#292524",
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.loadURL(url);

  const steamDomains = [
    "steamcommunity.com",
    "steampowered.com",
    "steamcdn-a.akamaihd.net",
  ];

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const isSteam = steamDomains.some((d) => url.includes(d));
    if (isSteam) {
      return { action: "allow" };
    }
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    const isSteam = steamDomains.some((d) => url.includes(d));
    const isLocalhost = url.includes("localhost");
    if (!isSteam && !isLocalhost) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

function showStartupError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[electron] Failed to start:", message);

  const hint = (() => {
    if (message.includes("DATABASE_URL") || message.includes("SESSION_SECRET")) {
      return (
        "Missing environment variables.\n\n" +
        "Please create a .env file in the project root with:\n" +
        "  DATABASE_URL=\"postgres://user:password@host:5432/dbname\"\n" +
        "  SESSION_SECRET=\"your-secret-key\"\n\n" +
        "See .env.example for reference."
      );
    }
    if (message.includes("Build not found")) {
      return (
        "Application build not found.\n\n" +
        "Please run: npm run build"
      );
    }
    if (message.includes("connect ECONNREFUSED") || message.includes("Prisma")) {
      return (
        "Database connection failed.\n\n" +
        "Please ensure PostgreSQL is running and accessible via the DATABASE_URL in your .env file.\n" +
        "Then run: npx prisma migrate deploy"
      );
    }
    return message;
  })();

  dialog.showErrorBox(
    "CS2 Inventory Simulator - Startup Error",
    hint
  );
}

app.whenReady().then(async () => {
  setupIPC();
  buildMenu();
  try {
    const url = await startServer();
    createWindow(url);
  } catch (error) {
    showStartupError(error);
    app.quit();
  }
});

app.on("window-all-closed", async () => {
  if (server) {
    server.server.close();
    server = null;
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", async () => {
  if (mainWindow === null) {
    try {
      const url = await startServer();
      createWindow(url);
    } catch (error) {
      showStartupError(error);
    }
  }
});

app.on("before-quit", async () => {
  if (server) {
    server.server.close();
    server = null;
  }
});
