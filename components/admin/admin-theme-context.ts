"use client"

import { createContext } from "react"

import type { AdminPresetId } from "@/assets/enumerate/global"

export const AdminThemeContext = createContext<{
    preset: AdminPresetId
    setPreset: (preset: AdminPresetId) => void
} | null>(null)
