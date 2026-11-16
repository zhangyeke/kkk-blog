"use client"

import React from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { AdminCreateToolbar } from "@/app/admin/components/AdminCreateToolbar"
import { useAdminTheme } from "@/app/admin/components/AdminShell"
import { usePermission } from "@/components/admin/permission-context"
import { GalleryModal } from "@/components/GalleryModal"
import { DataTable, type DataTableColumn } from "@/components/k-view/DataTable"
import { Empty } from "@/components/k-view/Empty"
import { Image } from "@/components/k-view/Image"
import { type RowActionItem, RowActions } from "@/components/k-view/RowActions"
import { Tag } from "@/components/k-view/Tag"
import { useRenderDialog } from "@/components/k-view/Popup/useRenderDialog"
import { useTableBusy } from "@/components/k-view/DataTable/busy"
import { formatDate } from "@/lib/date"
import type { AdminFootprintRow } from "@/service/footprint"
import { deleteAdminFootprint } from "@/service/footprint"
import { FootprintForm, type FootprintFormValues } from "./FootprintForm"

export function FootprintToolbar() {
    return (
        <AdminCreateToolbar
            permission="footprint:create"
            buttonLabel="新增足迹"
            dialogTitle="新增足迹"
            dialog={{
                headerClassName: "border-[var(--adm-line)] px-5",
                titleClassName: "adm-serif text-base md:text-lg text-[var(--adm-ink)]",
                contentClassName: "admin-shell admin-dialog-content w-[680px]",
            }}
            renderForm={({onCancel, onSuccess}) => (
                <FootprintForm onCancel={onCancel} onSuccess={onSuccess}/>
            )}
        />
    )
}

