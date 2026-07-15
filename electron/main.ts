import { app, BrowserWindow, ipcMain } from "electron";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isDev = process.env.NODE_ENV === "development" || (process.env.NODE_ENV !== "production" && !app.isPackaged);
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";

const DEFAULT_API_BASE_URL = "https://ccs.8385838.xyz";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml"
};

const ELECTRON_AUTH_SECRET = process.env.ELECTRON_AUTH_SECRET || "68UzqY7cLs2vD9VodiwfxJWjuQEmhrRX";
const STEAM_OPENID_SERVER = "https://steamcommunity.com/openid/login";
const STEAM_ID_REGEX = /^https:\/\/steamcommunity\.com\/openid\/id\/(76561[0-9]{12})\/?$/;

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

let localServerPort: number | null = null;

let callbackParams: Record<string, string> | null = null;

function startLocalServer(clientDir: string): Promise<number> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = (req.url || "").split("?")[0];
      if (urlPath === "/steam-callback") {
        const query = new URL(req.url || "", "http://localhost").searchParams;
        callbackParams = {};
        for (const [k, v] of query.entries()) {
          if (k.startsWith("openid.")) callbackParams[k] = v;
        }
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<html><body style='background:#1c1c1c;color:#f5f5f5;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0'><div>Verifying Steam login...</div></body></html>");
        return;
      }
      const filePath = path.join(clientDir, urlPath === "/" ? "index.html" : urlPath);
      const ext = path.extname(filePath);
      const mime = MIME_TYPES[ext] || "application/octet-stream";
      const headers: Record<string, string> = {
        "Content-Type": mime,
        "Cache-Control": "no-store"
      };
      fs.readFile(filePath, (err, data) => {
        if (err) {
          fs.readFile(path.join(clientDir, "index.html"), (err2, data2) => {
            if (err2) {
              res.writeHead(404, headers);
              res.end("Not found");
              return;
            }
            headers["Content-Type"] = "text/html";
            res.writeHead(200, headers);
            res.end(data2);
          });
          return;
        }
        res.writeHead(200, headers);
        res.end(data);
      });
    });
    server.listen(0, "127.0.0.1", () => {
      localServerPort = (server.address() as import("net").AddressInfo).port;
      resolve(localServerPort);
    });
  });
}

