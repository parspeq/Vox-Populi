
'use client';

import type { Reply, User } from '@/lib/types';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Paperclip, Reply as ReplyIcon, Edit, Trash2, Flag, Info } from 'lucide-react';
import { PostReply } from './post-reply';
import { useToast } from '@/hooks/use-toast';
import { editPost, deletePost, reportPost } from '@/app/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EnrichedTextViewer } from './enriched-text-viewer';
import { EnrichedTextEditor } from './enriched-text-editor';


interface PostCardProps {
  post: Reply;
  topicId: string;
  isInitialPost?: boolean;
  currentUser: User | null;
}

export function PostCard({ post, topicId, isInitialPost = false, currentUser }: PostCardProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isReportAlertOpen, setIsReportAlertOpen] = useState(false);
  const { toast } = useToast();

  const canEditOrDelete = currentUser && post.author.id === currentUser.id;
  const canReport = currentUser && post.author.id !== currentUser.id;

  const handleEditSubmit = async () => {
    if (editedContent === post.content) {
      setIsEditing(false);
      return;
    }
    setIsSubmitting(true);

    const result = await editPost({ postId: post.id, content: editedContent });
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: 'Success',
        description: 'Your post has been updated.',
      });
      setIsEditing(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error updating post',
        description: result.message || 'An unknown error occurred.',
      });
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    const result = await deletePost(post.id, topicId);
    // This part might not be reached if redirect works as expected
    // but good for handling errors without redirect
    setIsSubmitting(false);
    setIsAlertOpen(false);

    if (result.success) {
      toast({
        title: 'Success',
        description: 'The post has been deleted.',
      });
      // The revalidation should handle the UI update
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.message || 'Could not delete the post.',
      });
    }
  };

  const handleReport = async () => {
    setIsSubmitting(true);
    const result = await reportPost(post.id);
    setIsSubmitting(false);
    setIsReportAlertOpen(false);
    
    if (result.success) {
      toast({
        title: 'Post Reported',
        description: result.message,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error Reporting Post',
        description: result.message,
      });
    }
  };
  
  return (
    <div className={`flex gap-4 ${!isInitialPost ? 'pt-4' : ''}`}>
      <Avatar className="h-10 w-10">
        <AvatarImage src={post.author.avatar ?? undefined} alt={post.author.name} />
        <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{post.author.name}</span>
          <span className="text-xs text-muted-foreground">{post.timestamp}</span>
        </div>
        
        {isEditing ? (
          <div className="mt-2 space-y-2">
             <EnrichedTextEditor
                value={editedContent}
                onChange={setEditedContent}
                maxLength={500}
                disabled={isSubmitting}
              />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} disabled={isSubmitting}>Cancel</Button>
              <Button size="sm" onClick={handleEditSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {post.isUnderReview && (
              <Alert variant="destructive" className="mt-4 text-orange-500 border-orange-500/50 [&>svg]:text-orange-500">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This post has been reported and is pending community review.
                </AlertDescription>
              </Alert>
            )}
            <div className="prose prose-sm dark:prose-invert max-w-none mt-2">
                <div style={{ color: post.color ?? 'inherit' }}>
                    <EnrichedTextViewer text={post.content} />
                </div>
            </div>
          </>
        )}

        {!isEditing && post.attachments.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.attachments.map((file, index) => (
              <Button variant="outline" size="sm" key={index} className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                <span>{file}</span>
              </Button>
            ))}
          </div>
        )}

        {!isEditing && (
            <div className="mt-2 flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setIsReplying(!isReplying)} disabled={!!post.isUnderReview}>
                <ReplyIcon className="mr-2 h-4 w-4" />
                Reply
            </Button>
            {canEditOrDelete && (
              <>
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} disabled={!!post.isUnderReview}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                </Button>
                {!isInitialPost && (
                   <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setIsAlertOpen(true)} disabled={!!post.isUnderReview}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                  </Button>
                )}
              </>
            )}
            {canReport && (
                <Button variant="ghost" size="sm" onClick={() => setIsReportAlertOpen(true)} disabled={!!post.isUnderReview}>
                    <Flag className="mr-2 h-4 w-4" />
                    {post.isUnderReview ? 'Reported' : 'Report'}
                </Button>
            )}
            </div>
        )}

        {isReplying && (
          <div className="mt-4">
            <PostReply 
              topicId={topicId} 
              parentId={post.id} 
              onReplySubmitted={() => setIsReplying(false)}
            />
          </div>
        )}
        
        {post.replies && post.replies.length > 0 && (
          <div className="mt-4 pl-4 border-l-2 border-border">
            {post.replies.map((reply) => (
              <PostCard key={reply.id} post={reply} topicId={topicId} currentUser={currentUser}/>
            ))}
          </div>
        )}
      </div>

       <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this post and all of its replies.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSubmitting} className="bg-destructive hover:bg-destructive/90">
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isReportAlertOpen} onOpenChange={setIsReportAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to report this post? This will submit it for community review.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReport} disabled={isSubmitting} className="bg-destructive hover:bg-destructive/90">
              {isSubmitting ? 'Reporting...' : 'Report'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
