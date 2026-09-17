import { describe, expect, it } from "vitest";
import { uiStrings } from "../i18n";

describe("uiStrings", () => {
  it("returns English for an unknown or default language", () => {
    expect(uiStrings("Tamil").brandTag).toBe("your rejection, vouched");
    expect(uiStrings("").brandTag).toBe("your rejection, vouched");
  });

  it("returns Hinglish copy for Hinglish", () => {
    const t = uiStrings("Hinglish");
    expect(t.brandTag).toContain("rejection");
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
});