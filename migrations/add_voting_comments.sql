-- Migration script to add voting and comments functionality
-- Run this script to update your existing database

-- First, let's add the new columns to existing content tables
ALTER TABLE blog ADD COLUMN net_score INTEGER DEFAULT 0;
ALTER TABLE blog ADD COLUMN total_votes INTEGER DEFAULT 0;
ALTER TABLE blog ADD COLUMN comment_count INTEGER DEFAULT 0;

ALTER TABLE book ADD COLUMN net_score INTEGER DEFAULT 0;
ALTER TABLE book ADD COLUMN total_votes INTEGER DEFAULT 0;
ALTER TABLE book ADD COLUMN comment_count INTEGER DEFAULT 0;

ALTER TABLE product ADD COLUMN net_score INTEGER DEFAULT 0;
ALTER TABLE product ADD COLUMN total_votes INTEGER DEFAULT 0;
ALTER TABLE product ADD COLUMN comment_count INTEGER DEFAULT 0;

-- Create the Vote table
CREATE TABLE vote (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    content_id INTEGER NOT NULL,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT fk_vote_user FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
    
    -- Unique constraint: one vote per user per content
    CONSTRAINT unique_user_content_vote UNIQUE (user_id, content_type, content_id)
);

-- Create indexes for performance
CREATE INDEX idx_vote_content ON vote(content_type, content_id);
CREATE INDEX idx_vote_user ON vote(user_id);

-- Create the enhanced Comment table
-- First, drop existing comment table if it exists (backup data first if needed)
DROP TABLE IF EXISTS comment;

CREATE TABLE comment (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    author_id INTEGER NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    content_id INTEGER NOT NULL,
    parent_id INTEGER NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_comment_author FOREIGN KEY (author_id) REFERENCES "user"(id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_parent FOREIGN KEY (parent_id) REFERENCES comment(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_comment_content ON comment(content_type, content_id);
CREATE INDEX idx_comment_parent ON comment(parent_id);
CREATE INDEX idx_comment_author ON comment(author_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_vote_updated_at BEFORE UPDATE ON vote
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comment_updated_at BEFORE UPDATE ON comment
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a function to recalculate vote aggregates (for data consistency)
CREATE OR REPLACE FUNCTION recalculate_vote_aggregates(content_type_param VARCHAR(50), content_id_param INTEGER)
RETURNS VOID AS $$
DECLARE
    upvotes_count INTEGER;
    downvotes_count INTEGER;
    net_score_value INTEGER;
    total_votes_value INTEGER;
    table_name VARCHAR(50);
BEGIN
    -- Count votes
    SELECT 
        COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN vote_type = 'down' THEN 1 ELSE 0 END), 0)
    INTO upvotes_count, downvotes_count
    FROM vote 
    WHERE content_type = content_type_param AND content_id = content_id_param;
    
    net_score_value := upvotes_count - downvotes_count;
    total_votes_value := upvotes_count + downvotes_count;
    
    -- Update the appropriate content table
    IF content_type_param = 'blog' THEN
        UPDATE blog SET net_score = net_score_value, total_votes = total_votes_value 
        WHERE id = content_id_param;
    ELSIF content_type_param = 'book' THEN
        UPDATE book SET net_score = net_score_value, total_votes = total_votes_value 
        WHERE id = content_id_param;
    ELSIF content_type_param = 'product' THEN
        UPDATE product SET net_score = net_score_value, total_votes = total_votes_value 
        WHERE id = content_id_param;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a function to recalculate comment counts
CREATE OR REPLACE FUNCTION recalculate_comment_count(content_type_param VARCHAR(50), content_id_param INTEGER)
RETURNS VOID AS $$
DECLARE
    comment_count_value INTEGER;
BEGIN
    -- Count non-deleted comments
    SELECT COUNT(*)
    INTO comment_count_value
    FROM comment 
    WHERE content_type = content_type_param 
      AND content_id = content_id_param 
      AND is_deleted = FALSE;
    
    -- Update the appropriate content table
    IF content_type_param = 'blog' THEN
        UPDATE blog SET comment_count = comment_count_value WHERE id = content_id_param;
    ELSIF content_type_param = 'book' THEN
        UPDATE book SET comment_count = comment_count_value WHERE id = content_id_param;
    ELSIF content_type_param = 'product' THEN
        UPDATE product SET comment_count = comment_count_value WHERE id = content_id_param;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMIT;
