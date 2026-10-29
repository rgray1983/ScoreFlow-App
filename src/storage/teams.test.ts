import { describe, expect, it } from "vitest";
import { loadTeamBook, parseRoster, saveTeamBook } from "./teams";
import { memoryStorage } from "./local";
const home = { name: "Panthers", location: "McBee, SC", color: "#123456", logo: "data:image/png;base64,test", updatedAtMs: 1 };
describe("Pro team profiles", () => {
  it("migrates the existing home team without dropping its branding", () => {
    const book = loadTeamBook(home, memoryStorage());
    expect(book.teams).toEqual([{ ...home, id: "home-team", roster: [] }]);
    expect(book.selectedId).toBe("home-team");
  });
  it("reloads independently branded rosters and the selected team", () => {
    const storage = memoryStorage();
    const varsity = { ...home, id: "varsity", roster: [{ id: "p1", name: "Sophia", number: "12" }] };
    const jv = { ...home, name: "JV", id: "jv", color: "#987654", logo: "other", roster: [{ id: "p2", name: "Sam", number: "2" }] };
    saveTeamBook({ selectedId: "jv", teams: [varsity, jv] }, storage);
    expect(loadTeamBook(home, storage)).toEqual({ selectedId: "jv", teams: [varsity, jv] });
  });
  it("filters invalid players and duplicates, preserving leading-zero jersey numbers", () => {
    expect(parseRoster([null, { id: "p", name: "  Sophia  ", number: "07" }, { id: "p", name: "Duplicate" }, { id: "empty", name: " " }])).toEqual([{ id: "p", name: "Sophia", number: "07" }]);
  });
});
