import { act, fireEvent, render, screen } from "@testing-library/react"
import type { Session } from "next-auth"
import { useRouter } from "next/navigation"
import { UserBrief } from "./UserBrief"

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }))
jest.mock("@/env.mjs", () => ({ env: {} }))
jest.mock("@/service/fileUpload", () => ({ uploadImage: jest.fn() }))
jest.mock("./LogOutButton", () => ({ LogOutButton: ({ children }: { children: React.ReactNode }) => <button>{children}</button> }))

const session = { user: { name: "测试用户" } } as Session
const push = jest.fn()

function mousePointer(target: HTMLElement, type: string) {
  const event = new MouseEvent(type, { bubbles: true })
  Object.defineProperty(event, "pointerType", { value: "mouse" })
  fireEvent(target, event)
}

beforeEach(() => {
  jest.useFakeTimers()
  jest.mocked(useRouter).mockReturnValue({
    push,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })
  push.mockClear()
})
afterEach(() => jest.useRealTimers())

test("keeps the card open across the gap and closes it after leaving", () => {
  render(<UserBrief session={session} />)
  const trigger = screen.getByRole("button", { name: "测试用户的账户菜单" })
  trigger.focus()
  mousePointer(trigger, "pointerover")
  const card = screen.getByRole("dialog", { name: "账户菜单" })
  expect(trigger).toHaveFocus()
  expect(screen.getByRole("link", { name: "个人中心" })).toHaveAttribute("href", "/blog/me")
  expect(screen.queryByText("添加书签")).not.toBeInTheDocument()

  mousePointer(trigger, "pointerout")
  act(() => jest.advanceTimersByTime(70))
  mousePointer(card, "pointerover")
  act(() => jest.advanceTimersByTime(200))
  expect(card).toBeInTheDocument()

  mousePointer(card, "pointerout")
  act(() => jest.advanceTimersByTime(150))
  expect(trigger).toHaveAttribute("aria-expanded", "false")
})

test("opens without a mouse and opens the profile on a mouse click", () => {
  render(<UserBrief session={session} />)
  const trigger = screen.getByRole("button", { name: "测试用户的账户菜单" })
  fireEvent.click(trigger)
  expect(trigger).toHaveAttribute("aria-expanded", "true")
  fireEvent.keyDown(document.activeElement!, { key: "Escape" })
  expect(trigger).toHaveAttribute("aria-expanded", "false")

  mousePointer(trigger, "pointerdown")
  fireEvent.click(trigger, { detail: 1 })
  expect(push).toHaveBeenCalledWith("/blog/me")
})
