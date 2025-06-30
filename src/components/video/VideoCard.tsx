
import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { formatDistanceToNow } from 'date-fns';
import { Eye, Clock } from 'lucide-react';

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    view_count: number;
    created_at: string;
    duration: number | null;
    profiles: {
      username: string;
      display_name: string | null;
      avatar_url: string | null;
      subscriber_count: number | null;
    };
  };
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatViews = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <Link to={`/watch/${video.id}`}>
        <div className="relative aspect-video bg-gray-200">
          {video.thumbnail_url ? (
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-300">
              <span className="text-gray-500">No thumbnail</span>
            </div>
          )}
          {video.duration && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {formatDuration(video.duration)}
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-3">
        <Link to={`/watch/${video.id}`}>
          <h3 className="font-medium text-sm line-clamp-2 mb-2 hover:text-blue-600">
            {video.title}
          </h3>
        </Link>
        
        <Link to={`/channel/${video.profiles.username}`}>
          <div className="flex items-center space-x-2 mb-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={video.profiles.avatar_url || ''} />
              <AvatarFallback className="text-xs">
                {video.profiles.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center space-x-1 flex-1">
              <span className="text-sm text-gray-600 hover:text-gray-800">
                {video.profiles.display_name || video.profiles.username}
              </span>
              <VerifiedBadge subscriberCount={video.profiles.subscriber_count} />
            </div>
          </div>
        </Link>
        
        <div className="flex items-center text-xs text-gray-500 space-x-3">
          <div className="flex items-center">
            <Eye className="h-3 w-3 mr-1" />
            {formatViews(video.view_count)} views
          </div>
          <span>•</span>
          <span>{formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}</span>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
