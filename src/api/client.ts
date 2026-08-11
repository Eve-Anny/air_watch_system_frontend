import { getApiBaseUrl } from "../runtimeSettings";

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = new URL(`${baseUrl}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  let response: Response;
  try {
    response = await fetch(url.toString());
  } catch {
    throw new ApiError(`Could not reach the backend at ${baseUrl} - is it running?`);
  }

  if (!response.ok) {
    throw new ApiError(`Request to ${path} failed (${response.status})`, response.status);
  }
  return (await response.json()) as T;
}

async function mutate<T>(path: string, method: "POST" | "PATCH", body?: unknown): Promise<T> {
  const baseUrl = getApiBaseUrl();
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(`Could not reach the backend at ${baseUrl} - is it running?`);
  }

  if (!response.ok) {
    throw new ApiError(`Request to ${path} failed (${response.status})`, response.status);
  }
  return (await response.json()) as T;
}

export const api = { get: request, post: <T>(path: string, body?: unknown) => mutate<T>(path, "POST", body), patch: <T>(path: string, body?: unknown) => mutate<T>(path, "PATCH", body) };
