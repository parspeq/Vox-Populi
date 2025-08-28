
import { getCurrentUser, getPolls } from '@/lib/data';
import { redirect } from 'next/navigation';
import { PollsClient } from '../polls/polls-client';

export default async function MyPollsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        redirect('/login');
    }
    
    const page = typeof searchParams.page === 'string' ? Math.max(1, parseInt(searchParams.page, 10)) : 1;
    const searchQuery = typeof searchParams.search === 'string' ? searchParams.search : undefined;

    const { polls, totalPages } = await getPolls({
        currentUser,
        page,
        searchQuery,
        authorId: currentUser.id
    });

    return (
        <PollsClient 
            initialPolls={polls} 
            currentUser={currentUser}
            currentPage={page}
            totalPages={totalPages}
            searchQuery={searchQuery}
            title="My Polls"
            description="Manage and review your created polls."
        />
    );
}
