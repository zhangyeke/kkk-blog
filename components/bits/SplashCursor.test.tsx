import { cleanup, render } from "@testing-library/react"
import SplashCursor from "./SplashCursor"

jest.mock("@/hooks", () => ({
  useAppStore: (selector: (state: { trackMouse: boolean }) => unknown) => selector({ trackMouse: true }),
}))

function createGL(supported: (format: number) => boolean) {
  let format = 0
  let nextConstant = 0x10000
  const methods: Record<string, unknown> = {
    RGBA16F: 0x881a,
    RG16F: 0x822f,
    R16F: 0x822d,
    RGBA: 0x1908,
    RG: 0x8227,
    RED: 0x1903,
    HALF_FLOAT: 0x140b,
    FRAMEBUFFER_COMPLETE: 0x8cd5,
    ACTIVE_UNIFORMS: 0x8b86,
    drawingBufferWidth: 1,
    drawingBufferHeight: 1,
    getExtension: jest.fn(() => null),
    createTexture: jest.fn(() => ({})),
    createFramebuffer: jest.fn(() => ({})),
    createShader: jest.fn(() => ({})),
    createProgram: jest.fn(() => ({})),
    getShaderParameter: jest.fn(() => true),
    getProgramParameter: jest.fn((_program, parameter) => parameter === 0x8b86 ? 0 : true),
    texImage2D: jest.fn((_target, _level, value) => { format = value }),
    checkFramebufferStatus: jest.fn(() => supported(format) ? 0x8cd5 : 0x8cd6),
  }
  return new Proxy(methods, {
    get(target, key: string) {
      if (!(key in target)) target[key] = /^[A-Z0-9_]+$/.test(key) ? nextConstant++ : jest.fn()
      return target[key]
    },
  })
}

function installContext(gl: ReturnType<typeof createGL>, kind = "webgl2") {
  jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    ((requested: string) => requested === kind ? gl : null) as never,
  )
}

beforeEach(() => {
  jest.spyOn(window, "requestAnimationFrame").mockReturnValue(1)
  jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {})
  jest.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  cleanup()
  jest.restoreAllMocks()
})

test("skips the effect when WebGL is unavailable", () => {
  jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null)
  expect(() => render(<SplashCursor />)).not.toThrow()
  expect(window.requestAnimationFrame).not.toHaveBeenCalled()
})

test("does not initialize shaders when no floating-point framebuffer format is renderable", () => {
  const gl = createGL(() => false)
  installContext(gl)
  expect(() => render(<SplashCursor />)).not.toThrow()
  expect(gl.createShader).not.toHaveBeenCalled()
  expect(window.requestAnimationFrame).not.toHaveBeenCalled()
  expect(gl.deleteTexture).toHaveBeenCalledTimes((gl.createTexture as jest.Mock).mock.calls.length)
  expect(gl.deleteFramebuffer).toHaveBeenCalledTimes((gl.createFramebuffer as jest.Mock).mock.calls.length)
})

test("skips WebGL 1 without the half-float texture extension", () => {
  const gl = createGL(() => true)
  installContext(gl, "webgl")
  expect(() => render(<SplashCursor />)).not.toThrow()
  expect(gl.texImage2D).not.toHaveBeenCalled()
  expect(window.requestAnimationFrame).not.toHaveBeenCalled()
})

test("skips the effect when GPU texture allocation fails", () => {
  const gl = createGL(() => true)
  ;(gl.createTexture as jest.Mock).mockReturnValue(null)
  installContext(gl)
  expect(() => render(<SplashCursor />)).not.toThrow()
  expect(gl.createShader).not.toHaveBeenCalled()
  expect(window.requestAnimationFrame).not.toHaveBeenCalled()
})

test("keeps rendering when single-channel formats can fall back to RGBA", () => {
  const gl = createGL(format => format === 0x881a)
  installContext(gl)
  const { unmount } = render(<SplashCursor />)
  expect(gl.createShader).toHaveBeenCalled()
  expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1)
  unmount()
  expect(window.cancelAnimationFrame).toHaveBeenCalledWith(1)
})

test("clears the display with transparent alpha before showing the canvas", () => {
  const gl = createGL(() => true)
  installContext(gl)
  const { container } = render(<SplashCursor />)
  expect(gl.clearColor).toHaveBeenLastCalledWith(0, 0, 0, 0)
  expect(container.querySelector("canvas")).toHaveStyle({ visibility: "visible" })
})

test("keeps the overlay hidden if a frame fails", () => {
  const gl = createGL(() => true)
  ;(gl.drawElements as jest.Mock).mockImplementation(() => { throw new Error("GPU draw failed") })
  installContext(gl)
  const { container } = render(<SplashCursor />)
  expect(container.querySelector("canvas")).toHaveStyle({ visibility: "hidden" })
  expect(window.requestAnimationFrame).not.toHaveBeenCalled()
})
