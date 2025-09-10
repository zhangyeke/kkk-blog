import React from "react"
import Spinner from "./Spinner"

export default async function Suspense({children}:ContainerProps) {

    return (
        <React.Suspense fallback={<Spinner/>}>
            {children}
        </React.Suspense>
    )
}
