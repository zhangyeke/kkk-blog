// 服务端页面属性
interface PageParams<Params = Record<string, any>, SearchParams = Record<string, any>> {
    params: Promise<Params>;
    searchParams?: Promise<SearchParams>;
}

// 页面容器
interface ContainerProps {
    children: React.ReactNode;
}

type Slots<T extends string> = {
    [K in T]: React.ReactNode
}
type RequestMethod = "GET" | "POST" | "PUT" | "OPTIONS" |"DELETE" | "PATCH" | "HEAD"
