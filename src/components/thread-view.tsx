
import type { Topic, User } from '@/lib/types';
import { PostCard } from './post-card';

interface ThreadViewProps {
  topic: Topic;
  currentUser: User;
}

export function ThreadView({ topic, currentUser }: ThreadViewProps) {
  return (
    <div className="space-y-6">
      <PostCard post={topic.initialPost} topicId={topic.id} isInitialPost={true} currentUser={currentUser} />
    </div>
  );
}
