import { useSyncExternalStore } from "react";
import { API_BASE_URL as DEFAULT_API_BASE_URL } from "./config";

// Runtime-adjustable settings that don't require a rebuild - unlike VITE_API_BASE_URL (baked in at
// build time), these can change live in the browser, e.g. pointing a running dashboard at a
// different backend instance, or freezing all polling while explaining something during a demo.
// Persisted to localStorage so a page refresh doesn't lose them.

const STORAGE_KEY_BASE_URL = "aqms.apiBaseUrl";

let apiBaseUrl: string = localStorage.getItem(STORAGE_KEY_BASE_URL) || DEFAULT_API_BASE_URL;
let pollingPaused = false;

type Listener = () => void;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());
const subscribe = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function getApiBaseUrl(): string {
  return apiBaseUrl;
}

export function setApiBaseUrl(url: string): void {
  const trimmed = url.trim().replace(/\/$/, "");
  apiBaseUrl = trimmed || DEFAULT_API_BASE_URL;
  localStorage.setItem(STORAGE_KEY_BASE_URL, apiBaseUrl);
  notify();
}

export function isPollingPaused(): boolean {
  return pollingPaused;
}

export function setPollingPaused(paused: boolean): void {
  pollingPaused = paused;
  notify();
}

export function useApiBaseUrl(): string {
  return useSyncExternalStore(subscribe, getApiBaseUrl);
}

export function usePollingPaused(): boolean {
  return useSyncExternalStore(subscribe, isPollingPaused);
}
