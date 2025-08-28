
'use client';

import type { Poll, User } from '@/lib/types';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { castVote, reportPoll, deletePoll } from '@/app/actions';
import { formatDistanceToNow } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Flag, Edit, Trash2, ChevronDown } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { EditPollDialog } from './edit-poll-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { EnrichedTextViewer } from './enriched-text-viewer';

interface PollCardProps {
    poll: Poll;
    currentUser: User;
    onPollDeleted?: (pollId: string) => void;
    onPollEdited?: (updatedPoll: Poll) => void;
}

export function PollCard({ poll: initialPoll, currentUser, onPollDeleted, onPollEdited }: PollCardProps) {
    const [poll, setPoll] = useState(initialPoll);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [isReportAlertOpen, setIsReportAlertOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    const userHasVoted = !!poll.userVote;
    const isAuthor = poll.author.id === currentUser.id;
    
    const handleVote = async () => {
        if (!selectedOption) return;
        setIsSubmitting(true);
        const result = await castVote(poll.id, selectedOption);
        setIsSubmitting(false);

        if (result.success && result.updatedPoll) {
            setPoll(result.updatedPoll);
            toast({
                title: 'Success',
                description: 'Your vote has been cast.',
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: result.message || 'Could not cast your vote.',
            });
        }
    };
    
    const handleReport = async () => {
        setIsSubmitting(true);
        const result = await reportPoll(poll.id);
        setIsSubmitting(false);
        setIsReportAlertOpen(false);

        if (result.success) {
            toast({ title: 'Poll Reported', description: result.message });
            setPoll(p => ({ ...p, isUnderReview: true }));
        } else {
            toast({ variant: 'destructive', title: 'Error Reporting Poll', description: result.message });
        }
    };
    
    const handleDelete = async () => {
        setIsSubmitting(true);
        const result = await deletePoll(poll.id);
        // No need to set submitting to false as component may unmount

        if (result.success) {
            toast({ title: 'Success', description: 'Poll deleted successfully.' });
            onPollDeleted?.(poll.id);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
            setIsSubmitting(false);
        }
        setIsAlertOpen(false);
    };

    const handlePollEdited = (updatedPoll: Poll) => {
        setPoll(updatedPoll);
        onPollEdited?.(updatedPoll);
    };

    return (
        <>
            <Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
                <Card className={poll.isUnderReview ? 'border-orange-500/50' : ''}>
                    <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <CardTitle style={{ color: poll.color ?? 'inherit' }}>
                                        <EnrichedTextViewer text={poll.question} />
                                    </CardTitle>
                                    <CardDescription>
                                        <div className="flex items-center gap-2 text-sm mt-2 flex-wrap">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={poll.author.avatar ?? undefined} alt={poll.author.name} />
                                                <AvatarFallback>{poll.author.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span>{poll.author.name}</span>
                                            <span className="text-muted-foreground">&middot;</span>
                                            <span>{formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true })}</span>
                                        </div>
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                     <ChevronDown className={`h-5 w-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                            {!isAuthor && (
                                                <DropdownMenuItem onClick={() => setIsReportAlertOpen(true)} disabled={poll.isUnderReview}>
                                                    <Flag className="mr-2 h-4 w-4" />
                                                    <span>{poll.isUnderReview ? 'Under Review' : 'Report'}</span>
                                                </DropdownMenuItem>
                                            )}
                                            {isAuthor && (
                                                <>
                                                    <DropdownMenuItem onClick={() => setIsEditModalOpen(true)} disabled={poll.isUnderReview}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        <span>Edit</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setIsAlertOpen(true)} disabled={poll.isUnderReview} className="text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        <span>Delete</span>
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent>
                            {userHasVoted ? (
                                <div className="space-y-3">
                                    {poll.options.map(option => {
                                        const percentage = poll.totalVotes > 0 ? (option.voteCount / poll.totalVotes) * 100 : 0;
                                        const isUserChoice = poll.userVote === option.id;
                                        return (
                                            <div key={option.id}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className={`text-sm ${isUserChoice ? 'font-bold' : ''}`}>{option.text}</p>
                                                    <p className="text-sm text-muted-foreground">{percentage.toFixed(0)}% ({option.voteCount})</p>
                                                </div>
                                                <Progress value={percentage} />
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <RadioGroup onValueChange={setSelectedOption}>
                                    <div className="space-y-2">
                                        {poll.options.map(option => (
                                            <Label key={option.id} className="flex items-center gap-3 p-3 border rounded-md hover:bg-accent cursor-pointer has-[[data-state=checked]]:bg-accent">
                                                <RadioGroupItem value={option.id} id={option.id} />
                                                <span>{option.text}</span>
                                            </Label>
                                        ))}
                                    </div>
                                </RadioGroup>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">{poll.totalVotes} total votes</span>
                            {!userHasVoted && (
                                <Button onClick={handleVote} disabled={!selectedOption || isSubmitting}>
                                    {isSubmitting ? 'Voting...' : 'Vote'}
                                </Button>
                            )}
                        </CardFooter>
                    </CollapsibleContent>
                </Card>
            </Collapsible>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this poll and all of its votes.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isSubmitting} className="bg-destructive hover:bg-destructive/90">
                            {isSubmitting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <AlertDialog open={isReportAlertOpen} onOpenChange={setIsReportAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Report Poll</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to report this poll? This will submit it for community review.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReport} disabled={isSubmitting} className="bg-destructive hover:bg-destructive/90">
                            {isSubmitting ? 'Reporting...' : 'Report'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <EditPollDialog
                poll={poll}
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                onPollEdited={handlePollEdited}
            />
        </>
    );
}
