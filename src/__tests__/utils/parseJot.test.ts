import { describe, it, expect } from 'vitest';
import { parseJotContent, extractTags, extractLinks } from '../../utils/parseJot';

describe('parseJotContent', () => {
  it('parses plain text without tags or links', () => {
    const content = 'This is a plain text jot';
    const result = parseJotContent(content);

    expect(result).toEqual([
      { type: 'text', value: 'This is a plain text jot' }
    ]);
  });

  it('parses content with a single tag', () => {
    const content = 'Meeting notes #work';
    const result = parseJotContent(content);

    expect(result).toEqual([
      { type: 'text', value: 'Meeting notes ' },
      { type: 'tag', value: 'work' }
    ]);
  });

  it('parses content with multiple tags', () => {
    const content = 'Project update #work #meeting #urgent';
    const result = parseJotContent(content);

    expect(result).toEqual([
      { type: 'text', value: 'Project update ' },
      { type: 'tag', value: 'work' },
      { type: 'text', value: ' ' },
      { type: 'tag', value: 'meeting' },
      { type: 'text', value: ' ' },
      { type: 'tag', value: 'urgent' }
    ]);
  });

  it('parses content with a single link', () => {
    const content = 'Meeting with [[Sarah]]';
    const result = parseJotContent(content);

    expect(result).toEqual([
      { type: 'text', value: 'Meeting with ' },
      { type: 'link', value: 'Sarah' }
    ]);
  });

  it('parses content with multiple links', () => {
    const content = 'Discussion between [[Alice]] and [[Bob]]';
    const result = parseJotContent(content);

    expect(result).toEqual([
      { type: 'text', value: 'Discussion between ' },
      { type: 'link', value: 'Alice' },
      { type: 'text', value: ' and ' },
      { type: 'link', value: 'Bob' }
    ]);
  });

  it('parses mixed content with tags and links', () => {
    const content = 'Meeting with [[Sarah]] about [[Project X]] #work #meeting';
    const result = parseJotContent(content);

    expect(result).toEqual([
      { type: 'text', value: 'Meeting with ' },
      { type: 'link', value: 'Sarah' },
      { type: 'text', value: ' about ' },
      { type: 'link', value: 'Project X' },
      { type: 'text', value: ' ' },
      { type: 'tag', value: 'work' },
      { type: 'text', value: ' ' },
      { type: 'tag', value: 'meeting' }
    ]);
  });

  it('parses tags with numbers and hyphens', () => {
    const content = 'Task #project-2024 #v2_beta';
    const result = parseJotContent(content);

    expect(result).toEqual([
      { type: 'text', value: 'Task ' },
      { type: 'tag', value: 'project-2024' },
      { type: 'text', value: ' ' },
      { type: 'tag', value: 'v2_beta' }
    ]);
  });

  it('does not parse # without following letter', () => {
    const content = 'Price is #123 dollars';
    const result = parseJotContent(content);

    expect(result).toEqual([
      { type: 'text', value: 'Price is #123 dollars' }
    ]);
  });

  it('parses links with spaces', () => {
    const content = 'Reference [[Project X]] and [[Weekly Standup]]';
    const result = parseJotContent(content);

    expect(result).toEqual([
      { type: 'text', value: 'Reference ' },
      { type: 'link', value: 'Project X' },
      { type: 'text', value: ' and ' },
      { type: 'link', value: 'Weekly Standup' }
    ]);
  });

  it('handles empty content', () => {
    const content = '';
    const result = parseJotContent(content);

    expect(result).toEqual([]);
  });

  it('handles content starting with tag', () => {
    const content = '#urgent meeting tomorrow';
    const result = parseJotContent(content);

    expect(result).toEqual([
      { type: 'tag', value: 'urgent' },
      { type: 'text', value: ' meeting tomorrow' }
    ]);
  });

  it('handles content ending with link', () => {
    const content = 'Check with [[Bob]]';
    const result = parseJotContent(content);

    expect(result).toEqual([
      { type: 'text', value: 'Check with ' },
      { type: 'link', value: 'Bob' }
    ]);
  });
});

describe('extractTags', () => {
  it('extracts single tag', () => {
    const content = 'Meeting notes #work';
    const result = extractTags(content);

    expect(result).toEqual(['work']);
  });

  it('extracts multiple tags', () => {
    const content = 'Project update #work #meeting #urgent';
    const result = extractTags(content);

    expect(result).toEqual(['work', 'meeting', 'urgent']);
  });

  it('extracts tags with numbers and special characters', () => {
    const content = 'Task #project-2024 #v2_beta #phase3';
    const result = extractTags(content);

    expect(result).toEqual(['project-2024', 'v2_beta', 'phase3']);
  });

  it('returns empty array when no tags', () => {
    const content = 'No tags here';
    const result = extractTags(content);

    expect(result).toEqual([]);
  });

  it('does not extract # without following letter', () => {
    const content = 'Price is #123';
    const result = extractTags(content);

    expect(result).toEqual([]);
  });

  it('extracts tags from mixed content', () => {
    const content = 'Meeting with [[Sarah]] #work and [[Bob]] #urgent';
    const result = extractTags(content);

    expect(result).toEqual(['work', 'urgent']);
  });

  it('handles empty content', () => {
    const content = '';
    const result = extractTags(content);

    expect(result).toEqual([]);
  });
});

describe('extractLinks', () => {
  it('extracts single link', () => {
    const content = 'Meeting with [[Sarah]]';
    const result = extractLinks(content);

    expect(result).toEqual(['Sarah']);
  });

  it('extracts multiple links', () => {
    const content = 'Discussion between [[Alice]] and [[Bob]]';
    const result = extractLinks(content);

    expect(result).toEqual(['Alice', 'Bob']);
  });

  it('extracts links with spaces', () => {
    const content = 'Reference [[Project X]] and [[Weekly Standup]]';
    const result = extractLinks(content);

    expect(result).toEqual(['Project X', 'Weekly Standup']);
  });

  it('returns empty array when no links', () => {
    const content = 'No links here';
    const result = extractLinks(content);

    expect(result).toEqual([]);
  });

  it('extracts links from mixed content', () => {
    const content = 'Meeting with [[Sarah]] #work about [[Project X]] #urgent';
    const result = extractLinks(content);

    expect(result).toEqual(['Sarah', 'Project X']);
  });

  it('handles empty content', () => {
    const content = '';
    const result = extractLinks(content);

    expect(result).toEqual([]);
  });

  it('handles nested brackets correctly', () => {
    const content = 'Link to [[Note [Draft]]]';
    const result = extractLinks(content);

    expect(result).toEqual(['Note [Draft']);
  });
});
