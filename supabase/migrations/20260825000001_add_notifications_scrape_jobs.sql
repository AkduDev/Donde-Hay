-- Dónde Hay - Notifications & Scrape Jobs Migration
-- Adds tables for in-app notifications and scrape job tracking

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT CHECK (type IN ('price_alert', 'system', 'promotional')) NOT NULL DEFAULT 'system',
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ============================================
-- SCRAPE JOBS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS scrape_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed', 'dry_run')) DEFAULT 'pending',
  categories TEXT[] DEFAULT '{}',
  products_found INT DEFAULT 0,
  products_new INT DEFAULT 0,
  products_updated INT DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INT
);

CREATE INDEX IF NOT EXISTS idx_scrape_jobs_source ON scrape_jobs(source_id);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_status ON scrape_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_started ON scrape_jobs(started_at DESC);

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- NOTIFICATIONS RLS POLICIES
-- ============================================
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can mark own notifications as read"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can insert notifications (used by Edge Functions)
CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ============================================
-- SCRAPE JOBS RLS POLICIES
-- ============================================
-- Only service role can access scrape_jobs (admin data)
CREATE POLICY "Service role can manage scrape jobs"
  ON scrape_jobs FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- HELPER: Mark all user notifications as read
-- ============================================
CREATE OR REPLACE FUNCTION public.mark_notifications_read(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET read = true
  WHERE user_id = p_user_id AND read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER: Get unread notification count
-- ============================================
CREATE OR REPLACE FUNCTION public.unread_notification_count(p_user_id UUID)
RETURNS INT AS $$
SELECT COUNT(*)::INT
FROM notifications
WHERE user_id = p_user_id AND read = false;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================
-- pg_cron: Schedule price alert checks every 15 minutes
-- Run this AFTER deploying the check-price-alerts Edge Function:
--
-- SELECT cron.schedule(
--   'check-price-alerts',
--   '*/15 * * * *',
--   $$
--   SELECT net.http_post(
--     url := current_setting('app.settings.supabase_url') || '/functions/v1/check-price-alerts',
--     headers := '{"Content-Type": "application/json", "Authorization": "Bearer " || current_setting('app.settings.service_role_key'), "X-Cron-Secret": "' || current_setting('app.settings.cron_secret') || '"}',
--     body := '{}'
--   );
--   $$
-- );
-- ============================================
