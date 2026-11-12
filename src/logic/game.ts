// The draft as a boardgame.io game for @noble/bg-engine. Rules live in ./draft; this file only
// maps them onto match setup, seats and moves. It is bundled into the game server as well as
// the client, so keep imports to ./draft, ../data, boardgame.io/core and @engine/client.
//
// Seating: the host lists every player when creating the draft. Player i in that list holds
// boardgame.io seat i; the host is player 0. Every other player gets a personal code
// (ROOM-<seat><secret>). The room part finds the match, the seat digit says which seat to take,
// and the secret, generated on the server and shown only to the host, proves it is theirs.

import type { Game } from 'boardgame.io';
import { ActivePlayers, INVALID_MOVE } from 'boardgame.io/core';
import { defineGame } from '@engine/client';
import type { BaseGameState } from '@engine/client';
import { FACTIONS } from '../data/factions';
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  applyPick,
  currentSeat,
  isComplete,
  normalizePool,
  poolProblem,
  startDraft,
  type DraftSettings,
  type DraftState,
} from './draft';

export const GAME_ID = 'root-draft';

/** The player who created the match always holds seat "0" and is the host. */
export const HOST = '0';

/** Characters used in room codes and seat secrets (no 0/O, 1/I/L). */
export const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const ROOM_LENGTH = 4;
export const SECRET_LENGTH = 4;
export const MAX_NAME_LENGTH = 20;

export interface RootDraftState extends BaseGameState {
  draft: DraftState;
  /** Player names by boardgame.io player id, as the host entered them. */
  names: string[];
  /** Short public code that identifies this draft; the first part of every player code. */
  room: string;
  /** Seat secrets by player id. Only the host's view contains them (see stripSecretInfo). */
  secrets: Record<string, string>;
  /** Whether each player has entered their code (the host is seated from the start). */
  claimed: Record<string, boolean>;
  /** boardgame.io player ids in turn order (shuffled at setup): turnOrder[seat] is that seat's player. */
  turnOrder: string[];
  /** Set by the host once the lineup is final; ends the match. */
  locked: boolean;
}

/** What the host sends as boardgame.io setupData. The player count is the match's numPlayers. */
export type DraftSetupData = Partial<Omit<DraftSettings, 'players'>> & {
  /** Player names, host first; one per seat. */
  names?: string[];
  room?: string;
};

/** Read untrusted setupData into settings, falling back to the defaults field by field. */
export function settingsFrom(setupData: unknown, players: number): DraftSettings {
  const d = (setupData && typeof setupData === 'object' ? setupData : {}) as Record<string, unknown>;
  const pool = Array.isArray(d.pool)
    ? d.pool.filter((id): id is string => typeof id === 'string')
    : FACTIONS.map((f) => f.id);
  return {
    players,
    mode: d.mode === 'dealt' ? 'dealt' : 'open',
    guard: d.guard === 'warn' ? 'warn' : 'block',
    goal: d.goal === 'adventurous' ? 'adventurous' : 'recommended',
    order: d.order === 'forward' ? 'forward' : 'reverse',
    pool: normalizePool(pool),
  };
}

export function cleanName(name: unknown, index: number): string {
  const s = typeof name === 'string' ? name.trim().slice(0, MAX_NAME_LENGTH) : '';
  return s || `Player ${index + 1}`;
}

/** Player names from untrusted setupData, one per seat. */
export function namesFrom(setupData: unknown, players: number): string[] {
  const raw = (setupData as { names?: unknown } | undefined)?.names;
  const list = Array.isArray(raw) ? raw : [];
  return Array.from({ length: players }, (_, i) => cleanName(list[i], i));
}

/** Upper-case a typed code and drop spaces, dashes and anything else outside the code alphabet. */
export function normalizeCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function isRoomCode(room: unknown): room is string {
  return typeof room === 'string' && new RegExp(`^[${CODE_CHARS}]{${ROOM_LENGTH}}$`).test(room);
}

/** The code the host gives player `playerID`, e.g. "TQ4M-2K7QF". */
export function playerCode(G: Pick<RootDraftState, 'room' | 'secrets'>, playerID: string): string | null {
  const secret = G.secrets[playerID];
  return secret ? `${G.room}-${playerID}${secret}` : null;
}

/** Split a typed code into room, seat and secret, or null if it cannot be one. */
export function parseCode(code: string): { room: string; playerID: string; secret: string } | null {
  const c = normalizeCode(code);
  if (c.length !== ROOM_LENGTH + 1 + SECRET_LENGTH) return null;
  const room = c.slice(0, ROOM_LENGTH);
  const playerID = c.slice(ROOM_LENGTH, ROOM_LENGTH + 1);
  const secret = c.slice(ROOM_LENGTH + 1);
  const seat = Number(playerID);
  if (!isRoomCode(room) || !(seat >= 1 && seat < MAX_PLAYERS)) return null;
  return { room, playerID, secret };
}

/** Player whose pick it is, or null once every seat has picked. */
export function pickerOf(G: RootDraftState): string | null {
  const seat = currentSeat(G.draft);
  return seat < 0 ? null : G.turnOrder[seat];
}

/** Seat (position in turn order) held by a player, or -1. */
export function seatOfPlayer(G: RootDraftState, playerID: string | null): number {
  return playerID == null ? -1 : G.turnOrder.indexOf(playerID);
}

/**
 * Whether a player may make a move right now: true, or the reason why not. Shared by the
 * client (to explain a refusal) and the server (to enforce it). Players other than the host
 * see no secrets, so their client lets a claim through and the server decides.
 */
