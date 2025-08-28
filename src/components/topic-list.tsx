
'use client';

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Topic, User } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare, PlusCircle, Clock, ChevronLeft, ChevronRight, Settings2, Search } from 'lucide-react';
import { NewTopicDialog } from './new-topic-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateTopicsPerPage } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { Input } from './ui/input';
import { EnrichedTextViewer } from './enriched-text-viewer';

interface TopicListProps {
  topics: Topic[];
  currentPage: number;
  totalPages: number;
  currentUser: User;
  searchQuery?: string;
  title: string;
  description: string;
}

// New component to handle client-side date rendering
function ClientFormattedDate({ date, prefix }: { date: Date | null | undefined, prefix: string }) {
  const [formattedDate, setFormattedDate] = useState({ absolute: '', relative: '' });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This runs only on the client, after hydration
    setIsClient(true);
    if (date) {
      setFormattedDate({
        absolute: format(date, 'PPpp'),
        relative: formatDistanceToNow(date, { addSuffix: true }),
      });
    }
  }, [date]);

  if (!isClient || !date) {
    // Render a placeholder or nothing on the server and initial client render
    return <div className="h-5 w-48 bg-muted rounded animate-pulse" />;
  }

  return (
    <div className="flex items-center gap-1 text-muted-foreground" title={formattedDate.absolute}>
      <Clock className="h-4 w-4" />
      <span>{prefix} {formattedDate.absolute} ({formattedDate.relative})</span>
    </div>
  );
}


export function TopicList({ topics, currentPage, totalPages, currentUser, searchQuery: initialSearchQuery, title, description }: TopicListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [isSearchDisabled, setIsSearchDisabled] = useState(false);

  useEffect(() => {
    // If there was an active search and the input is now empty,
    // clear the search after a delay.
    if (!searchQuery && initialSearchQuery) {
      const timer = setTimeout(() => {
        router.push('/topics');
      }, 1000); // 1-second delay

      return () => clearTimeout(timer);
    }
  }, [searchQuery, initialSearchQuery, router]);


  const handleTopicsPerPageChange = (value: string) => {
    const numValue = parseInt(value, 10);
    startTransition(async () => {
      const result = await updateTopicsPerPage(numValue);
      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message,
        });
      } else {
        toast({
          title: 'Success',
          description: `Displaying ${numValue} topics per page.`,
        });
        // The revalidatePath in the action will refresh the data
      }
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSearchDisabled) return;

    setIsSearchDisabled(true);
    setTimeout(() => setIsSearchDisabled(false), 2000); // 2-second cooldown

    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    if (searchQuery) {
        params.set('search', searchQuery);
    } else {
        params.delete('search');
    }
    router.push(`/topics?${params.toString()}`);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[250px]">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
            <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 md:flex-none">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        type="search"
                        placeholder="Search topic titles..." 
                        className="pl-8" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button type="submit" disabled={isSearchDisabled || isPending}>
                  {isSearchDisabled ? 'Searching...' : 'Search'}
                </Button>
            </form>
          <Select
            defaultValue={currentUser.topicsPerPage?.toString() ?? '10'}
            onValueChange={handleTopicsPerPageChange}
            disabled={isPending}
          >
            <SelectTrigger className="w-auto">
              <Settings2 className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Topics per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="25">25 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Topic
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {topics.map((topic) => (
            <Link href={`/topics/${topic.id}`} key={topic.id} className="block group">
              <Card className="hover:bg-card/80 transition-colors duration-200">
                  <CardHeader>
                      <CardTitle>{topic.title}</CardTitle>
                      <CardDescription>
                          <div className="flex items-center gap-2 text-sm mt-2 flex-wrap">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={topic.author.avatar ?? undefined} alt={topic.author.name} />
                                <AvatarFallback>{topic.author.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{topic.author.name}</span>
                            <span className="text-muted-foreground hidden sm:inline">&middot;</span>
                            <ClientFormattedDate date={topic.timestamp} prefix="Posted" />
                          </div>
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-muted-foreground line-clamp-2">
                      <EnrichedTextViewer text={topic.initialPost.content} />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center flex-wrap gap-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MessageSquare className="h-4 w-4" />
                        <span>{topic.replyCount} {topic.replyCount === 1 ? 'reply' : 'replies'}</span>
                      </div>
                      <ClientFormattedDate date={topic.lastActivityTimestamp} prefix="Last activity" />
                  </CardFooter>
              </Card>
            </Link>
          ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <Button
            variant="outline"
            disabled={currentPage <= 1}
            onClick={() => router.push(`/topics?page=${currentPage - 1}&search=${searchQuery}`)}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage >= totalPages}
            onClick={() => router.push(`/topics?page=${currentPage + 1}&search=${searchQuery}`)}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      <NewTopicDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}
