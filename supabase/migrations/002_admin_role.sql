-- Add role column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- Allow admins to read all proposals (admins use service role in practice,
-- but this policy covers direct Supabase client access too)
CREATE POLICY "admin read all proposals" ON proposals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- To make yourself admin, run:
-- UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
