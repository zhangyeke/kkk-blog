import type { Metadata } from "next"

import { requirePageAccess } from "@/lib/admin-guard"
import { SettingsForm } from "../SettingsForm"

export const metadata: Metadata = {title: "偏好"}
export const dynamic = "force-dynamic"

export default async function Page() {
    // 偏好页有自己的 permissionKey（page:preferences）；
    // page:settings 现在只代表「站点信息」，两者在菜单树里是两个独立菜单
    await requirePageAccess("preferences")

    return (
        <div className="mx-auto w-full max-w-[900px]">
            <section
                className="adm-rise overflow-hidden rounded-lg border"
                style={{borderColor: "var(--adm-line)", background: "var(--adm-paper-2)"}}
            >
                <SettingsForm/>
            </section>
        </div>
    )
}
