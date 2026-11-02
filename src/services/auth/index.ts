import { apiBaseUrl } from "@/config/api";
import { createApiClient } from "@/lib/api-client";
import { createDevelopmentMockAuthService } from "@/services/auth/development-mock";
import { createHttpAuthService } from "@/services/auth/http";
import { unavailableAuthService } from "@/services/auth/unavailable";
import type { AuthMode, AuthService } from "@/types/auth";

/**
 * Which adapter runs. Fails closed: "backend" needs a valid API URL, "mock" is refused in a production
 * build, and anything else means sign-in is unavailable, so no order can be placed.
 */
export function resolveAuthMode(config: { mode: string | undefined; apiBaseUrl: string | null; nodeEnv: string | undefined }): AuthMode {
  if (config.mode === "backend" && config.apiBaseUrl) return "backend";
  if (config.mode === "mock" && config.nodeEnv !== "production") return "development_mock";
  return "unavailable";
}

let service: AuthService | undefined;

export function getAuthService(): AuthService {
  if (service) return service;
  const mode = resolveAuthMode({ mode: process.env.NEXT_PUBLIC_AUTH_MODE, apiBaseUrl, nodeEnv: process.env.NODE_ENV });
  service =
    mode === "backend" && apiBaseUrl
      ? createHttpAuthService(createApiClient(apiBaseUrl), apiBaseUrl)
      : mode === "development_mock"
        ? createDevelopmentMockAuthService()
        : unavailableAuthService;
  return service;
}
