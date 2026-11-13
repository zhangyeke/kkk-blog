"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Switch } from "@/components/ui/switch"
import { updateAdminPostCategory } from "@/service/postCategory"

export function CategoryStatusSwitch({id, name, status, disabled}: {
    id: number
    name: string
    status: number
    disabled: boolean
}) {
    const router = useRouter()
    const [checked, setChecked] = useState(status === 1)
    const [pending, setPending] = useState(false)

    useEffect(() => setChecked(status === 1), [status])

    async function handleCheckedChange(next: boolean) {
        if (pending || disabled) return
        setPending(true)
        try {
            const result = await updateAdminPostCategory({id, status: next ? 1 : 0})
            if (result.code !== 200) {
                toast.error(result.message || "状态修改失败")
                return
            }
            setChecked(next)
            toast.success(next ? "分类已启用" : "分类已禁用")
            router.refresh()
        } catch {
            toast.error("状态修改失败，请稍后再试")
        } finally {
            setPending(false)
        }
    }

    return (
        <div className="flex min-h-9 items-center justify-center gap-1.5">
            <Switch
                checked={checked}
                onCheckedChange={handleCheckedChange}
                disabled={disabled || pending}
                aria-label={`${checked ? "禁用" : "启用"}分类「${name}」`}
                aria-busy={pending}
                className="data-[state=checked]:bg-[var(--adm-c3)] data-[state=unchecked]:bg-[var(--adm-line)] cursor-pointer"
            />
            {pending && <Loader2 className="size-3 animate-spin text-[var(--adm-ink-3)]" aria-hidden="true"/>}
        </div>
    )
}
