import { execSync } from "child_process";
import { existsSync, unlinkSync, writeFileSync } from "fs";
import { resolve } from "path";

const markerFile = resolve(import.meta.dirname, "..", ".electron-build");
const commands = [
  `react-router build`,
  `esbuild electron/main.ts --bundle --platform=node --outfile=dist-electron/main.js --external:electron`,
  `esbuild electron/preload.ts --bundle --platform=node --outfile=dist-electron/preload.js --external:electron`
];

try {
  writeFileSync(markerFile, "");
  for (const cmd of commands) {
    console.log(`> ${cmd}`);
    execSync(cmd, { cwd: resolve(import.meta.dirname, ".."), stdio: "inherit" });
  }
} finally {
  if (existsSync(markerFile)) {
    unlinkSync(markerFile);
  }
}
