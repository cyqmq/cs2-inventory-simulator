import { useEffect } from "react";
import { getApiBaseUrl } from "~/api-client";

export async function clientLoader() {
  return null;
}

clientLoader.hydrate = true;

export default function SignIn() {
  useEffect(() => {
    const apiBase = getApiBaseUrl();
    window.location.href = `${apiBase}/sign-in`;
  }, []);

  return null;
}
