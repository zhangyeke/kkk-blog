import { render, screen } from "@testing-library/react"
import { buildVideoDirective, extractVideoUrl, isEmbedCode, resolveVideoSource, VideoEmbed } from "./video-directive"

// 视频指令测试只验证解析和渲染，不访问上传 Server Action。
jest.mock("@/env.mjs", () => ({ env: { NEXT_PUBLIC_IMG_UPLOAD_LIMIT: "3mb" } }))
jest.mock("@/service/fileUpload", () => ({ uploadImage: jest.fn() }))

test.each([
    ["https://www.bilibili.com/video/BV1xx411c7mD?spm_id_from=333", "https://player.bilibili.com/player.html?bvid=BV1xx411c7mD&autoplay=0"],
    ["https://m.bilibili.com/video/av170001", "https://player.bilibili.com/player.html?aid=170001&autoplay=0"],
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://www.youtube.com/embed/dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ", "https://www.youtube.com/embed/dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/abc123", "https://www.youtube.com/embed/abc123"],
])("converts platform links to embed urls: %s", (input, expected) => {
    expect(resolveVideoSource(input)).toEqual({ kind: "iframe", src: expected })
})

test("treats direct video files as media elements", () => {
    expect(resolveVideoSource("https://cdn.example.com/clip.MP4?token=1")).toEqual({
        kind: "file",
        src: "https://cdn.example.com/clip.MP4?token=1",
    })
})

test("falls back to embedding unknown http pages", () => {
    expect(resolveVideoSource("https://player.example.com/watch/1")).toEqual({
        kind: "iframe",
        src: "https://player.example.com/watch/1",
    })
})

test.each(["", "   ", "not a url", "javascript:alert(1)", "data:video/mp4;base64,AAAA"])(
    "rejects unsafe or malformed input: %s",
    (input) => {
        expect(resolveVideoSource(input)).toBeNull()
        expect(buildVideoDirective(input)).toBeNull()
    }
)

test("builds a leaf directive with the source attribute", () => {
    expect(buildVideoDirective(" https://youtu.be/dQw4w9WgXcQ ")).toBe(
        '\n\n::video{src="https://youtu.be/dQw4w9WgXcQ"}\n\n'
    )
})

test("extracts the link out of a share message with a title", () => {
    const shared =
        "【为什么说「庞镜」是《彰之刃零》绝对的核心？细节故事解析第三期】 https://www.bilibili.com/video/BV1Fw4h64Ee4/?share_source=copy_web&vd_source=70263833166eba2e51869ea3c6024"

    expect(extractVideoUrl(shared)).toBe(
        "https://www.bilibili.com/video/BV1Fw4h64Ee4/?share_source=copy_web&vd_source=70263833166eba2e51869ea3c6024"
    )
    expect(resolveVideoSource(shared)).toEqual({
        kind: "iframe",
        src: "https://player.bilibili.com/player.html?bvid=BV1Fw4h64Ee4&autoplay=0",
    })
    // 指令里只写链接，不写分享文案
    expect(buildVideoDirective(shared)).toBe(
        '\n\n::video{src="https://www.bilibili.com/video/BV1Fw4h64Ee4/?share_source=copy_web&vd_source=70263833166eba2e51869ea3c6024"}\n\n'
    )
})

test("handles links surrounded by text or punctuation", () => {
    expect(resolveVideoSource("看这个 https://youtu.be/dQw4w9WgXcQ 很有意思")).toEqual({
        kind: "iframe",
        src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    })
    expect(resolveVideoSource("（https://cdn.example.com/a.mp4）")).toEqual({
        kind: "file",
        src: "https://cdn.example.com/a.mp4",
    })
})

test("returns no link when the text has none", () => {
    expect(extractVideoUrl("这段文字里没有链接")).toBeNull()
})

test("accepts bilibili embed code with a protocol-relative src", () => {
    const embed =
        '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=117564579515487&bvid=BV1Fw4h64Ee4&cid=43358488383&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>'
    const expected = "https://player.bilibili.com/player.html?isOutside=true&aid=117564579515487&bvid=BV1Fw4h64Ee4&cid=43358488383&p=1"

    expect(isEmbedCode(embed)).toBe(true)
    expect(extractVideoUrl(embed)).toBe(expected)
    // 播放器地址本身就是可嵌入的，保留原始参数
    expect(resolveVideoSource(embed)).toEqual({ kind: "iframe", src: expected })
    expect(buildVideoDirective(embed)).toBe(`\n\n::video{src="${expected}"}\n\n`)
})

test("accepts youtube embed code and video tags", () => {
    const youtube =
        '<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=abc" title="YouTube video player" frameborder="0" allowfullscreen></iframe>'
    expect(resolveVideoSource(youtube)).toEqual({
        kind: "iframe",
        src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    })

    const video = '<video src="//cdn.example.com/clip.mp4" controls></video>'
    expect(resolveVideoSource(video)).toEqual({ kind: "file", src: "https://cdn.example.com/clip.mp4" })
})

test("accepts a bare protocol-relative address", () => {
    expect(extractVideoUrl("//player.bilibili.com/player.html?bvid=BV1Fw4h64Ee4")).toBe(
        "https://player.bilibili.com/player.html?bvid=BV1Fw4h64Ee4"
    )
})

test("degrades douyin share links to a click-through card", () => {
    const shared =
        "2.84 vse:/ :1pm 12/01 q@e.Bt 英语高频词2000常用词/每天听读两遍/一年听懂外国人听懂美剧  https://v.douyin.com/n90jggvK_EY/ 复制此链接，打开Dou音搜索，直接观看视频！"

    expect(extractVideoUrl(shared)).toBe("https://v.douyin.com/n90jggvK_EY/")
    // 抖音分享页带 X-Frame-Options / frame-ancestors，站外只能跳转
    expect(resolveVideoSource(shared)).toEqual({ kind: "link", src: "https://v.douyin.com/n90jggvK_EY/" })
    expect(resolveVideoSource("https://www.douyin.com/video/7693704030937483493")).toEqual({
        kind: "link",
        src: "https://www.douyin.com/video/7693704030937483493",
    })
})

test("renders douyin as an external link card", () => {
    render(<VideoEmbed src="https://v.douyin.com/n90jggvK_EY/"/>)
    const link = screen.getByRole("link", { name: /在抖音观看/ })
    expect(link).toHaveAttribute("href", "https://v.douyin.com/n90jggvK_EY/")
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
    expect(document.querySelector("iframe")).toBeNull()
})

test("renders an iframe for embedded players and a video element for files", () => {
    const { rerender } = render(<VideoEmbed src="https://www.bilibili.com/video/BV1xx411c7mD" />)
    const iframe = document.querySelector("iframe")
    expect(iframe).toHaveAttribute("src", "https://player.bilibili.com/player.html?bvid=BV1xx411c7mD&autoplay=0")
    expect(iframe).toHaveAttribute("allowfullscreen")

    rerender(<VideoEmbed src="https://cdn.example.com/clip.mp4" />)
    expect(document.querySelector("video")).toHaveAttribute("src", "https://cdn.example.com/clip.mp4")
})

test("shows a readable message for unusable addresses", () => {
    render(<VideoEmbed src="javascript:alert(1)" />)
    expect(screen.getByText(/无法识别的视频地址/)).toBeInTheDocument()
})
