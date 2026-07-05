import { afterEach, describe, expect, it, vi } from "vitest";
import { app } from "../src/server.js";

// ----- mock Temporal client ---------------------------------------
const mockStart = vi.fn();

vi.mock("../src/temporal/client.js", () => ({
  getClient: vi.fn(async () => ({
    workflow: {
      start: mockStart,
    },
  })),
}));

// ----- setup -------------------------------------------------------
afterEach(() => {
  vi.clearAllMocks();
});

// ----- tests -------------------------------------------------------
describe("POST /ingest", () => {
  it("returns 400 when docId is missing", async () => {
    const res = await app.request("/ingest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: "some text" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when content is missing", async () => {
    const res = await app.request("/ingest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ docId: "test" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for empty docId", async () => {
    const res = await app.request("/ingest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ docId: "", content: "text" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for empty content", async () => {
    const res = await app.request("/ingest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ docId: "test", content: "" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 202 with workflow ID on success", async () => {
    mockStart.mockResolvedValueOnce({ workflowId: "ingest-test-123" });

    const res = await app.request("/ingest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ docId: "my-doc", content: "Hello world" }),
    });
    expect(res.status).toBe(202);
    const body = (await res.json()) as { workflowId: string };
    expect(body.workflowId).toBe("ingest-test-123");
  });

  it("starts a Temporal workflow with the correct arguments", async () => {
    mockStart.mockResolvedValueOnce({ workflowId: "wf-args-test" });

    await app.request("/ingest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ docId: "doc42", content: "some content" }),
    });

    expect(mockStart).toHaveBeenCalledOnce();

    const [_wfFn, opts] = mockStart.mock.calls[0] as [
      unknown,
      { taskQueue: string; workflowId: string; args: unknown[] },
    ];

    expect(opts.taskQueue).toBe("tss-ingest");
    expect(opts.args).toEqual(["doc42", "some content", "Xenova/all-MiniLM-L6-v2"]);
  });
});
