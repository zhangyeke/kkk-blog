/** @jest-environment node */
import NextAuth from "next-auth"
import { updateUser } from "@/service/user"
import { auth } from "./index"

jest.mock("next-auth", () => ({ __esModule: true, default: jest.fn(() => ({ auth: jest.fn() })) }))
jest.mock("next-auth/providers/github", () => ({ __esModule: true, default: jest.fn() }))
jest.mock("next-auth/providers/google", () => ({ __esModule: true, default: jest.fn() }))
jest.mock("next-auth/providers/credentials", () => ({ __esModule: true, default: jest.fn() }))
jest.mock("bcrypt-ts-edge", () => ({ compareSync: jest.fn() }))
jest.mock("@/env.mjs", () => ({ env: {} }))
jest.mock("@/lib/prisma", () => ({ __esModule: true, default: {} }))
jest.mock("./prisma-adapter", () => ({ prismaAuthAdapter: jest.fn() }))
jest.mock("@/service/user", () => ({ getUserByEmail: jest.fn(), updateUser: jest.fn() }))

const jwt = jest.mocked(NextAuth).mock.calls[0]![0] as unknown as {
  callbacks: { jwt: (params: object) => Promise<Record<string, unknown>> }
}

test("does not copy a password hash or full user record into the token", async () => {
  const token = await jwt.callbacks.jwt({
    token: {},
    user: {
      id: "user-1",
      name: "test",
      email: "test@example.com",
      roles: "user",
      password: "secret-hash",
      address: { private: true },
    },
  })
  expect(token).toEqual({ sub: "user-1", name: "test", email: "test@example.com", roles: "user" })
  expect(token).not.toHaveProperty("password")
})

test("ignores client-supplied roles and id when updating the session", async () => {
  jest
    .mocked(updateUser)
    .mockResolvedValue({
      code: 200,
      data: { name: "validated", avatar: "avatar.png", email: "updated@example.com" },
    } as Awaited<ReturnType<typeof updateUser>>)
  const token = await jwt.callbacks.jwt({
    trigger: "update",
    token: { sub: "owner", roles: "user" },
    session: { user: { id: "someone", roles: "superAdmin", name: "unvalidated" } },
  })
  expect(token).toEqual({
    sub: "owner",
    roles: "user",
    name: "validated",
    avatar: "avatar.png",
    email: "updated@example.com",
  })
})

test("rejects an Auth.js configuration error object as an authenticated session", async () => {
  const instance = jest.mocked(NextAuth).mock.results[0]!.value as { auth: jest.Mock }
  instance.auth.mockResolvedValue({ message: "Server configuration error" })
  expect(await auth()).toBeNull()
})

test("preserves a valid authenticated session", async () => {
  const instance = jest.mocked(NextAuth).mock.results[0]!.value as { auth: jest.Mock }
  const session = { user: { id: "owner", name: "test" } }
  instance.auth.mockResolvedValue(session)
  expect(await auth()).toEqual(session)
})
