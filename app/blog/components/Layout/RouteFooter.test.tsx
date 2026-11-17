import { render, screen } from "@testing-library/react"
import { usePathname } from "next/navigation"
import RouteFooter from "./RouteFooter"

jest.mock("next/navigation", () => ({ usePathname: jest.fn() }))

test("updates footer visibility when navigating between blog routes", () => {
  const pathname = jest.mocked(usePathname)
  const view = <RouteFooter><footer>博客页脚</footer></RouteFooter>
  pathname.mockReturnValue("/blog")
  const { rerender } = render(view)
  expect(screen.getByRole("contentinfo")).toBeInTheDocument()

  for (const path of ["/blog/index", "/blog/travel/map", "/blog/jiangshan-map", "/blog/article/list/", "/blog/me", "/blog/me/articles"]) {
    pathname.mockReturnValue(path)
    rerender(<RouteFooter><footer>博客页脚</footer></RouteFooter>)
    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument()
  }

  pathname.mockReturnValue("/blog/bookmark")
  rerender(<RouteFooter><footer>博客页脚</footer></RouteFooter>)
  expect(screen.getByRole("contentinfo")).toBeInTheDocument()
})
