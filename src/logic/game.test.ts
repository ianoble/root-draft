import { describe, expect, it } from 'vitest';
import { Client } from 'boardgame.io/client';
import { Local } from 'boardgame.io/multiplayer';
import { InitializeGame } from 'boardgame.io/internal';
import { prepareGame } from '@engine/prepare';
import { FACTIONS } from '../data/factions';
import { currentSeat, maxReach, reachOf, targetOf, validSet } from './draft';
import {
  HOST,
  checkMove,
  gameDef,
  pickerOf,
  seatOfPlayer,
  settingsFrom,
  type DraftSetupData,
  type RootDraftState,
} from './game';

const ALL = FACTIONS.map((f) => f.id);
const game = { ...prepareGame(gameDef), seed: 'root-draft-test' };

function setupG(numPlayers: number, setupData?: DraftSetupData): RootDraftState {
  return InitializeGame({ game, numPlayers, setupData }).G as RootDraftState;
}

let matches = 0;

/** One connected client per seat, all talking to the same in-memory master, like a real match. */
function table(numPlayers = 4) {
  const multiplayer = Local();
  // boardgame.io reuses one in-memory master per game object, so each table needs its own match.
  const matchID = 'match-' + ++matches;
  const clients = Array.from({ length: numPlayers }, (_, i) => {
    const c = Client({ game, numPlayers, multiplayer, playerID: String(i), matchID });
    c.start();
    return c;
  });
  const G = () => clients[0].getState()!.G as RootDraftState;
  /** Send a move as a player; true if the match accepted it. */
  const act = (playerID: string, name: string, ...args: unknown[]) => {
    const before = JSON.stringify(G());
    (clients[Number(playerID)].moves[name] as (...a: unknown[]) => void)(...args);
    return JSON.stringify(G()) !== before;
  };
  const other = (...not: (string | null)[]) => String([0, 1, 2, 3, 4, 5].find((i) => !not.includes(String(i))));
  return { clients, G, act, other };
}

describe('definition', () => {
  it('registers as root-draft for 2 to 6 players', () => {
    expect(gameDef.id).toBe('root-draft');
    expect([gameDef.minPlayers, gameDef.maxPlayers]).toEqual([2, 6]);
  });
});

describe('settingsFrom', () => {
  it('defaults to an open, guarded draft over every faction', () => {
    expect(settingsFrom(undefined, 4)).toEqual({
      players: 4,
      mode: 'open',
      guard: 'block',
      goal: 'recommended',
      order: 'reverse',
      pool: ALL,
    });
  });

  it('keeps valid choices and ignores junk', () => {
    const s = settingsFrom({ mode: 'dealt', guard: 'warn', goal: 'adventurous', order: 'forward', pool: ['m', 'w', 7, 'zz', 'e'] }, 3);
    expect(s).toEqual({ players: 3, mode: 'dealt', guard: 'warn', goal: 'adventurous', order: 'forward', pool: ['m', 'e'] });
    expect(settingsFrom({ mode: 'nope', pool: 'm' }, 2)).toMatchObject({ mode: 'open', pool: ALL });
  });
});

describe('validateSetupData', () => {
  const validate = (data: unknown, n: number) => gameDef.game.validateSetupData!(data, n);

  it('accepts the defaults and a workable custom pool', () => {
    expect(validate(undefined, 4)).toBeUndefined();
    expect(validate({ pool: ['m', 'e', 'd', 'a', 'v'] }, 4)).toBeUndefined();
  });

  it('rejects pools that cannot seat the table or reach the target', () => {
    expect(validate({ pool: ['m', 'e'] }, 4)).toMatch(/cannot seat 4 players/);
    expect(validate({ pool: ['a', 'c', 'l', 't', 'r'] }, 4)).toMatch(/below the 21\+ target/);
    expect(validate({ pool: [] }, 2)).toMatch(/cannot seat/);
  });

  it('rejects a dealt draft whose every hand breaks a rule', () => {
    // Exactly players + 1 factions including both the Vagabond and the Knaves: every deal is illegal.
    expect(validate({ mode: 'dealt', pool: ['m', 'e', 'd', 'v', 'n'] }, 4)).toMatch(/No dealt hand/);
    expect(validate({ mode: 'dealt', pool: ['m', 'e', 'd', 'v', 'n', 'a'] }, 4)).toBeUndefined();
  });
});

describe('setup', () => {
  it('shuffles every player into the turn order', () => {
    const G = setupG(5);
    expect(G.turnOrder.slice().sort()).toEqual(['0', '1', '2', '3', '4']);
    expect(G.draft.players).toBe(5);
    expect(G.draft.picks).toEqual([]);
    expect(G.locked).toBe(false);
  });

  it('applies the host settings', () => {
    const G = setupG(3, { guard: 'warn', order: 'forward', pool: ['m', 'e', 'a', 'c'] });
    expect(G.draft).toMatchObject({ mode: 'open', guard: 'warn', order: 'forward', pool: ['m', 'e', 'a', 'c'], deal: [] });
    expect(pickerOf(G)).toBe(G.turnOrder[0]);
  });

  it('deals a legal hand of players + 1 for a dealt draft', () => {
    const G = setupG(4, { mode: 'dealt' });
    expect(G.draft.deal).toHaveLength(5);
    expect(maxReach([], G.draft.deal, 4)).toBeGreaterThanOrEqual(21);
  });

  it('starts with the last seat by default', () => {
    const G = setupG(4);
    expect(pickerOf(G)).toBe(G.turnOrder[3]);
    expect(seatOfPlayer(G, G.turnOrder[3])).toBe(3);
    expect(seatOfPlayer(G, null)).toBe(-1);
  });
});

