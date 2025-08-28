
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { requestPasswordReset, deleteAccount, togglePwa } from '@/app/actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { User } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Palette, WifiOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const themes = [
    { name: 'Light', value: 'light' },
    { name: 'Dark', value: 'dark' },
    { name: 'System', value: 'system' },
];

const highContrastThemes = [
    { name: 'Sepia', value: 'sepia' },
    { name: 'Midnight', value: 'midnight' },
    { name: 'Terminal', value: 'terminal' },
    { name: 'Ruby', value: 'ruby' },
    { name: 'Sapphire', value: 'sapphire' },
    { name: 'Emerald', value: 'emerald' },
    { name: 'Amethyst', value: 'amethyst' },
    { name: 'Topaz', value: 'topaz' },
    { name: 'Obsidian', value: 'obsidian' },
    { name: 'Alabaster', value: 'alabaster' },
    { name: 'Coral', value: 'coral' },
    { name: 'Slate', value: 'slate' },
];

export function SettingsClient({ currentUser }: { currentUser: User }) {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isPwaEnabled, setIsPwaEnabled] = useState(currentUser.isPwaEnabled ?? false);
  const [isPwaPending, startPwaTransition] = useTransition();

  useEffect(() => {
    setIsClient(true);
  }, []);


  const handleResetPassword = async () => {
    setIsResetting(true);
    await requestPasswordReset(currentUser.email);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    const result = await deleteAccount();
    
    if (!result.success) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.message,
      });
      setIsDeleting(false);
      setIsAlertOpen(false);
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    setTimeout(() => {
        window.location.reload();
    }, 100);
  };

  const handlePwaToggle = (enabled: boolean) => {
    startPwaTransition(async () => {
        setIsPwaEnabled(enabled);
        const result = await togglePwa(enabled);
        if (result.success) {
            toast({
                title: 'Settings updated',
                description: `Offline mode has been ${enabled ? 'enabled' : 'disabled'}. The app will reload to apply changes.`,
            });
            setTimeout(() => window.location.reload(), 2000);
        } else {
            setIsPwaEnabled(!enabled); // Revert on failure
            toast({
                variant: 'destructive',
                title: 'Error',
                description: result.message,
            });
        }
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex flex-wrap items-center gap-2">
                    {isClient && themes.map((t) => (
                        <Button key={t.value} variant={theme === t.value ? 'default' : 'outline'} onClick={() => handleThemeChange(t.value)}>
                            {t.name}
                        </Button>
                    ))}
                </div>
            </div>
            <div className="space-y-2">
                <h3 className="text-lg font-medium">High-Contrast Themes</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                    {isClient && highContrastThemes.map((t) => (
                        <Button key={t.value} variant={theme === t.value ? 'default' : 'outline'} onClick={() => handleThemeChange(t.value)}>
                            <Palette className="mr-2 h-4 w-4" />
                            {t.name}
                        </Button>
                    ))}
                </div>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Manage application features and behavior.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border rounded-lg">
                <div>
                  <div className="flex items-center gap-2 font-medium">
                    <WifiOff className="h-4 w-4" />
                    <span>Enable Offline Mode</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Install the app on your device for offline access and faster loading.
                  </p>
                </div>
                <Switch
                    checked={isPwaEnabled}
                    onCheckedChange={handlePwaToggle}
                    disabled={isPwaPending}
                />
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your account settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border rounded-lg">
            <div>
              <p className="font-medium">Reset Password</p>
              <p className="text-sm text-muted-foreground">Log out and start the password reset process.</p>
            </div>
            <Button onClick={handleResetPassword} disabled={isResetting} variant="outline">
              {isResetting ? 'Processing...' : 'Reset Password'}
            </Button>
          </div>

           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border border-destructive/50 rounded-lg">
            <div>
              <p className="font-medium text-destructive">Delete Account</p>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all of your data. This action cannot be undone.</p>
            </div>
             <Button onClick={() => setIsAlertOpen(true)} disabled={isDeleting} variant="destructive">
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and all associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? 'Deleting...' : 'Yes, delete my account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
