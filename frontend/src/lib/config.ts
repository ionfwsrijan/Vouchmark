declare global {
  interface Window {
    APP_CONFIG?: { apiUrl?: string };
  }
}

/** Base URL of the API, set at runtime via /config.js. */
export function apiBase(): string {
  const fromWindow = (window.APP_CONFIG && window.APP_CONFIG.apiUrl) || "";
  return fromWindow.replace(/\/+$/, "");
}

export function isLocalDev(): boolean {
  return apiBase() === "" || apiBase().startsWith("/");
}