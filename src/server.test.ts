import { describe, it, expect } from "vitest";
import { app } from "./server.js";

describe("GET /", () => {
  it("returns hello world as text/plain", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/^text\/plain/);
    expect(await res.text()).toBe("hello world");
  });
});

describe("GET /health", () => {
  it("returns ok status", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });
});
