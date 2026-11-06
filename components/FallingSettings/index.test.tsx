import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { Drawer } from "@/components/k-view/Popup/Drawer"
import FallingSettings from "./index"

const mockState = {
  fallingEnabled: true,
  fallingPattern: "petal",
  fallingImage: "",
  fallingSizes: [14, 28],
  fallingDensity: 4,
  fallingSpeed: 1,
  setFallingSizes: jest.fn(),
  setFallingSpeed: jest.fn(),
  setFallingDirection: jest.fn(),
}

jest.mock("@/hooks", () => ({
  useAppStore: (selector: (state: typeof mockState) => unknown) => selector(mockState),
}))
jest.mock("@/env.mjs", () => ({ env: {} }))
jest.mock("@/service/fileUpload", () => ({ uploadImage: jest.fn() }))
jest.mock("@/components/ui/image-upload", () => ({ ImageUpload: () => null }))

test("opens falling settings from the drawer and keeps the range keyboard accessible", async () => {
  const originalResizeObserver = globalThis.ResizeObserver
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  try {
    render(
      <Drawer defaultOpen direction="right" title="设置" footer={null}>
        <FallingSettings />
      </Drawer>
    )

    const trigger = screen.getByRole("button", { name: /设置全局飘落/ })
    trigger.focus()
    fireEvent.click(trigger)
    const dialog = screen.getByRole("dialog", { name: "全局飘落" })
    expect(dialog).toHaveAttribute("data-vaul-no-drag")
    const direction = within(dialog).getByRole("radiogroup", { name: "飘落方向" })
    expect(within(direction).getAllByRole("radio")).toHaveLength(4)
    expect(within(direction).getByRole("radio", { name: "下" })).toBeChecked()
    fireEvent.click(within(direction).getByRole("radio", { name: "上" }))
    expect(mockState.setFallingDirection).toHaveBeenCalledWith("up")
    expect(within(dialog).queryByText("图案颜色")).not.toBeInTheDocument()
    const min = within(dialog).getByRole("slider", { name: "最小图案大小" })
    const max = within(dialog).getByRole("slider", { name: "最大图案大小" })
    expect(min).toHaveAttribute("aria-valuenow", "14")
    expect(max).toHaveAttribute("aria-valuenow", "28")

    min.focus()
    fireEvent.keyDown(min, { key: "ArrowRight" })
    expect(mockState.setFallingSizes).toHaveBeenCalledWith([15, 28])

    const speed = within(dialog).getByRole("spinbutton", { name: "飘落速度（倍速）" })
    expect(speed).toHaveValue(1)
    fireEvent.change(speed, { target: { value: "2.4" } })
    expect(mockState.setFallingSpeed).toHaveBeenLastCalledWith(2.4)
    fireEvent.change(speed, { target: { value: "4" } })
    expect(mockState.setFallingSpeed).toHaveBeenLastCalledWith(2.4)
    fireEvent.blur(speed)
    expect(speed).toHaveValue(3)
    expect(mockState.setFallingSpeed).toHaveBeenLastCalledWith(3)

    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }))
    expect(screen.getByRole("dialog", { name: "设置" })).toBeInTheDocument()
    await waitFor(() => expect(trigger).toHaveFocus())
  } finally {
    globalThis.ResizeObserver = originalResizeObserver
  }
})
