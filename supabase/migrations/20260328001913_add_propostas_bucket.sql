-- Adiciona o bucket "propostas" para armazenar os PDFs gerados
INSERT INTO storage.buckets (id, name, public) 
VALUES ('propostas', 'propostas', true) 
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects 
  FOR SELECT USING (bucket_id = 'propostas');

DROP POLICY IF EXISTS "Auth Insert" ON storage.objects;
CREATE POLICY "Auth Insert" ON storage.objects 
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'propostas');

DROP POLICY IF EXISTS "Auth Update" ON storage.objects;
CREATE POLICY "Auth Update" ON storage.objects 
  FOR UPDATE TO authenticated USING (bucket_id = 'propostas');

DROP POLICY IF EXISTS "Auth Delete" ON storage.objects;
CREATE POLICY "Auth Delete" ON storage.objects 
  FOR DELETE TO authenticated USING (bucket_id = 'propostas');
