export type SegmentType = "text" | "tag" | "link";

export interface ParsedSegment {
  type: SegmentType;
  value: string;
}

/**
 * Parse jot content into segments for syntax highlighting
 *
 * Segments allow UI to render different styles for tags (#tag) and links ([[link]]).
 *
 * @param content - The raw jot content
 * @returns Array of parsed segments with type and value
 *
 * @example
 * parseJotContent("Meeting with [[Sarah]] about #project")
 * // Returns: [
 * //   { type: "text", value: "Meeting with " },
 * //   { type: "link", value: "Sarah" },
 * //   { type: "text", value: " about " },
 * //   { type: "tag", value: "project" }
 * // ]
 */
export function parseJotContent(content: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];

  // Pattern to match tags (#tag) and links ([[link]])
  // Tags: #followed by letter, then letters/numbers/underscores/hyphens
  // Links: [[any content except ]]]
  const pattern = /(#[a-zA-Z][a-zA-Z0-9_-]*)|(\[\[([^\]]+)\]\])/g;

  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(content)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        value: content.substring(lastIndex, match.index)
      });
    }

    // Add the match (tag or link)
    if (match[1]) {
      // It's a tag (with #)
      segments.push({
        type: "tag",
        value: match[1].substring(1) // Remove the # prefix
      });
    } else if (match[3]) {
      // It's a link (content inside [[]])
      segments.push({
        type: "link",
        value: match[3]
      });
    }

    lastIndex = pattern.lastIndex;
  }

  // Add remaining text after last match
  if (lastIndex < content.length) {
    segments.push({
      type: "text",
      value: content.substring(lastIndex)
    });
  }

  return segments;
}

/**
 * Extract all tags from content (without # prefix)
 *
 * @param content - The raw jot content
 * @returns Array of tag names (without #)
 *
 * @example
 * extractTags("Meeting about #project #work")
 * // Returns: ["project", "work"]
 */
export function extractTags(content: string): string[] {
  const tagPattern = /#([a-zA-Z][a-zA-Z0-9_-]*)/g;
  const tags: string[] = [];
  let match;

  while ((match = tagPattern.exec(content)) !== null) {
    tags.push(match[1]);
  }

  return tags;
}

/**
 * Extract all wiki-links from content (without [[ ]])
 *
 * @param content - The raw jot content
 * @returns Array of link targets (without brackets)
 *
 * @example
 * extractLinks("Meeting with [[Sarah]] about [[Project X]]")
 * // Returns: ["Sarah", "Project X"]
 */
export function extractLinks(content: string): string[] {
  const linkPattern = /\[\[([^\]]+)\]\]/g;
  const links: string[] = [];
  let match;

  while ((match = linkPattern.exec(content)) !== null) {
    links.push(match[1]);
  }

  return links;
}
