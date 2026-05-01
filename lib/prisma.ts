/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2025-09-17 21:38:09
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-04-25 21:15:14
 * @FilePath: \blog\lib\prisma.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import {neonConfig} from '@neondatabase/serverless';
import {PrismaNeon} from '@prisma/adapter-neon';
import {PrismaClient} from '@prisma/client';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

declare global {
    var prisma: PrismaClient | undefined;
}
const connectionString = process.env.DATABASE_URL;

// if (!connectionString) {
//     throw new Error('DATABASE_URL is not defined');
// }

const adapter = new PrismaNeon({connectionString});

const prisma = global.prisma ?? new PrismaClient({adapter});

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}

export default prisma;
