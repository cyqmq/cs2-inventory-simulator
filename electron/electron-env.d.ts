/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

interface ElectronAPI {
  isElectron: boolean;
  platform: string;
  arch: string;
  versions: {
    node: string;
    electron: string;
    chrome: string;
  };
  openExternal: (url: string) => void;
  getAppVersion: () => Promise<string>;
}

interface Window {
  electronAPI?: ElectronAPI;
}
