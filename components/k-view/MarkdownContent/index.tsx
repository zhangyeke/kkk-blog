import ReactMarkdown, { type Components } from "react-markdown"
import remarkDirective from "remark-directive"
import remarkGfm from "remark-gfm"
import { resolveVideoSource } from "@/lib/video-source"

type MarkdownNode = {
  type: string
  name?: string
  attributes?: Record<string, string | null | undefined>
  children?: MarkdownNode[]
  data?: Record<string, unknown>
}

function setElement(node: MarkdownNode, name: string, properties: Record<string, unknown>) {
  node.data = {
    ...node.data,
    hName: name,
    hProperties: properties,
  }
}

function remarkBlogDirectives() {
  return (tree: MarkdownNode) => {
    const walk = (node: MarkdownNode) => {
      if (node.type === "leafDirective" && node.name === "video") {
        setElement(node, "videoembed", { src: node.attributes?.src ?? "" })
      } else if (node.type === "containerDirective" && ["note", "tip", "info", "caution", "danger"].includes(node.name ?? "")) {
        const kind = node.name ?? "note"
        setElement(node, "aside", {
          className: `markdown-admonition markdown-admonition-${kind}`,
          "data-kind": kind,
        })
      } else if (node.type === "containerDirective" && node.name === "sandpack") {
        setElement(node, "div", { className: "markdown-sandpack" })
      } else if (node.type.endsWith("Directive")) {
        // Unknown directive syntax is shown as inert text instead of being interpreted as HTML/MDX.
        node.type = "paragraph"
        node.children = [{ type: "text", value: `未支持的内容块：${node.name ?? "directive"}` } as MarkdownNode]
      }

      node.children?.forEach(walk)
    }
    walk(tree)
  }
}

function MarkdownVideo({ src }: { src?: string }) {
  const source = resolveVideoSource(src ?? "")
  if (!source) return <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">视频地址无效</p>

  if (source.kind === "link") {
    return (
      <p className="my-4">
        <a href={source.src} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
          打开视频观看
        </a>
      </p>
    )
  }

  if (source.kind === "file") {
    return <video className="my-4 aspect-video w-full rounded-lg bg-black" src={source.src} controls playsInline preload="metadata" />
  }

  return (
    <div className="my-4 aspect-video overflow-hidden rounded-lg bg-black">
      <iframe
        className="size-full"
        src={source.src}
        title="文章视频"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  )
}

const components = {
  h1: ({ children }: React.ComponentProps<"h1">) => <h2 className="mb-4 mt-8 text-2xl font-bold first:mt-0">{children}</h2>,
  h2: ({ children }: React.ComponentProps<"h2">) => <h2 className="mb-3 mt-7 text-xl font-semibold">{children}</h2>,
  h3: ({ children }: React.ComponentProps<"h3">) => <h3 className="mb-2 mt-6 text-lg font-semibold">{children}</h3>,
  h4: ({ children }: React.ComponentProps<"h4">) => <h4 className="mb-2 mt-5 text-base font-semibold">{children}</h4>,
  p: ({ children }: React.ComponentProps<"p">) => <p className="my-4 leading-8">{children}</p>,
  a: ({ children, ...props }: React.ComponentProps<"a">) => (
    <a {...props} target={props.href?.startsWith("http") ? "_blank" : undefined} rel={props.href?.startsWith("http") ? "noopener noreferrer" : undefined} className="text-primary underline underline-offset-4">
      {children}
    </a>
  ),
  img: ({ src, alt, title }: React.ComponentProps<"img">) => {
    if (typeof src !== "string" || (!src.startsWith("/") && !src.startsWith("https://") && !src.startsWith("http://"))) return null
    // eslint-disable-next-line @next/next/no-img-element -- public articles may reference any image host; keep this native and lazy instead of requiring remotePatterns.
    return <img src={src} alt={alt ?? ""} title={title} loading="lazy" decoding="async" className="mx-auto my-5 h-auto max-w-full rounded-lg" />
  },
  ul: ({ children }: React.ComponentProps<"ul">) => <ul className="my-4 list-disc space-y-1 pl-6">{children}</ul>,
  ol: ({ children }: React.ComponentProps<"ol">) => <ol className="my-4 list-decimal space-y-1 pl-6">{children}</ol>,
  blockquote: ({ children }: React.ComponentProps<"blockquote">) => <blockquote className="my-4 border-l-4 border-primary/40 pl-4 text-muted-foreground">{children}</blockquote>,
  pre: ({ children }: React.ComponentProps<"pre">) => <pre className="my-4 overflow-x-auto rounded-lg bg-muted p-4 text-sm">{children}</pre>,
  code: ({ children, className }: React.ComponentProps<"code">) => <code className={`${className ?? ""} rounded bg-muted/70 px-1 py-0.5 font-mono text-sm`}>{children}</code>,
  hr: () => <hr className="my-8 border-border" />,
  table: ({ children }: React.ComponentProps<"table">) => <div className="my-5 overflow-x-auto"><table className="w-full border-collapse text-left">{children}</table></div>,
  th: ({ children }: React.ComponentProps<"th">) => <th className="border border-border bg-muted px-3 py-2 font-semibold">{children}</th>,
  td: ({ children }: React.ComponentProps<"td">) => <td className="border border-border px-3 py-2 align-top">{children}</td>,
  aside: ({ children, className }: React.ComponentProps<"aside">) => <aside className={`${className ?? ""} my-4 rounded-md border-l-4 border-primary/50 bg-muted/50 px-4 py-2`}>{children}</aside>,
  videoembed: MarkdownVideo,
  div: ({ children, className }: React.ComponentProps<"div">) => <div className={className === "markdown-sandpack" ? "my-4 rounded-lg border border-border bg-muted/40 p-4" : className}>{children}</div>,
} as Components

function removeFrontmatter(markdown: string) {
  return markdown.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---\r?\n/, "")
}

export function MarkdownContent({ markdown }: { markdown: string }) {
  return (
    <article className="markdown-content break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkDirective, remarkBlogDirectives]} components={components}>
        {removeFrontmatter(markdown)}
      </ReactMarkdown>
    </article>
  )
}
