import { describe, expect, it, vi, beforeEach } from "vitest";

const insertMock = vi.fn();
const fromMock = vi.fn(() => ({ insert: insertMock }));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabase: vi.fn(async () => ({ from: fromMock })),
}));

function makeRequest(body: unknown, ip = "1.2.3.4") {
  return new Request("http://localhost/api/events", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

describe("POST /api/events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a payload missing the required session_id with 400", async () => {
    const { POST } = await import("@/app/api/events/route");
    const res = await POST(
      makeRequest({ event_type: "pageview", city_slug: "norfolk" }, "10.0.0.1")
    );
    expect(res.status).toBe(400);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("rejects a payload with an empty session_id with 400", async () => {
    const { POST } = await import("@/app/api/events/route");
    const res = await POST(
      makeRequest({ event_type: "pageview", session_id: "" }, "10.0.0.2")
    );
    expect(res.status).toBe(400);
  });

  it("accepts a valid pageview event and returns 204", async () => {
    insertMock.mockResolvedValue({ error: null });
    const { POST } = await import("@/app/api/events/route");
    const res = await POST(
      makeRequest(
        { event_type: "pageview", session_id: "sess-1", city_slug: "norfolk" },
        "10.0.0.3"
      )
    );
    expect(res.status).toBe(204);
    expect(fromMock).toHaveBeenCalledWith("hr_page_events");
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ event_type: "pageview", session_id: "sess-1" })
    );
  });

  it("returns 500 when the insert fails (e.g. CHECK constraint violation), not a silent 204", async () => {
    insertMock.mockResolvedValue({
      error: { code: "23514", message: "violates check constraint" },
    });
    const { POST } = await import("@/app/api/events/route");
    const res = await POST(
      makeRequest({ event_type: "bogus_type", session_id: "sess-1" }, "10.0.0.4")
    );
    expect(res.status).toBe(500);
  });

  it("rate-limits after too many requests from the same IP", async () => {
    insertMock.mockResolvedValue({ error: null });
    const { POST } = await import("@/app/api/events/route");
    const ip = "10.0.0.5";
    let lastStatus = 0;
    for (let i = 0; i < 101; i++) {
      const res = await POST(
        makeRequest({ event_type: "pageview", session_id: "sess-1" }, ip)
      );
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});
