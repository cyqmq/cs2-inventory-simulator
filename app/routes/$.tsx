import { redirect, useLocation } from "react-router";
import { useEffect } from "react";

export async function clientLoader() {
  return null;
}

clientLoader.hydrate = true;

export default function CatchAll() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith("/assets")) {
      return;
    }
    window.location.href = "/";
  }, [location]);

  return null;
}
