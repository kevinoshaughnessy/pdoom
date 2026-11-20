-- D1 schema for saved p(Doom) responses.
-- Key fields are columns for quick queries; the full response is kept as JSON in payload.
CREATE TABLE IF NOT EXISTS responses (
  id          TEXT PRIMARY KEY,
  created_at  TEXT NOT NULL,
  version     TEXT,
  name        TEXT,           -- NULL when the respondent stayed anonymous
  field       TEXT,
  gut_before  REAL,
  gut_after   REAL,
  pdoom       REAL NOT NULL,
  archetype   TEXT,
  payload     TEXT NOT NULL   -- full JSON: answers, framing, question order, shares, crux, "why" text
);
CREATE INDEX IF NOT EXISTS idx_responses_created ON responses (created_at);
