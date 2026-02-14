"use client"
import React from "react"
import {Input} from "@/components/ui/input";

export interface ControlProps {
    type?: 'input' | React.ReactNode;
    attrs?: object;
}

export function Control(props: ControlProps) {
    const {type = 'input', attrs} = props;
    switch (type) {
        case 'input': {
            return <Input  {...attrs}/>
        }
        default: {
            return type
        }
    }
}
