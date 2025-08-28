
'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { voteOnReport, submitAuthorExplanation } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import type { User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { EnrichedTextViewer } from "@/components/enriched-text-viewer";


type ReportWithRelations = {
    id: string;
    postId: string | null;
    pollId: string | null;
    messageId: string | null;
    reporterId: string | null;
    postContent: string;
    postAuthorId: string;
    status: "pending" | "banned" | "appeal_pending" | "appeal_accepted" | "appeal_rejected";
    createdAt: Date;
    authorExplanation: string | null;
    postAuthor: {
        id: string;
        name: string;
        email: string;
        avatar: string | null;
    };
    reporter: {
        id: string;
        name: string;
        email: string;
        avatar: string | null;
    } | null;
    votes: {
        reportId: string;
        voterId: string;
        createdAt: Date;
    }[];
};

interface CommunityReviewClientProps {
    initialReports: ReportWithRelations[];
    currentUser: User;
}

// Client-side component to prevent hydration mismatch for dates
function ClientFormattedDate({ date }: { date: Date }) {
    const [formattedDate, setFormattedDate] = useState('');

    useEffect(() => {
        // This effect runs only on the client, after initial hydration
        setFormattedDate(new Date(date).toLocaleDateString());
    }, [date]);

    if (!formattedDate) {
        // Render a placeholder or nothing on the server and initial client render
        return null;
    }

    return <>{formattedDate}</>;
}


export function CommunityReviewClient({ initialReports, currentUser }: CommunityReviewClientProps) {
    const [reports, setReports] = useState<ReportWithRelations[]>(initialReports);
    const [isEligible, setIsEligible] = useState(false);
    const [explanation, setExplanation] = useState('');
    const [isSubmittingExplanation, setIsSubmittingExplanation] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
        const isAccountOldEnough = currentUser.createdAt < fifteenDaysAgo;
        const hasEnoughPosts = currentUser.posts.length >= 10;
        setIsEligible(isAccountOldEnough || hasEnoughPosts);
    }, [currentUser]);

    const handleVote = async (reportId: string) => {
        if (!isEligible) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'You do not currently meet the requirements to be able to vote, try again later',
            });
            return;
        }
        const result = await voteOnReport(reportId);
        if (!result.success) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: result.message,
            });
        } else {
             toast({
                title: 'Success',
                description: result.message,
            });
            if (result.banned) {
                 setReports(prevReports => prevReports.filter(r => r.id !== reportId));
            } else {
                 setReports(prevReports => prevReports.map(r => {
                     if (r.id === reportId) {
                         return { ...r, votes: [...r.votes, { reportId: reportId, voterId: currentUser.id, createdAt: new Date() }] };
                     }
                     return r;
                 }));
            }
        }
    };
    
    const handleExplanationSubmit = async (reportId: string) => {
        setIsSubmittingExplanation(true);
        const result = await submitAuthorExplanation({ reportId, explanation });
        setIsSubmittingExplanation(false);

        if (result.success) {
            toast({ title: "Success", description: result.message });
            setReports(prev => prev.map(r => r.id === reportId ? {...r, authorExplanation: explanation } : r));
            setExplanation('');
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.message });
        }
    };

    const getReportType = (report: ReportWithRelations) => {
        if (report.postId) return 'Post';
        if (report.pollId) return 'Poll';
        if (report.messageId) return 'Chat Message';
        return 'Content';
    }


    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold tracking-tight mb-6">Community Review</h1>
            <p className="text-muted-foreground mb-8">
                Help moderate the community by reviewing reported content. Content will be removed and the user banned after 12 votes.
            </p>
            {reports.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">There is no content to review at this time.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {reports.map(report => {
                        const userHasVoted = report.votes.some(v => v.voterId === currentUser.id);
                        const isContentAuthor = report.postAuthorId === currentUser.id;
                        const isReporter = report.reporterId === currentUser.id;
                        const canVote = !userHasVoted && !isContentAuthor && !isReporter;
                        const reportType = getReportType(report);
                        
                        return (
                            <Card key={report.id}>
                                <CardHeader>
                                    <CardTitle>Reported {reportType}</CardTitle>
                                    <CardDescription>
                                        Reported on <ClientFormattedDate date={report.createdAt} /> by {isReporter ? 'You' : report.reporter?.name || '[Deleted User]'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="p-4 bg-muted rounded-lg">
                                        <p className="font-semibold text-sm mb-1">{report.postAuthor.name} wrote:</p>
                                        <div className="text-sm">
                                            <EnrichedTextViewer text={report.postContent} />
                                        </div>
                                    </div>
                                    {report.authorExplanation && (
                                        <Alert>
                                            <Info className="h-4 w-4" />
                                            <AlertTitle>{report.postAuthor.name}'s Explanation</AlertTitle>
                                            <AlertDescription>{report.authorExplanation}</AlertDescription>
                                        </Alert>
                                    )}
                                     {isContentAuthor && !report.authorExplanation && (
                                        <div className="space-y-2">
                                            <p className="text-sm text-muted-foreground">You have one opportunity to explain your content to the community.</p>
                                            <Textarea 
                                                value={explanation}
                                                onChange={(e) => setExplanation(e.target.value)}
                                                placeholder="Explain your side of the story..."
                                                maxLength={500}
                                                disabled={isSubmittingExplanation}
                                            />
                                            <div className="flex justify-between items-center">
                                                <p className="text-xs text-muted-foreground">{explanation.length} / 500</p>
                                                <Button 
                                                    size="sm"
                                                    onClick={() => handleExplanationSubmit(report.id)}
                                                    disabled={isSubmittingExplanation || explanation.length < 10}
                                                >
                                                    {isSubmittingExplanation ? 'Submitting...' : 'Submit Explanation'}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                                {!isContentAuthor && (
                                    <CardFooter className="flex justify-between items-center">
                                        <Badge variant="outline" className="text-lg">
                                            {report.votes.length} / 12 Votes
                                        </Badge>
                                        <form action={() => handleVote(report.id)}>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span>
                                                            <Button 
                                                                type="submit"
                                                                variant="destructive"
                                                                disabled={!canVote}
                                                            >
                                                                {userHasVoted ? 'Voted' : 'Vote to Ban'}
                                                            </Button>
                                                        </span>
                                                    </TooltipTrigger>
                                                    {!isEligible && (
                                                        <TooltipContent>
                                                            <p>You must have an account older than 15 days or have made at least 10 posts to vote.</p>
                                                        </TooltipContent>
                                                    )}
                                                     {!canVote && userHasVoted && (
                                                        <TooltipContent>
                                                            <p>You have already voted on this report.</p>
                                                        </TooltipContent>
                                                    )}
                                                    {!canVote && isReporter && (
                                                        <TooltipContent>
                                                            <p>You cannot vote on a report you created.</p>
                                                        </TooltipContent>
                                                    )}
                                                </Tooltip>
                                            </TooltipProvider>
                                        </form>
                                    </CardFooter>
                                )}
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    );
}
