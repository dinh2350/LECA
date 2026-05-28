-- ============================================================
-- LECA Tables Migration
-- All UUIDs via gen_random_uuid(). All timestamps in UTC.
-- n2base tables (user, session, file, role, status) are NOT modified.
-- ARCHITECTURE.md §3.2 — "sessions" renamed to "conversation_sessions"
--   to avoid conflict with n2base's "session" table.
-- ============================================================

-- ============================================================
-- ORGANIZATIONS  (Phase 3 — multi-tenant SaaS tier)
-- ============================================================
CREATE TABLE "organizations" (
  "id"          UUID          NOT NULL DEFAULT gen_random_uuid(),
  "name"        VARCHAR(255)  NOT NULL,
  "slug"        VARCHAR(100)  NOT NULL,
  "plan"        VARCHAR(20)   NOT NULL DEFAULT 'self_hosted',
  "max_users"   INTEGER,
  "lti_key"     VARCHAR(255),
  "lti_secret"  VARCHAR(255),
  "is_active"   BOOLEAN       NOT NULL DEFAULT TRUE,
  "created_at"  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "organizations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "organizations_slug_key" UNIQUE ("slug"),
  CONSTRAINT "organizations_plan_check" CHECK (plan IN ('self_hosted', 'cloud_free', 'cloud_paid'))
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE "users" (
  "id"              UUID          NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID,
  "email"           VARCHAR(255)  NOT NULL,
  "password_hash"   VARCHAR(255),
  "display_name"    VARCHAR(100)  NOT NULL,
  "native_language" CHAR(5),
  "english_level"   VARCHAR(3),
  "role"            VARCHAR(20)   NOT NULL DEFAULT 'learner',
  "timezone"        VARCHAR(50),
  "is_active"       BOOLEAN       NOT NULL DEFAULT TRUE,
  "last_active_at"  TIMESTAMP,
  "created_at"      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "users_pkey"         PRIMARY KEY ("id"),
  CONSTRAINT "users_email_key"    UNIQUE ("email"),
  CONSTRAINT "users_org_fkey"     FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL,
  CONSTRAINT "users_level_check"  CHECK (english_level IN ('A1','A2','B1','B2','C1','C2')),
  CONSTRAINT "users_role_check"   CHECK (role IN ('learner','teacher','admin','maintainer'))
);

CREATE INDEX "idx_users_org"    ON "users"("organization_id");
CREATE INDEX "idx_users_role"   ON "users"("role");
CREATE INDEX "idx_users_active" ON "users"("is_active", "last_active_at");

-- ============================================================
-- DEVICES  (Phase 3 — native iOS/Android push notifications)
-- ============================================================
CREATE TABLE "devices" (
  "id"           UUID         NOT NULL DEFAULT gen_random_uuid(),
  "user_id"      UUID         NOT NULL,
  "platform"     VARCHAR(10)  NOT NULL,
  "push_token"   TEXT,
  "app_version"  VARCHAR(20),
  "last_seen_at" TIMESTAMP,
  "created_at"   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "devices_pkey"           PRIMARY KEY ("id"),
  CONSTRAINT "devices_push_token_key" UNIQUE ("push_token"),
  CONSTRAINT "devices_user_fkey"      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "devices_platform_check" CHECK (platform IN ('ios','android','web'))
);

CREATE INDEX "idx_devices_user" ON "devices"("user_id");

-- ============================================================
-- CLASSES  (institutional)
-- ============================================================
CREATE TABLE "classes" (
  "id"              UUID          NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID,
  "teacher_id"      UUID          NOT NULL,
  "name"            VARCHAR(255)  NOT NULL,
  "join_code"       CHAR(8)       NOT NULL,
  "target_level"    VARCHAR(3),
  "is_active"       BOOLEAN       NOT NULL DEFAULT TRUE,
  "created_at"      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "classes_pkey"          PRIMARY KEY ("id"),
  CONSTRAINT "classes_join_code_key" UNIQUE ("join_code"),
  CONSTRAINT "classes_org_fkey"      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL,
  CONSTRAINT "classes_teacher_fkey"  FOREIGN KEY ("teacher_id") REFERENCES "users"("id"),
  CONSTRAINT "classes_level_check"   CHECK (target_level IN ('A1','A2','B1','B2','C1','C2'))
);

CREATE INDEX "idx_classes_teacher" ON "classes"("teacher_id");
CREATE INDEX "idx_classes_org"     ON "classes"("organization_id");

-- ============================================================
-- CLASS ENROLLMENTS  (many-to-many: users ↔ classes)
-- ============================================================
CREATE TABLE "class_enrollments" (
  "class_id"    UUID      NOT NULL,
  "user_id"     UUID      NOT NULL,
  "enrolled_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "class_enrollments_pkey"       PRIMARY KEY ("class_id", "user_id"),
  CONSTRAINT "class_enrollments_class_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE,
  CONSTRAINT "class_enrollments_user_fkey"  FOREIGN KEY ("user_id")  REFERENCES "users"("id")   ON DELETE CASCADE
);

CREATE INDEX "idx_enrollments_user" ON "class_enrollments"("user_id");

-- ============================================================
-- SCENARIO PACKS  (Phase 3 — domain-specific packs)
-- ============================================================
CREATE TABLE "scenario_packs" (
  "id"            UUID         NOT NULL DEFAULT gen_random_uuid(),
  "name"          VARCHAR(255) NOT NULL,
  "slug"          VARCHAR(100) NOT NULL,
  "domain"        VARCHAR(50)  NOT NULL,
  "description"   TEXT,
  "difficulty_min" VARCHAR(3),
  "difficulty_max" VARCHAR(3),
  "is_featured"   BOOLEAN      NOT NULL DEFAULT FALSE,
  "created_at"    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "scenario_packs_pkey"     PRIMARY KEY ("id"),
  CONSTRAINT "scenario_packs_slug_key" UNIQUE ("slug"),
  CONSTRAINT "scenario_packs_domain_check"   CHECK (domain IN ('general','business','medical','academic','travel')),
  CONSTRAINT "scenario_packs_diff_min_check" CHECK (difficulty_min IN ('A1','A2','B1','B2','C1','C2')),
  CONSTRAINT "scenario_packs_diff_max_check" CHECK (difficulty_max IN ('A1','A2','B1','B2','C1','C2'))
);

-- ============================================================
-- SCENARIOS
-- ============================================================
CREATE TABLE "scenarios" (
  "id"             UUID          NOT NULL DEFAULT gen_random_uuid(),
  "pack_id"        UUID,
  "author_id"      UUID,
  "fork_of"        UUID,
  "title"          VARCHAR(255)  NOT NULL,
  "description"    TEXT,
  "ai_role"        TEXT          NOT NULL,
  "context"        TEXT          NOT NULL,
  "difficulty"     VARCHAR(3)    NOT NULL,
  "situation_type" VARCHAR(10)   NOT NULL,
  "tags"           TEXT[]        NOT NULL DEFAULT '{}',
  "status"         VARCHAR(20)   NOT NULL DEFAULT 'draft',
  "rating_avg"     DECIMAL(3,2),
  "rating_count"   INTEGER       NOT NULL DEFAULT 0,
  "use_count"      INTEGER       NOT NULL DEFAULT 0,
  "created_at"     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "scenarios_pkey"              PRIMARY KEY ("id"),
  CONSTRAINT "scenarios_pack_fkey"         FOREIGN KEY ("pack_id")   REFERENCES "scenario_packs"("id") ON DELETE SET NULL,
  CONSTRAINT "scenarios_author_fkey"       FOREIGN KEY ("author_id") REFERENCES "users"("id")          ON DELETE SET NULL,
  CONSTRAINT "scenarios_fork_fkey"         FOREIGN KEY ("fork_of")   REFERENCES "scenarios"("id")      ON DELETE SET NULL,
  CONSTRAINT "scenarios_difficulty_check"  CHECK (difficulty IN ('A1','A2','B1','B2','C1','C2')),
  CONSTRAINT "scenarios_situation_check"   CHECK (situation_type IN ('everyday','work')),
  CONSTRAINT "scenarios_status_check"      CHECK (status IN ('draft','in_review','featured','archived')),
  CONSTRAINT "scenarios_rating_avg_check"  CHECK (rating_avg BETWEEN 1.00 AND 5.00),
  CONSTRAINT "scenarios_rating_count_check" CHECK (rating_count >= 0),
  CONSTRAINT "scenarios_use_count_check"   CHECK (use_count >= 0)
);

CREATE INDEX "idx_scenarios_pack"        ON "scenarios"("pack_id");
CREATE INDEX "idx_scenarios_author"      ON "scenarios"("author_id");
CREATE INDEX "idx_scenarios_status_diff" ON "scenarios"("status", "difficulty");
CREATE INDEX "idx_scenarios_situation"   ON "scenarios"("situation_type");
CREATE INDEX "idx_scenarios_featured"    ON "scenarios"("status", "rating_avg" DESC) WHERE status = 'featured';

-- ============================================================
-- SCENARIO PHRASES  (vocabulary / key phrases per scenario)
-- ============================================================
CREATE TABLE "scenario_phrases" (
  "id"              UUID         NOT NULL DEFAULT gen_random_uuid(),
  "scenario_id"     UUID         NOT NULL,
  "phrase"          TEXT         NOT NULL,
  "example_sentence" TEXT        NOT NULL,
  "audio_url"       TEXT,
  "difficulty"      VARCHAR(3),
  "display_order"   SMALLINT     NOT NULL DEFAULT 0,
  "created_at"      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "scenario_phrases_pkey"         PRIMARY KEY ("id"),
  CONSTRAINT "scenario_phrases_scenario_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE CASCADE,
  CONSTRAINT "scenario_phrases_diff_check"    CHECK (difficulty IN ('A1','A2','B1','B2','C1','C2'))
);

CREATE INDEX "idx_phrases_scenario" ON "scenario_phrases"("scenario_id", "display_order");

-- ============================================================
-- SCENARIO REVIEWS  (Phase 3 — community governance)
-- ============================================================
CREATE TABLE "scenario_reviews" (
  "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
  "scenario_id" UUID        NOT NULL,
  "reviewer_id" UUID        NOT NULL,
  "decision"    VARCHAR(20) NOT NULL,
  "notes"       TEXT,
  "created_at"  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "scenario_reviews_pkey"             PRIMARY KEY ("id"),
  CONSTRAINT "scenario_reviews_unique"           UNIQUE ("scenario_id", "reviewer_id"),
  CONSTRAINT "scenario_reviews_scenario_fkey"    FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE CASCADE,
  CONSTRAINT "scenario_reviews_reviewer_fkey"    FOREIGN KEY ("reviewer_id") REFERENCES "users"("id")     ON DELETE CASCADE,
  CONSTRAINT "scenario_reviews_decision_check"   CHECK (decision IN ('approve','reject','request_changes'))
);

CREATE INDEX "idx_reviews_scenario" ON "scenario_reviews"("scenario_id");

-- ============================================================
-- SCENARIO RATINGS
-- ============================================================
CREATE TABLE "scenario_ratings" (
  "scenario_id" UUID      NOT NULL,
  "user_id"     UUID      NOT NULL,
  "rating"      SMALLINT  NOT NULL,
  "created_at"  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "scenario_ratings_pkey"          PRIMARY KEY ("scenario_id", "user_id"),
  CONSTRAINT "scenario_ratings_scenario_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE CASCADE,
  CONSTRAINT "scenario_ratings_user_fkey"     FOREIGN KEY ("user_id")     REFERENCES "users"("id")     ON DELETE CASCADE,
  CONSTRAINT "scenario_ratings_rating_check"  CHECK (rating BETWEEN 1 AND 5)
);

CREATE INDEX "idx_ratings_user" ON "scenario_ratings"("user_id");

-- ============================================================
-- LEVEL ASSESSMENTS  (baseline + periodic checks)
-- ============================================================
CREATE TABLE "level_assessments" (
  "id"                  UUID         NOT NULL DEFAULT gen_random_uuid(),
  "user_id"             UUID         NOT NULL,
  "assessed_level"      VARCHAR(3)   NOT NULL,
  "fluency_score"       DECIMAL(5,2),
  "pronunciation_score" DECIMAL(5,2),
  "vocabulary_score"    DECIMAL(5,2),
  "assessed_at"         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "level_assessments_pkey"         PRIMARY KEY ("id"),
  CONSTRAINT "level_assessments_user_fkey"    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "level_assessments_level_check"  CHECK (assessed_level IN ('A1','A2','B1','B2','C1','C2')),
  CONSTRAINT "level_assessments_fluency_check"      CHECK (fluency_score BETWEEN 0 AND 100),
  CONSTRAINT "level_assessments_pron_check"         CHECK (pronunciation_score BETWEEN 0 AND 100),
  CONSTRAINT "level_assessments_vocab_check"        CHECK (vocabulary_score BETWEEN 0 AND 100)
);

CREATE INDEX "idx_assessments_user_time" ON "level_assessments"("user_id", "assessed_at" DESC);

-- ============================================================
-- CONVERSATION SESSIONS  (one AI conversation session)
-- Renamed from "sessions" in ARCHITECTURE.md to avoid conflict
-- with n2base's "session" table.
-- ============================================================
CREATE TABLE "conversation_sessions" (
  "id"                  UUID          NOT NULL DEFAULT gen_random_uuid(),
  "user_id"             UUID          NOT NULL,
  "scenario_id"         UUID,
  "class_id"            UUID,
  "livekit_room_id"     VARCHAR(255),
  "mode"                VARCHAR(20)   NOT NULL DEFAULT 'free_talk',
  "status"              VARCHAR(20)   NOT NULL DEFAULT 'active',
  "duration_seconds"    INTEGER,
  "total_words"         INTEGER,
  "fluency_score"       DECIMAL(5,2),
  "pronunciation_score" DECIMAL(5,2),
  "vocabulary_score"    DECIMAL(5,2),
  "words_per_minute"    DECIMAL(6,2),
  "correction_rate"     DECIMAL(5,4),
  "started_at"          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ended_at"            TIMESTAMP,
  "created_at"          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "conversation_sessions_pkey"         PRIMARY KEY ("id"),
  CONSTRAINT "conversation_sessions_user_fkey"    FOREIGN KEY ("user_id")     REFERENCES "users"("id")          ON DELETE CASCADE,
  CONSTRAINT "conversation_sessions_scenario_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id")      ON DELETE SET NULL,
  CONSTRAINT "conversation_sessions_class_fkey"   FOREIGN KEY ("class_id")    REFERENCES "classes"("id")        ON DELETE SET NULL,
  CONSTRAINT "conversation_sessions_mode_check"   CHECK (mode IN ('free_talk','scenario','assessment')),
  CONSTRAINT "conversation_sessions_status_check" CHECK (status IN ('active','completed','abandoned')),
  CONSTRAINT "conversation_sessions_duration_check" CHECK (duration_seconds >= 0),
  CONSTRAINT "conversation_sessions_words_check"   CHECK (total_words >= 0),
  CONSTRAINT "conversation_sessions_fluency_check" CHECK (fluency_score BETWEEN 0 AND 100),
  CONSTRAINT "conversation_sessions_pron_check"    CHECK (pronunciation_score BETWEEN 0 AND 100),
  CONSTRAINT "conversation_sessions_vocab_check"   CHECK (vocabulary_score BETWEEN 0 AND 100),
  CONSTRAINT "conversation_sessions_wpm_check"     CHECK (words_per_minute >= 0),
  CONSTRAINT "conversation_sessions_correction_check" CHECK (correction_rate BETWEEN 0 AND 1)
);

