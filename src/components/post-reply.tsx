
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { createReply } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Send } from 'lucide-react';
import { EnrichedTextEditor } from './enriched-text-editor';

const replySchema = z.object({
  content: z.string().min(1, { message: "Reply cannot be empty." }).max(500, { message: "Reply must be 500 characters or less." }),
});

interface PostReplyProps {
  topicId: string;
  parentId: string;
  onReplySubmitted: () => void;
}

export function PostReply({ topicId, parentId, onReplySubmitted }: PostReplyProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof replySchema>>({
    resolver: zodResolver(replySchema),
    defaultValues: {
      content: '',
    },
  });

  async function onSubmit(values: z.infer<typeof replySchema>) {
    setIsSubmitting(true);
    const result = await createReply({
      content: values.content,
      topicId,
      parentId,
    });
    setIsSubmitting(false);

    if (result?.success) {
      toast({
        title: 'Success',
        description: 'Your reply has been posted.',
      });
      form.reset();
      onReplySubmitted();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error posting reply',
        description: result?.message || 'An unknown error occurred.',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 pt-4">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
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
        <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onReplySubmitted} disabled={isSubmitting}>
                Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Replying...' : 'Reply'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
