// Pure draft rules, ported from the prototype's <script id="logic"> block.
// No DOM, storage or boardgame.io access. ./game.ts wraps these rules as a boardgame.io game, so
// the client and the server validate every pick with exactly the same code.

import { FACTIONS, REACH_TARGETS, type Faction } from "../data/factions";

export type DraftMode = "open" | "dealt";
export type GuardMode = "block" | "warn";
export type ReachGoal = "recommended" | "adventurous";
/** "reverse": the last seat in turn order picks first (default). "forward": seat 1 picks first. */
export type PickOrder = "reverse" | "forward";

export interface DraftSettings {
  players: number;
  mode: DraftMode;
  guard: GuardMode;
  goal: ReachGoal;
  order: PickOrder;
  /** Faction ids the host allows. */
  pool: string[];
}

export interface DraftState extends DraftSettings {
  /** Dealt hand (mode "dealt" only), otherwise empty. */
  deal: string[];
  /** Faction ids in the order they were picked. */
  picks: string[];
}

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;
export const ADVENTUROUS_TARGET = 17;

const VAGABOND = "v";
const SECOND_VAGABOND = "w";
const KNAVES = "n";

export const FACTION_BY_ID: Record<string, Faction> = Object.fromEntries(
  FACTIONS.map((f) => [f.id, f]),
);

export type Rng = () => number;

/* ---------- Rules ---------- */

export function targetOf(s: Pick<DraftSettings, "players" | "goal">): number {
  return s.goal === "adventurous" ? ADVENTUROUS_TARGET : REACH_TARGETS[s.players];
}

export function reachOf(ids: string[]): number {
  return ids.reduce((total, id) => total + FACTION_BY_ID[id].reach, 0);
}

/** Combination rules for a set of factions in one game. */
export function validSet(ids: string[]): boolean {
  const has = new Set(ids);
  if (has.has(SECOND_VAGABOND) && !has.has(VAGABOND)) return false; // second Vagabond needs the first
  if (has.has(KNAVES) && (has.has(VAGABOND) || has.has(SECOND_VAGABOND))) return false; // Knaves and Vagabond are exclusive
  return true;
}

/** Known, de-duplicated ids in canonical order; the second Vagabond is dropped if the first is absent. */
export function normalizePool(ids: string[]): string[] {
  const want = new Set(ids);
  if (!want.has(VAGABOND)) want.delete(SECOND_VAGABOND);
  return FACTIONS.filter((f) => want.has(f.id)).map((f) => f.id);
}

/** The factions players actually choose from: the dealt hand, or the whole pool. */
export function sourceIds(s: DraftState): string[] {
  return s.mode === "dealt" ? s.deal.slice() : s.pool.slice();
}

export function remaining(s: DraftState): string[] {
  return sourceIds(s).filter((id) => !s.picks.includes(id));
}

/** Best total reach reachable by adding exactly k more factions from avail; -1 if no legal way. */
export function maxReach(picked: string[], avail: string[], k: number): number {
  let best = -1;
  const rec = (start: number, chosen: string[]): void => {
    if (chosen.length === k) {
      const all = picked.concat(chosen);
      if (validSet(all)) best = Math.max(best, reachOf(all));
      return;
    }
    for (let i = start; i <= avail.length - (k - chosen.length); i++) {
      rec(i + 1, chosen.concat(avail[i]));
    }
  };
  rec(0, []);
  return best;
}

/** Seat (index into turn order) that makes the i-th pick. */
export function seatOfPick(s: Pick<DraftSettings, "players" | "order">, i: number): number {
  return s.order === "reverse" ? s.players - 1 - i : i;
}

/** Faction picked by a seat, if it has picked yet. */
export function pickOfSeat(s: DraftState, seat: number): string | undefined {
  return s.picks[s.order === "reverse" ? s.players - 1 - seat : seat];
}

export function isComplete(s: DraftState): boolean {
  return s.picks.length >= s.players;
}

/** Seat whose turn it is, or -1 when the draft is complete. */
export function currentSeat(s: DraftState): number {
  return isComplete(s) ? -1 : seatOfPick(s, s.picks.length);
}

export type FactionOption =
  | { id: string; state: "taken"; seat: number }
  | { id: string; state: "unused" }
  | { id: string; state: "blocked"; why: string }
  | { id: string; state: "open"; warn?: string };

