
import { TopicList } from '@/components/topic-list';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { users } from '@/lib/schema';
import { getCurrentUser, getTopics } from '@/lib/data';
import { redirect } from 'next/navigation';

export const revalidate = 0; // Revalidate on every request

export default async function TopicsPage({
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
    .set({ lastSeenTopicsTimestamp: new Date() })
    .where(eq(users.id, currentUser.id))
    .catch(console.error);

  const page = typeof searchParams.page === 'string' ? Math.max(1, parseInt(searchParams.page, 10)) : 1;
  const searchQuery = typeof searchParams.search === 'string' ? searchParams.search : undefined;

  const { topics, totalPages } = await getTopics({
    currentUser,
    page,
    searchQuery,
  });

  return (
    <TopicList 
      topics={topics} 
      currentPage={page}
      totalPages={totalPages}
      currentUser={currentUser}
      searchQuery={searchQuery}
      title="Topics"
      description="Browse and participate in discussions."
    />
  );
}
