// 服务端页面属性
interface PageSearchParams<T = Record<string, unknown>> {
    searchParams?: Promise<T>;
}

interface PageParams<T = Record<string, unknown>> {
    params?: Promise<T>;
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

// 请求返回资源
interface ApiResource<D> extends BaseResource {
    data: {
        error?: Error;
        data: D;
        count?: number;
        status: number;
        statusText: string;
    }
}

