"use client"

import React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, useReducedMotion } from "motion/react"
import { ChevronDown, RotateCcw, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/ui/cn"
import { Form, type FormFieldConfig, type FormInstance } from "../Form"
import { useTableBusy } from "../DataTable/busy"

/** 兼容旧类型名；筛选项直接采用 Form 的字段配置格式。 */
export type FilterField = FormFieldConfig

export type FilterFormProps = {
  fields: FormFieldConfig[]
  /** 提交目标路径，如 /admin/posts */
  basePath: string
  /** 超过几个字段开始折叠 */
  visibleCount?: number
  className?: string
}

function getEmptyFieldValue(field: FormFieldConfig) {
  return field.type === "regionCascader" ? [] : ""
}

function getSearchParamValue(field: FormFieldConfig, value: string | null) {
  if (field.type === "regionCascader") return value?.split(",").filter(Boolean) ?? []
  return value ?? ""
}

function hasFilterValue(value: unknown) {
  if (Array.isArray(value)) return value.length > 0
  return Boolean(value)
}

export function FilterForm({ fields, basePath, visibleCount = 5, className }: FilterFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reduce = useReducedMotion()
  const busy = useTableBusy()
  const formRef = React.useRef<FormInstance>(null)
  const [expanded, setExpanded] = React.useState(false)
  const defaultValues = React.useMemo(
    () => Object.fromEntries(fields.map((field) => [field.key, getSearchParamValue(field, searchParams.get(field.key))])),
    [fields, searchParams]
  )
  const [hasActive, setHasActive] = React.useState(() => Object.values(defaultValues).some(hasFilterValue))
  const extraFieldNames = React.useMemo(
    () => new Set(fields.slice(visibleCount).map((field) => field.key)),
    [fields, visibleCount]
  )
  const firstExtraFieldName = fields[visibleCount]?.key

  // 路由前进、后退或外部筛选变化时，让表单显示 URL 中的值。
  React.useEffect(() => {
    const form = formRef.current
    if (!form) return

    form.reset(defaultValues)
    setHasActive(Object.values(defaultValues).some(hasFilterValue))
  }, [defaultValues])

  // FilterForm 只订阅一个派生布尔值，避免复制整份输入值到组件 state。
  React.useEffect(() => {
    const form = formRef.current
    if (!form) return

    const subscription = form.watch((values) => {
      setHasActive(fields.some((field) => hasFilterValue(values[field.key])))
    })

    return () => subscription.unsubscribe()
  }, [fields])

  const buildHref = (values: Record<string, unknown>) => {
    const params = new URLSearchParams()
    for (const field of fields) {
      const value = values[field.key]
      if (typeof value === "string" && value) params.set(field.key, value)
      if (Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string")) {
        params.set(field.key, value.join(","))
      }
    }

    const query = params.toString()
    return query ? `${basePath}?${query}` : basePath
  }

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    const values = formRef.current?.getValues() ?? {}
    busy.run(() => router.push(buildHref(values), { scroll: false }))
  }

  const handleReset = () => {
    const emptyValues = Object.fromEntries(fields.map((field) => [field.key, getEmptyFieldValue(field)]))
    formRef.current?.reset(emptyValues)
    setHasActive(false)
    busy.run(() => router.push(basePath, { scroll: false }))
  }

  const handleToggleExpanded = () => setExpanded((current) => !current)

  return (
    <Form
      ref={formRef}
      fields={fields}
      defaultValues={defaultValues}
      withSubmit={false}
      onFormSubmit={handleSubmit}
      fieldsClassName="contents space-y-0"
      fieldHidden={(name) => extraFieldNames.has(name) && !expanded}
      fieldClassName={(name) => {
        const isExtra = extraFieldNames.has(name)
        const isCollapsed = isExtra && !expanded

        return cn(
          "order-0 flex min-w-0 flex-col gap-1 sm:w-auto",
          isExtra &&
            "order-2 w-full overflow-hidden transition-[max-height,width,opacity] duration-200 motion-reduce:transition-none sm:w-auto",
          isExtra && expanded && "max-h-20 opacity-100",
          isExtra && name === firstExtraFieldName && expanded && "basis-full",
          isCollapsed && "pointer-events-none h-0 min-h-0 w-0 min-w-0 max-h-0 opacity-0"
        )
      }}
      labelClassName="text-xs tracking-[0.12em] text-[var(--adm-ink-3)] md:text-sm"
      className={cn("flex flex-wrap items-end gap-2.5 space-y-0 rounded-lg border p-2.5", className)}
      style={{ borderColor: "var(--adm-line)", background: "var(--adm-paper-2)" }}
    >
      <div className="order-1 flex w-full items-end gap-1.5 sm:ml-auto sm:w-auto">
        {extraFieldNames.size > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleToggleExpanded}
            aria-expanded={expanded}
            className="h-8 flex-1 gap-1 px-2 text-sm sm:flex-none md:text-base"
            style={{ color: "var(--adm-ink-2)" }}
          >
            {expanded ? "收起" : "更多"}
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: reduce ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="grid place-items-center"
            >
              <ChevronDown className="size-3.5" />
            </motion.span>
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={!hasActive}
          className="h-8 flex-1 gap-1 px-2.5 text-sm sm:flex-none md:text-base"
          style={{ color: "var(--adm-ink-2)" }}
        >
          <RotateCcw className="size-3.5" />
          重置
        </Button>

        <Button type="submit" size="sm" className="h-8 flex-1 gap-1 px-3 text-sm sm:flex-none md:text-base">
          <Search className="size-3.5" />
          搜索
        </Button>
      </div>
    </Form>
  )
}
