import { describe, expect, it } from "vitest";
import { genreKeysForProject, paletteForGenre } from "@/lib/genre-theme";

// Genre → palette rules as specified for Crea-Link's per-project colour themes.
describe("genre colour themes", () => {
  it("love and romance use the pink/lavender palette", () => {
    expect(paletteForGenre("Love / Romance")).toBe("romance");
  });
  it("peaceful, soothing genres use the sky-blue palette", () => {
    expect(paletteForGenre("Healing / Comfort")).toBe("peaceful");
    expect(paletteForGenre("Slice of Life")).toBe("peaceful");
  });
  it("morality and social awareness use the sage/mint palette", () => {
    expect(paletteForGenre("Social Awareness")).toBe("moral");
    expect(paletteForGenre("Humanity / Morality")).toBe("moral");
  });
  it("adventure and action use the peach/orange palette", () => {
    expect(paletteForGenre("Adventure")).toBe("adventure");
    expect(paletteForGenre("Action")).toBe("adventure");
  });
  it("revenge, psychology and horror use the soft rose-red palette", () => {
    expect(paletteForGenre("Revenge")).toBe("dark");
    expect(paletteForGenre("Psychological Thriller")).toBe("dark");
    expect(paletteForGenre("Horror")).toBe("dark");
  });
  it("the primary genre decides the palette when a project has several", () => {
    expect(genreKeysForProject("Horror", ["Love / Romance", "Horror"])[0]).toBe("dark");
  });
});
