import type { TranslationKey } from "@/lib/i18n";

/** Machine-readable failure reasons. The UI renders localized copy from the
 *  code, so no server-side error string ever reaches the screen. */
export type ErrorCode =
  | "not_found"
  | "bad_credentials"
  | "rate_limit"
  | "bad_request"
  | "network"
  | "unknown";

export class AppError extends Error {
  code: ErrorCode;
  constructor(code: ErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = "AppError";
  }
}

/** Derives a code from an API payload plus its HTTP status. */
export function codeFromResponse(
  payload: unknown,
  status?: number
): ErrorCode {
  const raw =
    payload && typeof payload === "object" && "code" in payload
      ? String((payload as { code: unknown }).code)
      : "";
  if (isErrorCode(raw)) return raw;

  if (status === 404) return "not_found";
  if (status === 401) return "bad_credentials";
  if (status === 403 || status === 429) return "rate_limit";
  if (status === 400) return "bad_request";
  return "unknown";
}

export function isErrorCode(value: string): value is ErrorCode {
  return (
    value === "not_found" ||
    value === "bad_credentials" ||
    value === "rate_limit" ||
    value === "bad_request" ||
    value === "network" ||
    value === "unknown"
  );
}

export function toErrorCode(err: unknown): ErrorCode {
  if (err instanceof AppError) return err.code;
  if (err instanceof TypeError) return "network";
  return "unknown";
}

export function errorTitleKey(code: ErrorCode): TranslationKey {
  return `error.${code}.title` as TranslationKey;
}

export function errorBodyKey(code: ErrorCode): TranslationKey {
  return `error.${code}.body` as TranslationKey;
}

/** Only these two states are worth offering "sign in / add token" for. */
export function needsAuthCta(code: ErrorCode): boolean {
  return code === "rate_limit" || code === "bad_credentials";
}
