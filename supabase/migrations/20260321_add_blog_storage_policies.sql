-- Storage policies for blog-images bucket
-- NOTE: The bucket 'blog-images' must be created manually in Supabase Dashboard > Storage
-- as a PUBLIC bucket before these policies will work.

-- Allow authenticated admin users to upload images
CREATE POLICY "Admins can upload blog images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'blog-images'
    AND public.has_role(auth.uid(), 'admin')
  );

-- Allow authenticated admin users to update/overwrite images
CREATE POLICY "Admins can update blog images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'blog-images'
    AND public.has_role(auth.uid(), 'admin')
  );

-- Allow authenticated admin users to delete images
CREATE POLICY "Admins can delete blog images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'blog-images'
    AND public.has_role(auth.uid(), 'admin')
  );

-- Allow anyone to view/download images (public bucket)
CREATE POLICY "Anyone can view blog images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'blog-images');
