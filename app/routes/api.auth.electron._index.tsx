import { middleware } from "~/middleware.server";
import { commitSession, getSession } from "~/session.server";
import { upsertUser } from "~/models/user.server";
import { badRequest } from "~/responses.server";
import type { Route } from "./+types/api.auth.electron._index";

const ELECTRON_SECRET = process.env.ELECTRON_AUTH_SECRET || "change-me-in-production";

export async function loader({ request }: Route.LoaderArgs) {
  await middleware(request);
  const { searchParams } = new URL(request.url);
  const steamId = searchParams.get("steamId");
  const secret = searchParams.get("secret");
  const nickname = searchParams.get("nickname") || "Player";
  const avatarUrl = searchParams.get("avatar") || "";

  if (!steamId || !secret || secret !== ELECTRON_SECRET) {
    throw badRequest;
  }

  const userId = await upsertUser({
    steamID: steamId,
    nickname,
    avatar: { medium: avatarUrl }
  });
  const session = await getSession(request.headers.get("cookie"));
  session.set("userId", userId);

  return Response.json({
    sessionCookie: await commitSession(session)
  });
}