CREATE INDEX "idx_sessions_user_time" ON "conversation_sessions"("user_id", "started_at" DESC);
CREATE INDEX "idx_sessions_scenario"  ON "conversation_sessions"("scenario_id");
CREATE INDEX "idx_sessions_class"     ON "conversation_sessions"("class_id");
CREATE INDEX "idx_sessions_status"    ON "conversation_sessions"("status") WHERE status = 'active';

-- ============================================================
-- TURNS  (individual learner ↔ AI exchanges within a session)
-- ============================================================
CREATE TABLE "turns" (
  "id"         UUID         NOT NULL DEFAULT gen_random_uuid(),
  "session_id" UUID         NOT NULL,
  "speaker"    VARCHAR(10)  NOT NULL,
  "transcript" TEXT         NOT NULL,
  "audio_url"  TEXT,
  "feedback"   JSONB,
  "turn_index" SMALLINT     NOT NULL,
  "duration_ms" INTEGER,
  "created_at" TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "turns_pkey"            PRIMARY KEY ("id"),
  CONSTRAINT "turns_unique"          UNIQUE ("session_id", "turn_index"),
  CONSTRAINT "turns_session_fkey"    FOREIGN KEY ("session_id") REFERENCES "conversation_sessions"("id") ON DELETE CASCADE,
  CONSTRAINT "turns_speaker_check"   CHECK (speaker IN ('learner','ai')),
  CONSTRAINT "turns_index_check"     CHECK (turn_index >= 0),
  CONSTRAINT "turns_duration_check"  CHECK (duration_ms >= 0)
);

