import { badRequest } from "~/responses.server";
import type { Route } from "./+types/api.auth.electron-config._index";

const ELECTRON_SECRET = process.env.ELECTRON_AUTH_SECRET || "68UzqY7cLs2vD9VodiwfxJWjuQEmhrRX";

export async function loader({ request }: Route.LoaderArgs) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  if (!secret || secret !== ELECTRON_SECRET) throw badRequest;
  return Response.json({
    steamApiKey: process.env.STEAM_API_KEY || ""
  });
}
