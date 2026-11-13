"use client"

import React from "react"
import { Locate } from "lucide-react"
import { toast } from "sonner"
import { useFormContext } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { geocodeFootprintAddress } from "@/service/amap-geocode"
import type { CustomControlProps } from "../type"

type CoordinatesValue = {
  lng: string
  lat: string
}

function readCoordinates(value: unknown): CoordinatesValue {
  if (typeof value !== "object" || value === null) {
    return { lng: "", lat: "" }
  }

  const coordinates = value as Partial<CoordinatesValue>
  return {
    lng: typeof coordinates.lng === "string" ? coordinates.lng : "",
    lat: typeof coordinates.lat === "string" ? coordinates.lat : "",
  }
}

export function GeoCoordinatesField({
  value,
  onChange,
  ref,
  name,
  id,
  disabled,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
}: CustomControlProps) {
  const { getValues } = useFormContext()
  const coordinates = readCoordinates(value)
  const [locating, setLocating] = React.useState(false)

  function handleLongitudeChange(event: React.ChangeEvent<HTMLInputElement>) {
    onChange({ ...coordinates, lng: event.currentTarget.value })
  }

  function handleLatitudeChange(event: React.ChangeEvent<HTMLInputElement>) {
    onChange({ ...coordinates, lat: event.currentTarget.value })
  }

  async function handleGetCoordinates() {
    const address = String(getValues("address") ?? "").trim()
    const regionCode: unknown = getValues("regionCode")

    if (!address) {
      toast.error("请先填写详细地点")
      return
    }
    if (!Array.isArray(regionCode) || regionCode.length < 2) {
      toast.error("请先选择省和市")
      return
    }

    setLocating(true)
    try {
      const result = await geocodeFootprintAddress({ address, regionCode })
      if (
        result.code !== 200 ||
        !result.data ||
        typeof result.data.lng !== "number" ||
        typeof result.data.lat !== "number"
      ) {
        toast.error(result.message || "地点坐标获取失败")
        return
      }

      onChange({
        lng: result.data.lng.toFixed(6),
        lat: result.data.lat.toFixed(6),
      })
      toast.success("已根据地点获取坐标")
    } catch {
      toast.error("地点坐标获取失败，请稍后重试")
    } finally {
      setLocating(false)
    }
  }

  return (
    <div role="group" aria-label="经纬度" aria-invalid={invalid} className="flex min-w-0 items-center gap-2">
      <Input
        ref={ref}
        id={id}
        name={name ? `${name}.lng` : undefined}
        type="number"
        inputMode="decimal"
        step="any"
        min={-180}
        max={180}
        placeholder="经度"
        aria-label="经度"
        aria-describedby={describedBy}
        aria-invalid={invalid}
        value={coordinates.lng}
        onChange={handleLongitudeChange}
        disabled={disabled || locating}
        className="min-w-0"
      />
      <Input
        id={id ? `${id}-latitude` : undefined}
        name={name ? `${name}.lat` : undefined}
        type="number"
        inputMode="decimal"
        step="any"
        min={-90}
        max={90}
        placeholder="纬度"
        aria-label="纬度"
        aria-describedby={describedBy}
        aria-invalid={invalid}
        value={coordinates.lat}
        onChange={handleLatitudeChange}
        disabled={disabled || locating}
        className="min-w-0"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        loading={locating}
        disabled={disabled || locating}
        onClick={handleGetCoordinates}
        aria-label="根据地点获取经纬度"
        className="shrink-0"
      >
        <Locate aria-hidden="true" />
        {locating ? "查询中…" : "获取"}
      </Button>
    </div>
  )
}
