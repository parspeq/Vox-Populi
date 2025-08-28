
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { verifyTwoFactorCode } from '@/app/actions';
import { useState } from 'react';

const verifyCodeSchema = z.object({
  code: z.string().length(6, { message: "Code must be 6 characters long." }),
});

export default function Verify2FAPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof verifyCodeSchema>>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: {
      code: '',
    },
  });

  async function onSubmit(values: z.infer<typeof verifyCodeSchema>) {
    setIsSubmitting(true);
    const result = await verifyTwoFactorCode(values);
    setIsSubmitting(false);

    if (result && result.message) {
      toast({
        variant: 'destructive',
        title: 'Verification failed',
        description: result.message,
      });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Two-Factor Authentication</h1>
          <p className="text-muted-foreground">Enter the code from your authenticator app.</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Code</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="123456" 
                      {...field} 
                      maxLength={6} 
                      className="text-center text-lg tracking-widest font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Verifying...' : 'Verify'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
