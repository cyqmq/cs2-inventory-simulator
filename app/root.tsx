import { useEffect, useState } from "react";
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
import { SyncIndicator } from "./components/sync-indicator";
import { SyncWarn } from "./components/sync-warn";
import { apiGet } from "./api-client";
import styles from "./tailwind.css?url";

function hideSplash() {
  const el = document.getElementById("splash");
  if (el && el.style.display !== "none") {
    el.style.opacity = "0";
    el.style.pointerEvents = "none";
    setTimeout(() => (el.style.display = "none"), 1000);
  }
}

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

export function SignInModal({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState<"idle" | "connecting" | "error">("idle");
  const isElectron = typeof window !== "undefined" && Boolean((window as any).electronAPI?.steamLogin);

  useEffect(() => {
    if (!isElectron) return;
    setStatus("connecting");
    (async () => {
      try {
        await (window as any).electronAPI.steamLogin();
      } catch {
        setStatus("error");
        return;
      }
      window.location.href = "/";
    })();
  }, [isElectron]);

  return (
    <div
      onClick={onClose}
      style={{
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        height: "100vh",
        justifyContent: "center",
        left: 0,
        position: "fixed",
        top: 0,
        width: "100vw",
        zIndex: 300
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          alignItems: "center",
          backgroundColor: "#1c1c1c",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          color: "#f5f5f5",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Exo 2', sans-serif",
          padding: "2.5rem 3rem"
        }}
      >
        <svg style={{ height: "2.5rem", marginBottom: "1.5rem" }} viewBox="0 0 140 36" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" fillRule="evenodd">
            <path fill="#F5F5F5" d="M0 0v36h10V12.5l-5 8.5h5V26H0v-4.5l5-8.5H0zM15 0h4v36h-4zM22 0h11.5c1.1 0 2.3.3 3.5 1 1.2.6 2.1 1.7 2.6 3.2.6 1.5.9 3.6.9 6.3 0 2.7-.3 4.8-.9 6.3-.5 1.5-1.4 2.6-2.6 3.2-1.2.6-2.4 1-3.5 1H22V0zm10 19c.8 0 1.5-.2 1.9-.7.5-.5.8-1.4.8-2.8v-5c0-1.4-.3-2.3-.8-2.8-.4-.5-1.1-.7-1.9-.7h-6v12h6zM37 28h-4l7 8h4zM49 0h13c1 0 2.1.2 3.3.7 1.2.5 2.2 1.3 3 2.5.8 1.2 1.1 2.8 1.1 4.8 0 2-.3 3.6-1.1 4.8-.8 1.2-1.8 2-3 2.5-1.2.5-2.4.7-3.3.7h-9V0zm12 12c.7 0 1.3-.2 1.7-.5.5-.3.7-.9.7-1.5 0-.6-.2-1.1-.7-1.5-.4-.3-1-.5-1.7-.5h-8v4h8zM49 20h4v16h-4zM65 0h4v36h-4zM72 0h13c1 0 2.1.2 3.3.7 1.2.5 2.2 1.3 3 2.5.8 1.2 1.1 2.8 1.1 4.8 0 2-.3 3.6-1.1 4.8-.8 1.2-1.8 2-3 2.5-1.2.5-2.4.7-3.3.7h-9V0zm12 12c.7 0 1.3-.2 1.7-.5.5-.3.7-.9.7-1.5 0-.6-.2-1.1-.7-1.5-.4-.3-1-.5-1.7-.5h-8v4h8zM72 20h4v16h-4zM89 0h4l7 8 6-8h4l-9 12v14h-4V12zM105 0h4v36h-4zM112 0h11.5c1.1 0 2.3.3 3.5 1 1.2.6 2.1 1.7 2.6 3.2.6 1.5.9 3.6.9 6.3 0 2.7-.3 4.8-.9 6.3-.5 1.5-1.4 2.6-2.6 3.2-1.2.6-2.4 1-3.5 1H112V0zm10 19c.8 0 1.5-.2 1.9-.7.5-.5.8-1.4.8-2.8v-5c0-1.4-.3-2.3-.8-2.8-.4-.5-1.1-.7-1.9-.7h-6v12h6z" opacity=".7"/>
            <path fill="#FAFAFA" d="M128 28h4l7 8h-4z"/>
          </g>
        </svg>

        {status === "connecting" && (
          <>
            <div style={{ fontSize: "1rem", marginBottom: "1rem", opacity: 0.8 }}>
              Connecting to Steam...
            </div>
            <div style={{
              background: "rgba(255,255,255,0.1)",
              borderRadius: 2,
              height: 4,
              overflow: "hidden",
              width: 160
            }}>
              <div style={{
                animation: "cs2-modal-progress 1.5s ease-in-out infinite",
                background: "white",
                borderRadius: 2,
                height: "100%",
                width: "30%"
              }} />
            </div>
            <style>{`@keyframes cs2-modal-progress{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}`}</style>
          </>
        )}

        {status === "error" && (
          <div style={{ fontSize: "0.95rem", opacity: 0.7 }}>
            Connection failed.{" "}
            <span
              onClick={() => setStatus("idle")}
              style={{ color: "#4a9eff", cursor: "pointer", textDecoration: "underline" }}
            >
              Retry
            </span>
          </div>
        )}

        {status === "idle" && !isElectron && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center" }}>
            <div style={{ fontSize: "0.95rem", opacity: 0.7 }}>
              Sign in with your Steam account
            </div>
            <button
              onClick={() => {
                const { getApiBaseUrl } = (window as any).__apiClient || {};
                const base = typeof getApiBaseUrl === "function" ? getApiBaseUrl() : "";
                window.location.href = `${base}/sign-in/steam/callback`;
              }}
              style={{
                background: "#1a1a2e",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 4,
                color: "#f5f5f5",
                cursor: "pointer",
                fontSize: "0.95rem",
                padding: "0.6rem 1.5rem"
              }}
            >
              Sign in with Steam
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const appProps = useLoaderData<typeof clientLoader>();
  const { footer, header, inventory } = useRootLayout();
  const [showSignIn, setShowSignIn] = useState(false);

  useEffect(() => { hideSplash(); }, []);

  useEffect(() => {
    const handler = () => setShowSignIn(true);
    window.addEventListener("cs2:sign-in", handler);
    return () => window.removeEventListener("cs2:sign-in", handler);
  }, []);

  if (!appProps) return null;

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
      {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
    </AppProvider>
  );
}

export { ErrorBoundary } from "~/components/error-boundary";
