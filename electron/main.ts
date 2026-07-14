import { app, BrowserWindow, ipcMain } from "electron";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";

const DEFAULT_API_BASE_URL = "http://localhost:3000";

function getConfigPath() {
  return path.join(app.getPath("userData"), "config.json");
}

function readConfig(): Record<string, string> {
  const configPath = getConfigPath();
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch {
    return {};
  }
}

function writeConfig(config: Record<string, string>) {
  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2));
}

function getApiBaseUrl(): string {
  const config = readConfig();
  return config.apiBaseUrl || process.env.API_BASE_URL || DEFAULT_API_BASE_URL;
}

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: "CS2 Inventory Simulator",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    icon: isDev
      ? undefined
      : path.join(__dirname, "..", "build", "client", "favicon.ico")
  });

  if (isDev) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(
      path.join(__dirname, "..", "build", "client", "index.html")
    );
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

ipcMain.handle("get-api-base-url", () => {
  return getApiBaseUrl();
});

ipcMain.handle("set-api-base-url", (_event, url: string) => {
  const config = readConfig();
  config.apiBaseUrl = url;
  writeConfig(config);
  return true;
});

ipcMain.handle("get-config-path", () => {
  return getConfigPath();
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
