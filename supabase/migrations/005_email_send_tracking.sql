-- 005_email_send_tracking.sql
--
-- Supports "Send to client": the server records when a proposal was last emailed and
-- how many times, so the send button can enforce a cooldown and a per-proposal cap
-- (otherwise it could be used to spam whatever address was typed into a proposal).
--
-- Run this BEFORE deploying the code that uses the Send button. These columns are
-- written only by the server (service role); owners get no UPDATE grant on them (see 004).

ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS send_count INTEGER NOT NULL DEFAULT 0;

-- A new proposal can't be created already "used up" or pre-stamped. Without this an
-- owner could insert send_count = -1000 and sidestep the cap.
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
    AND send_count = 0
    AND last_sent_at IS NULL
  );
