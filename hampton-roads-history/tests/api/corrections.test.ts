import { describe, expect, it, vi, beforeEach } from "vitest";

const maybeSingleMock = vi.fn();
const eqMock = vi.fn(() => ({ eq: eqMock, maybeSingle: maybeSingleMock }));
const selectMock = vi.fn(() => ({ eq: eqMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabase: vi.fn(async () => ({ from: fromMock })),
}));

const sendCorrectionReportMock = vi.fn();
vi.mock("@/lib/resend", () => ({
  sendCorrectionReport: sendCorrectionReportMock,
}));

function makeRequest(body: unknown, ip = "1.2.3.4") {
  return new Request("http://localhost/api/corrections", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

const VALID_ARTICLE_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

describe("POST /api/corrections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a payload with an invalid article_id with 400", async () => {
    const { POST } = await import("@/app/api/corrections/route");
    const res = await POST(
      makeRequest({ article_id: "not-a-uuid", description: "typo" }, "30.0.0.1")
    );
    expect(res.status).toBe(400);
  });

  it("rejects an empty description with 400", async () => {
    const { POST } = await import("@/app/api/corrections/route");
    const res = await POST(
      makeRequest({ article_id: VALID_ARTICLE_ID, description: "" }, "30.0.0.2")
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when the article doesn't exist or isn't published", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    const { POST } = await import("@/app/api/corrections/route");
    const res = await POST(
      makeRequest({ article_id: VALID_ARTICLE_ID, description: "Wrong date" }, "30.0.0.3")
    );
    expect(res.status).toBe(404);
    expect(sendCorrectionReportMock).not.toHaveBeenCalled();
  });

  it("looks up the article server-side and emails the editorial team on success", async () => {
    maybeSingleMock.mockResolvedValue({
      data: {
        title: "The Night Norfolk Burned",
        short_id: "ab12",
        slug: "the-night-norfolk-burned",
        hr_categories: [{ slug: "norfolk" }],
      },
      error: null,
    });
    sendCorrectionReportMock.mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/corrections/route");
    const res = await POST(
      makeRequest(
        {
          article_id: VALID_ARTICLE_ID,
          description: "The bombardment date is off by a year.",
          reporter_email: "reader@example.com",
        },
        "30.0.0.4"
      )
    );

    expect(res.status).toBe(200);
    expect(sendCorrectionReportMock).toHaveBeenCalledWith(
      "The Night Norfolk Burned",
      "https://hamptonroadshistory.com/norfolk/ab12-the-night-norfolk-burned",
      "The bombardment date is off by a year.",
      "reader@example.com"
    );
  });

  it("returns 500 if the confirmation email fails to send", async () => {
    maybeSingleMock.mockResolvedValue({
      data: {
        title: "Some Story",
        short_id: "cd34",
        slug: "some-story",
        hr_categories: [{ slug: "suffolk" }],
      },
      error: null,
    });
    sendCorrectionReportMock.mockRejectedValue(new Error("ESP unavailable"));

    const { POST } = await import("@/app/api/corrections/route");
    const res = await POST(
      makeRequest({ article_id: VALID_ARTICLE_ID, description: "Name misspelled" }, "30.0.0.5")
    );
    expect(res.status).toBe(500);
  });
});
