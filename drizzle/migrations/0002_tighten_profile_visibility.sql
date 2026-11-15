DROP POLICY IF EXISTS "Signed-in users can view creator profiles" ON public.profiles;
CREATE POLICY "View own or completed creator profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR onboarded = true);

DROP POLICY IF EXISTS "Signed-in users read profile media" ON storage.objects;
CREATE POLICY "Read own or current public avatar" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'profile-media'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.onboarded = true
          AND p.id::text = (storage.foldername(name))[1]
          AND p.avatar_url = 'sb://profile-media/' || name
      )
    )
  );