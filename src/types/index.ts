export interface Section {
  storyId: number;       // 1..50
  index: number;         // 1..N, e.g. 3 in 32:3
  text: string;          // plain text, no markdown
  imageUrl: string;      // CDN URL
  audioPath?: string;
  durationMs?: number;
}

export interface Story {
  id: number;
  title: string;
  sections: Section[];
}
