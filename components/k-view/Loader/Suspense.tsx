import React from "react"
import {Skeleton} from "@/components/ui/skeleton"

export function Suspense({fallback, children, className, style}: ContainerProps & BaseComponentProps & {
    fallback?: React.ReactNode
}) {
    return (
        <React.Suspense fallback={fallback ? fallback : <Skeleton className={className} style={style}/>}>
            {children}
        </React.Suspense>
    )
}