describe('checkMove', () => {
  it('explains refusals', () => {
    const G = setupG(4);
    const picker = pickerOf(G)!;
    const bystander = ['1', '2', '3'].find((p) => p !== picker)!;
    expect(checkMove(G, picker, 'pick', ['m'])).toBe(true);
    expect(checkMove(G, bystander, 'pick', ['m'])).toBe('It is not your pick yet');
    expect(checkMove(G, null, 'pick', ['m'])).toBe('It is not your pick yet');
    expect(checkMove(G, picker, 'pick', ['w'])).toBe('Opens once the first Vagabond is taken');
    expect(checkMove(G, picker, 'pick', [])).toBe('Choose a faction');
    expect(checkMove(G, bystander, 'undo', [])).toBe('Only the host can undo a pick');
    expect(checkMove(G, HOST, 'undo', [])).toBe('There is nothing to undo');
    expect(checkMove(G, HOST, 'lock', [])).toMatch(/Every seat must pick/);
    expect(checkMove(G, HOST, 'dance', [])).toMatch(/Unknown move/);
  });
});

describe('a live match', () => {
  it('lets only the seat that is up pick', () => {
    const t = table();
    const picker = pickerOf(t.G())!;
    const bystander = t.other(picker, HOST);
    expect(t.act(bystander, 'pick', 'm')).toBe(false);
    expect(t.act(picker, 'pick', 'm')).toBe(true);
    expect(t.G().draft.picks).toEqual(['m']);
    // The same seat cannot pick twice.
    if (picker !== HOST) expect(t.act(picker, 'pick', 'e')).toBe(false);
  });

  it('shows every pick to every player', () => {
    const t = table();
    t.act(pickerOf(t.G())!, 'pick', 'd');
    for (const c of t.clients) expect((c.getState()!.G as RootDraftState).draft.picks).toEqual(['d']);
  });

  it('lets the host pick for whoever is up', () => {
    const t = table();
    expect(t.act(HOST, 'pick', 'm')).toBe(true);
    expect(t.act(HOST, 'pick', 'e')).toBe(true);
    expect(t.G().draft.picks).toEqual(['m', 'e']);
  });

  it('rejects taken, blocked and unknown factions', () => {
    const t = table();
    t.act(HOST, 'pick', 'm');
    expect(t.act(HOST, 'pick', 'm')).toBe(false);
    expect(t.act(HOST, 'pick', 'w')).toBe(false);
    expect(t.act(HOST, 'pick', 'zz')).toBe(false);
    expect(t.G().draft.picks).toEqual(['m']);
  });

  it('enforces the reach guard on the server', () => {
    const t = table();
    // 4 players need 21. After a + c + l (8) even the Marquise (10) only reaches 18.
    t.act(HOST, 'pick', 'a');
    t.act(HOST, 'pick', 'c');
    expect(t.act(HOST, 'pick', 'l')).toBe(false);
    expect(t.act(HOST, 'pick', 'm')).toBe(true);
  });

  it('keeps undo, restart and lock for the host', () => {
    const t = table();
    t.act(HOST, 'pick', 'm');
    const guest = t.other(HOST);
    expect(t.act(guest, 'undo')).toBe(false);
    expect(t.act(guest, 'restart')).toBe(false);
    expect(t.act(HOST, 'undo')).toBe(true);
    expect(t.G().draft.picks).toEqual([]);
    expect(t.act(HOST, 'undo')).toBe(false);
    t.act(HOST, 'pick', 'm');
    expect(t.act(HOST, 'restart')).toBe(true);
    expect(t.G().draft.picks).toEqual([]);
  });

  it('runs a whole draft in pick order, then locks', () => {
    const t = table();
    const order = t.G().turnOrder;
    const picks = ['m', 'e', 'a', 'v'];
    picks.forEach((id, i) => {
      expect(pickerOf(t.G())).toBe(order[3 - i]);
      expect(t.act(order[3 - i], 'pick', id)).toBe(true);
    });
    const { draft } = t.G();
    expect(currentSeat(draft)).toBe(-1);
    expect(pickerOf(t.G())).toBeNull();
    expect(validSet(draft.picks)).toBe(true);
    expect(reachOf(draft.picks)).toBeGreaterThanOrEqual(targetOf(draft));
    expect(t.act(HOST, 'pick', 'd')).toBe(false);

    expect(t.act(t.other(HOST), 'lock')).toBe(false);
    expect(t.act(HOST, 'lock')).toBe(true);
    expect(t.clients[1].getState()!.ctx.gameover).toEqual({ locked: true });
    // Nothing changes after the lock.
    expect(t.act(HOST, 'undo')).toBe(false);
    expect(t.G().draft.picks).toEqual(picks);
  });

  it('cannot lock an unfinished draft', () => {
    const t = table();
    t.act(HOST, 'pick', 'm');
    expect(t.act(HOST, 'lock')).toBe(false);
    expect(t.G().locked).toBe(false);
  });

  it('records moves in the engine history', () => {
    const t = table();
    t.act(HOST, 'pick', 'm');
    expect(t.G().history).toMatchObject([{ moveName: 'pick', args: ['m'], playerID: HOST }]);
  });
});
