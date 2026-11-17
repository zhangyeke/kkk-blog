/** Shared, side-effect-free helpers for normalizing Markdown video embeds. */
export type VideoSource = { kind: "file" | "iframe" | "link"; src: string }

const VIDEO_FILE_RE = /\.(mp4|webm|ogg|ogv|mov|m4v)$/i
const LINK_ONLY_HOSTS = ["douyin.com", "iesdouyin.com"]
const URL_IN_TEXT_RE = /https?:\/\/[^\s<>"'“”‘’【】（）()，。；、]+/i
const EMBED_TAG_RE = /<(?:iframe|video|embed|source)\b[^>]*\ssrc\s*=\s*["']([^"']+)["']/i

function normalizeUrl(raw: string): string | null {
  const value = raw.trim()
  if (!value) return null
  const candidate = value.startsWith("//") ? `https:${value}` : value
  try {
    const url = new URL(candidate)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    return url.href
  } catch {
    return null
  }
}

export function isEmbedCode(input: string): boolean {
  return EMBED_TAG_RE.test(input)
}

export function extractVideoUrl(input: string): string | null {
  const embedSrc = input.match(EMBED_TAG_RE)?.[1]
  if (embedSrc) {
    const normalized = normalizeUrl(embedSrc)
    if (normalized) return normalized
  }

  const match = input.match(URL_IN_TEXT_RE)
  if (match) return normalizeUrl(match[0])
  if (input.trim().startsWith("//")) return normalizeUrl(input)
  return null
}

export function resolveVideoSource(input: string): VideoSource | null {
  const href = extractVideoUrl(input)
  if (!href) return null

  const url = new URL(href)
  const host = url.hostname.replace(/^www\./, "").toLowerCase()

  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be") {
    const id =
      host === "youtu.be"
        ? url.pathname.slice(1)
        : (url.searchParams.get("v") ?? url.pathname.match(/\/(?:shorts|embed)\/([\w-]+)/)?.[1] ?? "")
    return id ? { kind: "iframe", src: `https://www.youtube.com/embed/${encodeURIComponent(id)}` } : null
  }

  if (host === "bilibili.com" || host === "m.bilibili.com") {
    const bvid = url.pathname.match(/\/video\/(BV[\w]+)/i)?.[1]
    if (bvid) return { kind: "iframe", src: `https://player.bilibili.com/player.html?bvid=${bvid}&autoplay=0` }
    const aid = url.pathname.match(/\/video\/av(\d+)/i)?.[1]
    if (aid) return { kind: "iframe", src: `https://player.bilibili.com/player.html?aid=${aid}&autoplay=0` }
    return null
  }

  if (VIDEO_FILE_RE.test(url.pathname)) return { kind: "file", src: url.href }
  if (LINK_ONLY_HOSTS.some((item) => host === item || host.endsWith(`.${item}`))) {
    return { kind: "link", src: url.href }
  }
  return { kind: "iframe", src: url.href }
}
