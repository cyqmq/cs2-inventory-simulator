import { createRequestHandler } from "@react-router/express";
import compression from "compression";
import express from "express";
import morgan from "morgan";
import path from "node:path";
import url from "node:url";

process.env.NODE_ENV = process.env.NODE_ENV ?? "production";

const port = parseInt(process.env.PORT || "3000", 10);
const buildPath = path.resolve("build/server/index.js");
const buildModule = await import(url.pathToFileURL(buildPath).href);

const app = express();
app.disable("x-powered-by");
app.use(compression());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(morgan("tiny"));

app.use((req, res, next) => {
  if (req.path.startsWith("/api/") || req.path === "/healthz") {
    return next();
  }
  res.status(404).json({ error: "Not found" });
});

app.use(createRequestHandler({
  build: buildModule,
  mode: process.env.NODE_ENV
}));

const server = app.listen(port, () => {
  console.log(`[server.prod] http://localhost:${port}`);
});

["SIGTERM", "SIGINT"].forEach((signal) => {
  process.once(signal, () => server?.close(() => {}));
});
