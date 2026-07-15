import { config as fontAwesomeConfig } from "@fortawesome/fontawesome-svg-core";
import { CS2Economy, CS2_ITEMS } from "@ianlucas/cs2-lib";
import { Component, StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { setApiBaseUrl } from "./api-client";
import { clientGlobals } from "./globals";
import { fetchTranslation } from "./utils/translation-api";

(function hideSplashBeforeHydrate() {
  var el = document.getElementById("splash");
  if (el && el.style.display !== "none") {
    el.style.opacity = "0";
    el.style.pointerEvents = "none";
    el.style.display = "none";
    console.log("[CS2] splash hidden by hideSplashBeforeHydrate IIFE");
  } else if (el) {
    console.log("[CS2] splash already hidden (display: none)");
  } else {
    console.log("[CS2] splash element not found in DOM");
  }
})();

var _splashStartTime = Date.now();
window.addEventListener("load", function() {
  console.log("[CS2] window load event, elapsed:", Date.now() - _splashStartTime, "ms");
});
var _origPushState = history.pushState;
history.pushState = function() {
  console.log("[CS2] pushState called:", arguments[2]);
  return _origPushState.apply(this, arguments);
};

window.addEventListener("error", (e) => {
  console.log("[CS2] GLOBAL ERROR:", e.message, e.error?.stack);
});
window.addEventListener("unhandledrejection", (e) => {
  console.log("[CS2] UNHANDLED REJECTION:", e.reason?.stack || e.reason);
});

class RenderErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.log("[CS2] RENDER ERROR:", error.message, error.stack, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return <div><pre>{this.state.error.stack}</pre></div>;
    }
    return this.props.children;
  }
}

function hydrate() {
  const { itemTranslationMap } = clientGlobals;
  if (
    typeof itemTranslationMap !== "object" ||
    itemTranslationMap === null ||
    Object.keys(itemTranslationMap).length === 0
  ) {
    console.error(
      "[InventorySimulator] Item translation map is missing or empty. " +
        "This usually happens when your browser cached a stale translation " +
        "file during a deployment. Please clear your browser cache and reload."
    );
  }

  CS2Economy.load({
    items: CS2_ITEMS,
    language: itemTranslationMap
  });

  fontAwesomeConfig.replacementClass = "";

  startTransition(() => {
    try {
      hydrateRoot(
        document,
        <StrictMode>
          <RenderErrorBoundary>
            <HydratedRouter />
          </RenderErrorBoundary>
        </StrictMode>
      );
    } catch (err) {
      console.log("[CS2] hydrateRoot error:", err);
    }
  });
}

async function loadTranslationsAndHydrate() {
  const language = document.documentElement.dataset.language ?? "english";
  try {
    const { systemTranslationMap, itemTranslationMap } =
      await fetchTranslation(language);
    clientGlobals.systemTranslationMap = systemTranslationMap;
    clientGlobals.itemTranslationMap = itemTranslationMap;
  } catch (error) {
    console.error("[InventorySimulator] Failed to load translations:", error);
  }
  hydrate();
}

async function init() {
  console.log("[CS2-entry] init start");
  try {
    if (window.electronAPI) {
      const apiBaseUrl = await window.electronAPI.getApiBaseUrl();
      console.log("[CS2-entry] got API URL:", apiBaseUrl);
      setApiBaseUrl(apiBaseUrl);
    } else {
      const origin = window.location.origin;
      console.log("[CS2-entry] browser mode, API URL from origin:", origin);
      setApiBaseUrl(origin);
    }
    console.log("[CS2-entry] calling loadTranslationsAndHydrate");
    await loadTranslationsAndHydrate();
    console.log("[CS2-entry] loadTranslationsAndHydrate done");
  } catch (e) {
    console.error("[CS2-entry] init error:", e);
  }
}

console.log("[CS2-entry] script start");
init().catch(e => console.error("[CS2-entry] unhandled:", e));

if ("serviceWorker" in navigator) {
  // Unregister any existing service workers to avoid stale cache.
  navigator.serviceWorker.getRegistrations().then((regs) => {
    for (const reg of regs) {
      reg.unregister();
    }
  });
}
