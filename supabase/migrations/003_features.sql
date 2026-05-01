-- View count tracking
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Custom branding on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_logo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#4f46e5';

-- Admin role (if not already added from migration 002)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- To make yourself admin:
-- UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
