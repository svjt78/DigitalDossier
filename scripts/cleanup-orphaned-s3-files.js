#!/usr/bin/env node

import { config } from 'dotenv';
import fs from 'fs';

// Load environment variables, preferring .env.local for local development
config({ path: '.env.local' });
config();

import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '../lib/prisma.js';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET;
const IMAGES_PREFIX = process.env.S3_CONTENT_IMAGES_PREFIX || 'content-images';
const PDF_PREFIX = process.env.S3_CONTENT_PDFS_PREFIX || 'content-pdfs';

const BATCH_SIZE = 100;
const CONCURRENT_OPERATIONS = 10;

class OrphanFileCleanup {
  constructor(options = {}) {
    this.dryRun = options.dryRun !== false; // Default to true
    this.verbose = options.verbose || false;
    this.force = options.force || false; // Skip confirmation prompt
    this.batchSize = options.batchSize || BATCH_SIZE;
    this.fileType = options.fileType; // 'pdf', 'png', 'jpg', or undefined for all
    this.startDate = options.startDate;
    this.endDate = options.endDate;
    
    this.stats = {
      totalFilesScanned: 0,
      orphanedFiles: 0,
      deletedFiles: 0,
      errors: 0,
      skippedFiles: 0
    };
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = this.dryRun ? '[DRY RUN] ' : '';
    
    if (level === 'error') {
      console.error(`${timestamp} ${prefix}ERROR: ${message}`);
    } else if (level === 'warn') {
      console.warn(`${timestamp} ${prefix}WARN: ${message}`);
    } else if (this.verbose || level === 'info') {
      console.log(`${timestamp} ${prefix}${message}`);
    }
  }

  async getAllDatabaseFileKeys() {
    this.log('Fetching all file references from database...');
    
    const [blogs, books, products] = await Promise.all([
      prisma.blog.findMany({
        select: { coverKey: true, pdfKey: true },
        where: {
          OR: [
            { coverKey: { not: null } },
            { pdfKey: { not: null } }
          ]
        }
      }),
      prisma.book.findMany({
        select: { coverKey: true, pdfKey: true },
        where: {
          OR: [
            { coverKey: { not: null } },
            { pdfKey: { not: null } }
          ]
        }
      }),
      prisma.product.findMany({
        select: { coverKey: true, pdfKey: true },
        where: {
          OR: [
            { coverKey: { not: null } },
            { pdfKey: { not: null } }
          ]
        }
      })
    ]);

    const allKeys = new Set();
    
    [blogs, books, products].forEach(items => {
      items.forEach(item => {
        if (item.coverKey) allKeys.add(item.coverKey);
        if (item.pdfKey) allKeys.add(item.pdfKey);
      });
    });

    this.log(`Found ${allKeys.size} file references in database`);
    return allKeys;
  }

  async listS3Objects(prefix) {
    this.log(`Listing S3 objects with prefix: ${prefix}`);
    const objects = [];
    let continuationToken;

    do {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix + '/',
        ContinuationToken: continuationToken,
        MaxKeys: 1000
      });

