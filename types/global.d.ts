/* eslint-disable @typescript-eslint/no-explicit-any */

// 服务端页面属性
interface PageSearchParams<T = Record<string, unknown>> {
    searchParams: Promise<T>;
}

interface PageParams<T = Record<string, unknown>> {
    params: Promise<T>;
}

// 页面容器
interface ContainerProps {
    children: React.ReactNode;
}


// 插槽
type Slots<T extends string> = {
    [K in T]: React.ReactNode
}
// 请求方式
type RequestMethod = "GET" | "POST" | "PUT" | "OPTIONS" | "DELETE" | "PATCH" | "HEAD"

type BaseComponentProps = {
    className?: string;
    style?: React.CSSProperties;
}

interface BaseResource<D = unknown> {
    code: number;
    message: string;
    data: D
}

interface Paging {
    page: number;
    pageSize: number
}

/* 自定义css变量 并包含基础的css样式*/
interface StyleProperties extends React.CSSProperties {
    [key: string]: string
}

type AnyObject = Record<string, any>

type EventValue<T> = {
    target: {
        value: T
    }
}