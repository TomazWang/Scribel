import { parseJotContent, type ParsedSegment } from '../utils/parseJot';

interface JotContentProps {
  content: string;
}

/**
 * JotContent component renders jot text with syntax highlighting
 *
 * Features:
 * - Tags (#tag) rendered in blue
 * - Links ([[link]]) rendered in purple
 * - Regular text rendered normally
 *
 * @example
 * <JotContent content="Meeting with [[Sarah]] about #project" />
 */
export function JotContent({ content }: JotContentProps) {
  const segments = parseJotContent(content);

  return (
    <span className="jot-content">
      {segments.map((segment: ParsedSegment, index: number) => {
        if (segment.type === 'tag') {
          return (
            <span
              key={index}
              className="text-blue-500 dark:text-blue-400"
            >
              #{segment.value}
            </span>
          );
        }

        if (segment.type === 'link') {
          return (
            <span
              key={index}
              className="text-purple-500 dark:text-purple-400"
            >
              [[{segment.value}]]
            </span>
          );
        }

        return (
          <span key={index}>
            {segment.value}
          </span>
        );
      })}
    </span>
  );
}
