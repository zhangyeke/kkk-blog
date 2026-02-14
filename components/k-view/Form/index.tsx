"use client"
import React from "react"
import {FieldValues, useForm, UseFormHandleSubmit} from "react-hook-form";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {FormControl, FormField, FormItem, FormLabel, FormMessage, Form as ShadForm} from "@/components/ui/form";
import {Control} from "./Control";

export interface FormItem {
    prop: string;
    label?: React.ReactNode;
    control?: React.ReactNode;
    controlProps?: object;
    defaultValue?: string | number | boolean | object | unknown[];
}

export interface FormInstance<T extends FieldValues = FieldValues> {
    submit: UseFormHandleSubmit<T>,
    reset: () => void,
    resetField: (name: string) => void,
}

export interface FormProps {
    items: FormItem[]
    formResolver: ReturnType<typeof z.object>
    defaultValues?: Record<string, FormItem['defaultValue']>;
    ref?: React.Ref<FormInstance>
}

function getFormDefaultValues(items: FormItem[], defaultValues?: FormProps['defaultValues']) {
    const values: FormProps['defaultValues'] = {};
    items.forEach(item => {
        let value: FormItem['defaultValue'];
        if (item.defaultValue) {
            value = item.defaultValue
        } else {
            value = defaultValues ? defaultValues[item.prop] : undefined
        }
        values[item.prop] = value
    });

    return values
}

export function Form({items, formResolver, defaultValues, children, ref}: FormProps & ContainerProps) {

    const form = useForm({
        resolver: zodResolver(formResolver),
        defaultValues: getFormDefaultValues(items, defaultValues)
    })

    React.useImperativeHandle(ref, () => ({
        submit: form.handleSubmit,
        reset: form.reset,
        resetField: form.resetField,
    }))


    return (
        <ShadForm {...form}>
            <form className="space-y-4 px-6">
                {
                    items.map((item) => (
                        <FormField
                            key={item.prop}
                            control={form.control}
                            name={item.prop}
                            render={({field}) => {
                                console.log("这额", field,form.control)
                                return (
                                    <FormItem>
                                        <FormLabel>{item.label}</FormLabel>
                                        <FormControl>
                                            <Control type={item.control} attrs={{...item.controlProps, ...field}}/>
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )
                            }}
                        />
                    ))
                }
                {children}
            </form>
        </ShadForm>
    )
}
