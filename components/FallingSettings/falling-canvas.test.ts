import { createFallingCanvas } from "./falling-canvas"

test("starts above the viewport, recycles at minimum density and pauses without advancing", () => {
  const canvas = document.createElement("canvas")
  Object.defineProperties(canvas, {
    clientWidth: { value: 390 },
    clientHeight: { value: 800 },
  })
  const context = {
    resetTransform: jest.fn(),
    clearRect: jest.fn(),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
  }
  jest.spyOn(canvas, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D)
  jest.spyOn(Math, "random").mockReturnValue(0.5)
  let pending: FrameRequestCallback | undefined
  jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    pending = callback
    return 1
  })
  jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {
    pending = undefined
  })
  const engine = createFallingCanvas(canvas)!
  const tick = (time: number) => {
    context.drawImage.mockClear()
    pending!(time)
    return context.drawImage.mock.calls.length
  }

  try {
    engine.setOptions(1, 20, 20, 1)
    const firstColor = document.createElement("canvas")
    const secondColor = document.createElement("canvas")
    engine.setSprites([firstColor, secondColor])
    engine.setRunning(true)
    expect(tick(0)).toBe(0)

    let framesWithParticles = 0
    let gaps = 0
    for (let time = 16; time <= 45000; time += 16) {
      if (tick(time)) framesWithParticles++
      else if (framesWithParticles) gaps++
    }
    expect(framesWithParticles).toBeGreaterThan(2500)
    expect(gaps).toBe(0)
    expect(context.drawImage.mock.calls[0]?.[0]).toBe(secondColor)
    expect(context.setTransform.mock.calls.every(([a, b, c, d]) => Math.abs(a * d - b * c - 1) < 0.000001)).toBe(true)
    expect(context.setTransform.mock.calls.some(([, b]) => Math.abs(b) > 0.1)).toBe(true)
    const previousPosition = context.setTransform.mock.lastCall
    engine.setRunning(false)
    expect(pending).toBeUndefined()
    engine.setRunning(true)
    tick(60000)
    expect(context.setTransform.mock.lastCall).toEqual(previousPosition)
    const [,,,, x, y] = previousPosition!
    engine.setDirection("up")
    tick(60016)
    const [,,,, upX, upY] = context.setTransform.mock.lastCall!
    expect(upX).toBeCloseTo(390 - x, -1)
    expect(upY).toBeCloseTo(800 - y, -1)
    engine.setDirection("right")
    tick(60032)
    const [,,,, rightX, rightY] = context.setTransform.mock.lastCall!
    engine.setDirection("left")
    tick(60048)
    const [,,,, leftX, leftY] = context.setTransform.mock.lastCall!
    expect(leftX + rightX).toBeCloseTo(390, -1)
    expect(leftY + rightY).toBeCloseTo(800, -1)
    engine.setSprites([firstColor], "meteor")
    tick(60064)
    expect(context.drawImage.mock.calls.some(([, , , width, height]) => height === width * 3)).toBe(true)

    engine.setSprites([firstColor], "fireworks")
    let widestBurst = 0
    for (let time = 60080; time < 64000; time += 16) {
      context.lineTo.mockClear()
      expect(tick(time)).toBe(0)
      widestBurst = Math.max(widestBurst, context.lineTo.mock.calls.length)
    }
    expect(widestBurst).toBe(16)

    context.clearRect.mockClear()
    for (let frame = 0; frame < 90; frame++) tick(65000 + frame * 1000 / 90)
    expect(context.clearRect.mock.calls.length).toBeGreaterThanOrEqual(58)
    expect(context.clearRect.mock.calls.length).toBeLessThanOrEqual(64)
  } finally {
    engine.dispose()
    jest.restoreAllMocks()
  }
})
