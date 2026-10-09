-- 004_security_hardening.sql
--
-- Closes holes where a signed-in user could use the public Supabase API directly
-- (anon key + their own login) to bypass the checks the Next.js API routes make.
--
-- ORDER OF DEPLOYMENT: ship the matching app code first, then run this. The auth
-- callback now inserts profiles with ON CONFLICT DO NOTHING; the previous version
-- upserted and needs UPDATE rights on columns this migration removes.
--
-- The server routes use the service role, which ignores RLS and column grants, so
-- nothing below affects them.

-- ---------------------------------------------------------------------------
-- 1. profiles: a user must not be able to set their own role (privilege escalation)
-- ---------------------------------------------------------------------------
-- 001 had no WITH CHECK and no column limit, so
--   supabase.from("profiles").update({ role: "admin" }).eq("id", myId)
-- succeeded for any logged-in user.

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Row policies can't restrict columns, so use column privileges: signed-in users may
-- edit only their name and branding. role and email are never client-writable.
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (full_name, company_name, company_logo_url, brand_color)
  ON public.profiles TO authenticated;

-- Profiles are created by the on_auth_user_created trigger. The app's fallback insert
-- may only set identity columns, so it can't create a row that already says role = 'admin'.
REVOKE INSERT ON public.profiles FROM anon, authenticated;
GRANT INSERT (id, email, full_name) ON public.profiles TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. admin policy on proposals: "read" policy was FOR ALL
-- ---------------------------------------------------------------------------
-- 002 named it "admin read all proposals" but declared it FOR ALL, which also let any
-- admin session update or delete every user's proposals. Admin routes already use the
-- service role for writes, so SELECT is all that's needed.

DROP POLICY IF EXISTS "admin read all proposals" ON public.proposals;
CREATE POLICY "admin read all proposals"
  ON public.proposals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- 3. proposals: enforce the status rules in the database, not only in the API
-- ---------------------------------------------------------------------------
-- PATCH /api/proposals/[id] whitelists status changes, but the owner's RLS policy let
-- them call the Supabase API directly and set status = 'paid' (or edit a signed
-- proposal) themselves. Close that:

-- New proposals start as plain drafts: no signature, no payment, no views.
DROP POLICY IF EXISTS "Owners can insert proposals" ON public.proposals;
CREATE POLICY "Owners can insert proposals"
  ON public.proposals FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'draft'
    AND signature_data IS NULL
    AND signed_at IS NULL
    AND paid_at IS NULL
    AND viewed_at IS NULL
    AND stripe_checkout_session_id IS NULL
    AND COALESCE(view_count, 0) = 0
  );

DROP POLICY IF EXISTS "Owners can update own proposals" ON public.proposals;
CREATE POLICY "Owners can update own proposals"
  ON public.proposals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Owners may edit the content fields. Signature, payment, view and Stripe columns
-- (and amount and ownership) are written only by the server.
REVOKE UPDATE ON public.proposals FROM anon, authenticated;
GRANT UPDATE (title, client_name, client_email, content, status, expires_at, updated_at)
  ON public.proposals TO authenticated;

-- Status rules for end-user sessions. current_user is 'authenticated' for requests made
-- with a user's JWT; the service role and the SQL editor are exempt.
CREATE OR REPLACE FUNCTION public.guard_proposal_update()
RETURNS TRIGGER AS $$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF OLD.status IN ('signed', 'paid') THEN
    RAISE EXCEPTION 'Signed or paid proposals are read-only' USING ERRCODE = '42501';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     AND NOT (
       (OLD.status = 'draft' AND NEW.status = 'sent')
       OR (OLD.status = 'sent' AND NEW.status = 'draft')
     )
  THEN
    RAISE EXCEPTION 'Status change % -> % is not allowed', OLD.status, NEW.status
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS proposals_guard_update ON public.proposals;
CREATE TRIGGER proposals_guard_update
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_proposal_update();

-- ---------------------------------------------------------------------------
-- Rollback (if ever needed)
-- ---------------------------------------------------------------------------
-- DROP TRIGGER proposals_guard_update ON public.proposals;
-- DROP FUNCTION public.guard_proposal_update();
-- GRANT UPDATE ON public.proposals TO authenticated;
-- GRANT UPDATE, INSERT ON public.profiles TO authenticated;
-- (then re-create the original policies from 001/002)
