
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { toast } from '@/components/ui/use-toast';
import { ThumbsUp, ThumbsDown, Share, Eye, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const WatchPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [userLike, setUserLike] = useState<boolean | null>(null);

  const { data: video, isLoading } = useQuery({
    queryKey: ['video', id],
    queryFn: async () => {
      if (!id) throw new Error('Video ID is required');
      
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          profiles (
            username,
            display_name,
            avatar_url,
            subscriber_count
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: comments } = useQuery({
    queryKey: ['comments', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('video_id', id)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Check user's like status
  useEffect(() => {
    if (user && id) {
      supabase
        .from('video_likes')
        .select('is_like')
        .eq('user_id', user.id)
        .eq('video_id', id)
        .single()
        .then(({ data }) => {
          setUserLike(data?.is_like ?? null);
        });
    }
  }, [user, id]);

  const likeMutation = useMutation({
    mutationFn: async (isLike: boolean) => {
      if (!user || !id) throw new Error('User not authenticated');

      if (userLike === isLike) {
        // Remove like/dislike
        await supabase
          .from('video_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('video_id', id);
        return null;
      } else {
        // Add or update like/dislike
        await supabase
          .from('video_likes')
          .upsert({
            user_id: user.id,
            video_id: id,
            is_like: isLike,
          });
        return isLike;
      }
    },
    onSuccess: (result) => {
      setUserLike(result);
      queryClient.invalidateQueries({ queryKey: ['video', id] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('comments')
        .insert({
          video_id: id,
          user_id: user.id,
          content: content.trim(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully."
      });
    },
  });

  const handleLike = () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to like videos.",
        variant: "destructive"
      });
      return;
    }
    likeMutation.mutate(true);
  };

  const handleDislike = () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to dislike videos.",
        variant: "destructive"
      });
      return;
    }
    likeMutation.mutate(false);
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to comment.",
        variant: "destructive"
      });
      return;
    }

    commentMutation.mutate(commentText);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="bg-gray-300 aspect-video rounded-lg mb-4"></div>
          <div className="h-8 bg-gray-300 rounded mb-4"></div>
          <div className="flex items-center space-x-4 mb-4">
            <div className="h-12 w-12 bg-gray-300 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="max-w-7xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-600">Video not found</h1>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Video Section */}
        <div className="lg:col-span-2">
          {/* Video Player */}
          <div className="bg-black aspect-video rounded-lg mb-4 flex items-center justify-center">
            <video
              src={video.video_url}
              controls
              className="w-full h-full rounded-lg"
              poster={video.thumbnail_url || undefined}
            >
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Video Info */}
          <div className="mb-6">
            <h1 className="text-xl font-bold mb-2">{video.title}</h1>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center text-sm text-gray-600 space-x-4">
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {video.view_count?.toLocaleString()} views
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant={userLike === true ? "default" : "outline"}
                  size="sm"
                  onClick={handleLike}
                  disabled={likeMutation.isPending}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  {video.like_count}
                </Button>
                <Button
                  variant={userLike === false ? "default" : "outline"}
                  size="sm"
                  onClick={handleDislike}
                  disabled={likeMutation.isPending}
                >
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  {video.dislike_count}
                </Button>
                <Button variant="outline" size="sm">
                  <Share className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </div>
            </div>

            {/* Channel Info */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={video.profiles.avatar_url || ''} />
                  <AvatarFallback>
                    {video.profiles.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium">{video.profiles.display_name || video.profiles.username}</h3>
                    <VerifiedBadge subscriberCount={video.profiles.subscriber_count} />
                  </div>
                  <p className="text-sm text-gray-600">
                    {video.profiles.subscriber_count?.toLocaleString() || 0} subscribers
                  </p>
                </div>
              </div>
              <Button>Subscribe</Button>
            </div>

            {/* Description */}
            {video.description && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="whitespace-pre-wrap text-sm">{video.description}</p>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4">
              Comments ({video.comment_count || 0})
            </h2>

            {/* Add Comment */}
            {user && (
              <form onSubmit={handleComment} className="mb-6">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className="mb-2"
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setCommentText('')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!commentText.trim() || commentMutation.isPending}
                  >
                    Comment
                  </Button>
                </div>
              </form>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments?.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.profiles.avatar_url || ''} />
                    <AvatarFallback className="text-xs">
                      {comment.profiles.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm">
                        {comment.profiles.display_name || comment.profiles.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar - Related Videos */}
        <div className="lg:col-span-1">
          <h3 className="font-semibold mb-4">Recommended</h3>
          <div className="text-center text-gray-500">
            Related videos will appear here
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchPage;
