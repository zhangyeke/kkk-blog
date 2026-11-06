"use client"

import { useAppStore } from "@/hooks"
import { useShallow } from "zustand/react/shallow"
import {
  type BuiltInFallingPattern,
  clampFallingDensity,
  clampFallingSpeed,
  type FallingDirection,
  fallingDirections,
  type FallingPattern,
  fallingPatterns,
  fallingSeasons,
  fallingSizeLimits,
  fallingSpeed,
  isFallingSeason,
} from "@/lib/falling-patterns"
import { ImageUpload } from "@/components/ui/image-upload"
import { FallingGlyph } from "./FallingGlyph"
import { Input } from "@/components/ui/input"
import { Dialog } from "@/components/k-view/Popup/Dialog"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function FallingSettings() {
  const {
    fallingEnabled,
    fallingPattern: pattern,
    fallingImage: image,
    fallingSizes: sizes,
    fallingDensity: density,
    fallingSpeed: speed,
    fallingDirection: direction,
    setFallingDirection: setDirection,
    setFallingPattern: setPattern,
    setFallingImage: setImage,
    setFallingSizes: setSizes,
    setFallingDensity: setDensity,
    setFallingSpeed: setSpeed,
  } = useAppStore(useShallow((state) => ({
    fallingEnabled: state.fallingEnabled,
    fallingPattern: state.fallingPattern,
    fallingImage: state.fallingImage,
    fallingSizes: state.fallingSizes,
    fallingDensity: state.fallingDensity,
    fallingSpeed: state.fallingSpeed,
    fallingDirection: state.fallingDirection,
    setFallingDirection: state.setFallingDirection,
    setFallingPattern: state.setFallingPattern,
    setFallingImage: state.setFallingImage,
    setFallingSizes: state.setFallingSizes,
    setFallingDensity: state.setFallingDensity,
    setFallingSpeed: state.setFallingSpeed,
  })))
  const selection = fallingEnabled ? pattern : "none"
  const preview = selection === "none" ? "无" : selection === "image" ? "自定义"
    : isFallingSeason(selection) ? fallingSeasons[selection].label : fallingPatterns[selection].label

  return (
    <Dialog
      title="全局飘落"
      description="选择图案或四季预设，方向、大小、密度和速度即时生效。"
      footer={null}
      contentClassName="z-[1003] max-h-[85dvh] w-[calc(100%-2rem)] max-w-md min-w-0 gap-0 overflow-y-auto motion-reduce:animate-none sm:max-w-md"
      contentProps={{ overlayClassName: "z-[1002]", "data-vaul-no-drag": true }}
      trigger={
        <button
          type="button"
          aria-label={`设置全局飘落，当前图案：${preview}`}
          className="text-muted-foreground focus-visible:outline-ring flex items-center gap-2 rounded-sm focus-visible:outline-2 cursor-pointer"
        >
          {selection === "image" && image && (
            // eslint-disable-next-line @next/next/no-img-element -- User-uploaded images are loaded directly.
            <img src={image} alt="" referrerPolicy="no-referrer" className="size-6 rounded object-contain" />
          )}
          {selection !== "none" && selection !== "image" && (
            <FallingGlyph
              pattern={isFallingSeason(selection) ? fallingSeasons[selection].patterns[0] : selection}
              className="size-5 shrink-0"
            />
          )}
          {preview}
        </button>
      }
    >
      <div className="grid gap-5 px-6 py-5">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
          <label htmlFor="falling-pattern" className="text-sm">
            飘落图案
          </label>
          <Select value={selection} onValueChange={(value) => setPattern(value as FallingPattern)}>
            <SelectTrigger id="falling-pattern" className="w-full data-[size=default]:h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className="z-1004">
              <SelectItem value="none">无</SelectItem>
              <SelectItem value="image">自定义</SelectItem>

              <SelectGroup>
                <SelectLabel>单独图案</SelectLabel>
                {Object.entries(fallingPatterns).map(([key, option]) => (
                  <SelectItem key={key} value={key}>
                    <FallingGlyph pattern={key as BuiltInFallingPattern} className="size-4 shrink-0" />
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>四季预设</SelectLabel>
                {Object.entries(fallingSeasons).map(([key, option]) => (
                  <SelectItem key={key} value={key}>
                    <FallingGlyph pattern={option.patterns[0]} className="size-4 shrink-0" />
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        {selection !== "none" && (
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
            <span className="whitespace-nowrap text-sm">飘落方向</span>
            <RadioGroup
              aria-label="飘落方向"
              orientation="horizontal"
              className="grid-cols-4 gap-1.5"
              value={direction ?? "down"}
              onValueChange={(value) => setDirection(value as FallingDirection)}
            >
              {Object.entries(fallingDirections).map(([key, label]) => (
                <RadioGroupItem
                  key={key}
                  value={key}
                  className="flex aspect-auto size-auto h-8 w-full min-w-0 cursor-pointer items-center justify-center rounded-md bg-background text-sm text-foreground data-[state=checked]:border-primary data-[state=checked]:bg-primary/15"
                >
                  {label}
                </RadioGroupItem>
              ))}
            </RadioGroup>
          </div>
        )}
        {selection !== "none" && (
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="falling-density" className="text-sm">
              图案密度
            </label>
            <Input
              id="falling-density"
              type="number"
              min={1}
              max={10}
              step={1}
              className="w-24"
              defaultValue={density}
              onChange={(event) => {
                const value = event.currentTarget.valueAsNumber
                if (Number.isInteger(value) && value >= 1 && value <= 10) setDensity(value)
              }}
              onBlur={(event) => {
                const value = event.currentTarget.valueAsNumber
                const next = Number.isFinite(value) ? clampFallingDensity(value) : density
                event.currentTarget.value = String(next)
                setDensity(next)
              }}
            />
          </div>
        )}
        {selection !== "none" && (
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="falling-speed" className="text-sm">
              飘落速度
            </label>
            <div className="relative w-24">
              <Input
                id="falling-speed"
                type="number"
                min={fallingSpeed.min}
                max={fallingSpeed.max}
                step={fallingSpeed.step}
                aria-label="飘落速度（倍速）"
                className="pr-8"
                defaultValue={clampFallingSpeed(speed)}
                onChange={(event) => {
                  const value = event.currentTarget.valueAsNumber
                  if (value >= fallingSpeed.min && value <= fallingSpeed.max) setSpeed(clampFallingSpeed(value))
                }}
                onBlur={(event) => {
                  const value = event.currentTarget.valueAsNumber
                  const next = clampFallingSpeed(Number.isFinite(value) ? value : speed)
                  event.currentTarget.value = String(next)
                  setSpeed(next)
                }}
              />
              <span aria-hidden="true" className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">
                ×
              </span>
            </div>
          </div>
        )}
        {selection !== "none" && (
          <div className="space-y-1" data-vaul-no-drag>
            <div className="flex justify-between gap-2 text-sm">
              <span>图案大小</span>
              <output className="tabular-nums">
                {sizes[0]}–{sizes[1]} px
              </output>
            </div>
            <Slider
              min={fallingSizeLimits.min}
              max={fallingSizeLimits.max}
              value={sizes}
              thumbLabels={["最小图案大小", "最大图案大小"]}
              onValueChange={([min, max]) => {
                if (min !== undefined && max !== undefined) setSizes([min, max])
              }}
            />
          </div>
        )}
        {selection === "image" && (
          <ImageUpload
            className="max-w-none space-y-3 p-3"
            value={image}
            onUpload={setImage}
            onRemove={() => setImage("")}
            showUrlInput={false}
          />
        )}
      </div>
    </Dialog>
  )
}
