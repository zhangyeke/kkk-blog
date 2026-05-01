"use client"
import React, {useMemo} from "react"
import {FieldValues, useForm, UseFormReturn} from "react-hook-form";
import {ZodEffects, ZodObject} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {FormControl, FormField, FormItem, FormLabel, FormMessage, Form as ShadForm} from "@/components/ui/form";
import {Control, FieldComponentsType} from "./components/Control";
import {AutoFormProps} from '@autoform/react';
import {ZodProvider} from "@autoform/zod";
import {Button} from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {CustomControlProps} from "./type";

export type FormInstance = UseFormReturn

export interface FormProps extends Partial<Omit<AutoFormProps<FieldValues>, 'onFormInit' | 'schema' | 'formComponents' | 'uiComponents'>> {
    schema: ZodEffects<ZodObject<FieldValues>> | ZodObject<FieldValues>
    formComponents?: {
        [key: string]: (props: CustomControlProps) => React.ReactNode
    }
    onSubmit?: (v: FieldValues) => void
    ref?: React.Ref<FormInstance>
}

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
    const {schema, defaultValues, withSubmit = true, formComponents,className,style, ref, children, onSubmit} = props
    const {fields} = useMemo(() => {
        const zodProvider = new ZodProvider(schema)
        return zodProvider.parseSchema()
    }, [schema])

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: fields.reduce((acc, item) => {
            // 将 item.key 作为键，根据逻辑计算对应的值
            acc[item.key] = defaultValues
                ? defaultValues[item.key]
                : getFieldDefaultValue(item.key as FieldComponentsType);

            return acc;
        }, {} as FieldValues)

    })


    React.useImperativeHandle(ref, () => form)


    return (
        <ShadForm {...form}>
            <form className={cn("space-y-4 px-6", className)} style={style}>
                {
                    fields.map((item) => (
                        <FormField
                            key={item.key}
                            control={form.control}
                            name={item.key}
                            render={({field}) => {
                                return (
                                    <FormItem>
                                        <div className={'flex'}>
                                            {item.required && <span className="text-destructive">*  </span>}
                                            <FormLabel>{item.fieldConfig?.label}</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Control
                                                formComponents={formComponents}
                                                type={item.type}
                                                attrs={{label: item.fieldConfig?.label, ...item.fieldConfig?.inputProps, ...field}}
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )
                            }}
                        />
                    ))
                }
                {children}
                {(withSubmit) && <Button type={'button'} onClick={() => {
                    form.handleSubmit((v) => {
                        if (onSubmit) onSubmit(v)
                    })()
                }}>提交</Button>}
            </form>
        </ShadForm>
    )
}
