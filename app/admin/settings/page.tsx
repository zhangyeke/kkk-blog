import type { Metadata } from "next"

import { SettingsWorkbench } from "@/app/admin/settings/SettingsWorkbench"
import { requirePageAccess } from "@/lib/admin/guard"
import { getAdminSettingsSnapshot } from "@/lib/admin/settings-store"

export const metadata: Metadata = {title: "后台设置"}
export const dynamic = "force-dynamic"

export default async function Page() {
    await requirePageAccess("settings")
    const groups = await getAdminSettingsSnapshot()

    return <SettingsWorkbench groups={groups}/>
}
