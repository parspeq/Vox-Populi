
import { redirect } from 'next/navigation';
import { ClientLayout } from './client-layout';
import { getLayoutData } from '@/lib/data';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, notifications } = await getLayoutData();
  
  if (!currentUser) {
    // This should theoretically not happen due to middleware, but it's a good safeguard.
    redirect('/login');
  }

  return (
    <ClientLayout currentUser={currentUser} notifications={notifications}>
      {children}
    </ClientLayout>
  );
}
