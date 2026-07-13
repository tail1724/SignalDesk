import { describe, expect, it, vi, beforeEach } from "vitest";

const insertMock = vi.fn();
const fromMock = vi.fn(() => ({ insert: insertMock }));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabase: vi.fn(async () => ({ from: fromMock })),
}));

const sendConfirmationEmailMock = vi.fn();
vi.mock("@/lib/resend", () => ({
  sendConfirmationEmail: sendConfirmationEmailMock,
}));

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/newsletter", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/newsletter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an invalid email with 400", async () => {
    const { POST } = await import("@/app/api/newsletter/route");
    const res = await POST(makeRequest({ email: "not-an-email" }));
    expect(res.status).toBe(400);
  });

  it("inserts a pending subscriber and sends a confirmation email on success", async () => {
    insertMock.mockResolvedValue({ error: null });
    sendConfirmationEmailMock.mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/newsletter/route");
    const res = await POST(makeRequest({ email: "reader@example.com", source: "test" }));

    expect(res.status).toBe(200);
    expect(fromMock).toHaveBeenCalledWith("hr_newsletter_subscribers");
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ email: "reader@example.com", source: "test" })
    );
    expect(sendConfirmationEmailMock).toHaveBeenCalledTimes(1);
  });

  it("treats a duplicate email (unique violation) as a no-op success, not an error", async () => {
    insertMock.mockResolvedValue({ error: { code: "23505", message: "duplicate key" } });

    const { POST } = await import("@/app/api/newsletter/route");
    const res = await POST(makeRequest({ email: "already@example.com" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.alreadySubscribed).toBe(true);
    expect(sendConfirmationEmailMock).not.toHaveBeenCalled();
  });

  it("returns 500 for a non-duplicate database error", async () => {
    insertMock.mockResolvedValue({ error: { code: "42P01", message: "relation does not exist" } });

    const { POST } = await import("@/app/api/newsletter/route");
    const res = await POST(makeRequest({ email: "reader@example.com" }));
    expect(res.status).toBe(500);
  });

  it("still returns success if the confirmation email fails to send (row is already written)", async () => {
    insertMock.mockResolvedValue({ error: null });
    sendConfirmationEmailMock.mockRejectedValue(new Error("ESP unavailable"));

    const { POST } = await import("@/app/api/newsletter/route");
    const res = await POST(makeRequest({ email: "reader@example.com" }));
    expect(res.status).toBe(200);
  });
});
