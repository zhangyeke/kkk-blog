"use client"

import { useLayoutEffect, useMemo, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { gsap } from "gsap"
import { cn } from "@/lib/utils"

const SCRAMBLE_CHARSET = "0123456789"

/** 与服务端首帧一致；位数须与 `showSeconds` 一致 */
function hydrationPlaceholder(showSeconds: boolean): string[] {
  return showSeconds ? ["0", "0", "0", "0", "0", "0"] : ["0", "0", "0", "0"]
}

const DEFAULT_SHUFFLE_ROLLS = 5
const DEFAULT_SHUFFLE_DURATION = 0.3
const DEFAULT_SHUFFLE_EASE = "power3.out"

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false)
  useLayoutEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const apply = () => setReduce(mq.matches)
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])
  return reduce
}

function randomCharsetChar(): string {
  const i = Math.floor(Math.random() * SCRAMBLE_CHARSET.length)
  return SCRAMBLE_CHARSET[i]!
}

type ShufflePhase =
  | { kind: "idle" }
  | {
    kind: "run"
    rows: string[]
  }

function ShuffleDigit({
  digit,
  reducedMotion,
  allowShuffle,
  shuffleRolls,
  shuffleDuration,
  shuffleEase,
}: {
  digit: string
  reducedMotion: boolean
  /** 为 false 时仅同步数字（无滚动），用于首帧水合后对齐真实时间 */
  allowShuffle: boolean
  shuffleRolls: number
  shuffleDuration: number
  shuffleEase: string
}) {
  const [visible, setVisible] = useState(digit)
  const [phase, setPhase] = useState<ShufflePhase>({ kind: "idle" })
  const wrapRef = useRef<HTMLDivElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<gsap.core.Tween | null>(null)
  /** idle 单行高度；run 时勿用整列 wrap 高度（否则会当成一格，造成裁切/错位甚至像倒字） */
  const cellHRef = useRef(0)

  useLayoutEffect(() => {
    return () => {
      animRef.current?.kill()
      const strip = stripRef.current
      if (strip) gsap.killTweensOf(strip)
    }
  }, [])

  useLayoutEffect(() => {
    if (reducedMotion) {
      setVisible(digit)
      setPhase({ kind: "idle" })
      return
    }
    if (digit === visible) return

    if (!allowShuffle) {
      animRef.current?.kill()
      const strip = stripRef.current
      if (strip) gsap.killTweensOf(strip)
      setVisible(digit)
      setPhase({ kind: "idle" })
      return
    }

    const from = visible
    const middle = Array.from({ length: shuffleRolls }, randomCharsetChar)
    const rows = [from, ...middle, digit]

    setPhase({ kind: "run", rows })
  }, [digit, visible, reducedMotion, shuffleRolls, allowShuffle])

  useLayoutEffect(() => {
    const wrap = wrapRef.current
    if (phase.kind !== "idle" || !wrap) return
    const h = wrap.getBoundingClientRect().height
    if (h > 0) cellHRef.current = h
  }, [phase.kind, visible])

  useLayoutEffect(() => {
    if (phase.kind !== "run") return

    const wrap = wrapRef.current
    const strip = stripRef.current
    if (!wrap || !strip) return

    animRef.current?.kill()

    let step = cellHRef.current
    if (step <= 0) {
      const first = strip.firstElementChild as HTMLElement | null
      step = first?.getBoundingClientRect().height ?? 0
    }
    if (step <= 0) {
      const fs = parseFloat(globalThis.getComputedStyle(wrap).fontSize) || 16
      step = fs * 1.25
    }
    const steps = shuffleRolls + 1

    wrap.style.height = `${step}px`

    strip.querySelectorAll<HTMLElement>("[data-shuffle-row]").forEach((el) => {
      el.style.height = `${step}px`
    })

    gsap.set(strip, {
      y: 0,
      rotation: 0,
      rotationX: 0,
      rotationY: 0,
      force3D: false,
    })

    animRef.current = gsap.to(strip, {
      y: -steps * step,
      duration: shuffleDuration,
      ease: shuffleEase,
      force3D: false,
      onComplete: () => {
        flushSync(() => {
          setVisible(digit)
          setPhase({ kind: "idle" })
        })
        wrap.style.height = ""
        gsap.set(strip, { y: 0, rotation: 0, rotationX: 0, rotationY: 0 })
        animRef.current = null
      },
    })

    return () => {
      animRef.current?.kill()
      wrap.style.height = ""
    }
  }, [phase, digit, shuffleRolls, shuffleDuration, shuffleEase])

  return (
    <div
      ref={wrapRef}
      style={{
        position: "relative",
        display: "inline-block",
        overflow: "hidden",
        verticalAlign: "baseline",
      }}
    >
      {phase.kind === "idle" ? (
        <span>{visible}</span>
      ) : (
        <div
          ref={stripRef}
          style={{ display: "flex", flexDirection: "column", willChange: "transform" }}
        >
          {phase.rows.map((ch, i) => (
            <div key={i} data-shuffle-row style={{ flexShrink: 0 }}>
              <span>{ch}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export type FlipClockProps = BaseComponentProps & {
  use12h?: boolean
  /** 是否显示秒（末尾两位 + 第二处冒号）；默认 true */
  showSeconds?: boolean
  /** 每位数字切换时中间乱码格数（≥1），默认 5 */
  shuffleRolls?: number
  /** 单次滚动动画时长（秒），默认 0.4 */
  shuffleDuration?: number
  /** GSAP ease 字符串，默认 power3.out */
  shuffleEase?: string
}

export default function FlipClock({
  className,
  style,
  use12h = false,
  showSeconds = false,
  shuffleRolls = DEFAULT_SHUFFLE_ROLLS,
  shuffleDuration = DEFAULT_SHUFFLE_DURATION,
  shuffleEase = DEFAULT_SHUFFLE_EASE,
}: FlipClockProps) {
  const reducedMotion = usePrefersReducedMotion()
  const [parts, setParts] = useState<string[]>(() => hydrationPlaceholder(showSeconds))
  /** 首帧与服务端对齐占位后，先 false 再 true，避免与 setParts 同批提交导致仍走 shuffle */
  const [allowShuffle, setAllowShuffle] = useState(false)
  const rolls = Math.max(1, Math.floor(shuffleRolls))

  const targetLen = showSeconds ? 6 : 4
  const displayParts = useMemo(() => {
    if (parts.length === targetLen) return parts
    if (parts.length > targetLen) return parts.slice(0, targetLen)
    return [...parts, ...Array.from({ length: targetLen - parts.length }, () => "0")]
  }, [parts, targetLen])

  useLayoutEffect(() => {
    setAllowShuffle(false)
    const tick = () => setParts(getDisplayParts(new Date(), use12h, showSeconds))
    tick()
    queueMicrotask(() => setAllowShuffle(true))
    const intervalMs = showSeconds ? 1000 : 60_000
    const id = window.setInterval(tick, intervalMs)
    return () => clearInterval(id)
  }, [use12h, showSeconds])

  const label = showSeconds
    ? `当前时间 ${displayParts.slice(0, 2).join("")}:${displayParts.slice(2, 4).join("")}:${displayParts.slice(4, 6).join("")}`
    : `当前时间 ${displayParts.slice(0, 2).join("")}:${displayParts.slice(2, 4).join("")}`

  const shuffleDigitProps = {
    reducedMotion,
    allowShuffle,
    shuffleRolls: rolls,
    shuffleDuration,
    shuffleEase,
  }

  return (
    <div
      className={cn("inline-flex items-center ", className)}
      style={style}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
      aria-label={label}
    >
      <ShuffleDigit digit={displayParts[0]!} {...shuffleDigitProps} />
      <ShuffleDigit digit={displayParts[1]!} {...shuffleDigitProps} />
      <span aria-hidden>:</span>
      <ShuffleDigit digit={displayParts[2]!} {...shuffleDigitProps} />
      <ShuffleDigit digit={displayParts[3]!} {...shuffleDigitProps} />
      {showSeconds ? (
        <>
          <span aria-hidden>:</span>
          <ShuffleDigit digit={displayParts[4]!} {...shuffleDigitProps} />
          <ShuffleDigit digit={displayParts[5]!} {...shuffleDigitProps} />
        </>
      ) : null}
    </div>
  )
}

function getDisplayParts(d: Date, use12h: boolean, showSeconds: boolean): string[] {
  const full = splitTime(d, use12h)
  return showSeconds ? full : full.slice(0, 4)
}

function splitTime(d: Date, use12h: boolean): string[] {
  let h = d.getHours()
  if (use12h) {
    h = h % 12 || 12
  }
  const pad = (n: number) => String(n).padStart(2, "0")
  const hStr = pad(h)
  const mStr = pad(d.getMinutes())
  const sStr = pad(d.getSeconds())
  return [...hStr, ...mStr, ...sStr]
}
