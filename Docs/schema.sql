-- IELTS Learning Platform — Database Schema (PostgreSQL 16 + pgvector)

-- Enable Vector Extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),          -- NULL if login via OAuth
    full_name   VARCHAR(255) NOT NULL,
    role        VARCHAR(50) DEFAULT 'student',  -- student | teacher | admin
    target_band DECIMAL(2,1),           -- 5.0 ~ 9.0
    avatar_url  TEXT,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- OAuth providers
CREATE TABLE oauth_accounts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    provider    VARCHAR(50) NOT NULL,   -- google | facebook
    provider_id VARCHAR(255) NOT NULL,
    UNIQUE(provider, provider_id)
);

-- Courses
CREATE TABLE courses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL,
    skill       VARCHAR(50) NOT NULL,   -- reading | writing | listening | speaking
    level       VARCHAR(50),            -- beginner | intermediate | advanced
    is_published BOOLEAN DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Lessons
CREATE TABLE lessons (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id   UUID REFERENCES courses(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    order_index INTEGER NOT NULL,
    content     JSONB,                  -- structured content
    audio_url   TEXT,                   -- for listening
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Questions
CREATE TABLE questions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id   UUID REFERENCES lessons(id) ON DELETE CASCADE,
    type        VARCHAR(50) NOT NULL,   -- mcq | matching | fill_blank | writing | speaking
    content     JSONB NOT NULL,         -- schema per type
    order_index INTEGER NOT NULL,
    points      INTEGER DEFAULT 1,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- User Progress
CREATE TABLE user_progress (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    lesson_id       UUID REFERENCES lessons(id) ON DELETE CASCADE,
    status          VARCHAR(50) DEFAULT 'not_started', -- not_started | in_progress | completed
    score           DECIMAL(4,1),
    completed_at    TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- Submissions
CREATE TABLE submissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    question_id     UUID REFERENCES questions(id) ON DELETE CASCADE,
    answer          JSONB NOT NULL,     -- user's answer
    score           DECIMAL(4,1),
    ai_feedback     JSONB,              -- feedback from local AI
    scored_at       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Streaks
CREATE TABLE user_streaks (
    user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak  INTEGER DEFAULT 0,
    longest_streak  INTEGER DEFAULT 0,
    last_activity   DATE,
    freeze_count    INTEGER DEFAULT 1,  -- number of freezes available
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Vocabulary
CREATE TABLE vocabulary (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word        VARCHAR(255) UNIQUE NOT NULL,
    definition  TEXT,
    examples    JSONB,                  -- ["example 1", "example 2"]
    band_level  DECIMAL(2,1),          -- band score level
    category    VARCHAR(100),           -- academic | general | topic-specific
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Vector embeddings (pgvector)
CREATE TABLE document_embeddings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type VARCHAR(50) NOT NULL,   -- lesson | question | vocabulary | article
    source_id   UUID NOT NULL,
    chunk_text  TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    embedding   vector(384),           -- bge-small-en-v1.5 has 384 dims
    metadata    JSONB,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for vector search
CREATE INDEX ON document_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