export function checkMove(
  G: RootDraftState,
  playerID: string | null | undefined,
  moveName: string,
  args: unknown[],
): true | string {
  if (!G?.draft) return 'The draft has not loaded yet';
  const host = playerID === HOST;
  if (moveName === 'claim') {
    if (playerID == null || host) return 'The host is already seated';
    if (G.claimed[playerID]) return true;
    const [secret] = args;
    if (typeof secret !== 'string') return 'Enter your code';
    const expected = G.secrets[playerID];
    if (expected !== undefined && normalizeCode(secret) !== expected) return 'That code does not match this seat';
    return true;
  }
  if (G.locked) return 'The lineup is locked';
  switch (moveName) {
    case 'pick': {
      const picker = pickerOf(G);
      if (picker === null) return 'Every seat has already picked';
      // The host may pick for whoever is up, so an absent player cannot stall the draft.
      if (playerID !== picker && !host) return 'It is not your pick yet';
      if (!host && !G.claimed[picker]) return 'Enter your code before picking';
      const [id] = args;
      if (typeof id !== 'string') return 'Choose a faction';
      const result = applyPick(G.draft, id);
      return result.ok ? true : result.why;
    }
    case 'undo':
      if (!host) return 'Only the host can undo a pick';
      return G.draft.picks.length ? true : 'There is nothing to undo';
    case 'restart':
      return host ? true : 'Only the host can restart the draft';
    case 'lock':
      if (!host) return 'Only the host can lock the lineup';
      return isComplete(G.draft) ? true : 'Every seat must pick before the lineup is locked';
    default:
      return `Unknown move: ${moveName}`;
  }
}

/** Hide seat secrets, and the codes typed into claim moves, from everyone but the host. */
export function stripSecretInfo(G: RootDraftState, playerID: string | null): RootDraftState {
  if (playerID === HOST) return G;
  return {
    ...G,
    secrets: {},
    history: G.history.map((e) => (e.moveName === 'claim' ? { ...e, args: [] } : e)),
  };
}

export const RootDraftGame: Game<RootDraftState> = {
  name: GAME_ID,
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,

  validateSetupData: (setupData, numPlayers) => {
    if (numPlayers < MIN_PLAYERS || numPlayers > MAX_PLAYERS)
      return `A draft needs ${MIN_PLAYERS} to ${MAX_PLAYERS} players.`;
    const d = setupData as DraftSetupData | undefined;
    if (!isRoomCode(d?.room)) return 'Missing room code.';
    if (!Array.isArray(d?.names) || d.names.length !== numPlayers)
      return `Enter a name for each of the ${numPlayers} players.`;
    return poolProblem(settingsFrom(setupData, numPlayers)) ?? undefined;
  },

  setup: ({ ctx, random }, setupData?: unknown): RootDraftState => {
    const rng = () => random.Number();
    // validateSetupData has already rejected impossible settings; the full open pool is the
    // fallback for matches created without going through it.
    const draft =
      startDraft(settingsFrom(setupData, ctx.numPlayers), rng) ??
      startDraft(settingsFrom(undefined, ctx.numPlayers), rng)!;
    const room = (setupData as DraftSetupData | undefined)?.room;
    const secrets: Record<string, string> = {};
    const claimed: Record<string, boolean> = { [HOST]: true };
    for (const id of ctx.playOrder) {
      if (id === HOST) continue;
      let secret = '';
      for (let i = 0; i < SECRET_LENGTH; i++) secret += CODE_CHARS[Math.floor(rng() * CODE_CHARS.length)];
      secrets[id] = secret;
      claimed[id] = false;
    }
    return {
      draft,
      names: namesFrom(setupData, ctx.numPlayers),
      room: isRoomCode(room) ? room : 'ROOM',
      secrets,
      claimed,
      turnOrder: random.Shuffle(ctx.playOrder),
      locked: false,
      history: [],
    };
  },

  // The draft keeps its own pick order in G, and the host may act at any time, so every player
  // is always allowed to send moves; checkMove decides which ones are legal.
  turn: { activePlayers: ActivePlayers.ALL },

  moves: {
    claim: {
      // Secrets exist only on the server, and the typed code is kept out of other players' logs.
      client: false,
      redact: true,
      move: ({ G, playerID }, secret: string) => {
        if (checkMove(G, playerID, 'claim', [secret]) !== true) return INVALID_MOVE;
        G.claimed[playerID] = true;
      },
    },
    pick: ({ G, playerID }, id: string) => {
      if (checkMove(G, playerID, 'pick', [id]) !== true) return INVALID_MOVE;
      G.draft.picks.push(id);
    },
    undo: ({ G, playerID }) => {
      if (checkMove(G, playerID, 'undo', []) !== true) return INVALID_MOVE;
      G.draft.picks.pop();
    },
    restart: {
      // Re-deals with the match's random state, which only the server has.
      client: false,
      move: ({ G, playerID, random }) => {
        if (checkMove(G, playerID, 'restart', []) !== true) return INVALID_MOVE;
        const next = startDraft(G.draft, () => random.Number());
        if (!next) return INVALID_MOVE;
        G.draft = next;
      },
    },
    lock: ({ G, playerID }) => {
      if (checkMove(G, playerID, 'lock', []) !== true) return INVALID_MOVE;
      G.locked = true;
    },
  },

  endIf: ({ G }) => (G.locked ? { locked: true } : undefined),
};

export const gameDef = defineGame<RootDraftState>({
  game: RootDraftGame,
  id: GAME_ID,
  displayName: 'Root Faction Draft',
  description: 'Draft factions for a game of Root, with the reach rules checked as you pick.',
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,
  validateMove: ({ G, playerID }, moveName, ...args) => checkMove(G, playerID, moveName, args),
  stripSecretInfo,
});
