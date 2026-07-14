import type {
  LinksFunction,
  ShouldRevalidateFunctionArgs
} from "react-router";
import {
  data,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData
} from "react-router";

import { AppProvider } from "./components/app-context";
import { Background } from "./components/background";
import { Console } from "./components/console";
import { ErrorAlert } from "./components/error-alert";
import { Footer } from "./components/footer";
import { Header } from "./components/header";
import { useRootLayout } from "./components/hooks/use-root-layout";
import { Inventory } from "./components/inventory";
import { ItemSelectorProvider } from "./components/item-selector-context";
import { Splash } from "./components/splash";
import { SyncIndicator } from "./components/sync-indicator";
import { SyncWarn } from "./components/sync-warn";
import { apiGet } from "./api-client";
import styles from "./tailwind.css?url";

const bodyFontUrl =
  "https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wdth,wght@0,62.5..100,400..800;1,62.5..100,400..800&display=swap";

const displayFontUrl =
  "https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;600&display=swap";

const displayFontIAmPayingFor = "https://use.typekit.net/ojo0ltc.css";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com" },
  { rel: "stylesheet", href: bodyFontUrl },
  { rel: "stylesheet", href: displayFontUrl },
  { rel: "stylesheet", href: displayFontIAmPayingFor },
  { rel: "stylesheet", href: styles },
  { rel: "manifest", href: "/app.webmanifest" }
];

export function shouldRevalidate({ currentUrl }: ShouldRevalidateFunctionArgs) {
  if (currentUrl.pathname === "/craft") {
    return false;
  }
  return true;
}

export async function clientLoader() {
  try {
    return await apiGet("/api/init");
  } catch {
    return data({
      rules: {},
      preferences: {},
      user: undefined
    });
  }
}

clientLoader.hydrate = true;

export default function App() {
  const appProps = useLoaderData<typeof clientLoader>();
  const { footer, header, inventory } = useRootLayout();

  return (
    <AppProvider {...appProps}>
      <html
        data-language={appProps.preferences?.language ?? "english"}
        lang={appProps.preferences?.lang ?? "en"}
        onContextMenu={(event) => event.preventDefault()}
      >
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <Meta />
          <Links />
          <link
            rel="icon"
            href={(appProps.rules as Record<string, string>)?.appFaviconUrl || "/favicon.ico"}
            type={(appProps.rules as Record<string, string>)?.appFaviconMimeType || "image/x-icon"}
          />
        </head>
        <body className="overflow-y-scroll bg-stone-800">
          <Splash />
          <Background />
          <Console />
          <SyncWarn />
          {(header || inventory) && (
            <ItemSelectorProvider>
              {header && <Header showInventoryFilter={inventory} />}
              {inventory && <Inventory />}
            </ItemSelectorProvider>
          )}
          <Outlet />
          {footer && <Footer />}
          <SyncIndicator />
          <ScrollRestoration />
          <ErrorAlert />
          <Scripts />
        </body>
      </html>
    </AppProvider>
  );
}

export { ErrorBoundary } from "~/components/error-boundary";
