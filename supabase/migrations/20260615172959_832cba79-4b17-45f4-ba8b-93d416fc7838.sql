
-- Storage policies for the 'books' bucket: any authenticated user can read,
-- only admins can upload/delete.
CREATE POLICY "Authenticated users can read books"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'books');

CREATE POLICY "Admins can upload books"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'books' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update books"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'books' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete books"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'books' AND public.has_role(auth.uid(), 'admin'));
