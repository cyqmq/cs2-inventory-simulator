import { contextBridge, ipcRenderer } from "electron";

async function init() {
  try {
    const apiBaseUrl = await ipcRenderer.invoke("get-api-base-url");
    const configPath = await ipcRenderer.invoke("get-config-path");
    console.log("[CS2] Config path:", configPath);
    console.log("[CS2] API base URL:", apiBaseUrl);
  } catch (e) {
    console.error("[CS2] Init error:", e);
  }
}

init();

contextBridge.exposeInMainWorld("electronAPI", {
  getApiBaseUrl: () => ipcRenderer.invoke("get-api-base-url"),
  setApiBaseUrl: (url: string) => ipcRenderer.invoke("set-api-base-url", url),
  getConfigPath: () => ipcRenderer.invoke("get-config-path"),
  steamLogin: () => ipcRenderer.invoke("steam-login"),
  onSteamLoginResult: (callback: (session: string) => void) => {
    ipcRenderer.on("steam-login-result", (_event, session) => callback(session));
  }
});
