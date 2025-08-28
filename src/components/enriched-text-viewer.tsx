// src/components/enriched-text-viewer.tsx
import React from 'react';
import type { EnrichedTextNode } from '@/lib/enriched-text-parser';
import { parseEnrichedText } from '@/lib/enriched-text-parser';

interface EnrichedTextViewerProps {
  text: string;
}

const FONT_MAP: { [key: string]: string } = {
  serif: 'Georgia, "Times New Roman", serif',
  'sans-serif': 'Arial, Helvetica, sans-serif',
  monospace: '"Courier New", Courier, monospace',
  cursive: '"Brush Script MT", "Comic Sans MS", cursive',
};


const renderNode = (node: EnrichedTextNode, key: number): React.ReactNode => {
  if (typeof node === 'string') {
    return node;
  }

  // Do not render <param> tags directly
  if (node.type === 'param') {
      return null;
  }

  const children = node.content.map((child, index) => renderNode(child, index));
  const style: React.CSSProperties = {};
  
  switch (node.type) {
    case 'bold':
      return <strong key={key}>{children}</strong>;
    case 'italic':
      return <em key={key}>{children}</em>;
    case 'underline':
      return <u key={key}>{children}</u>;
    case 'fixed':
      return <code key={key}>{children}</code>;
    case 'smaller':
       return <span key={key} style={{ fontSize: 'smaller' }}>{children}</span>
    case 'bigger':
       return <span key={key} style={{ fontSize: 'larger' }}>{children}</span>
    case 'center':
      return <div key={key} style={{ textAlign: 'center' }}>{children}</div>;
    case 'flushleft':
       return <div key={key} style={{ textAlign: 'left' }}>{children}</div>;
    case 'flushright':
        return <div key={key} style={{ textAlign: 'right' }}>{children}</div>;
    case 'nofill':
      return <pre key={key} style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{children}</pre>;
    case 'excerpt':
        return <blockquote key={key} className="pl-4 border-l-4 my-2">{children}</blockquote>;
    case 'fontfamily':
        if (node.param && FONT_MAP[node.param]) {
            style.fontFamily = FONT_MAP[node.param];
        }
        return <span key={key} style={style}>{children}</span>;
    case 'color':
      if (node.param) {
        if (node.param.startsWith('rgb:')) {
            // Convert hexadecimal RGB like "FFFF,0000,0000" to #FF0000
            const parts = node.param.substring(4).split(',');
            if (parts.length === 3) {
                const r = parts[0].substring(0, 2);
                const g = parts[1].substring(0, 2);
                const b = parts[2].substring(0, 2);
                style.color = `#${r}${g}${b}`;
            }
        } else {
             // For simple color names, but be aware this is not fully sanitized.
             // CSS `color` property is relatively safe.
             style.color = node.param;
        }
      }
      return <span key={key} style={style}>{children}</span>;
    default:
      // Unknown tags are rendered as plain text for security
      return `<${node.type}>${children}</${node.type}>`;
  }
};

export function EnrichedTextViewer({ text }: EnrichedTextViewerProps) {
  const nodes = parseEnrichedText(text);
  return <>{nodes.map((node, index) => renderNode(node, index))}</>;
}
