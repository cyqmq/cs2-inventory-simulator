import { useEffect } from "react";
import { getApiBaseUrl } from "~/api-client";

export async function clientLoader() {
  return null;
}

clientLoader.hydrate = true;

export default function SignOut() {
  useEffect(() => {
    const apiBase = getApiBaseUrl();
    window.location.href = `${apiBase}/sign-out`;
  }, []);

  return null;
}
