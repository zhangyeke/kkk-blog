import type { CSSProperties } from "react"

export type FixedSide = "left" | "right"

export function fixedCellStyle(index: number, header = false): CSSProperties {
    return {
        position: `var(--table-position-${index}, static)` as CSSProperties["position"],
        left: `var(--table-left-${index}, auto)`,
        right: `var(--table-right-${index}, auto)`,
        zIndex: header ? 2 : 1,
        backgroundColor: "inherit",
        boxShadow: `var(--table-shadow-${index}, none)`,
    }
}

/** Measure the header cells once per layout change. Scrolling only updates the edge shadows. */
export function observeFixedColumns(container: HTMLDivElement) {
    const table = container.querySelector("table")
    if (!table || typeof ResizeObserver === "undefined" || typeof window.matchMedia !== "function") return

    const headers = Array.from(table.querySelectorAll<HTMLTableCellElement>("thead th[data-fixed-index]"))
    if (headers.length === 0) return
    const mobile = window.matchMedia("(width < 48rem)")
    let leftEdge: string | undefined
    let rightEdge: string | undefined
    let maxScroll = 0

    function clearOffsets() {
        for (const header of headers) {
            const index = header.dataset.fixedIndex
            container.style.removeProperty(`--table-position-${index}`)
            container.style.removeProperty(`--table-left-${index}`)
            container.style.removeProperty(`--table-right-${index}`)
            container.style.removeProperty(`--table-shadow-${index}`)
        }
    }

    function updateShadows() {
        if (leftEdge !== undefined) {
            container.style.setProperty(`--table-shadow-${leftEdge}`, container.scrollLeft > 1
                ? "inset -1px 0 var(--border), 4px 0 8px -6px var(--foreground)"
                : "none")
        }
        if (rightEdge !== undefined) {
            container.style.setProperty(`--table-shadow-${rightEdge}`, container.scrollLeft < maxScroll - 1
                ? "inset 1px 0 var(--border), -4px 0 8px -6px var(--foreground)"
                : "none")
        }
    }

    function measure() {
        const viewport = container.clientWidth
        maxScroll = container.scrollWidth - viewport
        const groups: Record<FixedSide, { index: string; width: number }[]> = { left: [], right: [] }

        for (const header of headers) {
            const index = header.dataset.fixedIndex
            const side = mobile.matches ? header.dataset.fixedMobile : header.dataset.fixedDesktop
            if (index === undefined || (side !== "left" && side !== "right")) continue
            const width = header.getBoundingClientRect().width
            if (width > 0) groups[side].push({ index, width })
        }

        clearOffsets()

        leftEdge = undefined
        rightEdge = undefined
        if (maxScroll <= 1) return

        let remaining = viewport - 48
        // Keep the operation side usable first, while leaving room to swipe the middle columns.
        for (const side of ["right", "left"] as const) {
            const group = side === "right" ? groups.right.reverse() : groups.left
            let offset = 0
            let edge: string | undefined
            for (const { index, width } of group) {
                if (width > remaining) break
                container.style.setProperty(`--table-position-${index}`, "sticky")
                container.style.setProperty(`--table-${side}-${index}`, `${offset}px`)
                offset += width
                remaining -= width
                edge = index
            }
            if (side === "left") leftEdge = edge
            else rightEdge = edge
        }
        updateShadows()
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    observer.observe(table)
    for (const header of headers) observer.observe(header)
    mobile.addEventListener("change", measure)
    container.addEventListener("scroll", updateShadows, { passive: true })
    return () => {
        observer.disconnect()
        mobile.removeEventListener("change", measure)
        container.removeEventListener("scroll", updateShadows)
        clearOffsets()
    }
}
