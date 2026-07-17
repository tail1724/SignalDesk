import { describe, expect, it } from "vitest";
import { enforceArticlePublication } from "@/lib/payload/workflow";

function hookArgs(
  role: string | null,
  data: Record<string, unknown>,
  original: Record<string, unknown> = {},
) {
  return {
    data,
    originalDoc: { id: "article-1", _status: "draft", ...original },
    req: {
      t: (key: string) => key,
      user: role ? { id: "user-1", role } : null,
    },
  } as never;
}

const completeGate = {
  fact_checked: true,
  sources_checked: true,
  rights_checked: true,
  disclosure_checked: true,
};

describe("article publication gate", () => {
  it("rejects first publication by a reporter even with complete checks", async () => {
    expect(() =>
      enforceArticlePublication(
        hookArgs("reporter", { _status: "published", ...completeGate }),
      ),
    ).toThrow();
  });

  it("rejects an authorized publisher when any quality check is missing", async () => {
    expect(() =>
      enforceArticlePublication(
        hookArgs("managing_editor", {
          _status: "published",
          ...completeGate,
          rights_checked: false,
        }),
      ),
    ).toThrow(/rights_checked/);
  });

  it("sets the authoritative workflow state and publication time", async () => {
    const result = await enforceArticlePublication(
      hookArgs("managing_editor", { _status: "published", ...completeGate }),
    );

    expect(result).toMatchObject({
      _status: "published",
      workflow_stage: "published",
    });
    expect(result?.published_at).toEqual(expect.any(String));
  });

  it("does not apply first-publication checks to an ordinary draft save", async () => {
    const data = { _status: "draft", title: "Revised draft" };
    expect(
      await enforceArticlePublication(hookArgs("reporter", data)),
    ).toEqual(data);
  });
});
