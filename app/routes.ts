import { type RouteConfig } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";
import fs from "fs";

const isElectronBuild = ["electron"].includes(process.env.BUILD_MODE ?? "") || fs.existsSync(".electron-build");

const serverRoutePatterns = [
  "api.",
  "healthz.",
  "translations.",
  "app.",
  "index[.]html.",
  "sign-in.steam.callback."
];

function isServerRoute(route: RouteConfig): boolean {
  const path =
    typeof route.path === "string"
      ? route.path
      : typeof route.segment === "string"
        ? route.segment
        : "";
  return serverRoutePatterns.some((pattern) => path.startsWith(pattern));
}

export default async function () {
  const routes = await flatRoutes();
  if (isElectronBuild) {
    return routes.filter((route) => !isServerRoute(route));
  }
  return routes;
}
