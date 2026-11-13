"use client"

import React, { type ComponentProps, type ReactNode } from "react"
import type { DefaultValues, FieldValues } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Form, type FormProps } from "@/components/k-view/Form"
import { FooterButtons } from "@/components/k-view/Popup/FooterButtons"
import { Spinner } from "@/components/k-view/Loader/Spinner"
import type { FormSchema } from "@/components/k-view/Form"

import { useCustomFormSubmit } from "@/hooks/useAutoFormSubmit"

type AdminFormSave<TValues extends FieldValues> = (values: TValues) => Promise<BaseResource<unknown>>
type AdminButtonVariant = ComponentProps<typeof Button>["variant"]

type AdminFormFieldsProps<TValues extends FieldValues> = {
  schema: FormSchema
  defaultValues?: DefaultValues<TValues>
  save: AdminFormSave<TValues>
  formComponents?: FormProps["formComponents"]
  submitParams?: FieldValues
  onCancel: () => void
  onSuccess?: (result: BaseResource<unknown>) => void
  successMessage?: string
  cancelLabel?: string
  submitLabel?: string
  pendingLabel?: string
  submitDisabled?: boolean
  submitTestId?: string
  cancelVariant?: AdminButtonVariant
  submitVariant?: AdminButtonVariant
  className?: string
  fieldsClassName?: string
  footerClassName?: string
  notice?: ReactNode
}

type AdminFormLoadProps<TRecord> = {
  load: () => Promise<BaseResource<TRecord>>
  render: (record: TRecord) => ReactNode
  onLoadError?: (error: unknown) => void
  loadingLabel?: string
  loadingFallback?: ReactNode
}

export type AdminFormProps<TValues extends FieldValues = FieldValues, TRecord = unknown> =
  | AdminFormFieldsProps<TValues>
  | AdminFormLoadProps<TRecord>

/** Shared dialog form shell for admin CRUD forms, with an async-content mode for editors that load a record first. */
export function AdminForm<TValues extends FieldValues = FieldValues, TRecord = unknown>(
  props: AdminFormProps<TValues, TRecord>
) {
  if ("load" in props) {
    return (
      <AdminFormLoader
        load={props.load}
        render={props.render}
        onLoadError={props.onLoadError}
        loadingLabel={props.loadingLabel}
        loadingFallback={props.loadingFallback}
      />
    )
  }

  return <AdminFormFields {...props} />
}

function AdminFormFields<TValues extends FieldValues>({
  schema,
  defaultValues,
  save,
  formComponents,
  submitParams,
  onCancel,
  onSuccess,
  successMessage = "保存成功",
  cancelLabel = "取消",
  submitLabel = "确定",
  pendingLabel,
  submitDisabled = false,
  submitTestId,
  cancelVariant = "outline",
  submitVariant,
  className = "flex min-w-0 flex-col space-y-0 px-0",
  fieldsClassName = "max-h-[min(70vh,calc(100dvh-8rem))] space-y-3 overflow-y-auto px-4 py-4 sm:px-5",
  footerClassName = "shrink-0 border-t border-[var(--adm-line)] px-5 py-3",
  notice,
}: AdminFormFieldsProps<TValues>) {
  const handleSuccess = React.useCallback(
    (result: BaseResource<unknown>) => {
      toast.success(result.message || successMessage)
      onSuccess?.(result)
    },
    [onSuccess, successMessage]
  )
  const submitOptions = React.useMemo(
    () => ({ isResetForm: true, submitSuccessAction: handleSuccess }),
    [handleSuccess]
  )
  const { formInstance, onSubmit, pending } = useCustomFormSubmit(save, submitOptions)

  function handleSubmitClick() {
    onSubmit(submitParams)
  }

  return (
    <Form
      ref={formInstance}
      schema={schema}
      defaultValues={defaultValues}
      formComponents={formComponents}
      withSubmit={false}
      className={className}
      fieldsClassName={fieldsClassName}
    >
      {notice && (
        <div className="px-5 pb-3 text-xs" style={{ color: "var(--adm-ink-3)" }}>
          {notice}
        </div>
      )}
      <FooterButtons className={footerClassName}>
        <Button type="button" variant={cancelVariant} onClick={onCancel} disabled={pending}>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={submitVariant}
          onClick={handleSubmitClick}
          loading={pending}
          disabled={submitDisabled}
          data-testid={submitTestId}
        >
          {pending ? pendingLabel ?? submitLabel : submitLabel}
        </Button>
      </FooterButtons>
    </Form>
  )
}

function AdminFormLoader<TRecord>({
  load,
  render,
  onLoadError,
  loadingLabel = "正在加载表单",
  loadingFallback,
}: AdminFormLoadProps<TRecord>) {
  const [record, setRecord] = React.useState<{ value: TRecord } | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let active = true
    setLoading(true)
    setRecord(null)

    async function loadRecord() {
      try {
        const result = await load()
        if (result.code !== 200) throw new Error(result.message || "加载失败")
        if (active) setRecord({ value: result.data })
      } catch (error) {
        if (!active) return
        if (onLoadError) onLoadError(error)
        else toast.error(error instanceof Error ? error.message : "表单加载失败")
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadRecord()
    return () => {
      active = false
    }
  }, [load, onLoadError])

  if (loading) {
    return loadingFallback ?? <Spinner text={loadingLabel} />
  }

  return record ? render(record.value) : null
}
