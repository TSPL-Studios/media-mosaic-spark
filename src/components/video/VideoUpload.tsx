
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Upload, Video } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const VideoUpload = () => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'entertainment' | 'education' | 'music' | 'gaming' | 'sports' | 'technology' | 'cooking' | 'travel' | 'lifestyle' | 'news'>('entertainment');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleVideoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!videoFile || !title.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please provide a title and select a video file.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      // For now, we'll create a video record without actual file upload
      // In a real implementation, you would upload to Supabase Storage first
      
      const { data, error } = await supabase
        .from('videos')
        .insert({
          title: title.trim(),
          description: description.trim(),
          category: category,
          creator_id: user.id,
          status: 'published',
          video_url: `https://example.com/videos/${Date.now()}.mp4`, // Placeholder
          thumbnail_url: thumbnailFile ? `https://example.com/thumbnails/${Date.now()}.jpg` : null,
          duration: 0, // Would be extracted from video file
          view_count: 0,
          like_count: 0,
          dislike_count: 0,
          comment_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Video uploaded successfully!",
        description: "Your video is now live on VidNova."
      });

      // Reset form
      setTitle('');
      setDescription('');
      setCategory('entertainment');
      setVideoFile(null);
      setThumbnailFile(null);

    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Video className="mr-2 h-5 w-5" />
            Upload Video
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVideoUpload} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Video File *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <Input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="video-upload"
                />
                <label htmlFor="video-upload" className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-500">
                    Choose video file
                  </span>
                  <span className="text-gray-500"> or drag and drop</span>
                </label>
                {videoFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: {videoFile.name}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Thumbnail (optional)
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              />
              {thumbnailFile && (
                <p className="mt-1 text-sm text-gray-600">
                  Selected: {thumbnailFile.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Title *
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video title"
                maxLength={100}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell viewers about your video"
                rows={4}
                maxLength={1000}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Category
              </label>
              <Select value={category} onValueChange={(value: any) => setCategory(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="music">Music</SelectItem>
                  <SelectItem value="gaming">Gaming</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="cooking">Cooking</SelectItem>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="lifestyle">Lifestyle</SelectItem>
                  <SelectItem value="news">News</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={uploading} className="w-full">
              {uploading ? 'Uploading...' : 'Upload Video'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoUpload;
