import fs from 'node:fs/promises';
import path from 'node:path';
import { parseStoryMarkdown } from '../src/lib/parseObs';
import { obsCdnImage, UI_IMAGE_SIZE } from '../src/lib/obsImage';

const CONTENT_DIR = path.resolve(process.cwd(), 'cache/en/content');
const OUT_JSON = path.resolve(process.cwd(), 'app/assets/en_obs.json');

async function exists(p: string) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function main() {
  if (!(await exists(CONTENT_DIR))) {
    console.error('Missing cache dir', CONTENT_DIR, '\nRun: npm run fetch:obs:en');
    process.exit(1);
  }
  const stories: any[] = [];
  for (let id = 1; id <= 50; id++) {
    const file = path.join(CONTENT_DIR, String(id).padStart(2, '0') + '.md');
    if (!(await exists(file))) {
      console.warn('Skip missing', file);
      continue;
    }
    const md = await fs.readFile(file, 'utf8');
    const story = parseStoryMarkdown(md, id);
    // Normalize image URLs to canonical CDN at UI size
    story.sections = story.sections.map(s => ({
      ...s,
      imageUrl: obsCdnImage(story.id, s.index, UI_IMAGE_SIZE),
    }));
    stories.push(story);
  }

  await fs.mkdir(path.dirname(OUT_JSON), { recursive: true });
  await fs.writeFile(OUT_JSON, JSON.stringify({ stories }, null, 2), 'utf8');
  console.log('Wrote', OUT_JSON, 'with', stories.length, 'stories');
}

main().catch(e => { console.error(e); process.exit(1); });

