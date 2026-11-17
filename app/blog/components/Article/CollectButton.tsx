"use client"
import React from "react"
import {Star} from "lucide-react";
import { LikeButton, type LikeButtonProps } from "@/components/k-view/LikeButton";
import {updatePostFavorite} from "@/service/postFavorite"
import {responseAsyncHandle} from "@/lib/action-response";

type CollectButtonProps = Pick<LikeButtonProps, 'defaultValue' | 'initialCount'> & BaseComponentProps & {
    postId: number
}

export function CollectButton({postId, ...props}: CollectButtonProps) {

    const handleCollectChange = React.useCallback(() => {
        return responseAsyncHandle(updatePostFavorite(postId))
    }, [postId])

    return (
        <LikeButton
            {...props}
            icon={Star}
            activeClassName={'text-yellow-300 fill-yellow-300'}
            particlesClassName={'bg-yellow-300'}
            onChange={handleCollectChange}
        />
    )
}
