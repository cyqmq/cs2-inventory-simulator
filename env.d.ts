/// <reference types="vite/client" />
/// <reference types="@react-router/node" />

declare const __SPLASH_SCRIPT__: string;
declare const __TRANSLATION_CHECKSUM__: string;
declare const __SOURCE_COMMIT__: string | undefined;

interface ElectronAPI {
  getApiBaseUrl: () => Promise<string>;
  steamLogin: () => Promise<void>;
  onSteamLoginResult: (callback: (session: string) => void) => void;
}

interface Window {
  electronAPI?: ElectronAPI;
}
