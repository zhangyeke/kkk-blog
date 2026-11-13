import type { Metadata } from "next"

import { Input } from "@/components/ui/input"
import { requirePageAccess } from "@/lib/admin-guard"

export const metadata: Metadata = {title: "站点信息"}
export const dynamic = "force-dynamic"

export default async function Page() {
    await requirePageAccess("settings")

    return (
        <div className="mx-auto w-full max-w-[900px]">
            <section
                className="adm-rise overflow-hidden rounded-lg border"
                style={{borderColor: "var(--adm-line)", background: "var(--adm-paper-2)"}}
            >
                <div className="border-b px-5 py-3.5" style={{borderColor: "var(--adm-line-2)"}}>
                    <span className="adm-serif text-base md:text-lg" style={{color: "var(--adm-ink)"}}>站点信息</span>
                </div>

                <div className="flex flex-col gap-4 px-5 py-4">
                    <label className="flex flex-col gap-1.5">
                        <span className="text-sm md:text-base tracking-[0.08em]" style={{color: "var(--adm-ink-3)"}}>站点名</span>
                        <Input defaultValue="kkk 的博客" className="h-9 text-base md:text-lg"/>
                    </label>
                    <label className="flex flex-col gap-1.5">
                        <span className="text-sm md:text-base tracking-[0.08em]" style={{color: "var(--adm-ink-3)"}}>副标题</span>
                        <Input defaultValue="记录一些正在发生的事" className="h-9 text-base md:text-lg"/>
                    </label>
                    <p className="text-sm md:text-base leading-relaxed" style={{color: "var(--adm-ink-3)"}}>
                        目前只做界面，保存逻辑接入 service 后即可生效。
                    </p>
                </div>
            </section>
        </div>
    )
}
