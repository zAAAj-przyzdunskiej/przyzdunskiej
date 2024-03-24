import { PrismaClient } from '@prisma/client';

let isDevMode = import.meta.env.DEV;
const options: any = isDevMode ? { log: ['query'] } : {};
const prisma = globalThis.prisma ?? new PrismaClient(options);

if (isDevMode) globalThis.prisma = prisma;

export { prisma };