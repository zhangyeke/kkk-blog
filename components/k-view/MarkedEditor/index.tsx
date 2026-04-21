"use client"
import React from "react";
import dynamic from "next/dynamic";
import {Skeleton} from "@/components/ui/skeleton";

// 1. 动态引入，禁用 SSR
export const AsyncMarkedEditor = dynamic(() => import('./MarkedEditor'), {
    ssr: false,
    loading: () => <Skeleton className="w-full h-100"/>
})

export {default as MarkedEditor} from "./MarkedEditor"