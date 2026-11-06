/** @jest-environment node */
import { uploadImage } from "./fileUpload"
import { env } from "@/env.mjs"
import { checkAuth } from "@/service/auth"

jest.mock("@/env.mjs", () => ({
  env: {
    IMAGE_UPLOAD_PROVIDER: "default",
    MTBED_UPLOAD_SERVER: "primary",
    IMAGE_UPLOAD_TIMEOUT_MS: 15000,
    NEXT_PUBLIC_IMG_UPLOAD_LIMIT: "3mb",
    IMGBB_API_URL: "https://existing.example",
    IMGBB_API_TOKEN: "test-token",
  },
}))
jest.mock("@/service/auth", () => ({ checkAuth: jest.fn() }))

const fetchMock = jest.fn()
const uploadEnv = env as {
  IMAGE_UPLOAD_PROVIDER: "default" | "mtbed"
  MTBED_UPLOAD_SERVER: "primary" | "secondary"
  NEXT_PUBLIC_IMG_UPLOAD_LIMIT: string
}
const originalFetch = global.fetch
const png = new Uint8Array(
  Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64")
)
function form(file = new File([png], "image.png", { type: "image/png" })) {
  const params = new FormData()
  params.append("file", file)
  return params
}
function success(url = "https://images.example/image.png") {
  return Response.json({ code: 200, data: { url, unexpected: "not forwarded" } })
}

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = fetchMock
  uploadEnv.IMAGE_UPLOAD_PROVIDER = "default"
  uploadEnv.MTBED_UPLOAD_SERVER = "primary"
  uploadEnv.NEXT_PUBLIC_IMG_UPLOAD_LIMIT = "3mb"
  jest.mocked(checkAuth).mockResolvedValue({ id: "owner" } as Awaited<ReturnType<typeof checkAuth>>)
  fetchMock.mockResolvedValue(success())
})
afterAll(() => {
  global.fetch = originalFetch
})

test("keeps the existing provider and its authorization and server-owned album settings", async () => {
  const params = form()
  params.append("provider", "mtbed")
  params.append("params", '{"album_id":999}')
  const response = await uploadImage(params)
  expect(response).toEqual({ code: 200, message: "图片上传成功", data: { url: "https://images.example/image.png" } })
  const [endpoint, request] = fetchMock.mock.calls[0]!
  expect(endpoint).toBe("https://existing.example/api/v3/upload")
  expect(request.headers.Authorization).toBe("Bearer test-token")
  expect(JSON.parse(request.body.get("params"))).toEqual({ dedup: true, album_id: 1516 })
  expect(request.body.get("file")).toBeInstanceOf(File)
  expect(request.body.get("image")).toBeNull()
  expect(request.redirect).toBe("error")
  expect(request.signal).toBeInstanceOf(AbortSignal)
})

test.each([
  ["primary", "https://aapi.helioho.st/upload.php"],
  ["secondary", "https://mtbed.netsons.org/upload.php"],
] as const)("uses the %s backup node with the image field and no existing credentials", async (server, endpoint) => {
  uploadEnv.IMAGE_UPLOAD_PROVIDER = "mtbed"
  uploadEnv.MTBED_UPLOAD_SERVER = server
  expect((await uploadImage(form())).code).toBe(200)
  const [url, request] = fetchMock.mock.calls[0]!
  expect(url).toBe(endpoint)
  expect(request.body.get("image")).toBeInstanceOf(File)
  expect(request.body.get("params")).toBeNull()
  expect(request.body.get("file")).toBeNull()
  expect(request.headers.Authorization).toBeUndefined()
  expect(request.headers.Origin).toBeUndefined()
  expect(request.headers.Referer).toBeUndefined()
})

test("unauthenticated uploads never reach the provider", async () => {
  jest.mocked(checkAuth).mockRejectedValueOnce(new Error("unauthorized"))
  expect((await uploadImage(form())).code).toBe(401)
  expect(fetchMock).not.toHaveBeenCalled()
})

test.each([new FormData(), form(new File([], "empty.png", { type: "image/png" }))])(
  "rejects missing or empty files",
  async (params) => {
    expect((await uploadImage(params)).code).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  }
)

test("rejects disguised text and active SVG content", async () => {
  for (const content of ["not an image", '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>']) {
    expect((await uploadImage(form(new File([content], "image.png", { type: "image/png" })))).code).toBe(415)
  }
  expect(fetchMock).not.toHaveBeenCalled()
})

test("validates the configured size before reading or uploading image bytes", async () => {
  uploadEnv.NEXT_PUBLIC_IMG_UPLOAD_LIMIT = "32b"
  expect((await uploadImage(form())).code).toBe(413)
  expect(fetchMock).not.toHaveBeenCalled()
})

test("the backup source caps each file at 20 MB even with a higher app limit", async () => {
  uploadEnv.IMAGE_UPLOAD_PROVIDER = "mtbed"
  uploadEnv.NEXT_PUBLIC_IMG_UPLOAD_LIMIT = "25mb"
  const file = new File([png], "large.png")
  const params = form(file)
  Object.defineProperty(params.get("file"), "size", { value: 20 * 1024 * 1024 + 1 })
  expect((await uploadImage(params)).code).toBe(413)
  expect(fetchMock).not.toHaveBeenCalled()
})

test("normalizes extension and MIME using actual bytes", async () => {
  await uploadImage(form(new File([png], "wrong.html", { type: "text/html" })))
  const file = fetchMock.mock.calls[0]![1].body.get("file") as File
  expect(file.name).toBe("upload.png")
  expect(file.type).toBe("image/png")
})

test("returns a useful 403 error without retrying or leaking upstream HTML", async () => {
  uploadEnv.IMAGE_UPLOAD_PROVIDER = "mtbed"
  fetchMock.mockResolvedValueOnce(new Response("private upstream details", { status: 403 }))
  expect(await uploadImage(form())).toEqual({ code: 502, message: expect.stringContaining("403"), data: null })
  expect(fetchMock).toHaveBeenCalledTimes(1)
})

test("handles non-JSON challenge pages", async () => {
  fetchMock.mockResolvedValueOnce(new Response("<html>challenge</html>"))
  expect((await uploadImage(form())).message).toContain("JSON")
})

test.each([
  { code: 500, data: { url: "https://images.example/file.png" } },
  { code: 200, data: { url: "javascript:alert(1)" } },
  { code: 200, data: { url: "https://user:password@images.example/file.png" } },
  { code: 200, data: { url: "" } },
  { code: 200 },
])("rejects invalid upstream success payloads", async (payload) => {
  fetchMock.mockResolvedValueOnce(Response.json(payload))
  expect((await uploadImage(form())).code).toBe(502)
})

test("returns a controlled timeout result", async () => {
  fetchMock.mockRejectedValueOnce(new DOMException("timed out", "TimeoutError"))
  expect((await uploadImage(form())).code).toBe(504)
  expect(fetchMock).toHaveBeenCalledTimes(1)
})

test("returns a controlled network failure", async () => {
  fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"))
  expect((await uploadImage(form())).code).toBe(502)
})

test("preserves timeout errors while reading an upstream response body", async () => {
  fetchMock.mockResolvedValueOnce({ ok: true, json: () => Promise.reject(new DOMException("aborted", "AbortError")) })
  expect((await uploadImage(form())).code).toBe(504)
})