CREATE INDEX "idx_turns_session" ON "turns"("session_id", "turn_index");

-- ============================================================
-- PRONUNCIATION SCORES  (background job output — Wav2Vec2)
-- ============================================================
CREATE TABLE "pronunciation_scores" (
  "id"             UUID         NOT NULL DEFAULT gen_random_uuid(),
  "turn_id"        UUID         NOT NULL,
  "user_id"        UUID         NOT NULL,
  "session_id"     UUID         NOT NULL,
  "word"           VARCHAR(100) NOT NULL,
  "phoneme_scores" JSONB        NOT NULL,
  "overall_score"  DECIMAL(5,2) NOT NULL,
  "scored_at"      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "pronunciation_scores_pkey"          PRIMARY KEY ("id"),
  CONSTRAINT "pronunciation_scores_turn_fkey"     FOREIGN KEY ("turn_id")    REFERENCES "turns"("id")                  ON DELETE CASCADE,
  CONSTRAINT "pronunciation_scores_user_fkey"     FOREIGN KEY ("user_id")    REFERENCES "users"("id")                  ON DELETE CASCADE,
  CONSTRAINT "pronunciation_scores_session_fkey"  FOREIGN KEY ("session_id") REFERENCES "conversation_sessions"("id")  ON DELETE CASCADE,
  CONSTRAINT "pronunciation_scores_score_check"   CHECK (overall_score BETWEEN 0 AND 100)
);

