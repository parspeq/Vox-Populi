
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { editPoll } from '@/app/actions';
import type { Poll } from '@/lib/types';
import { EnrichedTextEditor } from './enriched-text-editor';

const editPollSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters long.').max(500, 'Question must be 500 characters or less.'),
});

interface EditPollDialogProps {
  poll: Poll;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPollEdited: (poll: Poll) => void;
}

export function EditPollDialog({ poll, open, onOpenChange, onPollEdited }: EditPollDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof editPollSchema>>({
    resolver: zodResolver(editPollSchema),
  });
  
  useEffect(() => {
    if (poll) {
        form.reset({
            question: poll.question,
        });
    }
  }, [poll, form, open]);


  async function onSubmit(values: z.infer<typeof editPollSchema>) {
    setIsSubmitting(true);
    
    const result = await editPoll({ 
        pollId: poll.id,
        question: values.question,
    });

    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: 'Success',
        description: 'Your poll has been updated.',
      });
      onPollEdited({ ...poll, question: values.question });
      onOpenChange(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error updating poll',
        description: result.message || 'An unknown error occurred.',
      });
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <DialogHeader>
              <DialogTitle>Edit poll</DialogTitle>
              <DialogDescription>
                Update your poll's question. Options cannot be changed after creation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Poll Question</FormLabel>
                    <FormControl>
                       <EnrichedTextEditor
                        value={field.value}
                        onChange={field.onChange}
                        maxLength={500}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
