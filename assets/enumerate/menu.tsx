import {BookmarkPlus, Footprints, NotebookPen, NotebookText, Settings, Star} from "lucide-react";
import React from "react";

/*个人中心导航栏*/
export const navList = [
    { label: "记录足迹", icon: <Footprints />, href: "/blog/me/footprints/edit", permission: "superAdmin" },
    { label: "添加书签", icon: <BookmarkPlus />, href: "/blog/me/bookmark/edit", permission: "superAdmin" },
    { label: "我的文章", icon: <NotebookText />, href: "/blog/me/articles" },
    { label: "我的收藏", icon: <Star />, href: "/blog/me/favorite" },
    { label: "写文章", icon: <NotebookPen />, href: "/blog/article/write" },
    { label: "设置", icon: <Settings className={"group-hover:animate-spin"} />, href: "/blog/setting" },
]
/*统计*/
export const statistics = [
    {
        title: "文章",
        key: 'totalPosts',
    },
    {
        title: "被收藏数",
        key: 'totalFavorites',
    },
    {
        title: "浏览量",
        key: 'totalPV',
    }
]
