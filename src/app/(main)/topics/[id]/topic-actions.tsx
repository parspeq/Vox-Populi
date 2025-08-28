
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { deleteTopic } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TopicActionsProps {
  topicId: string;
  isUnderReview: boolean;
}

export function TopicActions({ topicId, isUnderReview }: TopicActionsProps) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDeleteTopic = async () => {
    setIsDeleting(true);
    const result = await deleteTopic(topicId);
    // No need to set deleting to false, as we will be redirected.

    // This part might not be reached if redirect works as expected
    if (!result.success) {
      setIsDeleting(false);
      setIsAlertOpen(false);
       toast({
        variant: 'destructive',
        title: 'Error',
        description: result.message || 'Could not delete the topic.',
      });
    }
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={isUnderReview ? 0 : -1}>
              <Button
                variant="destructive"
                onClick={() => setIsAlertOpen(true)}
                disabled={isDeleting || isUnderReview}
                className={isUnderReview ? 'cursor-not-allowed' : ''}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete Topic'}
              </Button>
            </span>
          </TooltipTrigger>
          {isUnderReview && (
            <TooltipContent>
              <p>This topic cannot be deleted while its initial post is under community review.</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              topic and all of its posts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTopic}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
