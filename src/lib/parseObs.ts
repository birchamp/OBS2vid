import type { Story, Section } from '../types';

// Strip minimal Markdown to get readable plain text for UI and captions
export function markdownToText(markdown: string): string {
  return markdown
    .replace(/\r/g, '')
    .replace(/^#\s+.*$/gm, '') // drop headings
    .replace(/```[\s\S]*?```/g, '') // drop code fences
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // links
    .replace(/\!\[[^\]]*\]\(([^)]+)\)/g, '') // images (handled separately)
    .replace(/[ \t]+$/gm, '')
    .trim();
}

// Parse OBS story markdown into a Story object with Sections.
// Splits on image lines and collects following prose until the next image.
export function parseStoryMarkdown(md: string, storyId: number): Story {
  const lines = md.split(/\r?\n/);
  const imgRe = /^!\[[^\]]*\]\(([^)]+)\)/;

  const rawSections: { imageUrl: string; text: string }[] = [];
  let current: { imageUrl: string; text: string } | null = null;

  for (const line of lines) {
    const t = line.trim();
    const m = imgRe.exec(t);
    if (m) {
      if (current) rawSections.push(current);
      current = { imageUrl: m[1], text: '' };
    } else if (current) {
      current.text += (current.text ? '\n' : '') + line;
    }
  }
  if (current) rawSections.push(current);

  const sections: Section[] = rawSections.map((s, i) => ({
    storyId,
    index: i + 1,
    text: markdownToText(s.text),
    imageUrl: s.imageUrl,
  }));

  // Try to infer title from first H1 if present, fallback to numeric id
  const titleMatch = md.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : `Story ${String(storyId).padStart(2, '0')}`;

  return { id: storyId, title, sections };
}
