import { useEffect } from "react";

export async function clientLoader() {
  return null;
}

clientLoader.hydrate = true;

export default function SignIn() {
  useEffect(() => {
    window.dispatchEvent(new Event("cs2:sign-in"));
  }, []);

  return null;
}
