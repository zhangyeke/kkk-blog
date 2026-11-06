import { act, render, screen } from "@testing-library/react"
import BlogEffects from "./BlogEffects"

jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: () =>
    function Effect() {
      return <span data-testid="effect" />
    },
}))
jest.mock("@/hooks", () => ({
  useAppStore: (selector: (state: object) => unknown) => selector({ trackMouse: true }),
}))
jest.mock("next/navigation", () => ({ usePathname: () => mockPathname }))
jest.mock("@/components/FallingSettings/FallingOverlay", () => ({
  __esModule: true,
  default: ({ running }: { running: boolean }) => <canvas data-testid="falling" data-running={running} />,
}))

let mockPathname: string
let reduced: boolean
let hidden: boolean
let motionChange: () => void
beforeEach(() => {
  jest.useFakeTimers()
  reduced = false
  hidden = false
  mockPathname = "/blog"
  jest.spyOn(document, "hidden", "get").mockImplementation(() => hidden)
  window.matchMedia = jest.fn(() => ({
    get matches() {
      return reduced
    },
    addEventListener: (_name: string, callback: () => void) => {
      motionChange = callback
    },
    removeEventListener: jest.fn(),
  })) as unknown as typeof window.matchMedia
})
afterEach(() => {
  jest.useRealTimers()
  jest.restoreAllMocks()
})

test("defers effects, unmounts them when hidden and restores them when visible", () => {
  render(<BlogEffects />)
  expect(screen.queryAllByTestId("effect")).toHaveLength(0)
  act(() => jest.advanceTimersByTime(200))
  expect(screen.getAllByTestId("effect")).toHaveLength(1)
  act(() => {
    hidden = true
    document.dispatchEvent(new Event("visibilitychange"))
  })
  expect(screen.queryAllByTestId("effect")).toHaveLength(0)
  act(() => {
    hidden = false
    document.dispatchEvent(new Event("visibilitychange"))
  })
  expect(screen.getAllByTestId("effect")).toHaveLength(1)
})

test("respects changes to the reduced-motion preference", () => {
  jest.spyOn(document, "readyState", "get").mockReturnValue("complete")
  reduced = true
  render(<BlogEffects />)
  act(() => jest.advanceTimersByTime(200))
  expect(screen.queryAllByTestId("effect")).toHaveLength(0)
  expect(screen.queryByTestId("falling")).toBeNull()
  act(() => {
    reduced = false
    motionChange()
  })
  expect(screen.getAllByTestId("effect")).toHaveLength(1)
  expect(screen.getByTestId("falling")).toBeInTheDocument()
})

test("starts falling after page load on any route and pauses it in the background", () => {
  mockPathname = "/login"
  const state = jest.spyOn(document, "readyState", "get").mockReturnValue("loading")
  render(<BlogEffects />)
  act(() => jest.advanceTimersByTime(200))
  expect(screen.queryByTestId("falling")).toBeNull()
  expect(screen.queryByTestId("effect")).toBeNull()

  state.mockReturnValue("complete")
  act(() => window.dispatchEvent(new Event("load")))
  const canvas = screen.getByTestId("falling")
  expect(canvas).toHaveAttribute("data-running", "true")
  act(() => {
    hidden = true
    document.dispatchEvent(new Event("visibilitychange"))
  })
  expect(screen.getByTestId("falling")).toBe(canvas)
  expect(canvas).toHaveAttribute("data-running", "false")
})
