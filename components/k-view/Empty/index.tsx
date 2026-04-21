import {Image} from "@/components/k-view/Image"
import {cn} from "@/lib/utils";

const placeholderImages = [
    {name: "address", path: "/images/placeholder/address.png", tips: "暂无地址"},
    {name: "auth", path: "/images/placeholder/auth.png", tips: "暂无权限"},
    {name: "car", path: "/images/placeholder/car.png", tips: "暂无购物车"},
    {name: "collect", path: "/images/placeholder/collect.png", tips: "暂无收藏商品"},
    {name: "coupon", path: "/images/placeholder/coupon.png", tips: "暂无优惠券"},
    {name: "data", path: "/images/placeholder/data.png", tips: "暂无数据"},
    {name: "history", path: "/images/placeholder/history.png", tips: "暂无历史记录"},
    {name: "imageError", path: "/images/placeholder/image_error.png", tips: "暂无图片数据"},
    {name: "imagePlaceholder", path: "/images/placeholder/image_placeholder.png", tips: "暂无图片数据"},
    {name: "list", path: "/images/placeholder/list.png", tips: "暂无列表数据"},
    {name: "msg", path: "/images/placeholder/msg.png", tips: "暂无消息"},
    {name: "news", path: "/images/placeholder/news.png", tips: "暂无新闻"},
    {name: "order", path: "/images/placeholder/order.png", tips: "暂无订单数据"},
    {name: "page", path: "/images/placeholder/page.png", tips: "暂无页面数据"},
    {name: "review", path: "/images/placeholder/review.png", tips: "暂无评论数据"},
    {name: "search", path: "/images/placeholder/search.png", tips: "暂无搜索数据"},
    {name: "wifi", path: "/images/placeholder/wifi.png", tips: "暂无wifi数据"}
];

export type EmptyType =
    | "address"
    | "auth"
    | "car"
    | "collect"
    | "coupon"
    | "data"
    | "history"
    | "imageError"
    | "imagePlaceholder"
    | "list"
    | "msg"
    | "news"
    | "order"
    | "page"
    | "review"
    | "search"
    | "wifi"

export type EmptyProps = {
    type?: EmptyType;
    text?: string;
    imageClass?: string;
} & BaseComponentProps & Partial<ContainerProps>

export function Empty({type = 'data', text, children, className, imageClass, style}: EmptyProps) {
    const index = placeholderImages.findIndex(item => item.name === type)
    const item = placeholderImages[index]
    return (
        <div style={style} className={cn('flex-center flex-col gap-y-2 text-sm text-gray-500 py-5', className)}>
            {children ? children : <Image src={item?.path} alt={type} className={cn('size-[150px]', imageClass)}/>}
            {children ? undefined : text || item?.tips}
        </div>
    )
}