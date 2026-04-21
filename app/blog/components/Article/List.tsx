"use client"
import {useCallback} from "react";
import {PostWithUser} from "@/types/post";
import ScrollElement, {type ScrollElementProps} from "@/components/scroll-animation";
import Vertical from "./Vertical"
import Horizontal from "./Horizontal"

interface ArticleListProps extends BaseComponentProps {
    initialData: PostWithUser[]
    layout?: 'vertical' | 'horizontal'
    scrollAnimation?: boolean
    scrollProps?: Omit<ScrollElementProps, 'children'>
}

const ItemLayout = {
    vertical: Vertical,
    horizontal: Horizontal
}

export default function List(props: ArticleListProps) {
    const {
        layout = 'vertical', scrollAnimation = true, scrollProps, initialData, className, style
    } = props;


    const renderItem = useCallback((item: PostWithUser, i: number) => {

        const Item = ItemLayout[layout]
        if (scrollAnimation) {
            return (
                <ScrollElement
                    key={item.id}
                    viewport={{
                        once: true,
                        amount: 0.5,
                        margin: '0px 0px 0px 0px'
                    }}
                    direction={layout === 'vertical' ? 'down' : i % 2 === 0 ? 'left' : 'right'}
                    {...scrollProps}
                >
                    <Item data={item} direction={i % 2 === 0 ? 'left' : 'right'}/>
                </ScrollElement>
            )
        }


        return <Item data={item} key={item.id} direction={i % 2 === 0 ? 'left' : 'right'}/>
    }, [layout, scrollAnimation, scrollProps])


    return (
        <div className={className} style={style}>
            {
                initialData.map((item, index) => renderItem(item, index))
            }
        </div>
    )
}
