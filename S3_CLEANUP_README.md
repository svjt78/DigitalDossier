# S3 Orphan File Cleanup Tool

This tool helps identify and delete orphaned PDF and PNG files from your S3 buckets that are no longer referenced in your PostgreSQL database.

## Overview

The script scans your S3 buckets for files in the `content-images/` and `content-pdfs/` folders, then cross-references them with the `coverKey` and `pdfKey` fields in your Blog, Book, and Product database tables. Any files found in S3 that don't have corresponding database references are considered "orphaned" and can be safely deleted.

## Quick Start

### Running from Docker Container (Recommended)

```bash
# Preview what would be deleted (dry run - default behavior)
docker exec blog_frontend npm run cleanup:s3

# Actually delete orphaned files
docker exec blog_frontend npm run cleanup:s3:execute

# Check only PDF files
docker exec blog_frontend npm run cleanup:s3:pdf

# Check only image files
docker exec blog_frontend npm run cleanup:s3:images
```

### Running Locally (Alternative)

```bash
# Preview what would be deleted (dry run - default behavior)
npm run cleanup:s3:local

# Actually delete orphaned files
npm run cleanup:s3:local:execute

# Or use DATABASE_URL override for any command
DATABASE_URL=postgresql://postgres:admin123@localhost:5432/blogdb npm run cleanup:s3:pdf
```

## Available NPM Scripts

### Docker Container Scripts (Recommended)
- `docker exec blog_frontend npm run cleanup:s3` - Dry run preview of all file types
- `docker exec blog_frontend npm run cleanup:s3:execute` - Actually delete orphaned files (includes --force flag)
- `docker exec blog_frontend npm run cleanup:s3:pdf` - Preview orphaned PDF files only
- `docker exec blog_frontend npm run cleanup:s3:images` - Preview orphaned PNG files only

### Local Scripts (Alternative)
- `npm run cleanup:s3:local` - Local dry run preview of all file types
- `npm run cleanup:s3:local:execute` - Local execution to actually delete orphaned files
- `npm run cleanup:s3:pdf` - Preview orphaned PDF files only (requires DATABASE_URL override)
- `npm run cleanup:s3:images` - Preview orphaned PNG files only (requires DATABASE_URL override)

## Command Line Options

```bash
node scripts/cleanup-orphaned-s3-files.js [OPTIONS]
```

### Options

- `--execute` - Actually delete files (default is dry-run)
- `--dry-run` - Preview what would be deleted (default)
- `--force` - Skip confirmation prompt (useful for Docker/non-interactive environments)
- `--verbose, -v` - Enable verbose logging
- `--file-type TYPE` - Only process specific file type (pdf, png, jpg)
- `--start-date DATE` - Only process files modified after this date
- `--end-date DATE` - Only process files modified before this date
- `--batch-size N` - Process files in batches of N (default: 100)
- `--help, -h` - Show help message

### Examples

#### From Docker Container (Recommended)
```bash
# Dry run with verbose output
docker exec blog_frontend node scripts/cleanup-orphaned-s3-files.js --verbose

# Delete only PDF files older than January 1, 2024
docker exec blog_frontend node scripts/cleanup-orphaned-s3-files.js --execute --file-type pdf --end-date 2024-01-01

# Preview files modified in the last 30 days
docker exec blog_frontend node scripts/cleanup-orphaned-s3-files.js --start-date 2024-08-01 --verbose

# Process files in smaller batches
docker exec blog_frontend node scripts/cleanup-orphaned-s3-files.js --execute --batch-size 50
```

#### From Local Machine (Alternative)
```bash
# Dry run with verbose output
DATABASE_URL=postgresql://postgres:admin123@localhost:5432/blogdb node scripts/cleanup-orphaned-s3-files.js --verbose

# Delete only PDF files older than January 1, 2024
DATABASE_URL=postgresql://postgres:admin123@localhost:5432/blogdb node scripts/cleanup-orphaned-s3-files.js --execute --file-type pdf --end-date 2024-01-01

# Preview files modified in the last 30 days
DATABASE_URL=postgresql://postgres:admin123@localhost:5432/blogdb node scripts/cleanup-orphaned-s3-files.js --start-date 2024-08-01 --verbose
```

## Required Environment Variables

Make sure these environment variables are set in your `.env` file:

