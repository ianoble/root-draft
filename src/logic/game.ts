// The draft as a boardgame.io game for @noble/bg-engine. Rules live in ./draft; this file only
// maps them onto match setup, seats and moves. It is bundled into the game server as well as
// the client, so keep imports to ./draft, ../data, boardgame.io/core and @engine/client.

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

export interface RootDraftState extends BaseGameState {
  draft: DraftState;
  /** boardgame.io player ids in turn order (shuffled at setup): turnOrder[seat] is that seat's player. */
  turnOrder: string[];
  /** Set by the host once the lineup is final; ends the match. */
  locked: boolean;
}

/** What the host sends as boardgame.io setupData. The player count is the match's numPlayers. */
export type DraftSetupData = Partial<Omit<DraftSettings, 'players'>>;

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
 * client (to explain a refusal) and the server (to enforce it).
 */
export function checkMove(
  G: RootDraftState,
  playerID: string | null | undefined,
  moveName: string,
  args: unknown[],
): true | string {
  if (!G?.draft) return 'The draft has not loaded yet';
  if (G.locked) return 'The lineup is locked';
  const host = playerID === HOST;
  switch (moveName) {
    case 'pick': {
      const picker = pickerOf(G);
      if (picker === null) return 'Every seat has already picked';
      // The host may pick for whoever is up, so an absent player cannot stall the draft.
      if (playerID !== picker && !host) return 'It is not your pick yet';
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

export const RootDraftGame: Game<RootDraftState> = {
  name: GAME_ID,
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,

  validateSetupData: (setupData, numPlayers) => {
    if (numPlayers < MIN_PLAYERS || numPlayers > MAX_PLAYERS)
      return `A draft needs ${MIN_PLAYERS} to ${MAX_PLAYERS} players.`;
    return poolProblem(settingsFrom(setupData, numPlayers)) ?? undefined;
  },

  setup: ({ ctx, random }, setupData?: unknown): RootDraftState => {
    const rng = () => random.Number();
    // validateSetupData has already rejected impossible settings; the full open pool is the
    // fallback for matches created without going through it.
    const draft =
      startDraft(settingsFrom(setupData, ctx.numPlayers), rng) ??
      startDraft(settingsFrom(undefined, ctx.numPlayers), rng)!;
    return { draft, turnOrder: random.Shuffle(ctx.playOrder), locked: false, history: [] };
  },

  // The draft keeps its own pick order in G, and the host may act at any time, so every player
  // is always allowed to send moves; checkMove decides which ones are legal.
  turn: { activePlayers: ActivePlayers.ALL },

  moves: {
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
});
