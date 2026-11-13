"use client"

import { createContext } from "react"

import type { AdminPresetId } from "@/lib/admin-presets"

export const AdminThemeContext = createContext<{
    preset: AdminPresetId
    setPreset: (preset: AdminPresetId) => void
} | null>(null)
