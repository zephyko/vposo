-- Fix storage security: Make audio bucket private and update policies

-- 1. Make the audio bucket private
UPDATE storage.buckets SET public = false WHERE id = 'audio';

-- 2. Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view audio files" ON storage.objects;

-- 3. Create secure SELECT policy - users can only view their own audio files
-- Files are stored in {user_id}/ folder structure
CREATE POLICY "Users can view their own audio" ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. Update INSERT policy to ensure users can only upload to their own folder
DROP POLICY IF EXISTS "Authenticated users can upload audio" ON storage.objects;
CREATE POLICY "Users can upload their own audio" ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5. Add DELETE policy for users to delete their own audio
DROP POLICY IF EXISTS "Users can delete their own audio" ON storage.objects;
CREATE POLICY "Users can delete their own audio" ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);