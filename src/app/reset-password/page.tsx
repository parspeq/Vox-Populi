
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
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
import { resetPasswordWith2FA } from '@/app/actions';
import { useState, Suspense } from 'react';

const resetPasswordSchema = z.object({
  code: z.string().min(1, "Code cannot be empty"),
  password: z.string().min(8, { message: "Password must be at least 8 characters long." }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});


function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email');
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof resetPasswordSchema>>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            code: '',
            password: '',
            confirmPassword: '',
        },
    });

    if (!email) {
        // This should not happen if navigated from the correct flow
        return <p>Invalid request. Please start the process over.</p>;
    }

    async function onSubmit(values: z.infer<typeof resetPasswordSchema>) {
        setIsSubmitting(true);
        const result = await resetPasswordWith2FA({ ...values, email: email! });
        setIsSubmitting(false);

        if (result.success) {
            toast({
                title: 'Success!',
                description: 'Your password has been reset. Please log in.',
            });
            router.push('/login');
        } else {
            toast({
                variant: 'destructive',
                title: 'Reset failed',
                description: result.message || 'An unknown error occurred.',
            });
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tight">Reset Your Password</h1>
                <p className="text-muted-foreground">Enter a 2FA code and your new password for {email}.</p>
                </div>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>2FA Code or Backup Code</FormLabel>
                            <FormControl>
                                <Input placeholder="123456 or ABC-123" {...field} />
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
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? 'Resetting...' : 'Reset Password'}
                    </Button>
                </form>
                </Form>
            </div>
        </div>
    )
}


export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordForm />
        </Suspense>
    )
}