      try {
        const response = await s3Client.send(command);
        
        if (response.Contents) {
          const filteredObjects = response.Contents.filter(obj => {
            // Skip directories
            if (obj.Key.endsWith('/')) return false;
            
            // Filter by file type if specified
            if (this.fileType) {
              const ext = obj.Key.toLowerCase().split('.').pop();
              if (this.fileType === 'png' && ext !== 'png') return false;
              if (this.fileType === 'jpg' && !['jpg', 'jpeg'].includes(ext)) return false;
              if (this.fileType === 'pdf' && ext !== 'pdf') return false;
            }
            
            // Filter by date if specified
            if (this.startDate && obj.LastModified < this.startDate) return false;
            if (this.endDate && obj.LastModified > this.endDate) return false;
            
            return true;
          });
          
          objects.push(...filteredObjects);
        }
        
        continuationToken = response.NextContinuationToken;
      } catch (error) {
        this.log(`Error listing objects with prefix ${prefix}: ${error.message}`, 'error');
        this.stats.errors++;
        break;
      }
    } while (continuationToken);

    this.log(`Found ${objects.length} objects in S3 with prefix: ${prefix}`);
    return objects;
  }

  async deleteS3Object(key) {
    if (this.dryRun) {
      this.log(`Would delete: ${key}`);
      return true;
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key
      });
      
      await s3Client.send(command);
      this.log(`Deleted: ${key}`);
      return true;
    } catch (error) {
      this.log(`Failed to delete ${key}: ${error.message}`, 'error');
      this.stats.errors++;
      return false;
    }
  }

  async processOrphanedFiles(orphanedFiles) {
    if (orphanedFiles.length === 0) {
      this.log('No orphaned files found');
      return;
    }

    this.log(`Found ${orphanedFiles.length} orphaned files`);
    
    if (!this.dryRun && !this.force) {
      // Check if we're in an interactive environment
      const isInteractive = process.stdin.isTTY && process.stdout.isTTY;
      
      if (!isInteractive) {
        this.log('Non-interactive environment detected. Use --force flag to skip confirmation.', 'warn');
        this.log('Operation cancelled. Run with --force to proceed without confirmation.');
        return;
      }

      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const confirm = await new Promise(resolve => {
        rl.question(`Are you sure you want to delete ${orphanedFiles.length} files? (yes/no): `, answer => {
          rl.close();
          resolve(answer.toLowerCase() === 'yes');
        });
      });

      if (!confirm) {
        this.log('Operation cancelled by user');
        return;
      }
    } else if (!this.dryRun && this.force) {
      this.log('Force mode enabled - skipping confirmation prompt');
    }

    // Process deletions in batches
    for (let i = 0; i < orphanedFiles.length; i += this.batchSize) {
      const batch = orphanedFiles.slice(i, i + this.batchSize);
      
      this.log(`Processing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(orphanedFiles.length / this.batchSize)}`);
      
      const deletePromises = batch.map(file => 
        this.deleteS3Object(file.Key).then(success => {
          if (success) this.stats.deletedFiles++;
        })
      );
      
      // Limit concurrent operations
      for (let j = 0; j < deletePromises.length; j += CONCURRENT_OPERATIONS) {
        const concurrentBatch = deletePromises.slice(j, j + CONCURRENT_OPERATIONS);
        await Promise.all(concurrentBatch);
      }
    }
  }

  async run() {
    try {
      this.log(`Starting S3 orphan file cleanup${this.dryRun ? ' (DRY RUN)' : ''}`);
      this.log(`Target bucket: ${BUCKET}`);
      this.log(`Prefixes: ${IMAGES_PREFIX}, ${PDF_PREFIX}`);
      
      if (this.fileType) {
        this.log(`File type filter: ${this.fileType}`);
      }
      
      if (this.startDate || this.endDate) {
        this.log(`Date range: ${this.startDate || 'any'} to ${this.endDate || 'any'}`);
      }

      // Get all file references from database
      const databaseKeys = await this.getAllDatabaseFileKeys();

      // Get all files from S3
      const [imageObjects, pdfObjects] = await Promise.all([
        this.listS3Objects(IMAGES_PREFIX),
        this.listS3Objects(PDF_PREFIX)
      ]);

      const allS3Objects = [...imageObjects, ...pdfObjects];
      this.stats.totalFilesScanned = allS3Objects.length;

      this.log(`Total files in S3: ${allS3Objects.length}`);

      // Find orphaned files
      const orphanedFiles = allS3Objects.filter(obj => !databaseKeys.has(obj.Key));
      this.stats.orphanedFiles = orphanedFiles.length;

      if (this.verbose) {
        orphanedFiles.forEach(file => {
          this.log(`Orphaned file: ${file.Key} (${file.Size} bytes, modified: ${file.LastModified})`);
        });
      }

      // Process orphaned files
      await this.processOrphanedFiles(orphanedFiles);

      // Print summary
      this.printSummary();

    } catch (error) {
      this.log(`Fatal error during cleanup: ${error.message}`, 'error');
      this.stats.errors++;
    } finally {
      await prisma.$disconnect();
    }
  }

  printSummary() {
    console.log('\n=== CLEANUP SUMMARY ===');
    console.log(`Total files scanned: ${this.stats.totalFilesScanned}`);
    console.log(`Orphaned files found: ${this.stats.orphanedFiles}`);
    console.log(`Files deleted: ${this.stats.deletedFiles}`);
    console.log(`Errors encountered: ${this.stats.errors}`);
    
    if (this.dryRun) {
      console.log('\n⚠️  This was a DRY RUN - no files were actually deleted');
      console.log('Run with --execute to perform actual deletions');
    } else {
      console.log('\n✅ Cleanup completed');
    }
  }
}

