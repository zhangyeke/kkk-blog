/**
 * 回归验证：cursor-pointer 修复的行为回归
 * 1) 刷新按钮 disabled 态 cursor 应为 not-allowed
 * 2) 主题预设按钮点击后 data-preset 切换 + 浮层关闭
 * 3) 偏好开关 aria-checked 可切换
 * 4) 无 console error / pageerror
 *
 * 只读验证，不修改源码。运行：node e2e/cursor-regression.mjs
 */
import { chromium } from "@playwright/test"

const BASE = "http://127.0.0.1:3000"
const EMAIL = process.env.E2E_EMAIL
const PASSWORD = process.env.E2E_PASSWORD
if (!EMAIL || !PASSWORD) throw new Error("请先设置 E2E_EMAIL 和 E2E_PASSWORD 环境变量")

const results = []
const ok = (name, pass, detail) => {
    results.push({ name, pass, detail })
    console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  ->  " + detail : ""}`)
}

const browser = await chromium.launch({ channel: "chrome" })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

// ---- 控制台错误收集（在导航前挂载）----
const consoleErrors = []
const pageErrors = []
page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text())
})
page.on("pageerror", (err) => pageErrors.push(String(err && err.message ? err.message : err)))

// ---- 登录 ----
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" })
await page.locator("#email").fill(EMAIL)
await page.locator('input[type="password"]').first().fill(PASSWORD)
await page.getByRole("button", { name: "登录" }).first().click()
await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60000 })
console.log("LOGIN OK ->", new URL(page.url()).pathname, "\n")

/* ============================================================
 * 回归点 2：主题预设按钮（循环 + onClick 状态）
 * ============================================================ */
await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" })
await page.waitForTimeout(300)

const presetBefore = await page.locator(".admin-shell").getAttribute("data-preset")
const trigger = page.locator('button[aria-label="切换主题风格"]')
ok("主题触发器 cursor=pointer", (await trigger.evaluate((el) => getComputedStyle(el).cursor)) === "pointer")

await trigger.click()
await page.waitForTimeout(450)

// 确认审计脚本确实能看到浮层里的 9 个预设按钮
const presetBtns = page.locator('[role="dialog"][aria-label="主题风格"] button[aria-pressed]')
const presetCount = await presetBtns.count()
const presetCursors = await presetBtns.evaluateAll((els) => els.map((e) => getComputedStyle(e).cursor))
ok("浮层内预设按钮数量 = 9", presetCount === 9, `实际 ${presetCount}`)
ok(
    "9 个预设按钮 cursor 全为 pointer",
    presetCursors.length > 0 && presetCursors.every((c) => c === "pointer"),
    `cursors=${JSON.stringify([...new Set(presetCursors)])}`,
)

// 点第 2 套（neon 夜行霓虹）
const targetLabel = await presetBtns.nth(1).innerText()
await presetBtns.nth(1).click()
await page.waitForTimeout(500)

const presetAfter = await page.locator(".admin-shell").getAttribute("data-preset")
const dialogCount = await page.locator('[role="dialog"][aria-label="主题风格"]').count()
const expanded = await trigger.getAttribute("aria-expanded")
const stored = await page.evaluate(() => localStorage.getItem("admin-preset"))

ok(
    "点击第 2 套预设后 data-preset 变化",
    presetAfter !== presetBefore && presetAfter === "neon",
    `${presetBefore} -> ${presetAfter} (按钮: ${targetLabel.replace(/\s+/g, " ")})`,
)
ok("点击后浮层关闭", dialogCount === 0 && expanded === "false", `dialog=${dialogCount} aria-expanded=${expanded}`)
ok("localStorage 同步写入", stored === presetAfter, `admin-preset=${stored}`)

// 复原到默认「和纸文库」(paper)
await trigger.click()
await page.waitForTimeout(400)
await page.locator('[role="dialog"][aria-label="主题风格"] button[aria-pressed]').nth(0).click()
await page.waitForTimeout(500)
const restored = await page.locator(".admin-shell").getAttribute("data-preset")
ok("主题已复原为默认 paper", restored === "paper", `data-preset=${restored}`)

/* ============================================================
 * 回归点 1：刷新按钮 disabled 态 cursor
 * ============================================================ */
await page.goto(`${BASE}/admin/posts`, { waitUntil: "networkidle" })
await page.waitForTimeout(400)

const refreshBtn = page.locator('button[aria-label="刷新"]')
ok("刷新按钮存在", (await refreshBtn.count()) === 1)
ok("刷新按钮常态 cursor=pointer", (await refreshBtn.evaluate((el) => getComputedStyle(el).cursor)) === "pointer")

