import { fireEvent, render } from "@testing-library/react"
import FallingOverlay from "./FallingOverlay"
import { createFallingCanvas } from "./falling-canvas"
import { createImageSprite, createPatternSprites } from "./falling-sprite"

const mockState = {
  fallingDensity: 4,
  fallingEnabled: true,
  fallingPattern: "petal",
  fallingImage: "",
  fallingSizes: [14, 28],
  fallingSpeed: 1,
}

const mockEngine = {
  dispose: jest.fn(),
  setOptions: jest.fn(),
  setDirection: jest.fn(),
  setRunning: jest.fn(),
  setSprites: jest.fn(),
}

jest.mock("@/hooks", () => ({
  useAppStore: (selector: (state: typeof mockState) => unknown) => selector(mockState),
}))
jest.mock("./falling-canvas", () => ({
  createFallingCanvas: jest.fn(() => mockEngine),
}))
jest.mock("./falling-sprite", () => ({
  createImageSprite: jest.fn(),
  createPatternSprites: jest.fn(() => []),
}))

beforeEach(() => {
  Object.assign(mockState, {
    fallingEnabled: true,
    fallingPattern: "petal",
    fallingImage: "",
    fallingDensity: 4,
    fallingSpeed: 1,
  })
  jest.clearAllMocks()
})
afterEach(() => jest.restoreAllMocks())

test("updates the settings and pauses the same canvas without restarting the particle stream", () => {
  const { container, rerender } = render(<FallingOverlay running />)
  const canvas = container.querySelector("canvas")
  expect(canvas).toHaveAttribute("aria-hidden", "true")
  expect(mockEngine.setOptions).toHaveBeenLastCalledWith(4, 14, 28, 1)
  expect(createPatternSprites).toHaveBeenLastCalledWith("petal")

  Object.assign(mockState, { fallingDensity: 10, fallingSpeed: 2, fallingPattern: "autumn" })
  rerender(<FallingOverlay running={false} />)
  expect(container.querySelector("canvas")).toBe(canvas)
  expect(createFallingCanvas).toHaveBeenCalledTimes(1)
  expect(mockEngine.setOptions).toHaveBeenLastCalledWith(10, 14, 28, 2)
  expect(mockEngine.setRunning).toHaveBeenLastCalledWith(false)
  expect(createPatternSprites).toHaveBeenCalledWith("leaf")
  expect(createPatternSprites).toHaveBeenLastCalledWith("treeLeaf")
  expect(mockEngine.setSprites).toHaveBeenLastCalledWith([], "float")

  mockState.fallingPattern = "summer"
  rerender(<FallingOverlay running />)
  expect(createPatternSprites).toHaveBeenLastCalledWith("rain")
  expect(mockEngine.setSprites).toHaveBeenLastCalledWith([], "rain")

  mockState.fallingPattern = "none"
  rerender(<FallingOverlay running />)
  expect(container).toBeEmptyDOMElement()
  expect(mockEngine.dispose).toHaveBeenCalledTimes(1)
})

test("waits for a custom image, caches the loaded image and falls back if loading fails", () => {
  mockState.fallingPattern = "image"
  const image = document.createElement("img")
  const sprite = document.createElement("canvas")
  const loadImage = jest.spyOn(window, "Image").mockReturnValue(image)
  jest.mocked(createImageSprite).mockReturnValue(sprite)
  const { container, rerender } = render(<FallingOverlay running />)
  expect(container).toBeEmptyDOMElement()
  expect(loadImage).not.toHaveBeenCalled()

  mockState.fallingImage = "https://images.example/petal.png"
  rerender(<FallingOverlay running />)
  expect(image.src).toBe(mockState.fallingImage)
  expect(image.referrerPolicy).toBe("no-referrer")
  fireEvent.load(image)
  expect(createImageSprite).toHaveBeenCalledWith(image)
  expect(mockEngine.setSprites).toHaveBeenLastCalledWith([sprite])

  mockState.fallingImage = "https://images.example/missing.png"
  rerender(<FallingOverlay running />)
  fireEvent.error(image)
  expect(createPatternSprites).toHaveBeenLastCalledWith("petal")
})
