import { parseStoryMarkdown, markdownToText } from '../../lib/parseObs';

const SAMPLE = `# 32. Jesus Heals a Paralytic

![Frame 1](https://cdn.door43.org/obs/jpg/360px/obs-en-32-01.jpg)
Jesus healed a paralyzed man who was brought to him.

The crowds praised God.

![Frame 2](https://cdn.door43.org/obs/jpg/360px/obs-en-32-02.jpg)
The religious leaders were angry with Jesus.
`;

describe('markdownToText', () => {
  it('strips basic markdown', () => {
    expect(markdownToText('**Bold** and _italic_ and `code`')).toBe('Bold and italic and code');
  });
});

describe('parseStoryMarkdown', () => {
  it('parses sections with indices and text', () => {
    const story = parseStoryMarkdown(SAMPLE, 32);
    expect(story.id).toBe(32);
    expect(story.title.startsWith('32.')).toBe(true);
    expect(story.sections.length).toBe(2);
    expect(story.sections[0].index).toBe(1);
    expect(story.sections[0].storyId).toBe(32);
    expect(story.sections[0].imageUrl).toContain('obs-en-32-01');
    expect(story.sections[0].text).toContain('Jesus healed a paralyzed man');
    expect(story.sections[1].index).toBe(2);
    expect(story.sections[1].imageUrl).toContain('obs-en-32-02');
    expect(story.sections[1].text).toContain('religious leaders');
  });
});

