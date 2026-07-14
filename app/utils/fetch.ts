import { apiUrl } from "~/api-client";

export async function postJson<T>(url: string, body: object) {
  const response = await fetch(apiUrl(url), {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST",
    credentials: "include"
  });
  return (await response.json()) as T;
}

export async function getJson<T>(url: string) {
  const response = await fetch(apiUrl(url), { credentials: "include" });
  return (await response.json()) as T;
}
