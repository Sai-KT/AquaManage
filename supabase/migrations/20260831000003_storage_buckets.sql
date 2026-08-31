-- ═══════════════════════════════════════════════════════════════════════════
-- AquaManage — Storage Bucket Migration
-- Supabase Storage configuration for Leak Photos and Videos Evidence
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Create 'leak-evidence' Storage Bucket ─────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'leak-evidence',
  'leak-evidence',
  true,
  52428800, -- 50 MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/ogg'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ── 2. Storage RLS Policies ──────────────────────────────────────────────────
-- View / Download files from leak-evidence
CREATE POLICY "Public Read Access for Leak Evidence"
  ON storage.objects FOR SELECT
  TO authenticated, anon
  USING (bucket_id = 'leak-evidence');

-- Upload files (authenticated users)
CREATE POLICY "Authenticated Users Can Upload Leak Evidence"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'leak-evidence');

-- Update files (uploader or admin)
CREATE POLICY "Uploader or Admin Can Update Evidence"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'leak-evidence' AND (auth.uid() = owner OR public.is_admin()))
  WITH CHECK (bucket_id = 'leak-evidence' AND (auth.uid() = owner OR public.is_admin()));

-- Delete files (uploader or admin)
CREATE POLICY "Uploader or Admin Can Delete Evidence"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'leak-evidence' AND (auth.uid() = owner OR public.is_admin()));
