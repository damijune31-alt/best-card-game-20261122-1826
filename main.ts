// RUNE CLASH — hand-in program (Node 22, standard library only).
// Stages game/ and screenshots/ into the output directory and writes
// dossier.json with the kit's buildDossier. The grader runs this program
// twice and compares both outputs byte for byte, so nothing here may vary
// between runs: no timestamps, no random values, no network access.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

function stage(name) {
  const src = join(repoRoot, name);
  if (!existsSync(src)) return 0;
  cpSync(src, join(outputDir, name), { recursive: true });
  return readdirSync(join(outputDir, name), { recursive: true }).length;
}

function totalBytes(dir) {
  let sum = 0;
  for (const entry of readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (entry.isFile()) sum += statSync(join(entry.parentPath, entry.name)).size;
  }
  return sum;
}

mkdirSync(outputDir, { recursive: true });
const stagedGame = stage('game');
const stagedShots = stage('screenshots');

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
const dossierPath = join(outputDir, 'dossier.json');
if (dossier.length > 1572864) throw new Error('dossier over the 1.5 MiB cap');
writeFileSync(dossierPath, dossier);

// Hand-in self-check: the dossier file as written must parse as JSON,
// and the staged trees must be plain files inside the platform's caps.
const parsed = JSON.parse(readFileSync(dossierPath, 'utf8'));
if (!parsed || typeof parsed !== 'object') throw new Error('dossier did not parse');
const outBytes = totalBytes(outputDir);
console.log(`dossier: ${dossierPath} (${dossier.length} bytes)`);
console.log(`staged: ${stagedGame} game entries, ${stagedShots} screenshots, ${outBytes} bytes in output`);
