/**
 * Fetch Open Bible Stories English v9 from Door43 and cache locally.
 * Run: npm run fetch:obs:en
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import https from 'node:https';
import { parseStoryMarkdown } from '../src/lib/parseObs';
import { obsCdnImage, UI_IMAGE_SIZE, EXPORT_IMAGE_SIZE } from '../src/lib/obsImage';

const BASE = 'https://git.door43.org/unfoldingWord/en_obs/raw/tag/v9/content';
const OUT = path.resolve(process.cwd(), 'cache/en/content');
const IMG_OUT = (size: string) => path.resolve(process.cwd(), `cache/en/images/${size}`);
const STORIES = Array.from({length:50}, (_,i)=>String(i+1).padStart(2,'0'));

function dl(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      fs.mkdir(path.dirname(dest), { recursive: true }).then(()=>{
        const file = (fs as any).createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => file.close().then(resolve));
      });
    }).on('error', reject);
  });
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  for (const id of STORIES) {
    const url = `${BASE}/${id}.md`;
    const dest = path.join(OUT, `${id}.md`);
    console.log('download', url);
    await dl(url, dest);

    // Parse sections to determine number of frames and image URLs if present
    const md = await fs.readFile(dest, 'utf8');
    const storyId = Number(id);
    const story = parseStoryMarkdown(md, storyId);
    // Cache images for UI and export sizes
    for (const section of story.sections) {
      const uiUrl = obsCdnImage(storyId, section.index, UI_IMAGE_SIZE);
      const exUrl = obsCdnImage(storyId, section.index, EXPORT_IMAGE_SIZE);
      const uiDest = path.join(IMG_OUT(UI_IMAGE_SIZE), `obs-en-${id}-${String(section.index).padStart(2,'0')}.jpg`);
      const exDest = path.join(IMG_OUT(EXPORT_IMAGE_SIZE), `obs-en-${id}-${String(section.index).padStart(2,'0')}.jpg`);
      console.log('cache img', uiUrl);
      await dl(uiUrl, uiDest);
      console.log('cache img', exUrl);
      await dl(exUrl, exDest);
    }
  }
  console.log('done');
}

main().catch(e => { console.error(e); process.exit(1); });
