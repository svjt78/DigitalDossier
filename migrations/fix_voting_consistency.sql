-- Enhanced database triggers for voting consistency
-- FIXED: Data type mismatch issues
-- Run this after implementing the API changes

-- Create improved recalculation functions with better error handling
CREATE OR REPLACE FUNCTION recalculate_vote_aggregates_v2(content_type_param VARCHAR(50), content_id_param INTEGER)
RETURNS VOID AS $$
DECLARE
    upvotes_count INTEGER := 0;
    downvotes_count INTEGER := 0;
    net_score_value INTEGER;
    total_votes_value INTEGER;
BEGIN
    -- Count votes with explicit initialization and proper casting
    SELECT 
        COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE 0 END), 0)::INTEGER,
        COALESCE(SUM(CASE WHEN vote_type = 'down' THEN 1 ELSE 0 END), 0)::INTEGER
    INTO upvotes_count, downvotes_count
    FROM vote 
    WHERE content_type = content_type_param AND content_id = content_id_param;
    
    net_score_value := upvotes_count - downvotes_count;
    total_votes_value := upvotes_count + downvotes_count;
    
    -- Update the appropriate content table with proper error handling
    IF content_type_param = 'blog' THEN
        UPDATE blog 
        SET 
            net_score = net_score_value, 
            total_votes = total_votes_value,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = content_id_param;
        
        -- Check if update was successful
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Blog with id % not found', content_id_param;
        END IF;
        
    ELSIF content_type_param = 'book' THEN
        UPDATE book 
        SET 
            net_score = net_score_value, 
            total_votes = total_votes_value,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = content_id_param;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Book with id % not found', content_id_param;
        END IF;
        
    ELSIF content_type_param = 'product' THEN
        UPDATE product 
        SET 
            net_score = net_score_value, 
            total_votes = total_votes_value,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = content_id_param;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product with id % not found', content_id_param;
        END IF;
        
    ELSE
        RAISE EXCEPTION 'Invalid content type: %', content_type_param;
    END IF;
    
    -- Log the update for debugging (only in development)
    -- RAISE NOTICE 'Updated % % with votes: up=%, down=%, net=%, total=%', 
    --     content_type_param, content_id_param, upvotes_count, downvotes_count, 
    --     net_score_value, total_votes_value;
        
END;
$$ LANGUAGE plpgsql;

-- Create trigger function for automatic vote aggregate updates
CREATE OR REPLACE FUNCTION trigger_vote_aggregate_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT and UPDATE
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM recalculate_vote_aggregates_v2(NEW.content_type, NEW.content_id);
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        PERFORM recalculate_vote_aggregates_v2(OLD.content_type, OLD.content_id);
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updates (as a safety net)
-- Note: This runs after our API transactions, providing additional consistency
DROP TRIGGER IF EXISTS vote_aggregate_trigger ON vote;
CREATE TRIGGER vote_aggregate_trigger
    AFTER INSERT OR UPDATE OR DELETE ON vote
    FOR EACH ROW EXECUTE FUNCTION trigger_vote_aggregate_update();

-- FIXED: Create a consistency check function with proper data types
CREATE OR REPLACE FUNCTION check_vote_consistency()
RETURNS TABLE(
    content_type VARCHAR(50),
    content_id INTEGER,
    stored_net_score INTEGER,
    calculated_net_score INTEGER,
    stored_total_votes INTEGER,
    calculated_total_votes INTEGER,
    is_consistent BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH vote_aggregates AS (
        SELECT 
            v.content_type,
            v.content_id,
            COALESCE(SUM(CASE WHEN v.vote_type = 'up' THEN 1 ELSE 0 END), 0)::INTEGER as calc_upvotes,
            COALESCE(SUM(CASE WHEN v.vote_type = 'down' THEN 1 ELSE 0 END), 0)::INTEGER as calc_downvotes
        FROM vote v
        GROUP BY v.content_type, v.content_id
    ),
    all_content AS (
        SELECT 'blog'::VARCHAR(50) as content_type, id::INTEGER as content_id, net_score::INTEGER, total_votes::INTEGER FROM blog
        UNION ALL
        SELECT 'book'::VARCHAR(50) as content_type, id::INTEGER as content_id, net_score::INTEGER, total_votes::INTEGER FROM book
        UNION ALL
        SELECT 'product'::VARCHAR(50) as content_type, id::INTEGER as content_id, net_score::INTEGER, total_votes::INTEGER FROM product
    )
    SELECT 
        ac.content_type,
        ac.content_id,
        ac.net_score as stored_net_score,
        COALESCE((va.calc_upvotes - va.calc_downvotes), 0)::INTEGER as calculated_net_score,
        ac.total_votes as stored_total_votes,
        COALESCE((va.calc_upvotes + va.calc_downvotes), 0)::INTEGER as calculated_total_votes,
        (ac.net_score = COALESCE((va.calc_upvotes - va.calc_downvotes), 0) 
         AND ac.total_votes = COALESCE((va.calc_upvotes + va.calc_downvotes), 0))::BOOLEAN as is_consistent
    FROM all_content ac
    LEFT JOIN vote_aggregates va ON ac.content_type = va.content_type AND ac.content_id = va.content_id
    WHERE NOT (ac.net_score = COALESCE((va.calc_upvotes - va.calc_downvotes), 0) 
               AND ac.total_votes = COALESCE((va.calc_upvotes + va.calc_downvotes), 0));
END;
$$ LANGUAGE plpgsql;

-- Create a function to fix all inconsistencies
CREATE OR REPLACE FUNCTION fix_all_vote_inconsistencies()
RETURNS INTEGER AS $$
DECLARE
    inconsistent_record RECORD;
    fixed_count INTEGER := 0;
BEGIN
    -- Fix all inconsistent vote counts
    FOR inconsistent_record IN 
        SELECT content_type, content_id FROM check_vote_consistency()
    LOOP
        PERFORM recalculate_vote_aggregates_v2(
            inconsistent_record.content_type, 
            inconsistent_record.content_id
        );
        fixed_count := fixed_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Fixed % inconsistent vote records', fixed_count;
    RETURN fixed_count;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for better performance (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_vote_content_type_id_type') THEN
        CREATE INDEX idx_vote_content_type_id_type ON vote(content_type, content_id, vote_type);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_comment_content_type_id_deleted') THEN
        CREATE INDEX idx_comment_content_type_id_deleted ON comment(content_type, content_id, is_deleted);
    END IF;
END $$;

-- Add helpful comments
COMMENT ON FUNCTION recalculate_vote_aggregates_v2 IS 
'Enhanced vote aggregation function with better error handling and logging. Used by both API and triggers.';

COMMENT ON FUNCTION check_vote_consistency IS 
'Utility function to check for vote count inconsistencies. Run periodically for monitoring.';

COMMENT ON FUNCTION fix_all_vote_inconsistencies IS 
'Maintenance function to fix all vote count inconsistencies. Safe to run anytime.';

-- Run an initial consistency check and fix any issues
DO $$
DECLARE
    fixed_records INTEGER;
BEGIN
    SELECT fix_all_vote_inconsistencies() INTO fixed_records;
    RAISE NOTICE 'Migration completed. Fixed % vote inconsistencies.', fixed_records;
END $$;

COMMIT;
