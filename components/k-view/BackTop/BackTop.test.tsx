import { act, fireEvent, render, screen } from "@testing-library/react"
import { BackTop } from "."

test.each([false, true])("returns to the top with reduced motion set to %s", (matches) => {
  jest.useFakeTimers()
  const position = jest.replaceProperty(window, "scrollY", 500)
  const scroll = jest.spyOn(window, "scrollTo").mockImplementation(() => {})
  const originalMatchMedia = window.matchMedia
  window.matchMedia = jest.fn(() => ({ matches }) as MediaQueryList)
  try {
    const { unmount } = render(<BackTop />)
    const button = screen.getByRole("button", { name: "返回顶部" })
    fireEvent.click(button)
    expect(scroll).toHaveBeenCalledWith({ top: 0, behavior: matches ? "instant" : "smooth" })
    if (!matches) {
      expect(button).toHaveAttribute("data-phase", "flight")
      fireEvent.click(button)
      expect(scroll).toHaveBeenCalledTimes(1)
    }
    position.replaceValue(0)
    fireEvent.scroll(window)
    if (!matches) {
      expect(button).toHaveAttribute("data-phase", "flight")
      fireEvent.animationEnd(button.querySelector("[data-flight-path]")!)
      expect(button).toHaveAccessibleName("已返回顶部")
      expect(button).toHaveAttribute("data-phase", "arrived")
      act(() => jest.advanceTimersByTime(580))
    }
    expect(button).not.toBeInTheDocument()
    unmount()
  } finally {
    window.matchMedia = originalMatchMedia
    jest.restoreAllMocks()
    jest.useRealTimers()
  }
})
