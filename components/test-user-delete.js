// test-user-delete.js
// Run this from your blog app root directory with: node test-user-delete.js

const fs = require('fs');
const path = require('path');

console.log('=== User Delete API Test ===\n');

// 1. Check if API files exist
console.log('1. Checking API file structure...');
const apiFiles = [
  'pages/api/users/index.js',
  'pages/api/users/delete-batch.js'
];

apiFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} is MISSING - Please create this file!`);
  }
});

// 2. Check environment variables
console.log('\n2. Checking environment variables...');
require('dotenv').config();

const envVars = {
  'CREDENTIAL_INTERNAL_TOKEN': process.env.CREDENTIAL_INTERNAL_TOKEN,
  'AUTH_API_BASE': process.env.AUTH_API_BASE,
  'DATABASE_URL': process.env.DATABASE_URL
};

Object.entries(envVars).forEach(([key, value]) => {
  if (value) {
    console.log(`✅ ${key} is set (length: ${value.length})`);
  } else {
    console.log(`❌ ${key} is NOT set`);
  }
});

// 3. Test database connection
console.log('\n3. Testing database connection...');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDb() {
  try {
    const userCount = await prisma.user.count();
    console.log(`✅ Database connected - Found ${userCount} users`);
    
    // List first 3 users
    const users = await prisma.user.findMany({ take: 3 });
    if (users.length > 0) {
      console.log('\nFirst few users:');
      users.forEach(u => console.log(`  - ${u.email} (${u.name})`));
    }
  } catch (error) {
    console.log(`❌ Database connection failed: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

// 4. Test credential service connection
async function testCredentialService() {
  console.log('\n4. Testing credential service...');
  const authBase = process.env.AUTH_API_BASE || 'http://localhost:8001';
  
  try {
    const fetch = require('node-fetch');
    const response = await fetch(`${authBase}/`);
    if (response.ok) {
      console.log(`✅ Credential service is reachable at ${authBase}`);
    } else {
      console.log(`⚠️ Credential service responded with status: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Cannot reach credential service at ${authBase}: ${error.message}`);
    console.log('   Make sure the credential service is running (docker-compose up)');
  }
}

// 5. Create missing API files if needed
async function createMissingFiles() {
  console.log('\n5. Creating missing API files...');
  
  const usersDir = path.join(process.cwd(), 'pages', 'api', 'users');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(usersDir)) {
    fs.mkdirSync(usersDir, { recursive: true });
    console.log('✅ Created /pages/api/users directory');
  }
  
  // Create index.js if missing
  const indexPath = path.join(usersDir, 'index.js');
  if (!fs.existsSync(indexPath)) {
    const indexContent = `// This file needs the full content from the artifact
// Copy the content from the provided index.js artifact
export default async function handler(req, res) {
  return res.status(501).json({ error: 'Not implemented - Please add the full code' });
}`;
    fs.writeFileSync(indexPath, indexContent);
    console.log('⚠️ Created placeholder /pages/api/users/index.js - Please add the full code!');
  }
  
  // Create delete-batch.js if missing
  const deletePath = path.join(usersDir, 'delete-batch.js');
  if (!fs.existsSync(deletePath)) {
    const deleteContent = `// This file needs the full content from the artifact
// Copy the content from the provided delete-batch.js artifact
export default async function handler(req, res) {
  return res.status(501).json({ error: 'Not implemented - Please add the full code' });
}`;
    fs.writeFileSync(deletePath, deleteContent);
    console.log('⚠️ Created placeholder /pages/api/users/delete-batch.js - Please add the full code!');
  }
}

// Run all tests
async function runTests() {
  await testDb();
  await testCredentialService();
  await createMissingFiles();
  
  console.log('\n=== Test Complete ===');
  console.log('\nNext steps:');
  console.log('1. Fix any ❌ items above');
  console.log('2. Make sure both blog and credential services are running');
  console.log('3. If API files were created, add the full code from the artifacts');
  console.log('4. Restart your blog app after making changes');
}

runTests().catch(console.error);