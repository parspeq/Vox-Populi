
'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import type { Chat, User, Message } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SendHorizonal, Hash, Palette, Smile, MoreHorizontal, Flag } from 'lucide-react';
import { getChatState, reportChatMessage, sendMessage } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';


interface ChatLayoutProps {
  chats: Chat[];
  allMessages: Message[];
  currentUser: User;
}

const colorOptions = [
    { value: 'default', label: 'Default', color: 'inherit' },
    { value: 'red', label: 'Red', color: '#ef4444' },
    { value: 'orange', label: 'Orange', color: '#f97316' },
    { value: 'yellow', label: 'Yellow', color: '#eab308' },
    { value: 'green', label: 'Green', color: '#22c55e' },
    { value: 'blue', label: 'Blue', color: '#3b82f6' },
    { value: 'indigo', label: 'Indigo', color: '#6366f1' },
    { value: 'violet', label: 'Violet', color: '#8b5cf6' },
];

const emojis = [
  '😂', '❤️', '👍', '😊',
  '🤍', '🎉', '🙏', '😭',
  '🤔', '💗', '✨', '👎',
  '💯', '🧿', '🖤', '🔥',
];

export function ChatLayout({ chats, allMessages, currentUser }: ChatLayoutProps) {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(chats[0] || null);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedColor, setSelectedColor] = useState('default');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [reportingMessageId, setReportingMessageId] = useState<string | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);


  useEffect(() => {
    if (selectedChat) {
      setMessages(allMessages.filter(m => m.chatId === selectedChat.id));
    } else {
      setMessages([]);
    }
  }, [selectedChat, allMessages]);
  
  // Polling for new messages
  useEffect(() => {
    if (!selectedChat) return;

    const intervalId = setInterval(async () => {
      // Create a stable reference to the messages for this interval
      const currentMessages = messagesRef.current;
      const lastMessage = currentMessages[currentMessages.length - 1];
      const lastTimestamp = lastMessage?.timestamp.toISOString() || new Date(0).toISOString();
      
      const result = await getChatState(selectedChat.id, lastTimestamp);
      
      if (!result) return; // Happens on logout when session is gone

      if (!result.chatExists) {
        toast({
            title: 'Channel deleted',
            description: 'This discussion channel has been deleted.',
        });
        setSelectedChat(null);
        router.push('/topics');
        return;
      }
      
      if (result.newMessages && result.newMessages.length > 0) {
        const formattedNewMessages: Message[] = result.newMessages.map(m => ({
            ...m,
            timestamp: new Date(m.timestamp),
        }));

        setMessages(prevMessages => {
          const existingIds = new Set(prevMessages.map(pm => pm.id));
          const newMessagesToAdd = formattedNewMessages.filter(nm => !existingIds.has(nm.id));
          
          if (newMessagesToAdd.length > 0) {
            return [...prevMessages, ...newMessagesToAdd];
          }
          return prevMessages;
        });
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [selectedChat, router, toast]);

  // Use a ref to keep track of the latest messages for the polling interval
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);


  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div');
        if (viewport) {
             viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);
  
  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim() || !selectedChat) return;

    const colorToSend = selectedColor === 'default' ? undefined : colorOptions.find(c => c.value === selectedColor)?.color;
  
    const tempId = crypto.randomUUID();
    const newMessage: Message = {
      id: tempId,
      chatId: selectedChat.id,
      content: inputValue,
      timestamp: new Date(),
      sender: currentUser,
      color: colorToSend,
    };
  
    const messageToSend = inputValue;
    setInputValue('');
  
    startTransition(() => {
      setMessages(prev => [...prev, newMessage]);
    });
  
    const result = await sendMessage(selectedChat.id, messageToSend, colorToSend);
  
    if (result.success && result.message && typeof result.message !== 'string') {
      const finalMessage = {
        ...result.message,
        timestamp: new Date(result.message.timestamp),
      };
      setMessages(prev =>
        prev.map(m => (m.id === tempId ? finalMessage : m))
      );
    } else {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast({
        variant: 'destructive',
        title: 'Error',
        description: typeof result.message === 'string' ? result.message : 'Failed to send message.',
      });
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputValue(prev => prev + emoji);
    setIsEmojiPickerOpen(false);
  }
  
  const handleReport = async () => {
    if (!reportingMessageId) return;
    setIsSubmittingReport(true);
    const result = await reportChatMessage(reportingMessageId);
    setIsSubmittingReport(false);
    setReportingMessageId(null);

    if (result.success) {
        toast({ title: 'Message Reported', description: result.message });
        setMessages(prev => prev.map(m => m.id === reportingMessageId ? { ...m, isUnderReview: true } : m));
    } else {
        toast({ variant: 'destructive', title: 'Error Reporting Message', description: result.message });
    }
  };
  
  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))]">
      <div className="w-1/4 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Channels</h2>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={cn(
                  'w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors',
                  selectedChat?.id === chat.id
                    ? 'bg-primary/10'
                    : 'hover:bg-accent/50'
                )}
              >
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-muted">
                    <Hash className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 truncate">
                  <p className="font-semibold">{chat.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {chat.messages[chat.messages.length - 1]?.content || 'No messages yet'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
      <div className="w-3/4 flex flex-col">
        {selectedChat ? (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-muted">
                  <Hash className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">{selectedChat.name}</h3>
            </div>
            <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((msg) => {
                  const canReport = currentUser.id !== msg.sender.id;
                  return (
                      <div
                          key={msg.id}
                          className={cn('flex items-end gap-2 justify-start group')}
                      >
                          <Avatar className="h-8 w-8 self-start">
                              <AvatarImage src={msg.sender.avatar ?? undefined} alt={msg.sender.name} />
                              <AvatarFallback>{msg.sender.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          
                          <div className={cn('p-3 rounded-xl max-w-md', 'bg-muted')}>
                              <p className="text-xs font-semibold pb-1">{msg.sender.name}</p>
                              <p style={{ color: msg.color ?? 'inherit' }}>{msg.content}</p>
                              <p className={cn("text-xs mt-1", "text-muted-foreground")}>{msg.timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                          </div>

                          {canReport && (
                              <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                                          <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                      <DropdownMenuItem onClick={() => setReportingMessageId(msg.id)} disabled={msg.isUnderReview}>
                                          <Flag className="mr-2 h-4 w-4" />
                                          <span>{msg.isUnderReview ? 'Under Review' : 'Report'}</span>
                                      </DropdownMenuItem>
                                  </DropdownMenuContent>
                              </DropdownMenu>
                          )}
                      </div>
                  );
                })}
              </div>
            </ScrollArea>
            <div className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <Select value={selectedColor} onValueChange={setSelectedColor}>
                    <SelectTrigger className="w-auto">
                        <SelectValue placeholder={<Palette className="h-5 w-5" />} />
                    </SelectTrigger>
                    <SelectContent>
                        {colorOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                            <div
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: option.color }}
                            />
                            {option.label}
                            </div>
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
                    <PopoverTrigger asChild>
                        <Button type="button" variant="ghost" size="icon">
                            <Smile className="h-5 w-5" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2 mb-2">
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
                <div className="relative w-full">
                    <Input 
                        placeholder="Type a message..." 
                        className="pr-12" 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                        <Button type="submit" size="icon" className="h-8 w-8">
                            <SendHorizonal className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Select a channel to start chatting</p>
          </div>
        )}
      </div>
       <AlertDialog open={!!reportingMessageId} onOpenChange={(open) => !open && setReportingMessageId(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Report Message</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to report this message? This will submit it for community review.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isSubmittingReport} onClick={() => setReportingMessageId(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReport} disabled={isSubmittingReport} className="bg-destructive hover:bg-destructive/90">
                        {isSubmittingReport ? 'Reporting...' : 'Report'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
