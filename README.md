# Root Faction Draft

A live draft room for choosing factions before a game of Root. It enforces the reach minimums
from the Law of Root (5.2), the Vagabond and Knaves combination rules, and a guard that blocks
or warns about picks that would leave the table unable to reach its target.

Vue client and boardgame.io game logic built on [@noble/bg-engine](https://github.com/ianoble/noble-bg-engine),
the same way as Zia and Western Legends. Server game id: `root-draft`.

## Prereqs

`noble-bg-engine` checked out at `../noble-bg-engine` or `../noblegames/noble-bg-engine`
(see `engine-root.ts`). The Vercel build clones it into the project instead.

## Dev

```bash
npm install
npm run dev
```

The client talks to the game server at `VITE_SERVER_URL` (default `http://localhost:8000`).
The server has to be built with this game included. From `noble-bg-engine`:

```bash
# PowerShell: $env:EXTERNAL_GAMES_CONFIG = '[{"slug":"root-draft","path":"C:/code/root-draft/src/logic/index.ts"}]'
export EXTERNAL_GAMES_CONFIG='[{"slug":"root-draft","path":"/abs/path/to/root-draft/src/logic/index.ts"}]'
npm run build -w packages/engine
npm run build -w packages/server
npm start -w packages/server
```

Without `DATABASE_URL` the server keeps matches in memory and sign-in accepts any name.

## How a draft works

- The host signs in, chooses the settings and pool, and creates the draft. The settings travel
  as boardgame.io `setupData`; the server rejects impossible ones with the same check the form uses.
- The host holds seat `0`. Other players open the invite link (`/join/:matchID`), sign in and
  take the next open seat. Turn order is shuffled when the match is created.
- Each seat picks when it is up. The host can also pick for whoever is up, undo the last pick,
  restart (re-dealing a dealt hand), and lock the finished lineup, which ends the match.
- Everyone sees picks live over the engine's Socket.IO connection.

## Layout

- `src/data/factions.ts`: faction data and reach targets. Lore and play text are original
  summaries; rules are linked, not copied.
- `src/logic/draft.ts`: pure draft rules (reach, validity, guard, dealing). No framework imports.
- `src/logic/game.ts`: the boardgame.io game and `defineGame` wrapper around those rules.
  `src/logic/index.ts` is the entry the server bundles, so keep its imports server-safe.
- `src/lib/api.ts`: lobby API calls (create, join, leave, list).
- `src/views/`: lobby, join link, draft room, faction browser.
- `src/components/`: faction cards and detail sheet, reach meter, seat list, setup form, sign-in.

## Tests

```bash
npm test          # rules, plus matches played through boardgame.io clients
npm run typecheck
```

## Deploy

- Vercel: `vercel.json` clones the engine during install and rewrites all paths to the SPA.
  Set `VITE_SERVER_URL` to the game server.
- Game server: add this site to `FRONTEND_URL` (comma-separated) and include this game in the
  server build, as above.
