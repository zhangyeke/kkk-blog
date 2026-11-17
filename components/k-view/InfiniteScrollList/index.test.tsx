import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { InfiniteScrollList } from "./index"

jest.mock("@/lib/ui/cn", () => ({ cn: (...values: string[]) => values.join(" ") }))
jest.mock("@/lib/number", () => ({ addUnit: String }))
jest.mock("@/components/ui/button", () => ({
  Button: (props: React.ComponentProps<"button">) => <button {...props} />,
}))
jest.mock("../Loader/Spinner", () => ({ Spinner: () => <span>加载中</span> }))
jest.mock("../Empty", () => ({ Empty: () => <span>暂无数据</span> }))
jest.mock("../division", () => ({ Division: ({ children }: React.PropsWithChildren) => <div>{children}</div> }))

type Item = { id: string }
const response = (id: string, totalPages = 1) => ({
  code: 200,
  message: "ok",
  data: { list: [{ id }], totalPages, currentPage: 1 },
})
const renderItem = (item: Item) => <span key={item.id}>{item.id}</span>
let intersect: IntersectionObserverCallback
beforeEach(() => {
  global.IntersectionObserver = jest.fn((callback) => {
    intersect = callback
    return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() }
  }) as unknown as typeof IntersectionObserver
})

test("ignores an old request after the filter changes", async () => {
  let finishOld!: (value: ReturnType<typeof response>) => void
  const fetchData = jest
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishOld = resolve
        })
    )
    .mockResolvedValueOnce(response("new"))
  const { rerender } = render(
    <InfiniteScrollList fetchData={fetchData} apiParams={{ category: 1 }} renderItem={renderItem} />
  )
  rerender(<InfiniteScrollList fetchData={fetchData} apiParams={{ category: 2 }} renderItem={renderItem} />)
  expect(await screen.findByText("new")).toBeInTheDocument()
  await act(async () => {
    finishOld(response("old"))
  })
  expect(screen.queryByText("old")).not.toBeInTheDocument()
  expect(screen.getByText("new")).toBeInTheDocument()
})

test("shows business errors and retries the failed page without an automatic loop", async () => {
  const fetchData = jest
    .fn()
    .mockResolvedValueOnce({ code: 0, message: "服务暂不可用", data: {} })
    .mockResolvedValueOnce(response("recovered"))
  render(<InfiniteScrollList fetchData={fetchData} renderItem={renderItem} />)
  expect(await screen.findByRole("alert")).toHaveTextContent("服务暂不可用")
  expect(screen.queryByText("暂无数据")).not.toBeInTheDocument()
  expect(fetchData).toHaveBeenCalledTimes(1)
  fireEvent.click(screen.getByRole("button", { name: "点此重试" }))
  expect(await screen.findByText("recovered")).toBeInTheDocument()
  expect(fetchData.mock.calls[1]![0].page).toBe(1)
})

test("locks duplicate observer callbacks while the next page is pending", async () => {
  const fetchData = jest
    .fn()
    .mockResolvedValueOnce(response("first", 2))
    .mockImplementationOnce(() => new Promise(() => {}))
  render(<InfiniteScrollList fetchData={fetchData} renderItem={renderItem} />)
  await screen.findByText("first")
  await waitFor(() => expect(intersect).toBeDefined())
  act(() => {
    const entries = [{ isIntersecting: true }] as IntersectionObserverEntry[]
    intersect(entries, {} as IntersectionObserver)
    intersect(entries, {} as IntersectionObserver)
  })
  expect(fetchData).toHaveBeenCalledTimes(2)
})
