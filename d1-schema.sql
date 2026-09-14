-- Cloudflare D1 Database Schema for "ספריית השראה" (Inspiration Library)
-- Compatible with SQLite / Cloudflare D1 Serverless SQL

-- 1. Items Table
CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    channels TEXT NOT NULL, -- JSON array of channels e.g. ["workshops", "education_ai"]
    content_type TEXT NOT NULL, -- 'workshop', 'tool', 'article', etc.
    subjects TEXT NOT NULL, -- JSON array of subject tags
    source_name TEXT NOT NULL,
    source_url TEXT NOT NULL,
    published_date TEXT,
    event_date TEXT,
    novelty TEXT NOT NULL, -- 'newly_published', 'newly_discovered', 'material_update'
    summary TEXT NOT NULL,
    relevance TEXT NOT NULL,
    details TEXT, -- JSON object: audience, participant_actions, pedagogical_rationale, etc.
    program_matches TEXT, -- JSON array of ProgramMatch objects
    sources TEXT, -- JSON array of SourceCitation objects
    program_change TEXT, -- JSON object or NULL
    image TEXT, -- JSON object or NULL
    caveat TEXT,
    briefing_id TEXT NOT NULL,
    briefing_date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    manually_edited INTEGER DEFAULT 0,
    -- User state fields (stored directly for fast queries + JSON in user_state)
    user_rating INTEGER, -- 1 to 5 or NULL
    user_status TEXT DEFAULT 'new', -- 'new', 'to_read', 'saved', 'tried', 'archived'
    user_personal_note TEXT DEFAULT '',
    user_state_updated_at TEXT
);

-- 2. Briefings Table
CREATE TABLE IF NOT EXISTS briefings (
    briefing_id TEXT PRIMARY KEY,
    briefing_date TEXT NOT NULL,
    timezone TEXT DEFAULT 'Asia/Jerusalem',
    status TEXT NOT NULL, -- 'complete', 'partial', 'failed'
    coverage TEXT NOT NULL, -- JSON array of CoverageItem
    program_catalog_review TEXT, -- JSON object of ProgramCatalogReview
    limitations TEXT, -- JSON array of strings
    imported_at TEXT NOT NULL,
    items_count INTEGER DEFAULT 0
);

-- 3. Import Logs Table
CREATE TABLE IF NOT EXISTS import_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    briefing_id TEXT NOT NULL,
    briefing_date TEXT NOT NULL,
    agent_status TEXT NOT NULL,
    import_status TEXT NOT NULL,
    added_count INTEGER DEFAULT 0,
    updated_count INTEGER DEFAULT 0,
    skipped_count INTEGER DEFAULT 0,
    unaccepted_count INTEGER DEFAULT 0,
    unaccepted_details TEXT, -- JSON array of { title, reason }
    limitations TEXT, -- JSON array of strings
    notes TEXT
);

-- 4. Item-Briefing Many-to-Many Links Table
CREATE TABLE IF NOT EXISTS item_briefing_links (
    item_id TEXT NOT NULL,
    briefing_id TEXT NOT NULL,
    briefing_date TEXT NOT NULL,
    linked_at TEXT NOT NULL,
    PRIMARY KEY (item_id, briefing_id),
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (briefing_id) REFERENCES briefings(briefing_id) ON DELETE CASCADE
);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_items_briefing_date ON items(briefing_date DESC);
CREATE INDEX IF NOT EXISTS idx_items_content_type ON items(content_type);
CREATE INDEX IF NOT EXISTS idx_items_user_status ON items(user_status);
CREATE INDEX IF NOT EXISTS idx_items_user_rating ON items(user_rating);
CREATE INDEX IF NOT EXISTS idx_items_updated_at ON items(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_briefings_date ON briefings(briefing_date DESC);
CREATE INDEX IF NOT EXISTS idx_import_logs_timestamp ON import_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_links_briefing ON item_briefing_links(briefing_id);