/** Status of every faction in the source for the next pick. */
export function options(s: DraftState): FactionOption[] {
  const rem = remaining(s);
  const left = s.players - s.picks.length - 1;
  const tgt = targetOf(s);
  const has = (id: string) => s.picks.includes(id);
  return sourceIds(s).map((id): FactionOption => {
    const i = s.picks.indexOf(id);
    if (i >= 0) return { id, state: "taken", seat: seatOfPick(s, i) };
    if (isComplete(s)) return { id, state: "unused" };
    if (id === SECOND_VAGABOND && !has(VAGABOND))
      return { id, state: "blocked", why: "Opens once the first Vagabond is taken" };
    if (id === KNAVES && has(VAGABOND))
      return { id, state: "blocked", why: "Cannot share a game with the Vagabond" };
    if (id === VAGABOND && has(KNAVES))
      return { id, state: "blocked", why: "Cannot share a game with the Knaves" };
    const best = maxReach(
      s.picks.concat(id),
      rem.filter((x) => x !== id),
      left,
    );
    if (best < 0)
      return { id, state: "blocked", why: "Leaves no legal picks for the remaining players" };
    if (best < tgt) {
      const why = `Best possible total after this pick is ${best}, short of ${tgt}+`;
      return s.guard === "block" ? { id, state: "blocked", why } : { id, state: "open", warn: why };
    }
    return { id, state: "open" };
  });
}

/* ---------- Setup ---------- */

/** Why these settings cannot start a draft, or null if they can. */
export function poolProblem(s: DraftSettings): string | null {
  const pool = normalizePool(s.pool);
  const tgt = targetOf(s);
  const best = maxReach([], pool, s.players);
  if (best < 0) return `This pool cannot seat ${s.players} players. Add more factions.`;
  if (best < tgt)
    return `The best this pool can reach with ${s.players} factions is ${best}, below the ${tgt}+ target. Add a militant faction or two.`;
  if (s.mode === "dealt") {
    if (pool.length < s.players + 1)
      return `A dealt draft needs at least ${s.players + 1} factions in the pool.`;
    // Fixed seed, so the client and the server always agree on the answer.
    if (!dealFor(s, seededRng(1)))
      return "No dealt hand from this pool can reach the target. Widen the pool.";
  }
  return null;
}

/** Small deterministic generator (mulberry32) for checks that must not depend on Math.random. */
export function seededRng(seed: number): Rng {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: T[], rng: Rng = Math.random): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Deal players + 1 factions, the first from the militants, re-dealing until the reach target is
 * reachable. A simplification of Advanced Setup, not the exact Law procedure. Null if impossible.
 */
export function dealFor(s: DraftSettings, rng: Rng = Math.random): string[] | null {
  const pool = normalizePool(s.pool);
  const tgt = targetOf(s);
  if (pool.length < s.players + 1) return null;
  for (let tries = 0; tries < 3000; tries++) {
    const militants = shuffle(
      pool.filter((id) => FACTION_BY_ID[id].type === "Militant"),
      rng,
    );
    const first = militants.length ? [militants[0]] : [];
    const rest = shuffle(
      pool.filter((id) => id !== first[0]),
      rng,
    ).slice(0, s.players + 1 - first.length);
    const deal = first.concat(rest);
    // A lone second Vagabond becomes the first one.
    if (deal.includes(SECOND_VAGABOND) && !deal.includes(VAGABOND))
      deal[deal.indexOf(SECOND_VAGABOND)] = VAGABOND;
    if (deal.includes(KNAVES) && deal.includes(VAGABOND)) continue;
    if (maxReach([], deal, s.players) >= tgt) return deal;
  }
  return null;
}

/** Build the starting state for a draft, dealing a hand if needed. Null if the settings cannot start. */
export function startDraft(settings: DraftSettings, rng: Rng = Math.random): DraftState | null {
  const s: DraftSettings = { ...settings, pool: normalizePool(settings.pool) };
  if (s.players < MIN_PLAYERS || s.players > MAX_PLAYERS || poolProblem(s)) return null;
  let deal: string[] = [];
  if (s.mode === "dealt") {
    const dealt = dealFor(s, rng);
    if (!dealt) return null;
    deal = dealt;
  }
  return { ...s, deal, picks: [] };
}

/* ---------- Moves (the server validates with these) ---------- */

export type PickError = "complete" | "not-your-turn" | "unavailable" | "blocked";
export type PickResult =
  | { ok: true; state: DraftState; warn?: string }
  | { ok: false; error: PickError; why: string };

/**
 * Validate and apply a pick. Pass `seat` to require that it is that seat's turn; omit it for a
 * host picking on behalf of whoever is up.
 */
export function applyPick(s: DraftState, id: string, seat?: number): PickResult {
  if (isComplete(s)) return { ok: false, error: "complete", why: "The draft is already complete" };
  if (seat !== undefined && seat !== currentSeat(s))
    return { ok: false, error: "not-your-turn", why: "It is not this seat's turn" };
  const option = options(s).find((o) => o.id === id);
  if (!option) return { ok: false, error: "unavailable", why: "That faction is not in this draft" };
  if (option.state === "taken")
    return { ok: false, error: "unavailable", why: "That faction is already taken" };
  if (option.state !== "open")
    return { ok: false, error: "blocked", why: option.state === "blocked" ? option.why : "" };
  return { ok: true, state: { ...s, picks: s.picks.concat(id) }, warn: option.warn };
}

export function undoPick(s: DraftState): DraftState {
  return { ...s, picks: s.picks.slice(0, -1) };
}
