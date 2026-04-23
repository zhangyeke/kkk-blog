import {neonConfig} from '@neondatabase/serverless';
import {PrismaNeon} from '@prisma/adapter-neon';
import {PrismaClient} from '@prisma/client';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

declare global {
    var prisma: PrismaClient | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
}

const adapter = new PrismaNeon({connectionString});

const prisma = global.prisma ?? new PrismaClient({adapter});

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}

export default prisma;
