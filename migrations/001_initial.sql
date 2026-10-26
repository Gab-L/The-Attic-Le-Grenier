CREATE TABLE IF NOT EXISTS "user" (
 id text PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE,
 email_verified boolean NOT NULL DEFAULT false, image text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 is_anonymous boolean NOT NULL DEFAULT false, username text UNIQUE, display_username text
);
CREATE TABLE IF NOT EXISTS session (
 id text PRIMARY KEY, expires_at timestamptz NOT NULL, token text NOT NULL UNIQUE,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 ip_address text, user_agent text, user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS session_user_idx ON session(user_id);
CREATE TABLE IF NOT EXISTS account (
 id text PRIMARY KEY, account_id text NOT NULL, provider_id text NOT NULL,
 user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 access_token text, refresh_token text, id_token text, access_token_expires_at timestamptz,
 refresh_token_expires_at timestamptz, scope text, password text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(provider_id, account_id)
);
CREATE INDEX IF NOT EXISTS account_user_idx ON account(user_id);
CREATE TABLE IF NOT EXISTS verification (
 id text PRIMARY KEY, identifier text NOT NULL, value text NOT NULL,
 expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS verification_identifier_idx ON verification(identifier);
CREATE TABLE IF NOT EXISTS rate_limit (id text PRIMARY KEY, key text NOT NULL UNIQUE, count integer NOT NULL, last_request bigint NOT NULL);

CREATE TABLE collections (
 id text PRIMARY KEY, name text NOT NULL, description text NOT NULL, reward text NOT NULL
);
CREATE TABLE definitions (
 id text PRIMARY KEY, slug text NOT NULL UNIQUE, name text NOT NULL, description text NOT NULL,
 period text NOT NULL CHECK(period IN ('1990','2000','2010')), category text NOT NULL,
 collection_id text NOT NULL REFERENCES collections(id), rarity text NOT NULL CHECK(rarity IN ('common','uncommon','rare','legendary')),
 illustration text NOT NULL, width integer NOT NULL CHECK(width BETWEEN 1 AND 2),
 surfaces jsonb NOT NULL, active boolean NOT NULL DEFAULT true
);
CREATE TABLE players (
 id uuid PRIMARY KEY, user_id text NOT NULL UNIQUE REFERENCES "user"(id),
 handle text NOT NULL UNIQUE, role text NOT NULL DEFAULT 'player' CHECK(role IN ('player','admin')),
 created_at timestamptz NOT NULL DEFAULT now(), stock integer NOT NULL DEFAULT 1 CHECK(stock BETWEEN 0 AND 4),
 recharge_at timestamptz NOT NULL DEFAULT now(), room jsonb NOT NULL DEFAULT '{"theme":"warm","wall":"cream","floor":"honey","placements":[]}',
 room_version integer NOT NULL DEFAULT 0, public boolean NOT NULL DEFAULT false,
 share_id uuid NOT NULL UNIQUE, favorites jsonb NOT NULL DEFAULT '[]',
 discoveries jsonb NOT NULL DEFAULT '[]', rewards jsonb NOT NULL DEFAULT '[]', badges jsonb NOT NULL DEFAULT '[]'
);
CREATE TABLE openings (
 id uuid PRIMARY KEY, player_id uuid NOT NULL REFERENCES players(id), idempotency_key uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), results jsonb NOT NULL,
 UNIQUE(player_id, idempotency_key)
);
CREATE INDEX openings_player_idx ON openings(player_id, created_at DESC);
CREATE TABLE trades (
 id uuid PRIMARY KEY, sender_id uuid NOT NULL REFERENCES players(id), recipient_id uuid NOT NULL REFERENCES players(id),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','declined','cancelled','expired')),
 offered uuid[] NOT NULL, requested uuid[] NOT NULL, idempotency_key uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL DEFAULT now() + interval '72 hours',
 updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(sender_id, idempotency_key), CHECK(sender_id <> recipient_id)
);
CREATE INDEX trades_pending_idx ON trades(expires_at) WHERE status = 'pending';
CREATE INDEX trades_sender_idx ON trades(sender_id);
CREATE INDEX trades_recipient_idx ON trades(recipient_id);
CREATE TABLE instances (
 id uuid PRIMARY KEY, definition_id text NOT NULL REFERENCES definitions(id), owner_id uuid NOT NULL REFERENCES players(id),
 acquired_at timestamptz NOT NULL DEFAULT now(), origin text NOT NULL, reserved_trade uuid REFERENCES trades(id)
);
CREATE INDEX instances_owner_idx ON instances(owner_id);
CREATE INDEX instances_reservation_idx ON instances(reserved_trade) WHERE reserved_trade IS NOT NULL;
CREATE TABLE notifications (
 id uuid PRIMARY KEY, player_id uuid NOT NULL REFERENCES players(id), message text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), read boolean NOT NULL DEFAULT false
);
CREATE TABLE blocks (
 player_id uuid NOT NULL REFERENCES players(id), blocked_id uuid NOT NULL REFERENCES players(id),
 PRIMARY KEY(player_id, blocked_id), CHECK(player_id <> blocked_id)
);
CREATE TABLE reports (
 id uuid PRIMARY KEY, reporter_id uuid NOT NULL REFERENCES players(id), target_id uuid NOT NULL REFERENCES players(id),
 reason text NOT NULL, status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE settings (id text PRIMARY KEY, value jsonb NOT NULL);
INSERT INTO settings VALUES ('distribution', '{"common":65,"uncommon":23,"rare":10,"legendary":2,"rechargeHours":6}') ON CONFLICT DO NOTHING;
CREATE TABLE audit (
 id bigserial PRIMARY KEY, actor_id uuid REFERENCES players(id), action text NOT NULL, details jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE rate_buckets (key text PRIMARY KEY, count integer NOT NULL, reset_at timestamptz NOT NULL);
