function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function audioBasename(storyId: number, sectionIndex: number): string {
  return `obs-en-${pad2(storyId)}-${pad2(sectionIndex)}.m4a`;
}

export function audioRelativePath(storyId: number, sectionIndex: number): string {
  return `recordings/${audioBasename(storyId, sectionIndex)}`;
}