CREATE INDEX "idx_pron_turn"    ON "pronunciation_scores"("turn_id");
CREATE INDEX "idx_pron_user"    ON "pronunciation_scores"("user_id", "scored_at" DESC);
CREATE INDEX "idx_pron_session" ON "pronunciation_scores"("session_id");

-- ============================================================
-- USER VOCABULARY  (tracks per-user phrase practice history)
-- ============================================================
CREATE TABLE "user_vocabulary" (
  "id"                UUID      NOT NULL DEFAULT gen_random_uuid(),
  "user_id"           UUID      NOT NULL,
  "phrase_id"         UUID      NOT NULL,
  "times_used"        INTEGER   NOT NULL DEFAULT 0,
  "times_missed"      INTEGER   NOT NULL DEFAULT 0,
  "last_practiced_at" TIMESTAMP,
  "next_review_at"    TIMESTAMP,
  "created_at"        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_vocabulary_pkey"        PRIMARY KEY ("id"),
  CONSTRAINT "user_vocabulary_unique"      UNIQUE ("user_id", "phrase_id"),
  CONSTRAINT "user_vocabulary_user_fkey"   FOREIGN KEY ("user_id")   REFERENCES "users"("id")            ON DELETE CASCADE,
  CONSTRAINT "user_vocabulary_phrase_fkey" FOREIGN KEY ("phrase_id") REFERENCES "scenario_phrases"("id") ON DELETE CASCADE,
  CONSTRAINT "user_vocabulary_used_check"  CHECK (times_used >= 0),
  CONSTRAINT "user_vocabulary_missed_check" CHECK (times_missed >= 0)
);

