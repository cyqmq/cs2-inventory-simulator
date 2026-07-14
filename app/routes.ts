import { type RouteConfig } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";
import fs from "fs";

const isElectronBuild = ["electron"].includes(process.env.BUILD_MODE ?? "") || fs.existsSync(".electron-build");

const serverRoutePatterns = [
  "api.",
  "healthz.",
  "translations.",
  "app.",
  "app[",
  "index[.]html.",
  "sign-in.steam.callback."
];

function isServerRoute(route: RouteConfig): boolean {
  const file = (route.file ?? "").replace(/^routes\//, "");
  return serverRoutePatterns.some((pattern) => file.startsWith(pattern));
}

const routes = await flatRoutes();
export default isElectronBuild ? routes.filter((route) => !isServerRoute(route)) : routes;
