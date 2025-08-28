
'use client';

import { useState } from 'react';
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
import { useForm, useFieldArray } from 'react-hook-form';
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
import { createPoll } from '@/app/actions';
import { Plus, Trash2 } from 'lucide-react';
import type { Poll } from '@/lib/types';
import { EnrichedTextEditor } from './enriched-text-editor';

const pollOptionSchema = z.object({
  text: z.string().min(1, 'Option cannot be empty.').max(50, 'Option must be 50 characters or less.'),
});

const createPollSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters long.').max(500, 'Question must be 500 characters or less.'),
  options: z.array(pollOptionSchema).min(2, 'You must provide at least 2 options.').max(5, 'You can provide a maximum of 5 options.'),
});

interface NewPollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPollCreated: (poll: Poll) => void;
}

export function NewPollDialog({ open, onOpenChange, onPollCreated }: NewPollDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof createPollSchema>>({
    resolver: zodResolver(createPollSchema),
    defaultValues: {
      question: '',
      options: [
        { text: 'Definitely Yes' }, 
        { text: 'Somewhat Yes' },
        { text: 'Maybe' },
        { text: 'Somewhat No' },
        { text: 'Definitely No' },
      ],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });

  async function onSubmit(values: z.infer<typeof createPollSchema>) {
    setIsSubmitting(true);
    const result = await createPoll({ ...values, color: undefined });
    setIsSubmitting(false);

    if (result.success && result.newPoll) {
      toast({
        title: 'Success',
        description: 'Your poll has been created.',
      });
      onPollCreated(result.newPoll);
      onOpenChange(false);
      form.reset();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error creating poll',
        description: result.message || 'An unknown error occurred.',
      });
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) form.reset();
        onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <DialogHeader>
              <DialogTitle>Create a new poll</DialogTitle>
              <DialogDescription>
                Ask the community a question. Provide between 2 and 5 options.
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
              
              <div>
                <FormLabel>Options</FormLabel>
                <div className="space-y-2 mt-2">
                  {fields.map((field, index) => (
                     <FormField
                        key={field.id}
                        control={form.control}
                        name={`options.${index}.text`}
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex items-center gap-2">
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 2}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                  ))}
                </div>
                 <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => append({ text: "" })}
                    disabled={fields.length >= 5}
                    >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Option
                </Button>
                <FormMessage>{form.formState.errors.options?.message}</FormMessage>
              </div>

            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Poll'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
