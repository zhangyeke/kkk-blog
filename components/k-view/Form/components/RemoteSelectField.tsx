import React, {useMemo} from "react";
import {AsyncSelect} from "@/components/ui/async-select";
import {getDeepValue, isStringNumber, str2num} from "@/lib/utils"
import {CustomControlProps} from "../type";

export interface FetchSearchParams<T> {
    api?: (p?: {
        [key: string]: string | number
    }) => Promise<BaseResource<T>>
    primaryKey?: keyof T
    prop?: keyof T
    query?: string
}

// 数据请求api
const fetchSearch = async <T, >({api, query, prop, primaryKey}: FetchSearchParams<T>) => {
    try {
        if (!api) return
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


export function RemoteSelect(props: CustomControlProps) {
    const {name, label, value, api, labelKey, valueKey, onChange} = props

    const labelKeyName = useMemo(() => (labelKey || name) as string, [labelKey, name])
    const valueKeyName = useMemo(() => (valueKey || name) as string, [valueKey, name])
    // triggerClassName={error ? "border-destructive" : ""}
    return (
        <>
            <AsyncSelect
                fetcher={(query) => fetchSearch({api, query, prop: labelKeyName, primaryKey: valueKeyName})}
                renderOption={(item) => (
                    <DisplayLabel item={item} keyName={labelKeyName}/>
                )}
                getOptionValue={(item) => String(getDeepValue(item, valueKeyName))}
                getDisplayValue={(item) => (
                    <DisplayLabel item={item} keyName={labelKeyName}/>
                )}
                width={'375px'}
                {...props}
                value={String(value)}
                label={String(label || 'name')}
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
