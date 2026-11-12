// Calls to the shared game server's lobby API (boardgame.io) plus the engine's seat sessions.
// A "session" is this browser's seat in a match: player id, credentials and display name.

import { clearSession, loadSession, saveSession } from '@engine/client';
import { SERVER_URL } from '../config';
import {
  authHeaders,
  deleteServerSession,
  fetchServerSessions,
  syncSessionToServer,
} from '../composables/useAuth';
import {
  CODE_CHARS,
  GAME_ID,
  HOST,
  ROOM_LENGTH,
  cleanName,
  parseCode,
  type DraftSetupData,
} from '../logic';

export interface MatchPlayer {
  id: number;
  name?: string;
}

export interface MatchInfo {
  matchID: string;
  players: MatchPlayer[];
  setupData?: DraftSetupData;
  gameover?: unknown;
  createdAt: number;
  updatedAt: number;
}

const base = `${SERVER_URL}/games/${GAME_ID}`;
const json = { 'Content-Type': 'application/json' };

async function errorText(res: Response, fallback: string): Promise<string> {
  const body = await res.text().catch(() => '');
  try {
    const parsed = body ? JSON.parse(body) : null;
    return parsed?.error || parsed?.message || fallback;
  } catch {
    return body || fallback;
  }
}

export async function listMatches(): Promise<MatchInfo[]> {
  const res = await fetch(base);
  if (!res.ok) throw new Error('Could not reach the game server');
  return ((await res.json()).matches ?? []) as MatchInfo[];
}

export async function getMatch(matchID: string): Promise<MatchInfo | null> {
  const res = await fetch(`${base}/${matchID}`);
  if (!res.ok) return null;
  return { ...((await res.json()) as MatchInfo), matchID };
}

/** A room code no current draft is using. */
async function newRoomCode(): Promise<string> {
  const taken = new Set((await listMatches()).map((m) => m.setupData?.room));
  for (;;) {
    let room = '';
    for (let i = 0; i < ROOM_LENGTH; i++) room += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    if (!taken.has(room)) return room;
  }
}

/**
 * Create a draft for the named players (host first) and take the host's seat. The server
 * validates the setup with the same rules as the form, and generates each player's code.
 */
export async function createDraft(setupData: DraftSetupData, names: string[]): Promise<string> {
  const room = await newRoomCode();
  const res = await fetch(`${base}/create`, {
    method: 'POST',
    headers: { ...json, ...authHeaders() },
    body: JSON.stringify({ numPlayers: names.length, setupData: { ...setupData, names, room } }),
  });
  if (!res.ok) throw new Error(await errorText(res, 'The server rejected this draft'));
  const { matchID } = (await res.json()) as { matchID: string };
  await joinSeat(matchID, HOST, names[0]);
  return matchID;
}

async function joinSeat(matchID: string, playerID: string, playerName: string): Promise<void> {
  const res = await fetch(`${base}/${matchID}/join`, {
    method: 'POST',
    headers: json,
    body: JSON.stringify({ playerID, playerName }),
  });
  if (!res.ok) throw new Error(await errorText(res, 'Could not take that seat'));
  const { playerCredentials } = (await res.json()) as { playerCredentials: string };
  saveSession(GAME_ID, matchID, { playerID, credentials: playerCredentials, playerName });
  await syncSessionToServer(GAME_ID, matchID, playerID, playerCredentials, playerName);
}

const CODE_KEY = (matchID: string) => `root-draft:code:${matchID}`;

/** The code this browser used to join a match, kept so the seat can be confirmed after connecting. */
export function savedCode(matchID: string): string | null {
  return localStorage.getItem(CODE_KEY(matchID));
}

export function saveCode(matchID: string, code: string): void {
  localStorage.setItem(CODE_KEY(matchID), code);
}

/**
 * Find the draft a player's code belongs to and take that seat. Returns the match and seat to
 * open. Confirming the code itself happens in the draft room, where the server checks it.
 */
export async function joinWithCode(code: string): Promise<{ matchID: string; playerID: string }> {
  const parsed = parseCode(code);
  if (!parsed) throw new Error('That does not look like a draft code. It should look like TQ4M-2K7QF.');
  const { room, playerID, secret } = parsed;

  const candidates = (await listMatches())
    .filter((m) => m.setupData?.room === room && !m.gameover)
    .sort((a, b) => b.createdAt - a.createdAt);
  const match = candidates[0];
  if (!match) throw new Error('No open draft uses that code. Check it with your host.');
  const { matchID } = match;

  // Already seated here, in this browser or (once restored) on this account.
  await restoreSeats();
  const session = loadSession(GAME_ID, matchID);
  if (session) {
    if (session.playerID !== playerID) throw new Error('You already hold a different seat in this draft.');
    saveCode(matchID, secret);
    return { matchID, playerID };
  }

  const seat = match.players.find((p) => String(p.id) === playerID);
  if (!seat) throw new Error('No open draft uses that code. Check it with your host.');
  if (seat.name) {
    throw new Error(
      'Someone has already used this code. If that was you on another device, sign in with the same account there.',
    );
  }
  const name = cleanName(match.setupData?.names?.[Number(playerID)], Number(playerID));
  await joinSeat(matchID, playerID, name);
  saveCode(matchID, secret);
  return { matchID, playerID };
}

/** Give up this browser's seat. Local state is cleared even if the server call fails. */
export async function leaveMatch(matchID: string): Promise<void> {
  const session = loadSession(GAME_ID, matchID);
  if (!session) return;
  try {
    await fetch(`${base}/${matchID}/leave`, {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ playerID: session.playerID, credentials: session.credentials }),
    });
  } catch {
    /* best effort */
  }
  clearSession(GAME_ID, matchID);
  localStorage.removeItem(CODE_KEY(matchID));
  await deleteServerSession(GAME_ID, matchID);
}

/** Seats this browser holds, keyed by match id. */
export function mySeats(): Record<string, string> {
  const prefix = `bgf:session:${GAME_ID}:`;
  const seats: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(prefix)) continue;
    const matchID = key.slice(prefix.length);
    const session = loadSession(GAME_ID, matchID);
    if (session) seats[matchID] = session.playerID;
  }
  return seats;
}

/** Copy seats saved against the signed-in account into this browser (e.g. on a second device). */
export async function restoreSeats(): Promise<void> {
  for (const s of await fetchServerSessions()) {
    if (s.gameName !== GAME_ID || loadSession(GAME_ID, s.matchID)) continue;
    saveSession(GAME_ID, s.matchID, {
      playerID: s.playerSeatID,
      credentials: s.credentials,
      playerName: s.playerName,
    });
  }
}

/** Link that opens the site with a player's code filled in. */
export function codeLink(code: string): string {
  return `${window.location.origin}/?code=${encodeURIComponent(code)}`;
}
