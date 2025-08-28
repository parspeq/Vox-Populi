// src/components/enriched-text-editor/index.tsx
'use client';

import React, { useRef, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { FormattingToolbar } from './formatting-toolbar';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Smile, HelpCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnrichedTextViewer } from '../enriched-text-viewer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';


interface EnrichedTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  textareaClassName?: string;
  disabled?: boolean;
  maxLength?: number;
}

const emojis = [
  '😂', '❤️', '👍', '😊',
  '🤍', '🎉', '🙏', '😭',
  '🤔', '💗', '✨', '👎',
  '💯', '🧿', '🖤', '🔥',
];

const formattingHelp = [
    { markup: '<bold>text</bold>', description: 'Makes text bold.', example: '<bold>Bold Text</bold>' },
    { markup: '<italic>text</italic>', description: 'Makes text italic.', example: '<italic>Italic Text</italic>' },
    { markup: '<underline>text</underline>', description: 'Underlines text.', example: '<underline>Underlined Text</underline>' },
    { markup: '<fixed>text</fixed>', description: 'Uses a fixed-width font.', example: '<fixed>Fixed-width Text</fixed>' },
    { markup: '<bigger>text</bigger>', description: 'Makes text larger.', example: 'Normally <bigger>Bigger</bigger>' },
    { markup: '<smaller>text</smaller>', description: 'Makes text smaller.', example: 'Normally <smaller>Smaller</smaller>' },
    { markup: '<center>text</center>', description: 'Centers the text block.', example: '<center>Centered Text</center>' },
    { markup: '<flushleft>text</flushleft>', description: 'Aligns text to the left.', example: '<flushleft>Left-aligned</flushleft>' },
    { markup: '<flushright>text</flushright>', description: 'Aligns text to the right.', example: '<flushright>Right-aligned</flushright>' },
    { markup: '<excerpt>text</excerpt>', description: 'Creates a blockquote.', example: '<excerpt>This is a quote.</excerpt>' },
    { markup: '<nofill> text </nofill>', description: 'Preserves all spaces and line breaks.', example: '<nofill>  Whitespace  is  kept.</nofill>' },
    { markup: '<fontfamily><param>serif</param>text</fontfamily>', description: 'Changes the font family.', example: '<fontfamily><param>serif</param>Serif Font</fontfamily>' },
    { markup: '<color><param>blue</param>text</color>', description: 'Changes text color.', example: '<color><param>blue</param>Blue Text</color>' },
];


export const EnrichedTextEditor = React.forwardRef<
  HTMLTextAreaElement,
  EnrichedTextEditorProps
>(({ value, onChange, className, textareaClassName, disabled, maxLength }, ref) => {
  const internalTextareaRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalTextareaRef;
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const applyFormat = (tag: string, param?: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let formattedText;
    if (param) {
        formattedText = `<${tag}><param>${param}</param>${selectedText}</${tag}>`;
    } else {
        formattedText = `<${tag}>${selectedText}</${tag}>`;
    }

    const newValue = value.substring(0, start) + formattedText + value.substring(end);
    
    if (maxLength && newValue.length > maxLength) {
      return;
    }

    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + formattedText.length - `</${tag}>`.length;
      textarea.selectionEnd = textarea.selectionStart;
    }, 0);
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + emoji + value.substring(end);
    
    if (maxLength && newValue.length > maxLength) {
        return;
    }

    onChange(newValue);

    setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = start + emoji.length;
        textarea.selectionEnd = start + emoji.length;
    }, 0);

    setIsEmojiPickerOpen(false);
  };

  return (
    <Tabs defaultValue="write" className={cn('border rounded-lg', className)}>
        <div className="flex justify-between items-center p-2 pr-4 bg-muted/50 rounded-t-lg">
            <TabsList className="grid w-fit grid-cols-2 h-8 text-xs">
                <TabsTrigger value="write" className="h-6">Write</TabsTrigger>
                <TabsTrigger value="preview" className="h-6">Preview</TabsTrigger>
            </TabsList>
            <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
                <DialogTrigger asChild>
                     <Button variant="ghost" size="icon" className="h-8 w-8">
                        <HelpCircle className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Formatting Help</DialogTitle>
                        <DialogDescription>
                            Use the following markup to format your text. You can also use the toolbar in the editor.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Markup (What you type)</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Example (What you get)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {formattingHelp.map((item) => (
                                    <TableRow key={item.markup}>
                                        <TableCell><code className="text-sm bg-muted p-1 rounded">{item.markup}</code></TableCell>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell><EnrichedTextViewer text={item.example} /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
        <TabsContent value="write" className="m-0">
            <FormattingToolbar onFormat={applyFormat} disabled={disabled}>
                <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
                <PopoverTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" disabled={disabled} title="Emoji">
                    <Smile className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                    <div className="grid grid-cols-4 gap-2">
                    {emojis.map(emoji => (
                        <Button
                        key={emoji}
                        variant="ghost"
                        size="icon"
                        className="text-xl"
                        onClick={() => handleEmojiSelect(emoji)}
                        >
                        {emoji}
                        </Button>
                    ))}
                    </div>
                </PopoverContent>
                </Popover>
            </FormattingToolbar>
            <Textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={cn(
                'min-h-[120px] border-0 border-t rounded-t-none focus-visible:ring-0 focus-visible:ring-offset-0',
                textareaClassName
                )}
                disabled={disabled}
                maxLength={maxLength}
            />
        </TabsContent>
        <TabsContent value="preview" className="m-0 p-3 min-h-[188px] text-sm">
            <EnrichedTextViewer text={value || "Nothing to preview yet."} />
        </TabsContent>
    </Tabs>
  );
});

EnrichedTextEditor.displayName = 'EnrichedTextEditor';
