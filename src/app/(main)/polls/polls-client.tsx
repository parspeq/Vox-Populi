
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlusCircle, Settings2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Poll, User } from '@/lib/types';
import { NewPollDialog } from '@/components/new-poll-dialog';
import { PollCard } from '@/components/poll-card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updatePollsPerPage } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';


interface PollsClientProps {
    initialPolls: Poll[];
    currentUser: User;
    currentPage: number;
    totalPages: number;
    searchQuery?: string;
    title: string;
    description: string;
}

export function PollsClient({ initialPolls, currentUser, currentPage, totalPages, searchQuery: initialSearchQuery, title, description }: PollsClientProps) {
    const [polls, setPolls] = useState(initialPolls);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
    const [isSearchDisabled, setIsSearchDisabled] = useState(false);

    useEffect(() => {
        setPolls(initialPolls);
    }, [initialPolls]);

    useEffect(() => {
        if (!searchQuery && initialSearchQuery) {
        const timer = setTimeout(() => {
            router.push('/polls');
        }, 1000);

        return () => clearTimeout(timer);
        }
    }, [searchQuery, initialSearchQuery, router]);


    const onPollCreated = (newPoll: Poll) => {
        setPolls(prevPolls => [newPoll, ...prevPolls]);
    };

    const onPollDeleted = (pollId: string) => {
        setPolls(prevPolls => prevPolls.filter(p => p.id !== pollId));
    };
    
    const onPollEdited = (updatedPoll: Poll) => {
        setPolls(prevPolls => prevPolls.map(p => p.id === updatedPoll.id ? updatedPoll : p));
    };

    const handlePollsPerPageChange = (value: string) => {
        const numValue = parseInt(value, 10);
        startTransition(async () => {
        const result = await updatePollsPerPage(numValue);
        if (!result.success) {
            toast({
            variant: 'destructive',
            title: 'Error',
            description: result.message,
            });
        } else {
            toast({
            title: 'Success',
            description: `Displaying ${numValue} polls per page.`,
            });
            router.push('/polls');
        }
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSearchDisabled) return;

        setIsSearchDisabled(true);
        setTimeout(() => setIsSearchDisabled(false), 2000);

        const params = new URLSearchParams(searchParams.toString());
        params.set('page', '1');
        if (searchQuery) {
            params.set('search', searchQuery);
        } else {
            params.delete('search');
        }
        router.push(`/polls?${params.toString()}`);
    };

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', newPage.toString());
        router.push(`/polls?${params.toString()}`);
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
                                placeholder="Search poll questions..." 
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
                        defaultValue={currentUser.pollsPerPage?.toString() ?? '10'}
                        onValueChange={handlePollsPerPageChange}
                        disabled={isPending}
                    >
                        <SelectTrigger className="w-auto">
                        <Settings2 className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Polls per page" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="10">10 per page</SelectItem>
                        <SelectItem value="25">25 per page</SelectItem>
                        <SelectItem value="50">50 per page</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={() => setIsDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Poll
                    </Button>
                </div>
            </div>

            {polls.length > 0 ? (
                <div className="space-y-4">
                    {polls.map(poll => (
                        <PollCard 
                            key={poll.id} 
                            poll={poll} 
                            currentUser={currentUser} 
                            onPollDeleted={onPollDeleted}
                            onPollEdited={onPollEdited}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">
                        {initialSearchQuery ? `No polls found for "${initialSearchQuery}".` : 'No polls have been created yet.'}
                    </p>
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4">
                <Button
                    variant="outline"
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
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
                    onClick={() => handlePageChange(currentPage + 1)}
                >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                </div>
            )}
            
            <NewPollDialog 
                open={isDialogOpen} 
                onOpenChange={setIsDialogOpen}
                onPollCreated={onPollCreated}
            />
        </div>
    );
}
