let _apiBaseUrl = "http://localhost:3000";

export function setApiBaseUrl(url: string) {
  _apiBaseUrl = url.replace(/\/$/, "");
}

export function getApiBaseUrl() {
  return _apiBaseUrl;
}

export function apiUrl(path: string) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${_apiBaseUrl}${cleanPath}`;
}

export async function apiPost<T>(path: string, body: object) {
  const response = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include"
  });
  if (!response.ok) {
    throw new Error(`API POST ${path} failed: ${response.status}`);
  }
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : undefined;
}

export async function apiGet<T>(path: string) {
  const response = await fetch(apiUrl(path), { credentials: "include" });
  if (!response.ok) {
    throw new Error(`API GET ${path} failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export interface ClientInitData {
  rules: Record<string, unknown>;
  preferences: Record<string, unknown>;
  user: unknown;
}

export async function fetchClientInit(): Promise<ClientInitData> {
  return apiGet<ClientInitData>("/api/init");
}
