import { apiBaseUrl } from "@/config/api";
import { createApiClient } from "@/lib/api-client";
import { createHttpAuthService } from "@/services/auth/http";
import { unavailableAuthService } from "@/services/auth/unavailable";
import type { AuthMode, AuthService } from "@/types/auth";

/**
 * Which adapter runs. Fails closed: sign-in goes through the backend when NEXT_PUBLIC_API_BASE_URL is a
 * valid URL, and is otherwise unavailable, so no order can be placed. There is no mock sign-in.
 */
export function resolveAuthMode(config: { apiBaseUrl: string | null }): AuthMode {
  return config.apiBaseUrl ? "backend" : "unavailable";
}

let service: AuthService | undefined;

export function getAuthService(): AuthService {
  if (service) return service;
  service = apiBaseUrl ? createHttpAuthService(createApiClient(apiBaseUrl), apiBaseUrl) : unavailableAuthService;
  return service;
}