// 放大 pending 窗口：延迟 RSC 请求，确保能抓到 disabled 态
await page.route("**/*", async (route) => {
    const req = route.request()
    if (req.url().includes("_rsc") || req.headers()["rsc"] === "1") {
        await new Promise((r) => setTimeout(r, 1500))
    }
    await route.continue()
})

await refreshBtn.click()

const samples = []
let sawDisabled = false
const deadline = Date.now() + 4000
while (Date.now() < deadline) {
    const s = await page
        .evaluate(() => {
            const b = document.querySelector('button[aria-label="刷新"]')
            if (!b) return null
            const cs = getComputedStyle(b)
            return {
                disabled: b.disabled === true,
                cursor: cs.cursor,
                spinning: !!b.querySelector(".animate-spin"),
            }
        })
        .catch(() => null)
    if (s) {
        samples.push(s)
        if (s.disabled) sawDisabled = true
        if (sawDisabled && !s.disabled) break
    }
    await page.waitForTimeout(40)
}
await page.unroute("**/*")
await page.waitForTimeout(600)

const disabledSamples = samples.filter((s) => s.disabled)
const disabledCursors = [...new Set(disabledSamples.map((s) => s.cursor))]

if (disabledSamples.length > 0) {
    ok(
        `刷新按钮 pending 期间 cursor=not-allowed（采样 ${disabledSamples.length} 次）`,
        disabledCursors.length === 1 && disabledCursors[0] === "not-allowed",
        `cursors=${JSON.stringify(disabledCursors)}，pending 窗口约 ${disabledSamples.length * 40}ms`,
    )
    ok(
        "pending 期间图标有旋转反馈",
        disabledSamples.some((s) => s.spinning),
        `spinning=${disabledSamples.some((s) => s.spinning)}`,
    )
    const after = samples[samples.length - 1]
    ok("pending 结束后恢复 cursor=pointer", !after.disabled && after.cursor === "pointer", JSON.stringify(after))
} else {
    // 兜底：源码 + 类名交叉确认
    const cls = await refreshBtn.getAttribute("class")
    ok(
        "pending 窗口太短未抓到，改用类名交叉确认",
        /disabled:cursor-not-allowed/.test(cls || ""),
        `class 含 disabled:cursor-not-allowed = ${/disabled:cursor-not-allowed/.test(cls || "")}`,
    )
}

/* ============================================================
 * 回归点 3：偏好开关 aria-checked 切换
 * ============================================================ */
await page.goto(`${BASE}/admin/settings/preferences`, { waitUntil: "networkidle" })
await page.waitForTimeout(400)

const switches = page.locator('[role="switch"]')
const swCount = await switches.count()
const swCursors = await switches.evaluateAll((els) => els.map((e) => getComputedStyle(e).cursor))
ok("偏好开关数量 = 4", swCount === 4, `实际 ${swCount}`)
ok(
    "4 个开关 cursor 全为 pointer",
    swCursors.length > 0 && swCursors.every((c) => c === "pointer"),
    `cursors=${JSON.stringify([...new Set(swCursors)])}`,
)

const first = switches.first()
const before = await first.getAttribute("aria-checked")
await first.click()
await page.waitForTimeout(350)
const after = await first.getAttribute("aria-checked")
ok("点击开关后 aria-checked 翻转", before !== after, `${before} -> ${after}`)

// 复原
await first.click()
await page.waitForTimeout(350)
const back = await first.getAttribute("aria-checked")
ok("再次点击开关恢复原状态", back === before, `${after} -> ${back}`)

/* ============================================================
 * 回归点 4：控制台错误
 * ============================================================ */
const realConsoleErrors = consoleErrors.filter((t) => !/favicon|Download the React DevTools/i.test(t))
ok("无 pageerror", pageErrors.length === 0, pageErrors.length ? JSON.stringify(pageErrors.slice(0, 3)) : "")
ok(
    "无 console error",
    realConsoleErrors.length === 0,
    realConsoleErrors.length ? JSON.stringify(realConsoleErrors.slice(0, 3)) : "",
)

await browser.close()

const failed = results.filter((r) => !r.pass)
console.log(`\n### 回归用例 ${results.length} 条，通过 ${results.length - failed.length}，失败 ${failed.length}`)
if (failed.length) {
    console.log("失败项：")
    for (const f of failed) console.log(`  - ${f.name}  ${f.detail || ""}`)
    process.exitCode = 1
}
