"use client"

import { useEffect, useRef, useState } from "react"
import styles from "./BackTop.module.css"

type Phase = "idle" | "flight" | "arrived"

export const BackTop = () => {
  const [visible, setVisible] = useState(false)
  const [phase, setPhase] = useState<Phase>("idle")
  const flightFinished = useRef(false)

  useEffect(() => {
    const onScroll = () => {
      const top = window.scrollY
      setVisible(top > 400)
      if (top <= 1 && flightFinished.current) {
        setPhase((current) => current === "flight" ? "arrived" : current)
      }
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (phase === "idle") return
    const timer = setTimeout(() => {
      setPhase(phase === "flight" && window.scrollY <= 1 ? "arrived" : "idle")
    }, phase === "flight" ? 1600 : 580)
    return () => clearTimeout(timer)
  }, [phase])

  function returnToTop() {
    if (phase !== "idle") return
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!reduceMotion) {
      flightFinished.current = false
      setPhase("flight")
    }
    window.scrollTo({ top: 0, behavior: reduceMotion ? "instant" : "smooth" })
  }

  if (!visible && phase === "idle") return null

  return (
    <button
      type="button"
      aria-label={phase === "arrived" ? "已返回顶部" : "返回顶部"}
      aria-disabled={phase !== "idle" || undefined}
      data-phase={phase}
      className={styles.button}
      onClick={returnToTop}
    >

      <span className={styles.dock} aria-hidden="true">
        <span className={styles.shadow} />
        <svg className={styles.speedLines} viewBox="0 0 76 88" fill="none">
          <path d="M22 61 27 45M34 79 37 54M47 69 48 49M58 57 56 43" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
          <path d="M14 51 17 44m47 22-2-8" stroke="currentColor" strokeOpacity=".46" strokeLinecap="round" />
        </svg>
        <span
          className={styles.carrier}
          data-flight-path=""
          onAnimationEnd={(event) => {
            if (event.target !== event.currentTarget || phase !== "flight") return
            flightFinished.current = true
            if (window.scrollY <= 1) setPhase("arrived")
          }}
        >
          <svg className={styles.plane} viewBox="0 0 36 36" fill="none">
            <path d="M18 3 32 28l-10-4-4 8-4-8-10 4L18 3Z" fill="var(--paper)" stroke="var(--ink)" strokeWidth=".9" strokeLinejoin="round" />
            <path d="M18 3v29l4-8 10 4L18 3Z" fill="var(--fold)" />
            <path d="M18 5 14 24m4-19 4 19m-4-19v25" stroke="var(--ink)" strokeOpacity=".53" strokeWidth=".8" strokeLinejoin="round" />
          </svg>
          <span className={styles.wake} />
        </span>
        <svg className={styles.check} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m5 12 4.5 4.5L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  )
}
