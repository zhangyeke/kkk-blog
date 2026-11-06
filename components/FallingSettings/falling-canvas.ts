import { clampFallingDensity, clampFallingSpeed, type FallingDirection, fallingSizeLimits, getFallingArtwork } from "@/lib/falling-patterns"

const fallingCycleMs = 14000
const rainCycleMs = 1300
const maxCanvasPixels = 2_500_000
const frameIntervalMs = 16
const fireworkColors = getFallingArtwork("fireworks").colors
const sparks = Array.from({ length: 16 }, (_, index) => {
  const angle = index * Math.PI / 8
  return { x: Math.cos(angle), y: Math.sin(angle), reach: index % 2 ? 0.76 : 1 }
})

type Motion = "float" | "rain" | "meteor" | "fireworks"

// Spread successive particles across the largest gaps in the cycle, even as density changes.
function phaseAt(index: number) {
  let phase = 0
  for (let place = 0.5; index > 0; place /= 2, index >>= 1) {
    phase += (index & 1) * place
  }
  return phase
}

type Particle = {
  phase: number
  firstCycle: number
  cycle: number
  sizeSeed: number
  colorSeed: number
  anchor: number
  wind: number
  drift: number
  period: number
  offset: number
  tilt: number
  glide: number
  opacity: number
}

