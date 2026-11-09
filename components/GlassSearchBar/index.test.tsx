import { fireEvent, render, screen } from "@testing-library/react"
import { GlassSearchBar } from "./index"

jest.mock("@/env.mjs", () => ({ env: {} }))
jest.mock("@/service/fileUpload", () => ({ uploadImage: jest.fn() }))
jest.mock("@/components/k-view/Image", () => ({ Image: () => null }))

test("keeps the panel mounted across close and reopen while hiding its controls", () => {
  render(<GlassSearchBar />)
  const trigger = screen.getByRole("button", { name: "展开搜索引擎列表" })
  fireEvent.click(trigger)
  const google = screen.getByRole("button", { name: "Google" })
  const panel = document.getElementById(trigger.getAttribute("aria-controls")!)!
  fireEvent.keyDown(google, { key: "Escape" })
  expect(trigger).toHaveFocus()
  expect(panel).toHaveAttribute("inert")
  expect(screen.queryByRole("button", { name: "Google" })).toBeNull()
  fireEvent.click(trigger)
  expect(screen.getByRole("button", { name: "Google" })).toBe(google)
  fireEvent.click(google)
  expect(trigger).toHaveFocus()
  expect(screen.getByRole("button", { name: "使用 Google 搜索" })).toBeInTheDocument()
})

test("anchors the panel's scale origin to the trigger and keeps it inside the component", () => {
  render(<GlassSearchBar />)
  const trigger = screen.getByRole("button", { name: "展开搜索引擎列表" })
  const bar = screen.getByRole("search")
  const panel = document.getElementById(trigger.getAttribute("aria-controls")!)!

  // 搜索条宽 600、按钮中心落在 150px 处 → 相对搜索条左边缘的锚点应为 50px
  bar.getBoundingClientRect = () => ({ left: 100, width: 600 }) as unknown as DOMRect
  trigger.getBoundingClientRect = () => ({ left: 112, width: 76 }) as unknown as DOMRect

  fireEvent.click(trigger)

  expect(panel).toHaveAttribute("data-open", "true")
  // 面板是组件内部的绝对定位元素，没有 portal 到 body
  expect(panel.parentElement).toBe(bar.parentElement)
  expect(panel.style.transformOrigin).toBe("50px top")
})
