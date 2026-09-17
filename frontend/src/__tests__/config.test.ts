import { beforeEach, describe, expect, it } from "vitest";
import { apiBase, isLocalDev } from "../lib/config";

describe("runtime config", () => {
  beforeEach(() => {
    delete window.APP_CONFIG;
  });

  it("returns an empty base when unconfigured", () => {
    expect(apiBase()).toBe("");
  });

  it("strips trailing slashes from the base URL", () => {
    window.APP_CONFIG = { apiUrl: "https://api.example.com/prod/" };
    expect(apiBase()).toBe("https://api.example.com/prod");
  });

  it("treats empty or relative bases as local dev", () => {
    expect(isLocalDev()).toBe(true);
    window.APP_CONFIG = { apiUrl: "/api" };
    expect(isLocalDev()).toBe(true);
  });

  it("treats an absolute base as a deployed API", () => {
    window.APP_CONFIG = { apiUrl: "https://api.example.com" };
    expect(isLocalDev()).toBe(false);
  });
});