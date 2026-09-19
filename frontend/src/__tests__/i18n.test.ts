import { describe, expect, it } from "vitest";
import { uiStrings } from "../i18n";

describe("uiStrings", () => {
  it("returns English for an unknown or default language", () => {
    expect(uiStrings("Tamil").brandTag).toBe("Claim intelligence desk");
    expect(uiStrings("").brandTag).toBe("Claim intelligence desk");
  });

  it("returns Hinglish copy for Hinglish", () => {
    const t = uiStrings("Hinglish");
    expect(t.heroA.length).toBeGreaterThan(0);
    expect(t.checkRejection).not.toBe("Check this rejection");
  });

  it("provides every phase label and story step in both languages", () => {
    for (const lang of ["English", "Hinglish"]) {
      const t = uiStrings(lang);
      expect(t.workPhases).toHaveLength(3);
      expect(t.workPhases.every((p) => p.length > 3)).toBe(true);
      expect(t.how).toHaveLength(3);
    }
  });

  it("ships full copy for the navigation, hero and panels in both languages", () => {
    for (const lang of ["English", "Hinglish"]) {
      const t = uiStrings(lang);
      for (const key of [
        "navOverview",
        "navHistory",
        "navHow",
        "navGrounds",
        "eyebrow",
        "heroA",
        "heroB",
        "heroCopy",
        "secureNote",
        "kickerInput",
        "kickerResult",
        "howHeading",
        "close",
      ] as const) {
        expect(t[key].length).toBeGreaterThan(0);
      }
    }
  });

  it("ships rulebook chrome and content blocks in both languages", () => {
    for (const lang of ["English", "Hinglish"]) {
      const t = uiStrings(lang);
      for (const key of [
        "groundsKicker",
        "groundsHeading",
        "groundsIntro",
        "groundsSearchAria",
        "groundsSearchPlaceholder",
        "groundsFilterAll",
        "groundsFilterWeak",
        "groundsFilterUndetermined",
        "groundsFilterStrong",
        "groundsWhy",
        "groundsMove",
        "groundsWeight",
        "groundsNone",
        "timelinesTitle",
        "grievancesTitle",
        "groundsNote",
      ] as const) {
        expect(t[key].length).toBeGreaterThan(0);
      }
    }
  });
});