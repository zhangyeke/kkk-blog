"use client"

import { useCallback, useMemo } from "react"

import { AdminForm } from "@/app/admin/components/AdminForm"
import type { CustomControlProps } from "@/components/k-view/Form/type"
import { RegionCascaderField } from "@/components/k-view/Form/components/RegionCascader"
import { GeoCoordinatesField } from "@/components/k-view/Form/components/GeoCoordinatesField"
import { createAdminFootprint, updateAdminFootprint } from "@/service/footprint"
import { addFootprintSchema } from "@/validators/footprint"

export type FootprintFormValues = {
    regionCode: string[]
    address: string
    coordinates: { lng: string; lat: string }
    album: string[]
}

const EMPTY_FOOTPRINT_VALUES: FootprintFormValues = {
    regionCode: [],
    address: "",
    coordinates: { lng: "", lat: "" },
    album: [],
}

export function FootprintForm({
    footprintId,
    defaultValue = EMPTY_FOOTPRINT_VALUES,
    valueLabelMap,
    onCancel,
    onSuccess,
}: {
    footprintId?: number
    defaultValue?: FootprintFormValues
    valueLabelMap?: Readonly<Record<string, string>>
    onCancel: () => void
    onSuccess: () => void
}) {
    const saveFootprint = useCallback(
        (values: FootprintFormValues) =>
            footprintId === undefined
                ? createAdminFootprint(values)
                : updateAdminFootprint(footprintId, values),
        [footprintId],
    )

    const formComponents = useMemo(() => ({
        geoCoordinates: GeoCoordinatesField,
        regionCascader: (props: CustomControlProps) => (
            <RegionCascaderField {...props} valueLabelMap={valueLabelMap} />
        ),
    }), [valueLabelMap])

    return (
        <AdminForm<FootprintFormValues>
            schema={addFootprintSchema}
            defaultValues={defaultValue}
            formComponents={formComponents}
            save={saveFootprint}
            onCancel={onCancel}
            onSuccess={onSuccess}
            successMessage={footprintId === undefined ? "足迹已创建" : "足迹已更新"}
            submitLabel={footprintId === undefined ? "保存足迹" : "保存修改"}
            pendingLabel={footprintId === undefined ? "保存中…" : "更新中…"}
        />
    )
}
