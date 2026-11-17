import React, {useCallback, useMemo} from "react";
import {AsyncSelect} from "@/components/ui/async-select";
import { getDeepValue } from "@/lib/object"
import { isStringNumber, str2num } from "@/lib/number"
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
        if (!api) return []
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
    const {
        name,
        label,
        value,
        api,
        labelKey,
        valueKey,
        onChange,
        options: providedOptions,
        preload,
        ...selectProps
    } = props
    const options = providedOptions as Record<string, unknown>[] | undefined

    const labelKeyName = useMemo(() => (labelKey || name) as string, [labelKey, name])
    const valueKeyName = useMemo(() => (valueKey || name) as string, [valueKey, name])
    const fetcher = useCallback(
        (query?: string) => options
            ? Promise.resolve(options)
            : fetchSearch({api, query, prop: labelKeyName, primaryKey: valueKeyName}),
        [api, labelKeyName, options, valueKeyName],
    )
    const filterFn = useCallback(
        (item: Record<string, unknown>, query: string) =>
            String(getDeepValue(item, labelKeyName) ?? "").toLocaleLowerCase().includes(query.toLocaleLowerCase()),
        [labelKeyName],
    )

    return (
        <AsyncSelect<Record<string, unknown>>
            fetcher={fetcher}
            filterFn={filterFn}
            preload={options ? true : preload}
            renderOption={(item) => <DisplayLabel item={item} keyName={labelKeyName}/>}
            getOptionValue={(item) => String(getDeepValue(item, valueKeyName))}
            getDisplayValue={(item) => <DisplayLabel item={item} keyName={labelKeyName}/>}
            width="100%"
            {...selectProps}
            className={selectProps.className}
            value={String(value ?? "")}
            label={String(label || "name")}
            onChange={(nextValue) => onChange({
                target: {
                    name,
                    value: str2num(nextValue),
                },
            })}
        />
    );
}
