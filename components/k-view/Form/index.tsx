"use client"
import React, { useMemo } from "react"
import { FieldValues, useForm, UseFormReturn, useWatch } from "react-hook-form"
import { ZodEffects, ZodObject } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form as ShadForm,
} from "@/components/ui/form"
import { Control, FieldComponentsType } from "./components/Control"
import type { AutoFormFieldProps, AutoFormProps } from "@autoform/react"
import { ZodProvider } from "@autoform/zod"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/ui/cn"
import { CustomControlProps } from "./type"

export type FormInstance = UseFormReturn
export type FormFieldConfig = AutoFormFieldProps["field"]
export type FormSchema = ZodEffects<ZodObject<FieldValues>> | ZodObject<FieldValues>

const EMPTY_WATCH_FIELDS: string[] = []

type FormSharedProps = Partial<
  Omit<AutoFormProps<FieldValues>, "onFormInit" | "schema" | "formComponents" | "uiComponents">
> & {
  formComponents?: {
    [key: string]: (props: CustomControlProps) => React.ReactNode
  }
  onSubmit?: (v: FieldValues) => void | Promise<void>
  onFormSubmit?: React.FormEventHandler<HTMLFormElement>
  ref?: React.Ref<FormInstance>
  fieldsClassName?: string
  fieldClassName?: (name: string, values: FieldValues) => string | undefined
  fieldHidden?: (name: string, values: FieldValues) => boolean
  fieldHiddenClassName?: string
  fieldDisabled?: (name: string, values: FieldValues) => boolean
  watchFields?: string[]
  labelClassName?: string
}

export type FormProps = FormSharedProps &
  ({ schema: FormSchema; fields?: FormFieldConfig[] } | { schema?: undefined; fields: FormFieldConfig[] })

// export type DefaultValues<T extends FieldValues> = FormProps<T>['defaultValues']

function getFieldDefaultValue(key: FieldComponentsType) {
  switch (key) {
    /*        case 'dateRange':{
            return []
        }*/
    default: {
      return ""
    }
  }
}

export function Form(props: FormProps & BaseComponentProps) {
  const {
    schema,
    defaultValues,
    withSubmit = true,
    formComponents,
    className,
    fieldsClassName,
    fieldClassName,
    fieldHidden,
    fieldHiddenClassName,
    fieldDisabled,
    watchFields = EMPTY_WATCH_FIELDS,
    labelClassName,
    onFormSubmit,
    style,
    ref,
    children,
    onSubmit,
    fields: configuredFields,
  } = props
  const fields = useMemo(() => {
    if (configuredFields) return configuredFields
    if (!schema) throw new Error("Form requires either a schema or a fields configuration")

    let fieldSchema = schema
    while (fieldSchema instanceof ZodEffects) {
      fieldSchema = fieldSchema.innerType() as FormSchema
    }

    const zodProvider = new ZodProvider(fieldSchema)
    return zodProvider.parseSchema().fields
  }, [configuredFields, schema])

  const form = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues: fields.reduce((acc, item) => {
      // 将 item.key 作为键，根据逻辑计算对应的值
      acc[item.key] = defaultValues ? defaultValues[item.key] : getFieldDefaultValue(item.key as FieldComponentsType)

      return acc
    }, {} as FieldValues),
  })
  // Subscribe only to fields that affect other fields. Most forms need no
  // whole-form subscription, which avoids rerendering every field per keystroke.
  useWatch({ control: form.control, name: watchFields })
  const values = form.getValues() as FieldValues

  React.useImperativeHandle(ref, () => form)

  const formFields = fields.map((item) => {
    const hidden = fieldHidden?.(item.key, values) ?? false

    return (
      <FormField
        key={item.key}
        control={form.control}
        name={item.key}
        render={({ field }) => (
          <FormItem
            className={cn(hidden && fieldHiddenClassName, fieldClassName?.(item.key, values))}
            aria-hidden={hidden || undefined}
            inert={hidden || undefined}
          >
            <div className="flex">
              {item.required && <span className="text-destructive">* </span>}
              <FormLabel className={labelClassName}>{item.fieldConfig?.label}</FormLabel>
            </div>
            <FormControl>
              <Control
                formComponents={formComponents}
                type={item.type}
                attrs={{
                  label: item.fieldConfig?.label,
                  ...item.fieldConfig?.inputProps,
                  ...field,
                  disabled: fieldDisabled?.(item.key, values) ?? item.fieldConfig?.inputProps?.disabled,
                }}
              />
            </FormControl>
            {item.fieldConfig?.description && <FormDescription>{item.fieldConfig.description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    )
  })

  const handleSubmitClick = () => {
    if (onSubmit) void form.handleSubmit(onSubmit)()
  }

  const handleFormSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    if (onSubmit) {
      event.preventDefault()
      void form.handleSubmit(onSubmit)()
      return
    }
    if (onFormSubmit) {
      onFormSubmit(event)
      return
    }
    event.preventDefault()
  }

  return (
    <ShadForm {...form}>
      <form className={cn("px-6", className)} style={style} onSubmit={handleFormSubmit}>
        <div className={cn("flex flex-col space-y-4", fieldsClassName)}>{formFields}</div>
        {children}
        {withSubmit && (
          <Button type="button" onClick={handleSubmitClick}>
            提交
          </Button>
        )}
      </form>
    </ShadForm>
  )
}