export function FootprintsTable({ rows, footer }: { rows: AdminFootprintRow[]; footer?: React.ReactNode }) {
    const { can } = usePermission()
    const { preset } = useAdminTheme()
    const { openDialog } = useRenderDialog()
    const router = useRouter()
    const busy = useTableBusy()
    const [preview, setPreview] = React.useState<{ urls: string[]; address: string; defaultIndex: number } | null>(null)

    function handlePhotoPreviewClick(event: React.MouseEvent<HTMLButtonElement>) {
        const footprintId = Number(event.currentTarget.dataset.footprintId)
        const row = rows.find((item) => item.id === footprintId)
        if (!row?.album.length) return

        setPreview({ urls: row.album, address: row.address, defaultIndex: 0 })
    }

    function handleEditClick(row: AdminFootprintRow) {
        const regionLabels = row.region.split(" / ")
        const valueLabelMap: Record<string, string> = {}
        row.regionCode.forEach((code, index) => {
            const label = regionLabels[index]?.trim()
            if (label && label !== code) valueLabelMap[code] = label
        })
        const defaultValue: FootprintFormValues = {
            regionCode: row.regionCode,
            address: row.addressValue,
            coordinates: {
                lng: row.lng == null ? "" : String(row.lng),
                lat: row.lat == null ? "" : String(row.lat),
            },
            album: row.album,
        }

        openDialog({
            title: "编辑足迹",
            headerClassName: "shrink-0 border-[var(--adm-line)] px-5 text-left",
            titleClassName: "adm-serif text-base md:text-lg text-[var(--adm-ink)]",
            contentClassName: "admin-shell admin-dialog-content w-[680px] max-w-[calc(100vw-2rem)]",
            contentProps: {
                showCloseButton: false,
                "data-preset": preset,
            },
            render: ({ close, onCancel }) => (
                <FootprintForm
                    footprintId={row.id}
                    defaultValue={defaultValue}
                    valueLabelMap={valueLabelMap}
                    onCancel={onCancel}
                    onSuccess={() => {
                        close()
                        router.refresh()
                    }}
                />
            ),
        })
    }

    async function handleDelete(row: AdminFootprintRow) {
        try {
            const result = await deleteAdminFootprint(row.id)
            if (result.code === 200) toast.success(result.message || "足迹已删除")
            else toast.error(result.message || "删除失败")
        } catch {
            toast.error("删除失败，请稍后重试")
        }
    }

    const columns: DataTableColumn<AdminFootprintRow>[] = [
        { key: "address", title: "地点", copy: true, className: "text-sm md:text-base text-[var(--adm-ink)]" },
        { key: "region", title: "地区", className: "text-sm md:text-base text-[var(--adm-ink-2)]" },
        {
            key: "photos",
            title: "照片",
            render: (row) => row.album.length > 0 ? (
                <button
                    type="button"
                    data-footprint-id={row.id}
                    className="group cursor-zoom-in rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-[var(--adm-paper-3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--adm-c1)]"
                    aria-label={`预览${row.address}的${row.photoCount}张照片`}
                    onClick={handlePhotoPreviewClick}
                >
                    <span className="flex items-center pl-1" aria-hidden="true">
                        {row.album.slice(0, 5).map((url, index) => (
                            <span
                                key={`${row.id}-${index}`}
                                className={`relative size-9 shrink-0 overflow-hidden rounded-full border-2 border-[var(--adm-paper-2)] bg-[var(--adm-paper-3)] shadow-sm transition-transform group-hover:scale-105 ${index > 0 ? "-ml-3" : ""}`}
                            >
                                <Image src={url} alt="" className="size-full" loading="lazy" />
                            </span>
                        ))}
                        {row.album.length > 5 && (
                            <span key={`${row.id}-overflow`} className="relative -ml-3 grid size-9 shrink-0 place-items-center rounded-full border-2 border-[var(--adm-paper-2)] bg-[var(--adm-paper-3)] text-xs font-medium text-[var(--adm-ink-2)] shadow-sm">
                                +{row.album.length - 5}
                            </span>
                        )}
                    </span>
                </button>
            ) : <span style={{ color: "var(--adm-ink-3)" }}>—</span>,
        },
        {
            key: "coordinates",
            title: "坐标",
            render: (row) => row.hasCoord && row.lat != null && row.lng != null ? (
                <span className="font-mono text-xs tabular-nums" style={{ color: "var(--adm-ink-3)" }}>
                    {row.lat.toFixed(5)}, {row.lng.toFixed(5)}
                </span>
            ) : <Tag tone="muted" appearance="plain" size="sm">缺坐标</Tag>,
        },
        {
            key: "createdAt",
            title: "记录时间",
            align: "right",
            className: "whitespace-nowrap",
            render: (row) => <span className="text-xs md:text-sm tabular-nums" style={{ color: "var(--adm-ink-3)" }}>{formatDate(row.createdAt)}</span>,
        },
        {
            key: "actions",
            title: "操作",
            fixed: "right",
            align: "right",
            render: (row) => {
                const actions: RowActionItem[] = [{
                    key: "edit",
                    kind: "edit",
                    label: `编辑足迹「${row.address}」`,
                    permission: "footprint:update",
                    onClick: () => handleEditClick(row),
                }, {
                    key: "delete",
                    kind: "delete",
                    label: `删除足迹「${row.address}」`,
                    confirmText: `确定删除「${row.address}」这条足迹及其记录吗？此操作不可撤销。`,
                    permission: "footprint:delete",
                    onClick: () => handleDelete(row),
                }]
                return <RowActions can={can} actions={actions} />
            },
        },
    ]

    return (
        <>
            <DataTable
                columns={columns}
                rows={rows}
                rowKey={(row) => row.id}
                footer={footer}
                caption="足迹列表"
                busy={busy.pending}
                empty={<Empty type="search" text="没有符合条件的足迹" description="调整搜索条件，或新增一条足迹"/>}
            />
            <GalleryModal
                isOpen={preview !== null}
                onBackdropClick={() => setPreview(null)}
                onCloseButtonClick={() => setPreview(null)}
                urls={preview?.urls ?? []}
                title={preview?.address}
                dialogLabel="足迹照片预览"
                themePreset={preset}
                defaultIndex={preview?.defaultIndex ?? 0}
            />
        </>
    )
}