```bash
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=digitaldossier-blog
DATABASE_URL=postgresql://user:password@host:port/database
S3_CONTENT_IMAGES_PREFIX=content-images  # Optional, defaults to 'content-images'
S3_CONTENT_PDFS_PREFIX=content-pdfs      # Optional, defaults to 'content-pdfs'
```

## Safety Features

### Dry Run Mode
- **Default behavior** - the script runs in dry-run mode by default
- Shows exactly what would be deleted without actually deleting anything
- Use `--execute` flag to perform actual deletions

### Confirmation Prompts
- When running with `--execute`, the script asks for confirmation before deleting files
- Shows the total number of files that will be deleted
- Requires typing "yes" to proceed

### Comprehensive Logging
- Timestamps on all log messages
- Different log levels (info, warn, error)
- Progress indicators for large operations
- Summary report at the end

### Error Handling
- Graceful handling of S3 API errors
- Database connection error handling
- Continues processing even if individual files fail
- Reports all errors in the final summary

### Batch Processing
- Processes deletions in configurable batches
- Limits concurrent S3 operations to avoid rate limiting
- Progress reporting for each batch

## Output

The script provides detailed output including:

- Total files scanned in S3
- Number of orphaned files found
- Files being deleted (in execute mode)
- Final summary with statistics
- Any errors encountered

### Sample Output

```
2024-09-16T10:30:00.000Z [DRY RUN] Starting S3 orphan file cleanup (DRY RUN)
2024-09-16T10:30:00.000Z [DRY RUN] Target bucket: digitaldossier-blog
2024-09-16T10:30:00.000Z [DRY RUN] Prefixes: content-images, content-pdfs
2024-09-16T10:30:01.000Z [DRY RUN] Fetching all file references from database...
2024-09-16T10:30:01.500Z [DRY RUN] Found 250 file references in database
2024-09-16T10:30:02.000Z [DRY RUN] Listing S3 objects with prefix: content-images
2024-09-16T10:30:03.000Z [DRY RUN] Found 180 objects in S3 with prefix: content-images
2024-09-16T10:30:03.500Z [DRY RUN] Listing S3 objects with prefix: content-pdfs
2024-09-16T10:30:04.000Z [DRY RUN] Found 95 objects in S3 with prefix: content-pdfs
2024-09-16T10:30:04.100Z [DRY RUN] Total files in S3: 275
2024-09-16T10:30:04.200Z [DRY RUN] Found 25 orphaned files
2024-09-16T10:30:04.250Z [DRY RUN] Would delete: content-images/old-image-1.png
2024-09-16T10:30:04.251Z [DRY RUN] Would delete: content-pdfs/old-document.pdf

=== CLEANUP SUMMARY ===
Total files scanned: 275
Orphaned files found: 25
Files deleted: 0
Errors encountered: 0

⚠️  This was a DRY RUN - no files were actually deleted
Run with --execute to perform actual deletions
```

## Database Tables Checked

The script checks these database tables and fields for file references:

- **Blog table**: `coverKey`, `pdfKey`
- **Book table**: `coverKey`, `pdfKey`  
- **Product table**: `coverKey`, `pdfKey`

Any file in S3 that doesn't have a corresponding reference in one of these fields is considered orphaned.

## Troubleshooting

### Common Issues

1. **AWS Authentication Errors**
   - Verify your AWS credentials are correct
   - Ensure the IAM user has S3 permissions for the bucket
   - Check that the bucket name and region are correct

2. **Database Connection Errors**
   - **If running locally**: Use `DATABASE_URL=postgresql://postgres:admin123@localhost:5432/blogdb` prefix or the local npm scripts
   - **If running in Docker**: Use `docker exec blog_frontend` to run commands inside the container
   - Verify your DATABASE_URL is correct for your environment
   - Ensure the database is accessible

3. **No Files Found**
   - Verify the S3 bucket exists and has files
   - Check that the prefix paths are correct
   - Ensure file naming matches expected patterns

### Getting Help

Run the script with `--help` to see all available options:

```bash
# From Docker container
docker exec blog_frontend npm run cleanup:s3 -- --help

# From local machine
DATABASE_URL=postgresql://postgres:admin123@localhost:5432/blogdb npm run cleanup:s3 -- --help
```

Or contact your system administrator if you need assistance with AWS credentials or database access.