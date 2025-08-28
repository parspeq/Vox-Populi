// src/components/enriched-text-editor/formatting-toolbar.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Bold, Italic, Underline, Code, Pilcrow,
  AlignLeft, AlignCenter, AlignRight, Quote,
  Minus, Plus, Type, Palette, Smile
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from '@/components/ui/separator';

interface FormattingToolbarProps {
  onFormat: (tag: string, param?: string) => void;
  disabled?: boolean;
  children?: React.ReactNode; // For the emoji popover trigger
}

const FONT_OPTIONS = [
    { label: 'Sans-serif (Default)', value: 'sans-serif' },
    { label: 'Serif', value: 'serif' },
    { label: 'Monospace', value: 'monospace' },
    { label: 'Cursive', value: 'cursive' },
];

const COLOR_OPTIONS = [
    { label: 'Black', value: 'black' },
    { label: 'Red', value: 'red' },
    { label: 'Green', value: 'green' },
    { label: 'Blue', value: 'blue' },
    { label: 'Yellow', value: 'yellow' },
    { label: 'Orange', value: 'orange' },
    { label: 'Purple', value: 'purple' },
];

export function FormattingToolbar({ onFormat, disabled, children }: FormattingToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-muted/50 rounded-t-lg">
      <Button type="button" variant="ghost" size="icon" onClick={() => onFormat('bold')} disabled={disabled} title="Bold">
        <Bold className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => onFormat('italic')} disabled={disabled} title="Italic">
        <Italic className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => onFormat('underline')} disabled={disabled} title="Underline">
        <Underline className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => onFormat('fixed')} disabled={disabled} title="Fixed-width">
        <Code className="h-4 w-4" />
      </Button>
      <Separator orientation="vertical" className="h-6" />
      <Button type="button" variant="ghost" size="icon" onClick={() => onFormat('smaller')} disabled={disabled} title="Smaller">
        <Minus className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => onFormat('bigger')} disabled={disabled} title="Bigger">
        <Plus className="h-4 w-4" />
      </Button>
      <Separator orientation="vertical" className="h-6" />
       <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon" disabled={disabled} title="Font Family">
            <Type className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {FONT_OPTIONS.map(font => (
            <DropdownMenuItem key={font.value} onSelect={() => onFormat('fontfamily', font.value)}>
              {font.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon" disabled={disabled} title="Color">
            <Palette className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {COLOR_OPTIONS.map(color => (
            <DropdownMenuItem key={color.value} onSelect={() => onFormat('color', color.value)}>
               <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: color.value }} />
                {color.label}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Separator orientation="vertical" className="h-6" />
      <Button type="button" variant="ghost" size="icon" onClick={() => onFormat('flushleft')} disabled={disabled} title="Align Left">
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => onFormat('center')} disabled={disabled} title="Align Center">
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => onFormat('flushright')} disabled={disabled} title="Align Right">
        <AlignRight className="h-4 w-4" />
      </Button>
      <Separator orientation="vertical" className="h-6" />
       <Button type="button" variant="ghost" size="icon" onClick={() => onFormat('excerpt')} disabled={disabled} title="Excerpt/Quote">
        <Quote className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => onFormat('nofill')} disabled={disabled} title="No Fill (Preformatted)">
        <Pilcrow className="h-4 w-4" />
      </Button>
      {children}
    </div>
  );
}
