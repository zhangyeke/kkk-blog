// 服务端页面属性
interface PageParams<Params = Record<string, unknown>, SearchParams = Record<string, unknown>> {
    params: Promise<Params>;
    searchParams?: Promise<SearchParams>;
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


// 请求返回资源
type ApiResource<D = unknown> = {
    code: number;
    message: string;
    data: {
        error?: Error;
        data: D;
        count?: number;
        status: number;
        statusText: string;
    }

}