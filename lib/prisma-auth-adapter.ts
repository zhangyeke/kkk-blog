import { PrismaAdapter } from "@auth/prisma-adapter"
import type { Prisma, PrismaClient, User as DbUser } from "@prisma/client"
import type { Adapter, AdapterUser } from "next-auth/adapters"

import prisma from "./prisma"

/** Prisma 使用 `avatar`；OAuth（Google/GitHub）与 Auth.js 适配器使用 `image`。 */

function dbUserToAdapterUser(u: DbUser): AdapterUser {
    return {
        id: u.id,
        email: u.email,
        emailVerified: u.emailVerified,
        name: u.name,
        image: u.avatar ?? null,
    }
}

export function prismaAuthAdapter(client: PrismaClient = prisma): Adapter {
    const base = PrismaAdapter(client)

    return {
        ...base,
        async createUser(data) {
            const { id: _discardId, image, ...rest } = data
            const row = await client.user.create({
                data: {
                    email: rest.email,
                    name: rest.name ?? "NO_NAME",
                    emailVerified: rest.emailVerified ?? undefined,
                    avatar: image ?? null,
                },
            })
            return dbUserToAdapterUser(row)
        },
        async getUser(id) {
            const row = await client.user.findUnique({ where: { id } })
            return row ? dbUserToAdapterUser(row) : null
        },
        async getUserByEmail(email) {
            const row = await client.user.findUnique({ where: { email } })
            return row ? dbUserToAdapterUser(row) : null
        },
        async getUserByAccount(provider_providerAccountId) {
            const account = await client.account.findUnique({
                where: { provider_providerAccountId },
                include: { user: true },
            })
            const u = account?.user
            return u ? dbUserToAdapterUser(u) : null
        },
        async updateUser({ id, image, ...rest }) {
            const data: Prisma.UserUpdateInput = {}
            if (rest.name !== undefined) data.name = rest.name ?? "NO_NAME"
            if (rest.email !== undefined) data.email = rest.email
            if (rest.emailVerified !== undefined) data.emailVerified = rest.emailVerified
            if (image !== undefined)
                data.avatar = image === null ? { set: null } : image
            const row = await client.user.update({
                where: { id },
                data,
            })
            return dbUserToAdapterUser(row)
        },
        async getSessionAndUser(sessionToken) {
            const bundle = await client.session.findUnique({
                where: { sessionToken },
                include: { user: true },
            })
            if (!bundle) {
                return null
            }
            const { user: u, ...session } = bundle
            return {
                session: {
                    sessionToken: session.sessionToken,
                    userId: session.userId,
                    expires: session.expires,
                },
                user: dbUserToAdapterUser(u),
            }
        },
    }
}
