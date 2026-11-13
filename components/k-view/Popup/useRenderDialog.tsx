"use client"

import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react"

import { Dialog, type DialogProps } from "./Dialog"

export type RenderDialogOptions = Omit<
    DialogProps,
    "title" | "children" | "trigger" | "open" | "defaultOpen" | "onOpenChange" | "onCancel"
> & {
    title: ReactNode
    /** Runs when the user dismisses the dialog. */
    onCancel?: () => void
    render: (controls: { close: () => void; onCancel: () => void }) => ReactNode
}

type OpenDialog = (options: RenderDialogOptions, opener?: Element | null) => void
const RenderDialogContext = createContext<(
    options: RenderDialogOptions,
    opener: Element | null,
) => () => void>(() => {
    throw new Error("useRenderDialog requires a RenderDialogProvider")
})

export function RenderDialogProvider({ children }: { children: ReactNode }) {
    const nextId = useRef(0)
    const activeId = useRef<number | null>(null)
    const [current, setCurrent] = useState<{
        id: number
        open: boolean
        options: RenderDialogOptions
        opener: HTMLElement | null
        close: () => void
        onCancel: () => void
    } | null>(null)

    const mountDialog = useCallback((options: RenderDialogOptions, opener: Element | null) => {
        const id = ++nextId.current
        activeId.current = id

        function close() {
            if (activeId.current !== id) return
            activeId.current = null
            setCurrent((previous) => previous?.id === id ? { ...previous, open: false } : previous)
        }

        function onCancel() {
            if (activeId.current !== id) return
            close()
            options.onCancel?.()
        }

        setCurrent({
            id,
            open: true,
            options,
            opener: opener instanceof HTMLElement ? opener : null,
            close,
            onCancel,
        })

        return () => {
            if (activeId.current === id) activeId.current = null
            setCurrent((previous) => previous?.id === id ? null : previous)
        }
    }, [])

    let dialog: ReactNode = null
    if (current) {
        const { id, open, options, opener, close, onCancel } = current
        const { render, contentProps, footer = null, ...props } = options

        dialog = (
            <Dialog
                key={id}
                {...props}
                footer={footer}
                open={open}
                onCancel={onCancel}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) onCancel()
                }}
                contentProps={{
                    ...contentProps,
                    onCloseAutoFocus: (event) => {
                        contentProps?.onCloseAutoFocus?.(event)
                        if (!event.defaultPrevented && id === nextId.current && opener?.isConnected) {
                            event.preventDefault()
                            opener.focus({ preventScroll: true })
                        }
                        setCurrent((previous) => previous?.id === id && !previous.open ? null : previous)
                    },
                }}
            >
                {render({ close, onCancel })}
            </Dialog>
        )
    }

    return (
        <RenderDialogContext.Provider value={mountDialog}>
            {children}
            {dialog}
        </RenderDialogContext.Provider>
    )
}

/** Open from an event handler. The provider renders the dialog automatically. */
export function useRenderDialog() {
    const mountDialog = useContext(RenderDialogContext)
    const dispose = useRef<(() => void) | undefined>(undefined)

    useEffect(() => () => dispose.current?.(), [])

    const openDialog: OpenDialog = useCallback((options, opener = document.activeElement) => {
        dispose.current = mountDialog(options, opener)
    }, [mountDialog])

    return { openDialog }
}
