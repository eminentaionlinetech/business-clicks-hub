CREATE POLICY "receipts upload own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "receipts read own or admin" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'receipts' AND ((storage.foldername(name))[1] = auth.uid()::text OR app_private.has_role(auth.uid(),'admin')));

CREATE POLICY "claim receipts upload own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'claim-receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "claim receipts read own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'claim-receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "claim receipts delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'claim-receipts' AND (storage.foldername(name))[1] = auth.uid()::text);