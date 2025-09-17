import React from "react"
import {Skeleton} from "@/components/ui/skeleton"

export default async function Suspense({children, className, style}: ContainerProps & BaseComponentProps) {

    return (
        <React.Suspense fallback={<Skeleton  className={className} style={style}/>}>
            {children}
        </React.Suspense>
    )
}
