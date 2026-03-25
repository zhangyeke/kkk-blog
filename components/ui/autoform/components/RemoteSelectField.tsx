import React from "react";
import {AsyncSelect} from "@/components/ui/async-select";
import {AutoFormFieldProps} from "@autoform/react";
import {getDeepValue, isStringNumber, str2num} from "@/lib/utils"


interface FetchSearchParams<T> {
    api: (p?: {
        [key: string]: string | number
    }) => Promise<BaseResource<T>>
    primaryKey?: keyof T
    prop?: keyof T
    query?: string
}

// 数据请求api
const fetchSearch = async <T, >({api, query, prop, primaryKey}: FetchSearchParams<T>) => {
    try {
        const key = isStringNumber(query) ? primaryKey : prop
        if (query && key) {
            const res = await api({
                [key]: str2num(query)
            })
            return res.data;
        } else {
            const res = await api()
            return res.data;
        }
    } catch (error) {
        console.log("远程下拉框请求失败", error)
        return []
    }

};


function DisplayLabel<T>({item, keyName}: { item: T, keyName: string }) {
    return <div className="font-medium">{String(getDeepValue(item, keyName))}</div>
}


export function RemoteSelect({inputProps, field, error, value}: AutoFormFieldProps) {
    const {name, key, api, labelKey, valueKey, onChange, ...props} = inputProps
    const {fieldConfig} = field;
    return (
        <>
            <AsyncSelect
                triggerClassName={error ? "border-destructive" : ""}
                fetcher={(query) => fetchSearch({api, query, prop: labelKey, primaryKey: valueKey})}
                renderOption={(item) => (
                    <DisplayLabel item={item} keyName={labelKey || name}/>
                )}
                getOptionValue={(item) => String(getDeepValue(item, valueKey || name))}
                getDisplayValue={(item) => (
                    <DisplayLabel item={item} keyName={labelKey || name}/>
                )}
                notFound={<div className="py-6 text-center text-sm">No users found</div>}
                width={'375px'}
                {...props}
                value={String(value)}
                label={fieldConfig?.label || 'name'}
                onChange={(v) => onChange({
                    target: {
                        name,
                        value: str2num(v)
                    }
                })}
            />
        </>

    );
}
