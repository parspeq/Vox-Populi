
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateTwoFactorSecret, verifyAndEnableTwoFactor } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { QrCode, KeyRound, Copy } from 'lucide-react';
import Image from 'next/image';

type SetupState = 'loading' | 'generate' | 'verify' | 'backup';

export default function Setup2FAPage() {
  const [setupState, setSetupState] = useState<SetupState>('loading');
  const [qrCode, setQrCode] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function getSecret() {
      const result = await generateTwoFactorSecret();
      if (result.error) {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
        router.push('/signup');
      } else {
        setQrCode(result.qrCodeDataURL!);
        setManualCode(result.secret!);
        setSetupState('generate');
      }
    }
    getSecret();
  }, [router, toast]);
  
  const handleVerify = async () => {
    setIsSubmitting(true);
    const result = await verifyAndEnableTwoFactor(verificationCode);
    setIsSubmitting(false);

    if (result.error) {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
        setBackupCodes(result.backupCodes!);
        setSetupState('backup');
    }
  }

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'The code has been copied to your clipboard.' });
  }
  
  const handleFinish = () => {
    router.push('/login');
  }

  if (setupState === 'loading') {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-center">
                        <Skeleton className="h-48 w-48" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        </div>
    )
  }

  if (setupState === 'backup') {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Save Your Backup Codes</CardTitle>
                    <CardDescription>
                        Store these backup codes in a safe place. You can use them to access your account if you lose your device.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="grid grid-cols-2 gap-4 font-mono text-center">
                        {backupCodes.map(code => (
                            <div key={code} className="bg-muted rounded-md p-2">{code}</div>
                        ))}
                   </div>
                   <Alert>
                        <AlertTitle>Important!</AlertTitle>
                        <AlertDescription>
                            This is the only time you will see these codes. Please save them now.
                        </AlertDescription>
                    </Alert>
                    <Button onClick={handleFinish} className="w-full">
                        I have saved my codes. Finish Setup.
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set Up Two-Factor Authentication</CardTitle>
          <CardDescription>
            Scan the QR code with your authenticator app or enter the manual code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex justify-center p-4 bg-white rounded-lg">
                <Image src={qrCode} alt="QR Code" width={200} height={200} />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="manualCode">Manual Setup Code</Label>
                <div className="flex items-center gap-2">
                    <Input id="manualCode" readOnly value={manualCode} className="font-mono" />
                    <Button variant="outline" size="icon" onClick={() => handleCopyToClipboard(manualCode)}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="verificationCode">Verification Code</Label>
                <Input 
                    id="verificationCode" 
                    placeholder="Enter 6-digit code" 
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                />
            </div>
          
            <Button onClick={handleVerify} disabled={isSubmitting || verificationCode.length !== 6} className="w-full">
                {isSubmitting ? "Verifying..." : "Verify and Enable"}
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Add a simple Label component if it's not globally available
const Label = (props: React.LabelHTMLAttributes<HTMLLabelElement>) => (
    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" {...props} />
)
