// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createApiClient, tunnelHeaders } from "@/lib/api-client";

describe("API client through an ngrok tunnel", () => {
  it("adds ngrok's skip-warning header only for ngrok hosts", () => {
    expect(tunnelHeaders("https://filing-simple-lilly.ngrok-free.dev/api/v1")).toEqual({ "ngrok-skip-browser-warning": "1" });
    expect(tunnelHeaders("https://abc.ngrok-free.app/api/v1")).toEqual({ "ngrok-skip-browser-warning": "1" });
    expect(tunnelHeaders("http://localhost:8000/api/v1")).toEqual({});
    expect(tunnelHeaders("https://api.mithrenagro.com/api/v1")).toEqual({});
    expect(tunnelHeaders("https://ngrok-free.dev.evil.example.com/api/v1")).toEqual({});
    expect(tunnelHeaders("not a url")).toEqual({});
  });

  it("sends the header with credentials on every request to the tunnel", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    await createApiClient("https://filing-simple-lilly.ngrok-free.dev/api/v1", fetchImpl).request("/auth/session");
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://filing-simple-lilly.ngrok-free.dev/api/v1/auth/session");
    expect(init.credentials).toBe("include");
    expect(init.headers).toMatchObject({ Accept: "application/json", "ngrok-skip-browser-warning": "1" });
  });
});
