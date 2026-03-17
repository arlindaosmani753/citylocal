-- Phase 2: Create post-images Supabase Storage bucket with RLS policies
-- Public bucket so getPublicUrl() works without signed read URLs.
-- Insert restricted to authenticated users; read is public.

INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
  'post-images',
  'post-images',
  true,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  10485760  -- 10MB per file
)
ON CONFLICT DO NOTHING;

-- Allow authenticated users to upload post images
CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'post-images'
  AND (storage.foldername(name))[1] = 'posts'
);

-- Public read for all post images (bucket is public)
CREATE POLICY "Post images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');
