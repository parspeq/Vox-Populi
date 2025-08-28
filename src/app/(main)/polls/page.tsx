
import { db } from '@/lib/db';
import { getCurrentUser, getPolls } from '@/lib/data';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { users } from '@/lib/schema';
import { PollsClient } from './polls-client';

export default async function PollsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        redirect('/login');
    }

    // Asynchronously update the last seen timestamp, no need to wait
    db.update(users)
      .set({ lastSeenPollsTimestamp: new Date() })
      .where(eq(users.id, currentUser.id))
      .catch(console.error);
    
    const page = typeof searchParams.page === 'string' ? Math.max(1, parseInt(searchParams.page, 10)) : 1;
    const searchQuery = typeof searchParams.search === 'string' ? searchParams.search : undefined;

    const { polls, totalPages } = await getPolls({
        currentUser,
        page,
        searchQuery
    });

    return (
        <PollsClient 
            initialPolls={polls} 
            currentUser={currentUser}
            currentPage={page}
            totalPages={totalPages}
            searchQuery={searchQuery}
            title="Polls"
            description="Vote on community polls."
        />
    );
}
