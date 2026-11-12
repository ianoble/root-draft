// Entry point bundled by the game server (noble-bg-engine build-external-games) and used by the client.
export {
  gameDef,
  RootDraftGame,
  GAME_ID,
  HOST,
  CODE_CHARS,
  ROOM_LENGTH,
  MAX_NAME_LENGTH,
  checkMove,
  cleanName,
  isRoomCode,
  namesFrom,
  normalizeCode,
  parseCode,
  pickerOf,
  playerCode,
  seatOfPlayer,
  settingsFrom,
  stripSecretInfo,
} from './game';
export type { RootDraftState, DraftSetupData } from './game';
export * from './draft';