async function verifySteamLogin(
  params: Record<string, string>,
  returnUrl: string
): Promise<string> {
  if (params["openid.mode"] !== "id_res") throw new Error("Invalid openid.mode");
  if (params["openid.ns"] !== "http://specs.openid.net/auth/2.0") throw new Error("Invalid openid.ns");
  if (!params["openid.return_to"]?.startsWith(returnUrl)) throw new Error("Invalid openid.return_to");
  if (params["openid.op_endpoint"] !== STEAM_OPENID_SERVER) throw new Error("Invalid openid.op_endpoint");

  const nonceMatch = params["openid.response_nonce"]?.match(/^([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z)/);
  if (!nonceMatch) throw new Error("Invalid response_nonce");
  if (Math.abs(Date.now() - new Date(nonceMatch[1]).getTime()) > 300_000) throw new Error("Nonce too old");

  const match = params["openid.identity"]?.match(STEAM_ID_REGEX);
  if (!match) throw new Error("Invalid identity - no SteamID");
  const steamId = match[1];

  const body = new URLSearchParams(params);
  body.set("openid.mode", "check_authentication");

  const response = await fetch(STEAM_OPENID_SERVER, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  if (!response.ok) throw new Error(`Steam verification HTTP ${response.status}`);
  const text = await response.text();
  const kv: Record<string, string> = {};
  for (const line of text.trim().split("\n")) {
    const idx = line.indexOf(":");
    if (idx !== -1) kv[line.slice(0, idx)] = line.slice(idx + 1);
  }
  if (kv["is_valid"] !== "true" || kv["ns"] !== "http://specs.openid.net/auth/2.0") {
    throw new Error("Steam rejected verification");
  }
  return steamId;
}

let mainWindow: BrowserWindow | null = null;
let isSteamLogin = false;
let steamLoginResolve: (() => void) | null = null;
let steamLoginReject: ((err: Error) => void) | null = null;

async function handleSteamCallback(url: string) {
  if (!isSteamLogin || !mainWindow) return;
  const apiBaseUrl = getApiBaseUrl();
  const port = localServerPort || 13579;
  const returnUrl = `http://127.0.0.1:${port}/steam-callback`;
  if (!url.startsWith(returnUrl)) return;

  try {
    const params = callbackParams || {};
    callbackParams = null;

    const steamId = await verifySteamLogin(params, returnUrl);

    let nickname = "Player";
    let avatarUrl = "";
    try {
      const apiKeyResp = await fetch(
        `${apiBaseUrl}/api/auth/electron-config?secret=${encodeURIComponent(ELECTRON_AUTH_SECRET)}`,
        { method: "GET", signal: AbortSignal.timeout(5000) }
      );
      if (apiKeyResp.ok) {
        const { steamApiKey } = await apiKeyResp.json() as { steamApiKey?: string };
        if (steamApiKey) {
          const summaryResp = await fetch(
            `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${steamApiKey}&steamids=${steamId}`,
            { signal: AbortSignal.timeout(5000) }
          );
          if (summaryResp.ok) {
            const data = await summaryResp.json() as { response?: { players?: Array<{ personaname: string; avatarfull: string }> } };
            const player = data?.response?.players?.[0];
            if (player) {
              nickname = player.personaname;
              avatarUrl = player.avatarfull;
            }
          }
        }
      }
    } catch { /* non-critical, use defaults */ }

    const sessionResp = await fetch(
      `${apiBaseUrl}/api/auth/electron?steamId=${encodeURIComponent(steamId)}&secret=${encodeURIComponent(ELECTRON_AUTH_SECRET)}&nickname=${encodeURIComponent(nickname)}&avatar=${encodeURIComponent(avatarUrl)}`,
      { method: "GET", signal: AbortSignal.timeout(10000) }
    );
    if (!sessionResp.ok) {
      throw new Error(`Session creation failed: ${sessionResp.status}`);
    }
    const { sessionCookie } = await sessionResp.json() as { sessionCookie: string };

    await mainWindow.webContents.session.cookies.set({
      url: apiBaseUrl,
      name: "_session",
      value: sessionCookie,
      path: "/",
      secure: apiBaseUrl.startsWith("https"),
      httpOnly: true,
      sameSite: "lax"
    });

    isSteamLogin = false;
    mainWindow.loadURL(`http://127.0.0.1:${port}/`);
    steamLoginResolve?.();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    isSteamLogin = false;
    mainWindow.loadURL(`http://127.0.0.1:${port}/`);
    steamLoginReject?.(new Error(msg));
  } finally {
    steamLoginResolve = null;
    steamLoginReject = null;
  }
}

async function createWindow() {
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
      sandbox: false,
      webSecurity: false
    },
    icon: isDev
      ? undefined
      : path.join(__dirname, "..", "build", "client", "favicon.ico")
  });

  try {
    await mainWindow.webContents.session.clearServiceWorkers();
  } catch { /* ignore */ }

  mainWindow.webContents.on("did-navigate", (_event, url) => {
    handleSteamCallback(url);
  });

  if (isDev) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    const port = await startLocalServer(path.join(__dirname, "..", "build", "client"));
    mainWindow.loadURL(`http://127.0.0.1:${port}`);
    mainWindow.webContents.openDevTools();
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

ipcMain.handle("steam-login", async () => {
  if (!mainWindow) throw new Error("No main window");
  const port = localServerPort || 13579;
  const returnUrl = `http://127.0.0.1:${port}/steam-callback`;

  isSteamLogin = true;

  return new Promise<void>((resolve, reject) => {
    steamLoginResolve = resolve;
    steamLoginReject = reject;

    const steamUrl = new URL(STEAM_OPENID_SERVER);
    steamUrl.searchParams.set("openid.ns", "http://specs.openid.net/auth/2.0");
    steamUrl.searchParams.set("openid.mode", "checkid_setup");
    steamUrl.searchParams.set("openid.return_to", returnUrl);
    steamUrl.searchParams.set("openid.identity", "http://specs.openid.net/auth/2.0/identifier_select");
    steamUrl.searchParams.set("openid.claimed_id", "http://specs.openid.net/auth/2.0/identifier_select");
    mainWindow.loadURL(steamUrl.toString());

    setTimeout(() => {
      if (isSteamLogin) {
        isSteamLogin = false;
        reject(new Error("Steam login timeout"));
      }
    }, 300_000);
  });
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
