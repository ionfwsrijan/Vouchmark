import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { analyze, getDeviceId, prepareFile } from "../api";

describe("getDeviceId", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("creates and persists a stable device id", () => {
    const first = getDeviceId();
    expect(first).toBeTruthy();
    expect(getDeviceId()).toBe(first);
  });
});

describe("prepareFile", () => {
  it("rejects files that are neither an image nor a PDF", async () => {
    const f = new File(["x"], "letter.txt", { type: "text/plain" });
    await expect(prepareFile(f)).rejects.toThrow(/photo/);
  });

  it("passes PDFs through as-is", async () => {
    const f = new File(["%PDF-1.4 fake body"], "letter.pdf", {
      type: "application/pdf",
    });
    const out = await prepareFile(f);
    expect(out.mimeType).toBe("application/pdf");
    expect(out.base64).toBeTruthy();
  });
});

describe("analyze", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs the payload and unwraps the analysis", async () => {
    const ok = JSON.stringify({
      ok: true,
      analysis: { verdict: { label: "LIKELY_INVALID", fight_score: 78 } },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(ok, {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const out = await analyze({ language: "English", context: {} });
    expect(out.verdict.label).toBe("LIKELY_INVALID");

    const call = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const [url, init] = call;
    expect(url).toContain("/analyze");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.document).toBeUndefined();
    expect(body.text).toBeUndefined();
    expect(body.language).toBe("English");
  });

  it("surfaces the server error envelope as an ApiError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ ok: false, error: "boom" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    await expect(
      analyze({ language: "English", context: {} }),
    ).rejects.toThrow("boom");
  });
});