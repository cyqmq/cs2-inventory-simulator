import type { Config } from "@react-router/dev/config";
import fs from "fs";

const isElectronBuild = ["electron"].includes(process.env.BUILD_MODE ?? "") || fs.existsSync(".electron-build");

export default {
  ssr: !isElectronBuild
} satisfies Config;
