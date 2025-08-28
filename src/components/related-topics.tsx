'use client';

import { useEffect, useState } from 'react';
import { suggestRelatedTopics } from '@/ai/flows/suggest-related-topics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';

interface RelatedTopicsProps {
  threadContent: string;
}

export function RelatedTopics({ threadContent }: RelatedTopicsProps) {
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      setLoading(true);
      try {
        const result = await suggestRelatedTopics({ threadContent });
        setTopics(result.relatedTopics);
      } catch (error) {
        console.error('Failed to fetch related topics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [threadContent]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Lightbulb className="h-5 w-5 text-primary" />
        <CardTitle className="text-lg">Related Topics</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <ul className="space-y-2">
            {topics.map((topic, index) => (
              <li key={index} className="flex justify-between items-center group">
                <span className="text-sm text-muted-foreground">{topic}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
