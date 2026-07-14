/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createRequestHandler } from "@react-router/express";
import compression from "compression";
import express from "express";
import { createServer } from "http";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");
const projectRoot = resolve(__dirname, "..");

export interface ServerOptions {
  port: number;
  host?: string;
}

function loadEnvFile() {
  const envPath = resolve(projectRoot, ".env");
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      const clean = value.replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = clean;
      }
    }
  }
}

function checkRequiredEnv() {
  const required = ["DATABASE_URL", "SESSION_SECRET"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(
      `[electron] Missing required environment variables: ${missing.join(", ")}`
    );
    console.error(
      "[electron] Please create a .env file in the project root. See .env.example for reference."
    );
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}

export async function createRemixServer(options: ServerOptions) {
  const { port, host } = options;

  loadEnvFile();
  checkRequiredEnv();

  const buildPath = resolve(projectRoot, "build/server/index.js");
  const publicPath = resolve(projectRoot, "build/client");

  if (!existsSync(buildPath)) {
    throw new Error(
      "Build not found. Please run `npm run build` before starting the Electron app."
    );
  }

  const buildModule = await import(
    `file://${buildPath.replace(/\\/g, "/")}`
  );

  const app = express();
  app.disable("x-powered-by");
  app.use(compression());

  app.use(
    "/assets",
    express.static(resolve(publicPath, "assets"), {
      immutable: true,
      maxAge: "1y",
    })
  );
  app.use(express.static(publicPath));
  app.use(express.static(resolve(projectRoot, "public"), { maxAge: "1h" }));

  app.all(
    "*",
    createRequestHandler({
      build: buildModule,
      mode: process.env.NODE_ENV || "production",
    })
  );

  const httpServer = createServer(app);

  return new Promise<{ port: number; server: typeof httpServer }>(
    (resolve, reject) => {
      const onListen = () => {
        const addr = httpServer.address();
        const actualPort =
          typeof addr === "object" && addr ? addr.port : port;
        console.log(
          `[electron] Remix server listening on http://localhost:${actualPort}`
        );
        resolve({ port: actualPort, server: httpServer });
      };
      httpServer.once("error", reject);
      if (host !== undefined) {
        httpServer.listen(port, host, onListen);
      } else {
        httpServer.listen(port, onListen);
      }
    }
  );
}
