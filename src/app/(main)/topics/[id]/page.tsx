
import { notFound } from 'next/navigation';
import { ThreadView } from '@/components/thread-view';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { db } from '@/lib/db';
import { eq, and, inArray } from 'drizzle-orm';
import { topics, posts, users, reportedPosts } from '@/lib/schema';
import type { Topic, Reply, User } from '@/lib/types';
import type { Post } from '@/lib/types';
import { getCurrentUser } from '@/lib/data';
import { deleteTopic } from '@/app/actions';
import { TopicActions } from './topic-actions';


async function getTopicData(topicId: string) {
    const topicResult = await db.query.topics.findFirst({
        where: eq(topics.id, topicId),
        with: {
            author: true,
            posts: {
                with: {
                    author: true,
                    attachments: true,
                },
                orderBy: (posts, { asc }) => [asc(posts.timestamp)],
            }
        }
    });

    if (!topicResult) {
        return null;
    }
    
    const allPosts = topicResult.posts;
    const postIds = allPosts.map(p => p.id);

    // Find which posts have a pending report
    const pendingReports = postIds.length > 0 ? await db.query.reportedPosts.findMany({
        where: and(
            inArray(reportedPosts.postId, postIds),
            eq(reportedPosts.status, 'pending')
        ),
        columns: {
            postId: true
        }
    }) : [];
    const postsUnderReview = new Set(pendingReports.map(r => r.postId));


    const buildReplyTree = (postId: string | null): Reply[] => {
        return allPosts
            .filter(p => p.parentId === postId)
            .map(p => ({
                id: p.id,
                author: p.author,
                content: p.content,
                timestamp: p.timestamp.toLocaleString(),
                attachments: p.attachments.map(a => a.url),
                replies: buildReplyTree(p.id),
                color: p.color,
                isUnderReview: postsUnderReview.has(p.id)
            }));
    };
    
    const initialPost = allPosts.find(p => p.parentId === null);

    if (!initialPost) {
        // A topic must have an initial post.
        // This can happen if the initial post is deleted.
        // We should handle this gracefully.
        return null;
    }

    const formattedTopic: Topic = {
        id: topicResult.id,
        title: topicResult.title,
        author: topicResult.author,
        timestamp: topicResult.timestamp.toLocaleString(),
        replyCount: topicResult.replyCount ?? 0,
        initialPost: {
            id: initialPost.id,
            author: initialPost.author,
            content: initialPost.content,
            timestamp: initialPost.timestamp.toLocaleString(),
            attachments: initialPost.attachments.map(a => a.url),
            replies: buildReplyTree(initialPost.id),
            color: initialPost.color,
            isUnderReview: postsUnderReview.has(initialPost.id)
        }
    };

    return formattedTopic;
}


export default async function TopicPage({ params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();
  const topic = await getTopicData(params.id);

  if (!topic || !currentUser) {
    notFound();
  }

  const canDeleteTopic = currentUser && topic.author.id === currentUser.id;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/topics">Topics</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{topic.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex justify-between items-start">
            <h1 className="text-3xl font-bold tracking-tight">{topic.title}</h1>
            {canDeleteTopic && <TopicActions topicId={topic.id} isUnderReview={!!topic.initialPost.isUnderReview} />}
        </div>
        <ThreadView topic={topic} currentUser={currentUser} />
      </div>
    </div>
  );
}