CREATE INDEX "idx_vocab_user_review" ON "user_vocabulary"("user_id", "next_review_at");

-- ============================================================
-- DAILY USER STATS  (Phase 3 — pre-aggregated for teacher dashboard)
-- Populated nightly by BullMQ aggregation job.
-- ============================================================
CREATE TABLE "daily_user_stats" (
  "user_id"           UUID      NOT NULL,
  "stat_date"         DATE      NOT NULL,
  "session_count"     SMALLINT  NOT NULL DEFAULT 0,
  "total_minutes"     SMALLINT  NOT NULL DEFAULT 0,
  "avg_fluency_score" DECIMAL(5,2),
  "avg_pron_score"    DECIMAL(5,2),
  "words_practiced"   INTEGER   NOT NULL DEFAULT 0,

  CONSTRAINT "daily_user_stats_pkey"              PRIMARY KEY ("user_id", "stat_date"),
  CONSTRAINT "daily_user_stats_user_fkey"         FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "daily_user_stats_session_check"     CHECK (session_count >= 0),
  CONSTRAINT "daily_user_stats_minutes_check"     CHECK (total_minutes >= 0),
  CONSTRAINT "daily_user_stats_words_check"       CHECK (words_practiced >= 0)
);

CREATE INDEX "idx_daily_stats_date" ON "daily_user_stats"("stat_date", "user_id");