// CLI Interface
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: true,
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--execute':
        options.dryRun = false;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--force':
        options.force = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--file-type':
        options.fileType = args[++i];
        if (!['pdf', 'png', 'jpg'].includes(options.fileType)) {
          console.error('Invalid file type. Use: pdf, png, or jpg');
          process.exit(1);
        }
        break;
      case '--start-date':
        options.startDate = new Date(args[++i]);
        if (isNaN(options.startDate)) {
          console.error('Invalid start date format');
          process.exit(1);
        }
        break;
      case '--end-date':
        options.endDate = new Date(args[++i]);
        if (isNaN(options.endDate)) {
          console.error('Invalid end date format');
          process.exit(1);
        }
        break;
      case '--batch-size':
        options.batchSize = parseInt(args[++i]);
        if (isNaN(options.batchSize) || options.batchSize < 1) {
          console.error('Invalid batch size');
          process.exit(1);
        }
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
      default:
        console.error(`Unknown option: ${args[i]}`);
        printHelp();
        process.exit(1);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
S3 Orphan File Cleanup Tool

USAGE:
  node scripts/cleanup-orphaned-s3-files.js [OPTIONS]

OPTIONS:
  --execute              Actually delete files (default is dry-run)
  --dry-run              Preview what would be deleted (default)
  --force                Skip confirmation prompt (useful for Docker/non-interactive)
  --verbose, -v          Enable verbose logging
  --file-type TYPE       Only process specific file type (pdf, png, jpg)
  --start-date DATE      Only process files modified after this date
  --end-date DATE        Only process files modified before this date
  --batch-size N         Process files in batches of N (default: 100)
  --help, -h             Show this help message

EXAMPLES:
  # Dry run (preview only)
  node scripts/cleanup-orphaned-s3-files.js

  # Actually delete orphaned files
  node scripts/cleanup-orphaned-s3-files.js --execute

  # Delete files without confirmation (useful for Docker/automated scripts)
  node scripts/cleanup-orphaned-s3-files.js --execute --force

  # Only check PDF files
  node scripts/cleanup-orphaned-s3-files.js --file-type pdf --verbose

  # Delete files older than specific date
  node scripts/cleanup-orphaned-s3-files.js --execute --end-date 2024-01-01

ENVIRONMENT VARIABLES:
  AWS_REGION             AWS region for S3
  AWS_ACCESS_KEY_ID      AWS access key
  AWS_SECRET_ACCESS_KEY  AWS secret key
  AWS_S3_BUCKET          S3 bucket name
  DATABASE_URL           PostgreSQL connection string
  S3_CONTENT_IMAGES_PREFIX  Image prefix (default: content-images)
  S3_CONTENT_PDFS_PREFIX    PDF prefix (default: content-pdfs)
`);
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArgs();
  const cleanup = new OrphanFileCleanup(options);
  cleanup.run().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { OrphanFileCleanup };