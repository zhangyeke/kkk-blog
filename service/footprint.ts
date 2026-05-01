"use server"
import { merge } from "lodash"
import { updateTag } from "next/cache"
import { Prisma } from "@prisma/client"
import prisma from "@/lib/prisma"
import { backFailMessage, backSuccessMessage } from "@/lib/actionMessageBack"
import { checkAuth } from "@/service/auth"
import { addFootprintSchema } from "@/validators/footprint"
import type { addFootprintParams } from "@/types/footprint"

// --- CREATE ---
export async function createFootprint(data: addFootprintParams) {
  try {
    const user = await checkAuth()
    const params = addFootprintSchema.parse(data)
    const { regionCode, ...rest } = params
    const provinceCode = regionCode[0]
    const cityCode = regionCode[1]
    const areaCode = regionCode[2]
    if (!provinceCode || !cityCode) {
      return backFailMessage("请选择完整的省 / 市地区")
    }
    const footprint = await prisma.footprint.create({
      data: {
        ...rest,
        province: parseInt(provinceCode, 10),
        city: parseInt(cityCode, 10),
        area: areaCode ? parseInt(areaCode, 10) : undefined,
        userId: user.id || "",
      },
    })

    updateTag("action-footprintList")
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

    const { regionCode, ...rest } = data
    const updateData: Prisma.FootprintUpdateInput = { ...rest }
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
    updateTag("action-footprintList")
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
    updateTag("action-footprintList")
    return backSuccessMessage("删除足迹成功", deleted)
  } catch {
    return backFailMessage("删除足迹失败")
  }
}
