import {neonConfig, Pool} from '@neondatabase/serverless';
import {PrismaNeon} from '@prisma/adapter-neon';
import {PrismaClient} from '@prisma/client';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
// const connectionString = `${process.env.DATABASE_URL}`;
// const pool = new Pool({connectionString});
const adapter = new PrismaNeon({connectionString: process.env.DATABASE_URL});
export const prisma = new PrismaClient({adapter});


