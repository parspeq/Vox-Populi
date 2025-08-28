
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { signUp } from '@/app/actions';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const signUpSchema = z.object({
  name: z.string().trim().min(2, { message: 'Name must contain at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  age: z.coerce.number().int().positive().gte(18, { message: 'You must be 18 or older to sign up.'}).lte(99, {message: 'Please enter a valid age.'}),
  password: z.string().min(20, { message: 'Password must be at least 20 characters long.' }),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the Terms of Service to create an account."
  }),
  acceptPolicy: z.boolean().refine(val => val === true, {
    message: "You must accept the Privacy Policy to create an account."
  }),
  honeypot: z.string().optional(),
  formLoadTime: z.number(),
});

export default function SignUpPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formLoadTime, setFormLoadTime] = useState<number | null>(null);

  useEffect(() => {
    setFormLoadTime(Date.now());
  }, []);

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      age: undefined,
      password: '',
      acceptTerms: false,
      acceptPolicy: false,
      honeypot: '',
      formLoadTime: 0,
    },
  });

  async function onSubmit(values: z.infer<typeof signUpSchema>) {
    if (formLoadTime === null) {
        toast({
            variant: 'destructive',
            title: 'An error occurred',
            description: 'Could not verify form submission time. Please try again.',
        });
        return;
    }
    
    setIsSubmitting(true);
    const result = await signUp({ ...values, formLoadTime: formLoadTime });
    setIsSubmitting(false);

    if (result && result.message) {
      toast({
        variant: 'destructive',
        title: 'Sign-up failed',
        description: result.message,
      });
    } else if (result && result.errors) {
       // Handle validation errors if needed, though form should catch them
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Create an Account</h1>
          <p className="text-muted-foreground">Enter your details below to get started.</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Name" {...field} autoComplete="name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="text"
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      placeholder="email@example.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="25" {...field} maxLength={2} value={field.value ?? ''} autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} autoComplete="new-password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 border">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I agree to the{' '}
                       <Link href="/terms" className="text-primary hover:underline" target="_blank">
                        Terms of Service
                      </Link>
                      .
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="acceptPolicy"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 border">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I agree to the{' '}
                       <Link href="/privacy" className="text-primary hover:underline" target="_blank">
                        Privacy Policy
                      </Link>
                      .
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
                control={form.control}
                name="honeypot"
                render={({ field }) => (
                    <FormItem className="absolute left-[-5000px]">
                        <FormLabel className="hidden">Leave this field empty</FormLabel>
                        <FormControl>
                            <Input {...field} tabIndex={-1} autoComplete="off" />
                        </FormControl>
                    </FormItem>
                )}
            />
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </Form>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

    
