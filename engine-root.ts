import fs from 'node:fs';
import path from 'node:path';

// Engine source: an in-project copy (cloned by the Vercel build), or a local checkout next to
// this repo or next to the other games in ../noblegames.
const candidates = ['noble-bg-engine', '../noble-bg-engine', '../noblegames/noble-bg-engine'];

export const engineRoot = path.resolve(
  __dirname,
  candidates.find((dir) => fs.existsSync(path.resolve(__dirname, dir))) ?? candidates[0],
);

export const engineAlias = { '@engine': path.join(engineRoot, 'packages/engine/src') };
