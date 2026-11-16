import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { createContext, useContext } from "react"

import { RenderDialogProvider, useRenderDialog } from "./useRenderDialog"

jest.mock("@/env.mjs", () => ({ env: {} }))
jest.mock("@/service/fileUpload", () => ({ uploadImage: jest.fn() }))

const FormContext = createContext("default")

function FormContent({ cancel }: { cancel: () => void }) {
    const value = useContext(FormContext)
    return <button onClick={cancel}>{value}</button>
}

test.each([true, false])("opens and dismisses custom content (with onCancel: %s)", async (withOnCancel) => {
    let cancelPrevious: (() => void) | undefined
    const onCancel = jest.fn()

    function Harness() {
        const { openDialog } = useRenderDialog()

        return (
            <button onClick={(event) => openDialog({
                title: "New post",
                onCancel: withOnCancel ? onCancel : undefined,
                render: ({ close, onCancel: cancel }) => (
                    <>
                        <FormContent cancel={() => {
                            cancelPrevious = cancel
                            cancel()
                        }} />
                        <button onClick={close}>Save</button>
                    </>
                ),
            }, event.currentTarget)}>Open form</button>
        )
    }

    render(
        <FormContext.Provider value="Cancel form">
            <RenderDialogProvider><Harness /></RenderDialogProvider>
        </FormContext.Provider>,
    )
    const trigger = screen.getByRole("button", { name: "Open form" })
    fireEvent.click(trigger)
    const firstDialog = await screen.findByRole("dialog", { name: "New post" })
    const cancel = screen.getByRole("button", { name: "Cancel form" })
    fireEvent.click(cancel)
    await waitFor(() => expect(firstDialog).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(onCancel).toHaveBeenCalledTimes(withOnCancel ? 1 : 0)

    fireEvent.click(trigger)
    const secondDialog = await screen.findByRole("dialog", { name: "New post" })
    act(() => cancelPrevious?.())
    expect(secondDialog).toBeInTheDocument()
    expect(onCancel).toHaveBeenCalledTimes(withOnCancel ? 1 : 0)

    fireEvent.keyDown(secondDialog, { key: "Escape" })
    await waitFor(() => expect(secondDialog).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(onCancel).toHaveBeenCalledTimes(withOnCancel ? 2 : 0)

    fireEvent.click(trigger)
    const thirdDialog = await screen.findByRole("dialog", { name: "New post" })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(thirdDialog).not.toBeInTheDocument())
    expect(onCancel).toHaveBeenCalledTimes(withOnCancel ? 2 : 0)
})
