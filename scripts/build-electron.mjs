import * as esbuild from "esbuild";
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const electronDir = resolve(root, "electron");

async function build() {
  const entries = ["main.ts", "preload.ts", "server.ts"];

  for (const entry of entries) {
    const outFile = resolve(electronDir, entry.replace(/\.ts$/, ".mjs"));

    console.log(`[build-electron] Building ${entry} → ${outFile}`);

    await esbuild.build({
      entryPoints: [resolve(electronDir, entry)],
      outfile: outFile,
      bundle: true,
      platform: "node",
      format: "esm",
      target: "node24",
      external: [
        "electron",
        "express",
        "compression",
        "morgan",
        "@react-router/express",
        "@react-router/node",
        "@remix-run/node-fetch-server",
        "source-map-support",
      ],
      sourcemap: false,
      minify: false,
    });
  }

  console.log("[build-electron] Done.");
}

build().catch((err) => {
  console.error("[build-electron] Build failed:", err);
  process.exit(1);
});
