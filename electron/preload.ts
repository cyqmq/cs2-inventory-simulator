import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  getApiBaseUrl: () => ipcRenderer.invoke("get-api-base-url"),
  setApiBaseUrl: (url: string) => ipcRenderer.invoke("set-api-base-url", url),
  getConfigPath: () => ipcRenderer.invoke("get-config-path"),
  steamLogin: () => ipcRenderer.invoke("steam-login"),
  onSteamLoginResult: (callback: (session: string) => void) => {
    ipcRenderer.on("steam-login-result", (_event, session) => callback(session));
  }
});