export function createFallingCanvas(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d")
  if (!context) return undefined
  const ctx = context
  const particles: Particle[] = []
  let width = 0
  let height = 0
  let direction: FallingDirection = "down"
  let scaleX = 1
  let scaleY = 1
  let rainDrift = 0
  let rainCos = 1
  let rainSin = 0
  let elapsed = 0
  let speed = 1
  let minSize = 14
  let maxSize = 28
  let sprites: readonly HTMLCanvasElement[] = []
  let motion: Motion = "float"
  let running = false
  let frame: number | undefined
  let lastDraw: number | undefined
  let nextDraw: number | undefined

  function resize() {
    const horizontal = direction === "left" || direction === "right"
    const viewportWidth = canvas.clientWidth
    const viewportHeight = canvas.clientHeight
    width = horizontal ? viewportHeight : viewportWidth
    height = horizontal ? viewportWidth : viewportHeight
    if (!width || !height) return
    const scale = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(maxCanvasPixels / (width * height)))
    const pixelWidth = Math.max(1, Math.floor(viewportWidth * scale))
    const pixelHeight = Math.max(1, Math.floor(viewportHeight * scale))
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight
    scaleX = pixelWidth / viewportWidth
    scaleY = pixelHeight / viewportHeight
    rainDrift = Math.min(width * 0.18, height * 0.21)
    const rainAngle = -Math.atan2(rainDrift, height)
    rainCos = Math.cos(rainAngle)
    rainSin = Math.sin(rainAngle)
  }

  function position(x: number, y: number, cos = 1, sin = 0) {
    switch (direction) {
      case "up":
        ctx.setTransform(-scaleX * cos, -scaleY * sin, scaleX * sin, -scaleY * cos, (width - x) * scaleX, (height - y) * scaleY)
        break
      case "left":
        ctx.setTransform(-scaleX * sin, scaleY * cos, -scaleX * cos, -scaleY * sin, (height - y) * scaleX, x * scaleY)
        break
      case "right":
        ctx.setTransform(scaleX * sin, -scaleY * cos, scaleX * cos, scaleY * sin, y * scaleX, (width - x) * scaleY)
        break
      default:
        ctx.setTransform(scaleX * cos, scaleY * sin, -scaleX * sin, scaleY * cos, x * scaleX, y * scaleY)
    }
  }

  function drawFirework(progress: number, particle: Particle, size: number) {
    const x = width * (0.18 + particle.anchor * 0.64)
    const end = height * (0.34 + particle.sizeSeed * 0.32)
    ctx.strokeStyle = fireworkColors[Math.floor(particle.colorSeed * fireworkColors.length)]!
    ctx.lineWidth = Math.max(1, size / 18)
    ctx.beginPath()
    if (progress < 0.32) {
      position(x, -14 + (end + 14) * progress / 0.32)
      ctx.globalAlpha = 0.85
      ctx.moveTo(0, -Math.max(8, size * 0.55))
      ctx.lineTo(0, 0)
    } else {
      const burst = (progress - 0.32) / 0.68
      const radius = Math.max(10, size * 1.8) * (1 - (1 - burst) ** 2)
      position(x, end)
      ctx.globalAlpha = (1 - burst) ** 1.5
      for (const spark of sparks) {
        const distance = radius * spark.reach
        ctx.moveTo(spark.x * distance * 0.72, spark.y * distance * 0.72)
        ctx.lineTo(spark.x * distance, spark.y * distance)
      }
    }
    ctx.stroke()
  }

  function clear() {
    ctx.resetTransform()
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  function draw() {
    if ((!sprites.length && motion !== "fireworks") || !width || !height) return
    clear()

    const count = motion === "fireworks" ? Math.ceil(particles.length / 10) : particles.length
    for (let index = 0; index < count; index++) {
      const particle = particles[index]!
      const time = elapsed - particle.phase
      const cycle = Math.floor(time)
      if (cycle < particle.firstCycle) continue
      if (cycle !== particle.cycle) {
        particle.cycle = cycle
        particle.sizeSeed = Math.random()
        particle.colorSeed = Math.random()
        particle.anchor = Math.random()
        particle.wind = 24 + Math.random() * 48
        particle.drift = (Math.random() - 0.5) * 160
        particle.period = 2.2 + Math.random() * 1.6
        particle.offset = Math.random() * Math.PI * 2
        particle.tilt = 0.18 + Math.random() * 0.38
        particle.glide = (Math.random() - 0.5) * 0.32
        particle.opacity = 0.64 + Math.random() * 0.24
      }

      const progress = time - cycle
      const size = minSize + Math.floor(particle.sizeSeed * (maxSize - minSize + 1))
      if (motion === "fireworks") {
        drawFirework(progress, particle, size)
        continue
      }
      const sprite = sprites[Math.floor(particle.colorSeed * sprites.length)]!

      if (motion === "rain" || motion === "meteor") {
        const length = motion === "meteor" ? Math.max(30, size * 3) : Math.max(14, size * 1.55)
        const y = progress * (height + length * 2) - length
        if (y < -length / 2 || y > height + length / 2) continue
        const x = particle.anchor * (width + rainDrift) + (progress - 1) * rainDrift
        position(x, y, rainCos, rainSin)
        ctx.globalAlpha = particle.opacity
        ctx.drawImage(sprite, -size / 2, -length / 2, size, length)
        continue
      }

      const padding = size * 0.75
      const glide = progress + particle.glide * Math.sin(progress * Math.PI) / Math.PI
      const y = glide * (height + 2 * padding) - padding
      const extent = size * Math.SQRT1_2
      if (y < -extent || y > height + extent) continue

      const angle = progress * particle.period * Math.PI * 2 + particle.offset
      const wind = Math.min(width * 0.12, particle.wind)
      const drift = particle.drift * Math.min(1, width / 600)
      const margin = Math.min(width / 2, wind + Math.abs(drift) / 2 + size * 0.2)
      const x = margin + particle.anchor * (width - margin * 2) + Math.sin(angle) * wind + (progress - 0.5) * drift
      const rotation = Math.sin(angle + 0.8) * particle.tilt
      const cos = Math.cos(rotation)
      const sin = Math.sin(rotation)
      position(x, y, cos, sin)
      ctx.globalAlpha = particle.opacity
      ctx.drawImage(sprite, -size / 2, -size / 2, size, size)
    }
  }

  function schedule() {
    if (running && (sprites.length || motion === "fireworks") && frame === undefined) {
      frame = window.requestAnimationFrame(tick)
    }
  }

  function tick(now: number) {
    frame = undefined
    if (nextDraw === undefined || now >= nextDraw) {
      // Keep the unused portion of the refresh interval on high-refresh displays.
      nextDraw = Math.max(now, (nextDraw ?? now) + frameIntervalMs)
      if (lastDraw !== undefined) {
        const duration = motion === "float" ? fallingCycleMs : motion === "rain" ? rainCycleMs : motion === "meteor" ? 2200 : 3400
        elapsed += Math.min(now - lastDraw, 64) * speed / duration
      }
      lastDraw = now
      draw()
    }
    schedule()
  }

  function pause() {
    if (frame !== undefined) window.cancelAnimationFrame(frame)
    frame = lastDraw = nextDraw = undefined
  }

  resize()
  window.addEventListener("resize", resize)

  return {
    setOptions(density: number, min: number, max: number, nextSpeed: number) {
      speed = clampFallingSpeed(nextSpeed)
      minSize = Math.round(Math.max(fallingSizeLimits.min, Math.min(min, fallingSizeLimits.max)))
      maxSize = Math.round(Math.max(minSize, Math.min(max, fallingSizeLimits.max)))
      const count = clampFallingDensity(density) * 5
      while (particles.length < count) {
        const phase = phaseAt(particles.length)
        particles.push({
          phase,
          firstCycle: Math.max(0, Math.ceil(elapsed - phase)),
          cycle: -1,
          sizeSeed: 0,
          colorSeed: 0,
          anchor: 0,
          wind: 0,
          drift: 0,
          period: 0,
          offset: 0,
          tilt: 0,
          glide: 0,
          opacity: 0,
        })
      }
      particles.length = count
    },
    setDirection(nextDirection: FallingDirection) {
      if (direction === nextDirection) return
      direction = nextDirection
      resize()
    },
    setSprites(nextSprites: readonly HTMLCanvasElement[], nextMotion: Motion = "float") {
      sprites = nextSprites
      motion = nextMotion
      if (!sprites.length && motion !== "fireworks") {
        pause()
        clear()
      }
      schedule()
    },
    setRunning(nextRunning: boolean) {
      running = nextRunning
      if (!running) pause()
      schedule()
    },
    dispose() {
      running = false
      pause()
      window.removeEventListener("resize", resize)
    },
  }
}
