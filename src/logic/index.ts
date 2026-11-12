// Entry point bundled by the game server (noble-bg-engine build-external-games) and used by the client.
export { gameDef, RootDraftGame, GAME_ID, HOST, checkMove, pickerOf, seatOfPlayer, settingsFrom } from './game';
export type { RootDraftState, DraftSetupData } from './game';
export * from './draft';
