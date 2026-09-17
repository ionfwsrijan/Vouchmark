import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FightScore } from "../components/FightScore";

function scoreText(score: number, tone: "clay" | "ok" | "amber"): string {
  render(<FightScore score={score} tone={tone} />);
  const els = screen.getAllByLabelText(/fight intensity/i);
  return String(els[0]?.textContent ?? "");
}

describe("FightScore", () => {
  it("clamps a too-high score down to 100", () => {
    expect(scoreText(140, "clay")).toContain("100");
  });

  it("clamps a negative score up to 0", () => {
    expect(scoreText(-5, "amber")).toContain("0");
  });

  it("renders an in-range score verbatim", () => {
    expect(scoreText(42, "ok")).toContain("42");
  });
});