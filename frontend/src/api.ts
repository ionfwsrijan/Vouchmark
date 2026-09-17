import type {
  Analysis,
  AnalyzeResponse,
  Case,
  ContextInput,
} from "./types";
import { apiBase } from "./lib/config";

const DEVICE_KEY = "rnd-device-id";

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export interface AnalyzeArgs {
  base64?: string;
  mimeType?: string;
  text?: string;
  language: string;
  context: ContextInput;
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const base = apiBase();
  const url = base ? `${base}${path}` : path;
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiError(
      "Could not reach the analysis service. If running locally, is scripts/run-local.ps1 up?",
    );
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const message =
      typeof data.error === "string"
        ? (data.error as string)
        : `Request failed (HTTP ${res.status})`;
    throw new ApiError(message);
  }
  return data as T;
}

export async function analyze(args: AnalyzeArgs): Promise<Analysis> {
  const body = {
    deviceId: getDeviceId(),
    language: args.language,
    text: args.text?.trim() || undefined,
    document: args.base64 || undefined,
    mimeType: args.mimeType,
    context: {
      policyYears: args.context.policyYears || undefined,
      diagnosisAgeYears: args.context.diagnosisAgeYears || undefined,
      amountClaimed: args.context.amountClaimed || undefined,
      amountRejected: args.context.amountRejected || undefined,
    },
  };
  const payload = await http<AnalyzeResponse>("/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!payload.ok || !payload.analysis) {
    throw new ApiError(payload.error || "Analysis failed.");
  }
  return payload.analysis;
}

export async function fetchCases(): Promise<Case[]> {
  const deviceId = getDeviceId();
  const payload = await http<{ ok: boolean; cases: Case[] }>(
    `/cases?deviceId=${encodeURIComponent(deviceId)}`,
  );
  return payload.cases || [];
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.readAsDataURL(file);
  });
}

/**
 * Downscale an image in the browser before upload.
 * A phone photo of a letter is far larger than Bedrock needs; pushing a
 * 1280px JPEG keeps the whole pipeline fast and under every size limit.
 */
export async function prepareFile(file: File): Promise<{
  base64: string;
  mimeType: string;
}> {
  if (file.type === "application/pdf") {
    return { base64: await fileToBase64(file), mimeType: "application/pdf" };
  }
  if (!file.type.startsWith("image/")) {
    throw new ApiError("Please attach a photo (JPEG/PNG/WebP) or a PDF.");
  }

  const source = await createImageBitmap(file).catch(() => null);
  if (!source) {
    return { base64: await fileToBase64(file), mimeType: file.type || "image/jpeg" };
  }

  const MAX = 1280;
  const scale = Math.min(1, MAX / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    source.close();
    return { base64: await fileToBase64(file), mimeType: file.type || "image/jpeg" };
  }
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  source.close();

  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  return { base64: dataUrl.split(",")[1] ?? "", mimeType: "image/jpeg" };
}