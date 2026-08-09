
DROP POLICY IF EXISTS "storage_public_read_site" ON storage.objects;
CREATE POLICY "storage_authenticated_read_site" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'site-images');
