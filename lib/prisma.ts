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

/**
 * Next dev 会把 PrismaClient 放在 global 上跨 Fast Refresh 复用。
 * Prisma schema 新增模型后，旧实例不会自动获得新 delegate；检测到该情况时重建实例，
 * 否则会在 prisma.adminSettingGroup.create 等调用处得到难以理解的 undefined 错误。
 */
function supportsCurrentSchema(client: PrismaClient | undefined): boolean {
    if (!client) return false

    const delegates = client as PrismaClient & {
        adminSettingGroup?: unknown
        adminSettingField?: unknown
    }
    if (typeof delegates.adminSettingGroup !== "object" || typeof delegates.adminSettingField !== "object") {
        return false
    }

    // A generated Client can have all delegates while still lacking fields added
    // to an existing model. Inspect the runtime model so Fast Refresh replaces it.
    const runtimeModel = (client as PrismaClient & {
        _runtimeDataModel?: {
            models?: Record<string, {fields?: Array<{name: string}>}>
        }
    })._runtimeDataModel?.models?.AdminMenu

    return runtimeModel?.fields?.some((field) => field.name === "position") ?? false
}

const cachedPrisma = global.prisma
const hasCurrentSchema = supportsCurrentSchema(cachedPrisma)
const prisma = hasCurrentSchema
    ? cachedPrisma!
    : new PrismaClient({adapter: new PrismaNeon({connectionString})});

if (cachedPrisma && !hasCurrentSchema) {
    void cachedPrisma.$disconnect().catch(() => undefined)
}

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}

export default prisma;
