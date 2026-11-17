"use server"

import { revalidatePath } from "next/cache"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { hashSync } from "bcrypt-ts-edge"
import type { Prisma } from "@prisma/client"

import prisma from "@/lib/prisma"
import { backFailMessage, backSuccessMessage } from "@/lib/actionMessageBack"
import { requireAction } from "@/lib/admin/guard"
import { normalizePaging, type Paging } from "@/lib/paging"
import type { DataScope } from "@/lib/admin/permissions"
import { adminUserFormSchema } from "@/validators/user"

export type AdminUserRow = {
  id: string
  name: string
  email: string
  avatar: string | null
  roles: string
  loginProviders: string[]
  createdAt: Date
  postCount: number
}

export type AdminUserDetails = Pick<AdminUserRow, "id" | "name" | "email" | "avatar" | "roles">

export type AdminUserFilter = Partial<Paging> & {
  keyword?: string
  role?: string
}

async function getAssignableRole(code: string) {
  return prisma.role.findUnique({ where: { code }, select: { code: true, status: true } })
}

function canAssignSuperAdmin(actorRoles: string) {
  return actorRoles.split(",").map((role) => role.trim()).includes("superAdmin")
}

export async function createAdminUser(input: unknown) {
  try {
    const admin = await requireAction("user:manage")
    const parsed = adminUserFormSchema.safeParse(input)
    if (!parsed.success) return backFailMessage(parsed.error.issues[0]?.message || "用户信息不合法")
    const data = parsed.data
    const email = data.email.toLowerCase()
    if (data.roles === "superAdmin" && !canAssignSuperAdmin(admin.roles)) {
      return backFailMessage("只有超级管理员可以分配超级管理员角色")
    }
    const role = await getAssignableRole(data.roles)
    if (!role || role.status !== 1) return backFailMessage("请选择正常状态的角色")
    if (await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id: true } })) {
      return backFailMessage("该邮箱已被注册")
    }

    await prisma.user.create({
      data: {
        name: data.name,
        email,
        avatar: data.avatar || null,
        roles: role.code,
        ...(data.password ? { password: hashSync(data.password, 10) } : {}),
      },
    })
    revalidatePath("/admin/users")
    return backSuccessMessage("用户已创建")
  } catch (error) {
    if (isRedirectError(error)) throw error
    console.warn("[service/admin/users] 创建用户失败", error)
    return backFailMessage("创建用户失败，请稍后再试")
  }
}

export async function updateAdminUser(input: unknown) {
  try {
    const admin = await requireAction("user:manage")
    const raw = typeof input === "object" && input !== null ? input as Record<string, unknown> : {}
    const id = typeof raw.id === "string" ? raw.id : ""
    if (!id) return backFailMessage("用户不存在")
    if (id === admin.id) return backFailMessage("不能编辑当前账号")
    const parsed = adminUserFormSchema.safeParse(raw)
    if (!parsed.success) return backFailMessage(parsed.error.issues[0]?.message || "用户信息不合法")
    const data = parsed.data
    const email = data.email.toLowerCase()
    if (data.roles === "superAdmin" && !canAssignSuperAdmin(admin.roles)) {
      return backFailMessage("只有超级管理员可以分配超级管理员角色")
    }

    const target = await prisma.user.findUnique({ where: { id }, select: { roles: true } })
    if (!target) return backFailMessage("用户不存在")
    if (target.roles.split(",").map((role) => role.trim()).includes("superAdmin") && !canAssignSuperAdmin(admin.roles)) {
      return backFailMessage("只有超级管理员可以编辑超级管理员账号")
    }
    const role = await getAssignableRole(data.roles)
    if (!role || role.status !== 1) return backFailMessage("请选择正常状态的角色")
    const duplicate = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    })
    if (duplicate && duplicate.id !== id) return backFailMessage("该邮箱已被注册")

    await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email,
        avatar: data.avatar || null,
        roles: role.code,
        ...(data.password ? { password: hashSync(data.password, 10) } : {}),
      },
    })
    revalidatePath("/admin/users")
    revalidatePath("/admin", "layout")
    return backSuccessMessage("用户信息已更新")
  } catch (error) {
    if (isRedirectError(error)) throw error
    console.warn("[service/admin/users] 更新用户失败", error)
    return backFailMessage("更新用户失败，请稍后再试")
  }
}

export async function getAdminUserFilterOptions() {
  try {
    const roles = await prisma.role.findMany({
      select: { code: true, name: true, status: true },
      orderBy: [{ sort: "asc" }, { id: "asc" }],
    })
    return backSuccessMessage("获取角色选项成功", {
      roles: roles.filter((role) => role.status === 1).map((role) => ({ code: role.code, name: role.name })),
      roleNames: Object.fromEntries(roles.map((role) => [role.code, role.name])) as Record<string, string>,
    })
  } catch {
    return backFailMessage("获取角色选项失败", {
      roles: [] as Array<{ code: string; name: string }>,
      roleNames: {} as Record<string, string>,
    })
  }
}

export async function getAdminUsers(scope: DataScope, options?: AdminUserFilter) {
  if (!scope.all) {
    return backSuccessMessage("获取用户列表成功", {
      list: [] as AdminUserRow[],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    })
  }

  try {
    const { page, pageSize } = normalizePaging(options)
    const keyword = options?.keyword?.trim()
    const role = options?.role?.trim()
    const where: Prisma.UserWhereInput = {}
    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: "insensitive" } },
        { email: { contains: keyword, mode: "insensitive" } },
      ]
    }
    if (role) where.roles = { contains: role, mode: "insensitive" }

    const [total, rows] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          roles: true,
          accounts: { select: { provider: true } },
          createdAt: true,
          _count: { select: { posts: true } },
        },
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    const list: AdminUserRow[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      avatar: row.avatar,
      roles: row.roles,
      loginProviders: [...new Set(row.accounts.map((account) => account.provider))],
      createdAt: row.createdAt,
      postCount: row._count.posts,
    }))
    return backSuccessMessage("获取用户列表成功", {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    })
  } catch {
    return backFailMessage("获取用户列表失败", {
      list: [] as AdminUserRow[],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    })
  }
}

export async function deleteAdminUser(id: string) {
  const admin = await requireAction("user:manage")
  if (id === admin.id) return backFailMessage("不能删除自己")
  try {
    const user = await prisma.user.findUnique({ where: { id }, select: { _count: { select: { posts: true } } } })
    if (!user) return backFailMessage("用户不存在")
    if (user._count.posts > 0) return backFailMessage("该用户仍有文章，请先处理其文章后再删除")
    const target = await prisma.user.findUnique({ where: { id }, select: { roles: true } })
    if (target?.roles.split(",").map((role) => role.trim()).includes("superAdmin") && !canAssignSuperAdmin(admin.roles)) {
      return backFailMessage("只有超级管理员可以删除超级管理员账号")
    }
    await prisma.user.delete({ where: { id } })
    revalidatePath("/admin/users")
    return backSuccessMessage("用户已删除")
  } catch {
    return backFailMessage("删除用户失败")
  }
}
