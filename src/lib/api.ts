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
import { GAME_ID, type DraftSetupData } from '../logic';

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

/** Create a match. The server validates the setup with the same rules as the form. */
export async function createMatch(numPlayers: number, setupData: DraftSetupData): Promise<string> {
  const res = await fetch(`${base}/create`, {
    method: 'POST',
    headers: { ...json, ...authHeaders() },
    body: JSON.stringify({ numPlayers, setupData }),
  });
  if (!res.ok) throw new Error(await errorText(res, 'The server rejected this draft'));
  return ((await res.json()) as { matchID: string }).matchID;
}

/** Claim a seat (the first open one unless a seat is given) and remember it in this browser. */
export async function joinMatch(matchID: string, playerName: string, seat?: string): Promise<string> {
  let playerID = seat;
  if (playerID === undefined) {
    const match = await getMatch(matchID);
    if (!match) throw new Error('That draft does not exist');
    const open = match.players.find((p) => !p.name);
    if (!open) throw new Error('Every seat in this draft is taken');
    playerID = String(open.id);
  }
  const res = await fetch(`${base}/${matchID}/join`, {
    method: 'POST',
    headers: json,
    body: JSON.stringify({ playerID, playerName }),
  });
  if (!res.ok) throw new Error(await errorText(res, 'Could not claim a seat'));
  const { playerCredentials } = (await res.json()) as { playerCredentials: string };
  saveSession(GAME_ID, matchID, { playerID, credentials: playerCredentials, playerName });
  await syncSessionToServer(GAME_ID, matchID, playerID, playerCredentials, playerName);
  return playerID;
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

export function inviteLink(matchID: string): string {
  return `${window.location.origin}/join/${matchID}`;
}
