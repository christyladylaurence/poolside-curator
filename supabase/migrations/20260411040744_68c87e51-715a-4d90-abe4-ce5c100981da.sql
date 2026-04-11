INSERT INTO storage.buckets (id, name, public) VALUES ('episodes', 'episodes', true);

CREATE POLICY "Anyone can upload episode files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'episodes');

CREATE POLICY "Anyone can read episode files" ON storage.objects FOR SELECT USING (bucket_id = 'episodes');

CREATE POLICY "Anyone can delete their episode files" ON storage.objects FOR DELETE USING (bucket_id = 'episodes');