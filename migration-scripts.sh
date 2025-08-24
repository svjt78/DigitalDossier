#!/bin/bash

# ===========================================
# Database Migration Scripts for Neon.tech
# ===========================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Database Migration to Neon.tech${NC}"
echo "========================================"

# Check if required tools are installed
check_requirements() {
    echo -e "${YELLOW}📋 Checking requirements...${NC}"
    
    if ! command -v pg_dump &> /dev/null; then
        echo -e "${RED}❌ pg_dump not found. Please install PostgreSQL client tools.${NC}"
        exit 1
    fi
    
    if ! command -v psql &> /dev/null; then
        echo -e "${RED}❌ psql not found. Please install PostgreSQL client tools.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Requirements check passed${NC}"
}

# Function to backup current databases
backup_databases() {
    echo -e "${YELLOW}💾 Creating backups of current databases...${NC}"
    
    # Create backup directory
    mkdir -p ./database_backups
    
    # Backup blog database
    echo "📚 Backing up blog database..."
    pg_dump "postgresql://postgres:admin123@localhost:5432/blogdb" > ./database_backups/blogdb_backup_$(date +%Y%m%d_%H%M%S).sql
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Blog database backup completed${NC}"
    else
        echo -e "${RED}❌ Blog database backup failed${NC}"
        exit 1
    fi
    
    # Backup credentials database
    echo "🔐 Backing up credentials database..."
    pg_dump "postgresql://postgres:password@localhost:5433/credentialdb" > ./database_backups/credentialdb_backup_$(date +%Y%m%d_%H%M%S).sql
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Credentials database backup completed${NC}"
    else
        echo -e "${RED}❌ Credentials database backup failed${NC}"
        exit 1
    fi
}

# Function to migrate blog database
migrate_blog_database() {
    echo -e "${YELLOW}📚 Migrating blog database to Neon.tech...${NC}"
    
    if [ -z "$NEON_BLOG_CONNECTION_STRING" ]; then
        echo -e "${RED}❌ NEON_BLOG_CONNECTION_STRING environment variable not set${NC}"
        echo "Please set it to your Neon.tech blog database connection string"
        exit 1
    fi
    
    # Find the latest blog backup
    BLOG_BACKUP=$(ls -t ./database_backups/blogdb_backup_*.sql | head -n1)
    
    if [ -z "$BLOG_BACKUP" ]; then
        echo -e "${RED}❌ No blog database backup found${NC}"
        exit 1
    fi
    
    echo "📤 Restoring blog database from: $BLOG_BACKUP"
    psql "$NEON_BLOG_CONNECTION_STRING" < "$BLOG_BACKUP"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Blog database migration completed${NC}"
    else
        echo -e "${RED}❌ Blog database migration failed${NC}"
        exit 1
    fi
}

# Function to migrate credentials database
migrate_credentials_database() {
    echo -e "${YELLOW}🔐 Migrating credentials database to Neon.tech...${NC}"
    
    if [ -z "$NEON_CREDENTIALS_CONNECTION_STRING" ]; then
        echo -e "${RED}❌ NEON_CREDENTIALS_CONNECTION_STRING environment variable not set${NC}"
        echo "Please set it to your Neon.tech credentials database connection string"
        exit 1
    fi
    
    # Find the latest credentials backup
    CREDENTIALS_BACKUP=$(ls -t ./database_backups/credentialdb_backup_*.sql | head -n1)
    
    if [ -z "$CREDENTIALS_BACKUP" ]; then
        echo -e "${RED}❌ No credentials database backup found${NC}"
        exit 1
    fi
    
    echo "📤 Restoring credentials database from: $CREDENTIALS_BACKUP"
    psql "$NEON_CREDENTIALS_CONNECTION_STRING" < "$CREDENTIALS_BACKUP"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Credentials database migration completed${NC}"
    else
        echo -e "${RED}❌ Credentials database migration failed${NC}"
        exit 1
    fi
}

# Function to test connections
test_connections() {
    echo -e "${YELLOW}🧪 Testing Neon.tech database connections...${NC}"
    
    # Test blog database
    echo "📚 Testing blog database connection..."
    psql "$NEON_BLOG_CONNECTION_STRING" -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Blog database connection successful${NC}"
    else
        echo -e "${RED}❌ Blog database connection failed${NC}"
    fi
    
    # Test credentials database
    echo "🔐 Testing credentials database connection..."
    psql "$NEON_CREDENTIALS_CONNECTION_STRING" -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Credentials database connection successful${NC}"
    else
        echo -e "${RED}❌ Credentials database connection failed${NC}"
    fi
}

# Main execution
main() {
    echo -e "${GREEN}Starting migration process...${NC}"
    
    check_requirements
    
    # Check if this is a backup-only run
    if [ "$1" == "--backup-only" ]; then
        backup_databases
        echo -e "${GREEN}🎉 Backup completed! Set your Neon.tech connection strings and run without --backup-only to migrate.${NC}"
        exit 0
    fi
    
    # Check if connection strings are set
    if [ -z "$NEON_BLOG_CONNECTION_STRING" ] || [ -z "$NEON_CREDENTIALS_CONNECTION_STRING" ]; then
        echo -e "${YELLOW}⚠️  Connection strings not set. Running backup only...${NC}"
        echo ""
        echo "To complete migration:"
        echo "1. Set NEON_BLOG_CONNECTION_STRING environment variable"
        echo "2. Set NEON_CREDENTIALS_CONNECTION_STRING environment variable" 
        echo "3. Run this script again"
        echo ""
        backup_databases
        exit 0
    fi
    
    backup_databases
    migrate_blog_database
    migrate_credentials_database
    test_connections
    
    echo -e "${GREEN}🎉 Migration completed successfully!${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Update your application environment files with new connection strings"
    echo "2. Test your applications with the new databases"
    echo "3. Proceed with deployment configurations"
}

# Usage information
usage() {
    echo "Usage: $0 [--backup-only]"
    echo ""
    echo "Options:"
    echo "  --backup-only    Only backup current databases, don't migrate"
    echo ""
    echo "Environment variables required for migration:"
    echo "  NEON_BLOG_CONNECTION_STRING        - Neon.tech blog database connection string"
    echo "  NEON_CREDENTIALS_CONNECTION_STRING - Neon.tech credentials database connection string"
    echo ""
    echo "Example:"
    echo "  export NEON_BLOG_CONNECTION_STRING='postgresql://user:pass@host/blogdb?sslmode=require'"
    echo "  export NEON_CREDENTIALS_CONNECTION_STRING='postgresql://user:pass@host/credentialdb?sslmode=require'"
    echo "  $0"
}

# Check for help flag
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    usage
    exit 0
fi

# Run main function
main "$@"