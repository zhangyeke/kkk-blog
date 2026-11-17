"use server"
import { merge } from "lodash"
import { Prisma } from "@prisma/client"
import prisma from "@/lib/prisma"
import { backFailMessage, backSuccessMessage } from "@/lib/actionMessageBack"
import { checkAuth } from "@/service/auth"
import { addFootprintSchema } from "@/validators/footprint"
import type { addFootprintParams } from "@/types/footprint"
import { revalidatePath } from "next/cache"
import { requireAction, scopeOf } from "@/lib/admin/guard"
import { normalizePaging, type Paging } from "@/lib/paging"
import type { DataScope } from "@/lib/admin/permissions"
import { getRegionPathLabels } from "@/service/china-map"

const footprintScopeWhere = (scope: DataScope) => (scope.all ? {} : { userId: scope.userId })

function getFootprintRegionFields(regionCode: string[]) {
  const [provinceCode, cityCode, areaCode] = regionCode
  if (!provinceCode || !cityCode) return null

  return {
    province: Number.parseInt(provinceCode, 10),
    city: Number.parseInt(cityCode, 10),
    area: areaCode ? Number.parseInt(areaCode, 10) : undefined,
  }
}

function getFootprintCoordinateFields(coordinates?: { lng: string; lat: string }) {
  const lng = coordinates?.lng.trim() ?? ""
  const lat = coordinates?.lat.trim() ?? ""

  return {
    lng: lng ? Number(lng) : null,
    lat: lat ? Number(lat) : null,
  }
}

// --- CREATE ---
export async function createFootprint(data: addFootprintParams) {
  try {
    const user = await checkAuth()
    const params = addFootprintSchema.parse(data)
    const { regionCode, coordinates, ...rest } = params
    const regionFields = getFootprintRegionFields(regionCode)
    if (!regionFields) {
      return backFailMessage("请选择完整的省 / 市地区")
    }
    const footprint = await prisma.footprint.create({
      data: {
        ...rest,
        ...regionFields,
        ...getFootprintCoordinateFields(coordinates),
        userId: user.id || "",
      },
    })

    return backSuccessMessage("创建足迹成功", footprint)
  } catch {
    return backFailMessage("创建足迹失败")
  }
}

export async function getAllFootprints(params?: Prisma.FootprintFindManyArgs) {
  try {
    const footprints = await prisma.footprint.findMany(params)

    return backSuccessMessage("获取足迹列表成功", {
      list: footprints,
    })
  } catch {
    return backFailMessage("获取足迹列表失败", {
      list: [],
    })
  }
}

// --- READ ---

/**
 * 地图专用：只取有坐标的足迹，字段裁剪到地图所需。
 * 与 getAllFootprints 的区别：强制 lat/lng 非空，省得前端再过滤一遍。
 */
export async function getMappedFootprints() {
  try {
    const rows = await prisma.footprint.findMany({
      where: {lat: {not: null}, lng: {not: null}},
      select: {
        id: true,
        province: true,
        city: true,
        area: true,
        address: true,
        album: true,
        lat: true,
        lng: true,
        createdAt: true,
      },
      orderBy: [{province: "asc"}, {createdAt: "desc"}],
    })

    const regionPaths = await getRegionPathLabels(rows.map((row) => [
      String(row.province),
      String(row.city),
      ...(row.area == null ? [] : [String(row.area)]),
    ]))

    return backSuccessMessage("获取地图足迹成功", {
      list: rows.map((row, index) => ({
        ...row,
        regionPath: regionPaths[index] ?? "",
      })),
    })
  } catch {
    return backFailMessage("获取地图足迹失败", {list: []})
  }
}

