
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { createTopic } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { EnrichedTextEditor } from './enriched-text-editor';

interface NewTopicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const createTopicSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters long." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters long." }).max(500, { message: "Description must be 500 characters or less." }),
});

export function NewTopicDialog({ open, onOpenChange }: NewTopicDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof createTopicSchema>>({
    resolver: zodResolver(createTopicSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });
  
  async function onSubmit(values: z.infer<typeof createTopicSchema>) {
    setIsSubmitting(true);
    const result = await createTopic({ ...values });
    setIsSubmitting(false);

    if (result?.success) {
      toast({
        title: 'Success',
        description: 'Your topic has been created.',
      });
      onOpenChange(false);
      form.reset();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error creating topic',
        description: result?.message || 'An unknown error occurred.',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <DialogHeader>
              <DialogTitle>Create a new topic</DialogTitle>
              <DialogDescription>
                Start a new discussion by providing a title and a description.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="What's on your mind?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
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
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Topic'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
