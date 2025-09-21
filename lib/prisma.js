// lib/prisma.js
console.log('>>> Prisma will connect with DATABASE_URL =', process.env.DATABASE_URL);
const { PrismaClient } = require('@prisma/client');

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

module.exports = { prisma };
module.exports.default = prisma;
