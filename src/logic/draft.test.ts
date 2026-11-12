import { describe, expect, it } from "vitest";
import { FACTIONS, REACH_TARGETS } from "../data/factions";
import {
  FACTION_BY_ID,
  applyPick,
  currentSeat,
  dealFor,
  maxReach,
  normalizePool,
  options,
  pickOfSeat,
  poolProblem,
  reachOf,
  remaining,
  seatOfPick,
  shuffle,
  startDraft,
  targetOf,
  undoPick,
  validSet,
  type DraftSettings,
  type DraftState,
  type Rng,
} from "./draft";

const ALL = FACTIONS.map((f) => f.id);

function mulberry32(seed: number): Rng {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function settings(over: Partial<DraftSettings> = {}): DraftSettings {
  return { players: 4, mode: "open", guard: "block", goal: "recommended", order: "reverse", pool: ALL, ...over };
}
function state(over: Partial<DraftState> = {}): DraftState {
  return { ...settings(), deal: [], picks: [], ...over };
}
const optionFor = (s: DraftState, id: string) => options(s).find((o) => o.id === id)!;

describe("faction data", () => {
  it("has 13 factions plus the second Vagabond, with unique ids", () => {
    expect(FACTIONS).toHaveLength(14);
    expect(new Set(ALL).size).toBe(14);
  });

  it("matches the reach table", () => {
    const reach = Object.fromEntries(FACTIONS.map((f) => [f.id, f.reach]));
    expect(reach).toEqual({ m: 10, e: 7, a: 3, v: 5, w: 2, r: 5, l: 2, d: 8, c: 3, h: 9, k: 8, f: 7, t: 4, n: 4 });
  });

  it("gives every faction strengths, cautions and an opening", () => {
    for (const f of FACTIONS) {
      expect(f.goodAt.length, f.name).toBeGreaterThanOrEqual(2);
      expect(f.watchOut.length, f.name).toBeGreaterThanOrEqual(2);
      expect(f.firstTurns.length, f.name).toBeGreaterThanOrEqual(3);
      for (const line of [...f.goodAt, ...f.watchOut, ...f.firstTurns]) expect(line.trim().length).toBeGreaterThan(20);
    }
  });
});

describe("targets and reach sums", () => {
  it("uses the Law minimums by player count", () => {
    expect([2, 3, 4, 5, 6].map((players) => targetOf({ players, goal: "recommended" }))).toEqual([17, 18, 21, 25, 28]);
    expect(REACH_TARGETS[4]).toBe(21);
  });

  it("uses 17 at any count for adventurous tables", () => {
    expect([2, 3, 4, 5, 6].map((players) => targetOf({ players, goal: "adventurous" }))).toEqual([17, 17, 17, 17, 17]);
  });

  it("sums reach", () => {
    expect(reachOf([])).toBe(0);
    expect(reachOf(["m", "e", "a", "v"])).toBe(25);
    expect(reachOf(["v", "w"])).toBe(7); // first Vagabond 5, second 2
  });
});

describe("validSet", () => {
  it("requires the first Vagabond for the second", () => {
    expect(validSet(["w", "m"])).toBe(false);
    expect(validSet(["v", "w", "m"])).toBe(true);
  });

  it("keeps the Knaves and the Vagabond apart", () => {
    expect(validSet(["n", "v"])).toBe(false);
    expect(validSet(["n", "v", "w"])).toBe(false);
    expect(validSet(["n", "m"])).toBe(true);
    expect(validSet(["v", "m"])).toBe(true);
  });
});

describe("normalizePool", () => {
  it("drops unknown ids, duplicates and an orphaned second Vagabond", () => {
    expect(normalizePool(["w", "m", "m", "zz", "e"])).toEqual(["m", "e"]);
    expect(normalizePool(["w", "v"])).toEqual(["v", "w"]);
  });
});

describe("maxReach", () => {
  it("finds the best legal total", () => {
    expect(maxReach([], ALL, 4)).toBe(35); // m h d k
    expect(maxReach([], ALL, 6)).toBe(49); // m h d k e f
    expect(maxReach(["a"], ["m", "l", "c"], 2)).toBe(16);
  });

  it("returns the current total when nothing is left to add", () => {
    expect(maxReach(["m", "e"], ["a"], 0)).toBe(17);
  });

  it("returns -1 when there is no legal completion", () => {
    expect(maxReach([], ["m"], 2)).toBe(-1);
    expect(maxReach(["n"], ["v"], 1)).toBe(-1);
    expect(maxReach([], ["w", "m"], 2)).toBe(-1);
  });

  it("skips illegal combinations rather than counting them", () => {
    // v + n is illegal, so the best pair is v + a.
    expect(maxReach([], ["v", "n", "a"], 2)).toBe(8);
  });
});

describe("seat order", () => {
  it("lets the last seat pick first by default", () => {
    const s = state();
    expect([0, 1, 2, 3].map((i) => seatOfPick(s, i))).toEqual([3, 2, 1, 0]);
    expect(currentSeat(s)).toBe(3);
    expect(currentSeat(state({ picks: ["m"] }))).toBe(2);
  });

  it("supports first seat first", () => {
    const s = state({ order: "forward", picks: ["m"] });
    expect(currentSeat(s)).toBe(1);
    expect(pickOfSeat(s, 0)).toBe("m");
  });

  it("maps picks back to seats and reports completion", () => {
    const s = state({ picks: ["m", "e", "a", "v"] });
    expect(currentSeat(s)).toBe(-1);
    expect(pickOfSeat(s, 3)).toBe("m");
    expect(pickOfSeat(s, 0)).toBe("v");
    expect(pickOfSeat(state({ picks: ["m"] }), 0)).toBeUndefined();
  });
});

describe("options", () => {
  it("marks taken factions with the seat that took them", () => {
    const s = state({ picks: ["m"] });
    expect(optionFor(s, "m")).toEqual({ id: "m", state: "taken", seat: 3 });
    expect(remaining(s)).not.toContain("m");
  });

  it("opens the second Vagabond only after the first", () => {
    expect(optionFor(state(), "w").state).toBe("blocked");
    expect(optionFor(state({ picks: ["v"] }), "w").state).toBe("open");
  });

  it("blocks Knaves and Vagabond from sharing a game", () => {
    expect(optionFor(state({ picks: ["v"] }), "n").state).toBe("blocked");
    expect(optionFor(state({ picks: ["n"] }), "v").state).toBe("blocked");
    expect(optionFor(state({ picks: ["n"] }), "w").state).toBe("blocked");
  });

  it("blocks a pick that makes the target unreachable", () => {
    // 4 players need 21. m+v+a+c = 21 exactly, so the Lizard Cult (2) cannot fit.
    const s = state({ pool: ["m", "a", "c", "l", "v"] });
    const lizard = optionFor(s, "l");
    expect(lizard.state).toBe("blocked");
    expect(lizard).toMatchObject({ why: "Best possible total after this pick is 20, short of 21+" });
    expect(optionFor(s, "m").state).toBe("open");
  });

  it("only warns when the guard is set to warn", () => {
    const s = state({ pool: ["m", "a", "c", "l", "v"], guard: "warn" });
    expect(optionFor(s, "l")).toEqual({
      id: "l",
      state: "open",
      warn: "Best possible total after this pick is 20, short of 21+",
    });
    expect(optionFor(s, "m")).toEqual({ id: "m", state: "open" });
  });

  it("relaxes the guard for the adventurous target", () => {
    const s = state({ pool: ["m", "a", "c", "l", "v"], goal: "adventurous" });
    expect(optionFor(s, "l").state).toBe("open");
  });

  it("blocks a pick that strands the remaining seats, even in warn mode", () => {
    // 2 players, pool n + v + w: taking the Knaves leaves only Vagabonds, which cannot join them.
    const s = state({ players: 2, pool: ["n", "v", "w"], guard: "warn", goal: "adventurous" });
    expect(optionFor(s, "n")).toEqual({
      id: "n",
      state: "blocked",
      why: "Leaves no legal picks for the remaining players",
    });
  });

  it("marks leftovers as unused once the draft is complete", () => {
    const s = state({ picks: ["m", "e", "a", "v"] });
    expect(optionFor(s, "d").state).toBe("unused");
    expect(optionFor(s, "m").state).toBe("taken");
  });

  it("only offers the dealt hand in a dealt draft", () => {
    const s = state({ mode: "dealt", deal: ["m", "e", "a", "v", "d"] });
    expect(options(s).map((o) => o.id)).toEqual(["m", "e", "a", "v", "d"]);
  });

  it("never lets a guarded draft finish below target", () => {
    // Always take the weakest open faction; the guard must still land on the target.
    for (const players of [2, 3, 4, 5, 6]) {
      let s = state({ players });
      while (currentSeat(s) >= 0) {
        const open = options(s)
          .filter((o) => o.state === "open")
          .sort((a, b) => FACTION_BY_ID[a.id].reach - FACTION_BY_ID[b.id].reach);
        expect(open.length).toBeGreaterThan(0);
        s = { ...s, picks: s.picks.concat(open[0].id) };
      }
      expect(validSet(s.picks)).toBe(true);
      expect(reachOf(s.picks)).toBeGreaterThanOrEqual(targetOf(s));
    }
  });
});

describe("applyPick", () => {
  it("applies a legal pick without mutating the input", () => {
    const s = state();
    const r = applyPick(s, "m", 3);
    expect(r).toMatchObject({ ok: true, state: { picks: ["m"] } });
    expect(s.picks).toEqual([]);
  });

  it("rejects the wrong seat", () => {
    expect(applyPick(state(), "m", 0)).toMatchObject({ ok: false, error: "not-your-turn" });
  });

  it("lets a host pick for whoever is up when no seat is given", () => {
    expect(applyPick(state(), "m").ok).toBe(true);
  });

  it("rejects taken, unknown and out-of-hand factions", () => {
    expect(applyPick(state({ picks: ["m"] }), "m")).toMatchObject({ ok: false, error: "unavailable" });
    expect(applyPick(state(), "zz")).toMatchObject({ ok: false, error: "unavailable" });
    const dealt = state({ mode: "dealt", deal: ["m", "e", "a", "v", "d"] });
    expect(applyPick(dealt, "h")).toMatchObject({ ok: false, error: "unavailable" });
  });

  it("rejects blocked picks and passes warnings through", () => {
    const pool = ["m", "a", "c", "l", "v"];
    expect(applyPick(state({ pool }), "l")).toMatchObject({ ok: false, error: "blocked" });
    expect(applyPick(state({ pool, guard: "warn" }), "l")).toMatchObject({
      ok: true,
      warn: "Best possible total after this pick is 20, short of 21+",
    });
    expect(applyPick(state(), "w")).toMatchObject({ ok: false, error: "blocked" });
  });

  it("rejects picks after the draft is complete", () => {
    expect(applyPick(state({ picks: ["m", "e", "a", "v"] }), "d")).toMatchObject({ ok: false, error: "complete" });
  });

  it("undoes the last pick", () => {
    expect(undoPick(state({ picks: ["m", "e"] })).picks).toEqual(["m"]);
    expect(undoPick(state()).picks).toEqual([]);
  });
});

describe("poolProblem", () => {
  it("accepts the full pool at every player count", () => {
    for (const players of [2, 3, 4, 5, 6]) {
      expect(poolProblem(settings({ players }))).toBeNull();
      expect(poolProblem(settings({ players, mode: "dealt" }))).toBeNull();
    }
  });

  it("flags a pool that is too small, too weak, or too small to deal from", () => {
    expect(poolProblem(settings({ pool: ["m", "e"] }))).toMatch(/cannot seat 4 players/);
    expect(poolProblem(settings({ pool: ["a", "c", "l", "t", "r"] }))).toMatch(/is 15, below the 21\+ target/);
    expect(poolProblem(settings({ pool: ["m", "e", "d", "h"], mode: "dealt" }))).toMatch(/at least 5 factions/);
  });

  it("flags a dealt draft where every possible hand is illegal", () => {
    // Five factions for four players, with both the Vagabond and the Knaves: they always meet.
    expect(poolProblem(settings({ pool: ["m", "e", "d", "v", "n"], mode: "dealt" }))).toMatch(/No dealt hand/);
    expect(poolProblem(settings({ pool: ["m", "e", "d", "v", "n"] }))).toBeNull();
  });
});

describe("shuffle", () => {
  it("returns a permutation and leaves the input alone", () => {
    const input = ["a", "b", "c", "d", "e"];
    const out = shuffle(input, mulberry32(1));
    expect(out.slice().sort()).toEqual(input);
    expect(input).toEqual(["a", "b", "c", "d", "e"]);
  });
});

describe("dealFor", () => {
  it("deals players + 1 distinct factions that satisfy every rule", () => {
    for (const players of [2, 3, 4, 5, 6]) {
      for (let seed = 1; seed <= 200; seed++) {
        const s = settings({ players, mode: "dealt" });
        const deal = dealFor(s, mulberry32(seed * 7919 + players))!;
        expect(deal).not.toBeNull();
        expect(deal).toHaveLength(players + 1);
        expect(new Set(deal).size).toBe(deal.length);
        expect(deal.every((id) => ALL.includes(id))).toBe(true);
        expect(FACTION_BY_ID[deal[0]].type).toBe("Militant");
        if (deal.includes("w")) expect(deal).toContain("v");
        expect(deal.includes("n") && deal.includes("v")).toBe(false);
        expect(maxReach([], deal, players)).toBeGreaterThanOrEqual(targetOf(s));
      }
    }
  });

  it("stays inside the chosen pool", () => {
    const pool = ["m", "e", "a", "c", "d"];
    const deal = dealFor(settings({ players: 3, mode: "dealt", pool }), mulberry32(42))!;
    expect(deal.every((id) => pool.includes(id))).toBe(true);
  });

  it("returns null when the pool is too small or cannot reach the target", () => {
    expect(dealFor(settings({ mode: "dealt", pool: ["m", "e", "d", "h"] }))).toBeNull();
    expect(dealFor(settings({ mode: "dealt", pool: ["a", "c", "l", "t", "r", "n"] }), mulberry32(3))).toBeNull();
  });
});

describe("startDraft", () => {
  it("starts an open draft with a normalized pool and no deal", () => {
    const s = startDraft(settings({ pool: ["w", "m", "e", "d", "h", "a"] }))!;
    expect(s.pool).toEqual(["m", "e", "a", "d", "h"]);
    expect(s.deal).toEqual([]);
    expect(s.picks).toEqual([]);
  });

  it("deals a hand for a dealt draft", () => {
    const s = startDraft(settings({ mode: "dealt" }), mulberry32(9))!;
    expect(s.deal).toHaveLength(5);
  });

  it("refuses settings that cannot work", () => {
    expect(startDraft(settings({ pool: ["m", "e"] }))).toBeNull();
    expect(startDraft(settings({ players: 7 }))).toBeNull();
  });
});
