import type { Metadata } from "next"

import { FilterForm } from "@/components/k-view/FilterForm"
import type { FormFieldConfig } from "@/components/k-view/Form"
import { TableBusyProvider } from "@/components/k-view/DataTable/busy"
import { requirePageAccess, scopeOf } from "@/lib/admin-guard"
import { normalizePageSize } from "@/lib/paging"
import { getAdminFootprints } from "@/service/footprint"
import { TableBusyPager } from "../components/TableBusyPager"
import { TableToolbar } from "../components/TableToolbar"
import { FootprintsTable, FootprintToolbar } from "./FootprintsTable"

export const metadata: Metadata = { title: "足迹" }
export const dynamic = "force-dynamic"

type SearchParams = { page?: string; pageSize?: string; address?: string; regionCode?: string }

export default async function AdminFootprintsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const user = await requirePageAccess("footprints")
  const scope = scopeOf(user)
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = normalizePageSize(params.pageSize)
  const address = params.address?.trim() ?? ""
  const requestedRegionCode = (params.regionCode ?? "").split(",")
  const regionCode = requestedRegionCode.length <= 3 && requestedRegionCode.every((code) => /^\d{6}$/.test(code))
    ? requestedRegionCode.filter(Boolean)
    : []
  const result = await getAdminFootprints(scope, { page, pageSize, address, regionCode })
  const data = result.code === 200 ? result.data : { list: [], total: 0, page: 1, pageSize: 10, totalPages: 1 }
  const fields: FormFieldConfig[] = [
    {
      key: "address",
      type: "string",
      required: false,
      fieldConfig: {
        label: "地点",
        inputProps: {
          placeholder: "搜索地点…",
          className: "h-8 w-full text-sm md:text-base sm:w-[var(--field-w)]",
          style: { "--field-w": "240px" },
        },
      },
      options: [],
      schema: [],
    },
    {
      key: "regionCode",
      type: "regionCascader",
      required: false,
      fieldConfig: {
        label: "地区",
        inputProps: {
          placeholder: "选择足迹地区",
          allowParentSelection: true,
          minParentSelectionDepth: 1,
          className: "h-8 w-full text-sm md:text-base sm:w-[var(--field-w)]",
          style: { "--field-w": "240px" },
        },
      },
      options: [],
      schema: [],
    },
  ]

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      <TableBusyProvider>
        <div className="adm-rise mb-2">
          <FilterForm fields={fields} basePath="/admin/footprints" />
        </div>
        <div className="adm-rise mb-2">
          <TableToolbar action={<FootprintToolbar />} />
        </div>
        <div className="adm-rise">
          <FootprintsTable
            rows={data.list}
            footer={
              data.total > 0 ? (
                <TableBusyPager
                  page={data.page}
                  pageSize={data.pageSize}
                  totalPages={data.totalPages}
                  total={data.total}
                  basePath="/admin/footprints"
                  query={{ address, regionCode: regionCode.length ? regionCode.join(",") : undefined }}
                />
              ) : undefined
            }
          />
        </div>
      </TableBusyProvider>
    </div>
  )
}
