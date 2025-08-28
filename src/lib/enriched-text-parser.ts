// src/lib/enriched-text-parser.ts

export type EnrichedTextNode = string | {
  type: string;
  content: EnrichedTextNode[];
  param?: string;
};

// A simple, security-focused parser for a subset of text/enriched format.
// It builds a syntax tree instead of using regex replacement to handle nesting.
export function parseEnrichedText(text: string): EnrichedTextNode[] {
  const stack: { type: string; content: EnrichedTextNode[]; param?: string }[] = [{ type: 'root', content: [] }];
  let i = 0;

  while (i < text.length) {
    const openTagMatch = text.substring(i).match(/^<([a-zA-Z]+)>/);
    const closeTagMatch = text.substring(i).match(/^<\/([a-zA-Z]+)>/);

    if (openTagMatch) {
      const tagName = openTagMatch[1].toLowerCase();
      const newNode = { type: tagName, content: [] };
      stack.push(newNode);
      i += openTagMatch[0].length;
    } else if (closeTagMatch) {
      const tagName = closeTagMatch[1].toLowerCase();
      if (stack.length > 1 && stack[stack.length - 1].type === tagName) {
        const completedNode = stack.pop()!;
        
        // Special handling for <param> which modifies its parent
        if (completedNode.type === 'param' && stack.length > 0) {
          const parent = stack[stack.length - 1];
          if (completedNode.content.length > 0 && typeof completedNode.content[0] === 'string') {
             parent.param = completedNode.content[0];
          }
        } else {
            stack[stack.length - 1].content.push(completedNode);
        }
      } else {
        // Mismatched or invalid closing tag, treat as plain text
        stack[stack.length - 1].content.push(closeTagMatch[0]);
      }
      i += closeTagMatch[0].length;
    } else {
      const nextTagIndex = text.indexOf('<', i);
      if (nextTagIndex === -1) {
        stack[stack.length - 1].content.push(text.substring(i));
        break;
      }
      stack[stack.length - 1].content.push(text.substring(i, nextTagIndex));
      i = nextTagIndex;
    }
  }
  
  // If tags are left unclosed, they are not rendered.
  // The content of the root node is the parsed result.
  return stack[0].content;
}
