import { chromium } from "@playwright/test"

const BASE = "http://127.0.0.1:3000"
const EMAIL = process.env.E2E_EMAIL
const PASSWORD = process.env.E2E_PASSWORD
if (!EMAIL || !PASSWORD) throw new Error("请先设置 E2E_EMAIL 和 E2E_PASSWORD 环境变量")

const PAGES = [
    "/admin",
    "/admin/posts",
    "/admin/bookmarks",
    "/admin/footprints",
    "/admin/users",
    "/admin/settings",
    "/admin/settings/preferences",
    "/admin/settings/permissions",
    "/admin/forbidden",
]

const COLLECT = () => {
    const out = []
    const nodes = document.querySelectorAll(
        'button, a[href], [role="button"], [role="switch"], [role="tab"], input[type="submit"], input[type="button"], summary, select',
    )
    for (const el of nodes) {
        const cs = getComputedStyle(el)
        if (cs.display === "none" || cs.visibility === "hidden") continue
        const rect = el.getBoundingClientRect()
        if (rect.width === 0 && rect.height === 0) continue
        // 找最近的带 id 的祖先，方便定位
        out.push({
            tag: el.tagName.toLowerCase(),
            role: el.getAttribute("role") || "",
            type: el.getAttribute("type") || "",
            label: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 24),
            cls: (el.className && typeof el.className === "string" ? el.className : "").slice(0, 90),
            cursor: cs.cursor,
            disabled: el.disabled === true,
        })
    }
    return out
}

const browser = await chromium.launch({ channel: "chrome" })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

// ---- 登录 ----
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" })
await page.locator("#email").fill(EMAIL)
await page.locator('input[type="password"]').first().fill(PASSWORD)
await page.getByRole("button", { name: "登录" }).first().click()
await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60000 })
console.log("LOGIN OK ->", new URL(page.url()).pathname)

const all = []
for (const path of PAGES) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 60000 })
    await page.waitForTimeout(400)
    // 打开主题切换浮层，才能测到里面的 9 个预设按钮
    if (path === "/admin") {
        const trigger = page.locator('button[aria-label="切换主题风格"]')
        if (await trigger.count()) {
            await trigger.click()
            await page.waitForTimeout(400)
        }
    }
    const rows = await page.evaluate(COLLECT)
    all.push({ path, rows })
}

await browser.close()

let bad = 0
for (const { path, rows } of all) {
    const offenders = rows.filter((r) => !r.disabled && r.cursor !== "pointer")
    console.log(`\n=== ${path}  (共 ${rows.length} 个可点击元素，非 pointer ${offenders.length}) ===`)
    const seen = new Set()
    for (const r of offenders) {
        const key = `${r.tag}|${r.label}|${r.cls.slice(0, 40)}`
        if (seen.has(key)) continue
        seen.add(key)
        bad++
        console.log(`  [${r.tag}${r.role ? " role=" + r.role : ""}] cursor=${r.cursor}  "${r.label}"`)
        console.log(`      class: ${r.cls}`)
    }
}
console.log(`\n### 非 pointer 唯一元素合计: ${bad}`)