export async function getMeFootprints(params: Prisma.FootprintWhereInput & Paging) {
  try {
    const user = await checkAuth()
    const { page, pageSize, ...where } = params

    const mergedWhere = merge({ userId: user.id as string }, where)

    const footprints = await getAllFootprints({
      where: mergedWhere,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    const totalCount = await prisma.footprint.count({
      where: mergedWhere,
    })

    return backSuccessMessage("获取我的足迹列表成功", {
      list: footprints.data.list,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
    })
  } catch {
    return backFailMessage("获取我的足迹列表失败", {
      list: [],
      totalPages: 0,
      currentPage: 0,
    })
  }
}

export async function getFootprintById(id: number) {
  try {
    const footprint = await prisma.footprint.findUnique({
      where: { id },
    })

    return backSuccessMessage("获取足迹成功", footprint)
  } catch {
    return backFailMessage("获取足迹失败")
  }
}

// --- UPDATE ---

export async function updateFootprint({ id, ...data }: addFootprintParams & { id: number }) {
  try {
    await checkAuth()

    const { regionCode, coordinates, ...rest } = data
    const updateData: Prisma.FootprintUpdateInput = { ...rest }
    if (coordinates) {
      Object.assign(updateData, getFootprintCoordinateFields(coordinates))
    }
    if (regionCode && regionCode.length >= 2) {
      const p = regionCode[0]
      const c = regionCode[1]
      if (p && c) {
        updateData.province = parseInt(p, 10)
        updateData.city = parseInt(c, 10)
      }
    }

    const footprint = await prisma.footprint.update({
      where: { id },
      data: updateData,
    })
    return backSuccessMessage("更新足迹成功", footprint)
  } catch {
    return backFailMessage("更新足迹失败")
  }
}

// --- DELETE ---

export async function deleteFootprint(id: number) {
  try {
    const user = await checkAuth()

    const row = await prisma.footprint.findUnique({
      where: { id },
      select: { id: true, userId: true },
    })
    if (!row) {
      return backFailMessage("足迹不存在")
    }
    if (row.userId !== user.id) {
      return backFailMessage("无权删除该足迹")
    }

    const deleted = await prisma.footprint.delete({ where: { id } })
    return backSuccessMessage("删除足迹成功", deleted)
  } catch {
    return backFailMessage("删除足迹失败")
  }
}

export type AdminFootprintRow = {
  id: number
  address: string
  addressValue: string
  region: string
  regionCode: string[]
  photoCount: number
  album: string[]
  hasCoord: boolean
  lat: number | null
  lng: number | null
  createdAt: Date
}

export async function getAdminFootprints(
  scope: DataScope,
  options?: Partial<Paging> & { address?: string; regionCode?: string[] },
) {
  try {
    const { page, pageSize } = normalizePaging(options)
    const address = options?.address?.trim()
    const requestedRegionCode = options?.regionCode ?? []
    const regionCode = requestedRegionCode.length <= 3 && requestedRegionCode.every((code) => /^\d{6}$/.test(code))
      ? requestedRegionCode
      : []
    const where = {
      ...footprintScopeWhere(scope),
      ...(address ? { address: { contains: address, mode: "insensitive" as const } } : {}),
      ...(regionCode[0] ? { province: Number(regionCode[0]) } : {}),
      ...(regionCode[1] ? { city: Number(regionCode[1]) } : {}),
      ...(regionCode[2] ? { area: Number(regionCode[2]) } : {}),
    }

    const [total, rows] = await Promise.all([
      prisma.footprint.count({ where }),
      prisma.footprint.findMany({
        where,
        select: {
          id: true,
          address: true,
          province: true,
          city: true,
          area: true,
          album: true,
          lat: true,
          lng: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    const regionLabels = await getRegionPathLabels(rows.map((row) => [
      String(row.province),
      String(row.city),
      ...(row.area == null ? [] : [String(row.area)]),
    ]))
    const list: AdminFootprintRow[] = rows.map((row, index) => ({
      id: row.id,
      address: row.address?.trim() || "未命名地点",
      addressValue: row.address?.trim() ?? "",
      region: regionLabels[index] ?? "",
      regionCode: [
        String(row.province),
        String(row.city),
        ...(row.area == null ? [] : [String(row.area)]),
      ],
      photoCount: row.album?.length ?? 0,
      album: row.album,
      hasCoord: row.lat != null && row.lng != null,
      lat: row.lat,
      lng: row.lng,
      createdAt: row.createdAt,
    }))

    return backSuccessMessage("获取足迹列表成功", {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    })
  } catch {
    return backFailMessage("获取足迹列表失败", {
      list: [] as AdminFootprintRow[],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    })
  }
}

export async function createAdminFootprint(input: unknown) {
  const user = await requireAction("footprint:create")
  try {
    const params = addFootprintSchema.parse(input)
    const { regionCode, coordinates, ...rest } = params
    const regionFields = getFootprintRegionFields(regionCode)
    if (!regionFields) return backFailMessage("请选择完整的省 / 市地区")

    await prisma.footprint.create({
      data: {
        address: rest.address?.trim() || null,
        album: rest.album,
        ...regionFields,
        ...getFootprintCoordinateFields(coordinates),
        area: regionFields.area ?? null,
        userId: user.id,
      },
    })
    revalidatePath("/admin/footprints")
    revalidatePath("/blog/me/footprints")
    return backSuccessMessage("足迹已创建", null)
  } catch {
    return backFailMessage("足迹创建失败，请检查填写内容")
  }
}

export async function updateAdminFootprint(id: number, input: unknown) {
  const user = await requireAction("footprint:update")
  if (!Number.isSafeInteger(id) || id <= 0) return backFailMessage("足迹 ID 不合法")

  try {
    const existing = await prisma.footprint.findUnique({
      where: { id },
      select: { userId: true },
    })
    if (!existing) return backFailMessage("足迹不存在")
    if (!scopeOf(user).all && existing.userId !== user.id) return backFailMessage("无权编辑该足迹")

    const params = addFootprintSchema.parse(input)
    const { regionCode, coordinates, ...rest } = params
    const regionFields = getFootprintRegionFields(regionCode)
    if (!regionFields) return backFailMessage("请选择完整的省 / 市地区")

    const footprint = await prisma.footprint.update({
      where: { id },
      data: {
        address: rest.address?.trim() || null,
        album: rest.album,
        ...regionFields,
        area: regionFields.area ?? null,
        ...getFootprintCoordinateFields(coordinates),
      },
    })

    revalidatePath("/admin/footprints")
    revalidatePath("/blog/me/footprints")
    revalidatePath("/blog", "layout")
    return backSuccessMessage("足迹已更新", footprint)
  } catch {
    return backFailMessage("足迹更新失败，请检查填写内容")
  }
}

export async function deleteAdminFootprint(id: number) {
  const user = await requireAction("footprint:delete")
  if (!Number.isSafeInteger(id) || id <= 0) return backFailMessage("足迹不存在")
  const existing = await prisma.footprint.findUnique({ where: { id }, select: { userId: true } })
  if (!existing) return backFailMessage("足迹不存在")
  if (!scopeOf(user).all && existing.userId !== user.id) return backFailMessage("无权删除该足迹")
  await prisma.footprint.delete({ where: { id } })
  revalidatePath("/admin/footprints")
  revalidatePath("/blog/me/footprints")
  revalidatePath("/blog", "layout")
  return backSuccessMessage("足迹已删除", null)
}
