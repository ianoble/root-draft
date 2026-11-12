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
  namesFrom,
  normalizeCode,
  parseCode,
  pickerOf,
  playerCode,
  seatOfPlayer,
  settingsFrom,
  stripSecretInfo,
  type DraftSetupData,
  type RootDraftState,
} from './game';

const ALL = FACTIONS.map((f) => f.id);
const game = { ...prepareGame(gameDef), seed: 'root-draft-test' };
const NAMES = ['Ian', 'Bea', 'Cal', 'Dee', 'Eli', 'Fay'];

function setupData(numPlayers: number, over: DraftSetupData = {}): DraftSetupData {
  return { room: 'TQ4M', names: NAMES.slice(0, numPlayers), ...over };
}
function setupG(numPlayers: number, over: DraftSetupData = {}): RootDraftState {
  return InitializeGame({ game, numPlayers, setupData: setupData(numPlayers, over) }).G as RootDraftState;
}

let matches = 0;
// The in-memory master creates each match without setupData, so skip the setup check there
// (validateSetupData has its own tests below).
const liveGame = { ...game, validateSetupData: undefined };

/**
 * One connected client per seat, all talking to the same in-memory master, like a real match.
 * Every guest enters their code unless `seated` is false.
 */
function table(numPlayers = 4, seated = true) {
  const multiplayer = Local();
  // boardgame.io reuses one in-memory master per game object, so each table needs its own match.
  const matchID = 'match-' + ++matches;
  const clients = Array.from({ length: numPlayers }, (_, i) => {
    const c = Client({ game: liveGame, numPlayers, multiplayer, playerID: String(i), matchID });
    c.start();
    return c;
  });
  const view = (playerID: string) => clients[Number(playerID)].getState()!.G as RootDraftState;
  const G = () => view(HOST);
  /** Send a move as a player; true if the host's view of the match changed. */
  const act = (playerID: string, name: string, ...args: unknown[]) => {
    const before = JSON.stringify(G());
    (clients[Number(playerID)].moves[name] as (...a: unknown[]) => void)(...args);
    return JSON.stringify(G()) !== before;
  };
  const secret = (playerID: string) => G().secrets[playerID];
  if (seated) for (let i = 1; i < numPlayers; i++) act(String(i), 'claim', secret(String(i)));
  const other = (...not: (string | null)[]) => String([0, 1, 2, 3, 4, 5].find((i) => !not.includes(String(i))));
  return { clients, view, G, act, secret, other };
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

describe('names and codes', () => {
  it('cleans names and fills gaps', () => {
    expect(namesFrom({ names: ['  Ian ', '', 7, 'x'.repeat(30)] }, 4)).toEqual(['Ian', 'Player 2', 'Player 3', 'x'.repeat(20)]);
    expect(namesFrom(undefined, 2)).toEqual(['Player 1', 'Player 2']);
  });

  it('reads codes however they are typed', () => {
    expect(normalizeCode(' tq4m-2k7qf ')).toBe('TQ4M2K7QF');
    expect(parseCode('tq4m 2k7qf')).toEqual({ room: 'TQ4M', playerID: '2', secret: 'K7QF' });
    expect(parseCode('TQ4M-0K7QF')).toBeNull(); // the host has no code
    expect(parseCode('TQ4M-9K7QF')).toBeNull();
    expect(parseCode('TQ4M-2K7Q')).toBeNull();
    expect(parseCode('')).toBeNull();
  });

  it('builds each guest a code that parses back to their seat', () => {
    const G = setupG(4);
    expect(playerCode(G, HOST)).toBeNull();
    for (const id of ['1', '2', '3']) {
      const code = playerCode(G, id)!;
      expect(code).toMatch(/^TQ4M-[123][A-Z2-9]{4}$/);
      expect(parseCode(code)).toEqual({ room: 'TQ4M', playerID: id, secret: G.secrets[id] });
    }
  });
});

describe('validateSetupData', () => {
  const validate = (data: unknown, n: number) => gameDef.game.validateSetupData!(data, n);

  it('accepts a full roster with the default or a workable pool', () => {
    expect(validate(setupData(4), 4)).toBeUndefined();
    expect(validate(setupData(4, { pool: ['m', 'e', 'd', 'a', 'v'] }), 4)).toBeUndefined();
  });

  it('needs a room code and a name per seat', () => {
    expect(validate(undefined, 4)).toMatch(/room code/);
    expect(validate({ room: 'TQ4M', names: ['a', 'b'] }, 4)).toMatch(/name for each of the 4/);
  });

  it('rejects pools that cannot seat the table or reach the target', () => {
    expect(validate(setupData(4, { pool: ['m', 'e'] }), 4)).toMatch(/cannot seat 4 players/);
    expect(validate(setupData(4, { pool: ['a', 'c', 'l', 't', 'r'] }), 4)).toMatch(/below the 21\+ target/);
  });

  it('rejects a dealt draft whose every hand breaks a rule', () => {
    expect(validate(setupData(4, { mode: 'dealt', pool: ['m', 'e', 'd', 'v', 'n'] }), 4)).toMatch(/No dealt hand/);
    expect(validate(setupData(4, { mode: 'dealt', pool: ['m', 'e', 'd', 'v', 'n', 'a'] }), 4)).toBeUndefined();
  });
});

describe('setup', () => {
  it('seats the roster, shuffles turn order and gives every guest a secret', () => {
    const G = setupG(5);
    expect(G.names).toEqual(['Ian', 'Bea', 'Cal', 'Dee', 'Eli']);
    expect(G.room).toBe('TQ4M');
    expect(G.turnOrder.slice().sort()).toEqual(['0', '1', '2', '3', '4']);
    expect(Object.keys(G.secrets)).toEqual(['1', '2', '3', '4']);
    expect(new Set(Object.values(G.secrets)).size).toBe(4);
    expect(G.claimed).toEqual({ 0: true, 1: false, 2: false, 3: false, 4: false });
    expect(G.draft.players).toBe(5);
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

describe('secrets', () => {
  it('are visible to the host only', () => {
    const G = setupG(3);
    expect(stripSecretInfo(G, HOST).secrets).toEqual(G.secrets);
    expect(stripSecretInfo(G, '1').secrets).toEqual({});
    expect(stripSecretInfo(G, null).secrets).toEqual({});
  });

  it('never reach other players over the wire, even after codes are entered', () => {
    const t = table(3);
    for (const id of ['1', '2']) {
      expect(t.view(id).secrets).toEqual({});
      expect(JSON.stringify(t.view(id))).not.toContain(t.secret('2'));
    }
    expect(Object.keys(t.G().secrets)).toEqual(['1', '2']);
  });
});

describe('checkMove', () => {
  it('explains refusals', () => {
    const G = { ...setupG(4), claimed: { 0: true, 1: true, 2: true, 3: true } };
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

  it('checks codes on the server and defers to it on clients', () => {
    const G = setupG(3);
    expect(checkMove(G, '1', 'claim', [G.secrets['1']])).toBe(true);
    expect(checkMove(G, '1', 'claim', [G.secrets['1'].toLowerCase()])).toBe(true);
    expect(checkMove(G, '1', 'claim', [G.secrets['2']])).toBe('That code does not match this seat');
    expect(checkMove(G, HOST, 'claim', ['ABCD'])).toBe('The host is already seated');
    // A guest's own view has no secrets, so their client sends the claim and the server decides.
    expect(checkMove(stripSecretInfo(G, '1'), '1', 'claim', ['ZZZZ'])).toBe(true);
  });
});

describe('a live match', () => {
  it('seats a guest only with the right code', () => {
    const t = table(3, false);
    expect(t.act('1', 'claim', 'ZZZZ')).toBe(false);
    expect(t.act('1', 'claim', t.secret('2'))).toBe(false);
    expect(t.G().claimed['1']).toBe(false);
    expect(t.act('1', 'claim', t.secret('1'))).toBe(true);
    expect(t.G().claimed).toEqual({ 0: true, 1: true, 2: false });
    // Other players see the claim, but not the code that was typed.
    expect(t.view('2').claimed['1']).toBe(true);
    expect(JSON.stringify(t.view('2'))).not.toContain(t.secret('1'));
  });

  it('does not let a guest pick before entering their code', () => {
    const t = table(4, false);
    const picker = pickerOf(t.G())!;
    if (picker !== HOST) {
      expect(t.act(picker, 'pick', 'm')).toBe(false);
      t.act(picker, 'claim', t.secret(picker));
    }
    expect(t.act(picker, 'pick', 'm')).toBe(true);
  });

  it('lets only the seat that is up pick', () => {
    const t = table();
    const picker = pickerOf(t.G())!;
    const bystander = t.other(picker, HOST);
    expect(t.act(bystander, 'pick', 'm')).toBe(false);
    expect(t.act(picker, 'pick', 'm')).toBe(true);
    expect(t.G().draft.picks).toEqual(['m']);
    if (picker !== HOST) expect(t.act(picker, 'pick', 'e')).toBe(false);
  });

  it('shows every pick to every player', () => {
    const t = table();
    t.act(pickerOf(t.G())!, 'pick', 'd');
    for (const c of t.clients) expect((c.getState()!.G as RootDraftState).draft.picks).toEqual(['d']);
  });

  it('lets the host pick for whoever is up, seated or not', () => {
    const t = table(4, false);
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
    const t = table(2);
    t.act(HOST, 'pick', 'm');
    expect(t.G().history.at(-1)).toMatchObject({ moveName: 'pick', args: ['m'], playerID: HOST });
  });
});
