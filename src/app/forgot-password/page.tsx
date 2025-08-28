
'use client';

import { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { requestPasswordReset } from '@/app/actions';
import { z } from 'zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const emailSchema = z.string().email({ message: 'Please enter a valid email.' });

function ForgotPasswordContent() {
    const searchParams = useSearchParams();
    const submitted = searchParams.get('submitted');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const validation = emailSchema.safeParse(email);
        if(!validation.success) {
            toast({
                variant: 'destructive',
                title: 'Invalid Email',
                description: validation.error.errors[0].message
            });
            return;
        }

        setIsSubmitting(true);
        // The action will handle the redirect
        await requestPasswordReset(email);
        // This part may not be reached if redirect happens, but is a good fallback
        setIsSubmitting(false);
    };

    if (submitted) {
        return (
             <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <div className="w-full max-w-md space-y-6 text-center">
                    <h1 className="text-3xl font-bold tracking-tight">Check Your Device</h1>
                    <p className="text-muted-foreground">
                        If an account with that email exists, you will be redirected to complete the password reset process. Otherwise, for security, no confirmation will be sent.
                    </p>
                    <p className="text-sm text-muted-foreground">
                       <Link href="/login" className="font-medium text-primary hover:underline">Return to Login</Link>
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight">Forgot Password</h1>
                    <p className="text-muted-foreground">Enter your email to begin the reset process.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input 
                            id="email" 
                            type="email" 
                            placeholder="email@example.com" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Continue'}
                    </Button>
                </form>
                 <p className="text-center text-sm text-muted-foreground">
                    Remember your password?{' '}
                    <Link href="/login" className="font-medium text-primary hover:underline">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
}

const Label = (props: React.LabelHTMLAttributes<HTMLLabelElement>) => (
    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-2" {...props} />
)

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ForgotPasswordContent />
        </Suspense>
    )
}
