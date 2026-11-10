CREATE TABLE users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), google_sub text UNIQUE NOT NULL, name text, created_at timestamptz DEFAULT now());
CREATE TABLE circles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text UNIQUE NOT NULL, head_id uuid NOT NULL REFERENCES users, escalation_min int NOT NULL DEFAULT 15 CHECK (escalation_min IN (15,30,60)), created_at timestamptz DEFAULT now());
CREATE TABLE members (
  circle_id uuid REFERENCES circles ON DELETE CASCADE, user_id uuid REFERENCES users ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('kepala','wakil','perawat')),
  status text NOT NULL CHECK (status IN ('pending','approved')),
  can_edit_medicine bool NOT NULL DEFAULT false, can_read_documents bool NOT NULL DEFAULT false,
  PRIMARY KEY (circle_id, user_id));
CREATE TABLE consents (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE, purpose text NOT NULL, recipient text NOT NULL, granted_at timestamptz DEFAULT now(), revoked_at timestamptz);
CREATE TABLE audit_log (id bigserial PRIMARY KEY, circle_id uuid, user_id uuid, action text NOT NULL, detail text, at timestamptz DEFAULT now());
