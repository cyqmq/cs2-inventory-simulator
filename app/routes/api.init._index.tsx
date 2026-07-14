import { data } from "react-router";
import { findRequestUser } from "~/auth.server";
import { middleware } from "~/middleware.server";
import { getClientRules } from "~/models/rule";
import { steamCallbackUrl } from "~/models/rule.server";
import { getBackground } from "~/preferences/background.server";
import { getLanguage } from "~/preferences/language.server";
import { getToggleable } from "~/preferences/toggleable.server";
import { getSession } from "~/session.server";
import { nonEmptyString } from "~/utils/misc";
import {
  ASSETS_BASE_URL,
  CLOUDFLARE_ANALYTICS_TOKEN,
  SOURCE_COMMIT,
  VIEWER_ASSETS_BASE_URL,
  VIEWER_EMBED_URL
} from "~/env.server";
import {
  resolveViewerOriginAllowed,
  resolveViewerCatalog
} from "~/data/viewer.server";
import type { Route } from "./+types/api.init._index";

export async function loader({ request }: Route.LoaderArgs) {
  await middleware(request);
  const session = await getSession(request.headers.get("Cookie"));
  const user = await findRequestUser(request);
  const ipCountry = request.headers.get("CF-IPCountry");
  const { origin: appUrl, host: appSiteName } = new URL(
    await steamCallbackUrl.get()
  );
  const clientRules = await getClientRules(user?.id);
  return data({
    rules: {
      ...clientRules,
      assetsBaseUrl: nonEmptyString(ASSETS_BASE_URL),
      viewerEmbedUrl: nonEmptyString(VIEWER_EMBED_URL),
      viewerAssetsBaseUrl: nonEmptyString(VIEWER_ASSETS_BASE_URL),
      cloudflareAnalyticsToken: CLOUDFLARE_ANALYTICS_TOKEN,
      sourceCommit: SOURCE_COMMIT,
      viewerOriginAllowed: resolveViewerOriginAllowed({
        enabled: clientRules.viewerEnabled,
        hostname: new URL(appUrl).hostname,
        key: clientRules.viewerKey
      }),
      viewerCatalog: clientRules.viewerEnabled
        ? await resolveViewerCatalog()
        : undefined,
      meta: { appUrl, appSiteName }
    },
    preferences: {
      ...(await getBackground(session)),
      ...(await getLanguage(session, ipCountry)),
      ...(await getToggleable(session))
    },
    user
  });
}
