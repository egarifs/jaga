CREATE TABLE medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES circles ON DELETE CASCADE,
  name text NOT NULL, dose_text text NOT NULL,
  units_per_dose numeric NOT NULL DEFAULT 1 CHECK (units_per_dose > 0),
  times text[] NOT NULL DEFAULT '{}',
  as_needed bool NOT NULL DEFAULT false, condition_text text, min_gap_min int CHECK (min_gap_min > 0),
  remaining numeric NOT NULL DEFAULT 0 CHECK (remaining >= 0), expiry date,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (as_needed OR cardinality(times) > 0),
  CHECK (NOT as_needed OR min_gap_min IS NOT NULL));
CREATE TABLE doses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id uuid NOT NULL REFERENCES medicines ON DELETE CASCADE,
  circle_id uuid NOT NULL REFERENCES circles ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','taken','skipped')),
  taken_at timestamptz, device_taken_at timestamptz,
  logged_by uuid REFERENCES users ON DELETE SET NULL,
  escalate_at timestamptz NOT NULL, reminded_at timestamptz, escalated_at timestamptz,
  UNIQUE (medicine_id, scheduled_at));
CREATE INDEX doses_pending ON doses (scheduled_at) WHERE status = 'pending';
CREATE TABLE shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES circles ON DELETE CASCADE,
  user_id uuid REFERENCES users ON DELETE CASCADE,
  name text NOT NULL, start_time text NOT NULL, end_time text NOT NULL);
-- Outbox: server decides who to alert; FCM sender drains rows where sent_at IS NULL.
CREATE TABLE notifications (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  dose_id uuid REFERENCES doses ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('reminder','escalation')),
  created_at timestamptz NOT NULL DEFAULT now(), sent_at timestamptz);
