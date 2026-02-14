"use client"
import React from "react"
import {Drawer} from "@/components/k-view";

export default function Page() {

    return (
        <Drawer
            title={'写文章'}
            footer={null}
            open={true}
            direction={'right'}
            aria-hidden={open}
        >
        </Drawer>
    )
}
