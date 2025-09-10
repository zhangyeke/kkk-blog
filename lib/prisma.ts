import {neonConfig} from '@neondatabase/serverless';
import {PrismaNeon} from '@prisma/adapter-neon';
import {PrismaClient} from '@prisma/client';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

declare global {
    let prisma: PrismaClient | undefined;
}

const connectionString = `${process.env.DATABASE_URL}`;
//
// const pool = new Pool({ connectionString });
const adapter = new PrismaNeon({connectionString});
const prisma = new PrismaClient({adapter});


export default prisma