// Offline benchmark: actual before/after service functions, synthetic rows and DB latency.
// Never connects to a database, authenticates a user, or modifies application data.
import { execFileSync } from "node:child_process"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { performance } from "node:perf_hooks"
import { gzipSync } from "node:zlib"
import ts from "typescript"
import { remark } from "remark"
import strip from "strip-markdown"

const gitOptions = ["-c", `safe.directory=${process.cwd().replaceAll("\\", "/")}`]
const baselineRef = process.argv[2] || execFileSync("git", [...gitOptions, "rev-parse", "HEAD"], { encoding: "utf8" }).trim()
const candidateFiles = ["components/photo-map/PhotoMap.tsx", "service/post.ts", "types/post.ts"]
const candidateSource = (() => {
  try {
    execFileSync("git", [...gitOptions, "diff", "--quiet", "--", ...candidateFiles], { stdio: "ignore" })
    return "HEAD"
  } catch {
    return "working tree"
  }
})()
const date = process.argv[3] || (() => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())
  const get = (type) => parts.find((part) => part.type === type)?.value ?? ""
  return `${get("year")}-${get("month")}-${get("day")}`
})()
const original = execFileSync("git", [...gitOptions, "show", `${baselineRef}:service/post.ts`], { encoding: "utf8" })
const current = readFileSync("service/post.ts", "utf8")
const content = "# 性能测试\n\n这是用于可复现测试的文章正文，包含 **Markdown** 格式和中文。\n".repeat(180)
// Keep the benchmark's Prisma selections aligned with the committed baseline and optimized DTO.
const postWithUserInclude = {
  category: true,
  user: { select: { id: true, name: true, avatar: true, email: true } },
}
const postListSelect = {
  id: true,
  title: true,
  cover: true,
  categoryId: true,
  tags: true,
  content: true,
  createdAt: true,
  pv: true,
  favoriteCount: true,
  category: { select: { name: true } },
  user: { select: { name: true, avatar: true } },
}
const rows = Array.from({ length: 6 }, (_, id) => ({
  id: id + 1,
  categoryId: 1,
  status: 1,
  title: `测试文章${id + 1}`,
  content,
  tags: "性能,开发",
  cover: "/images/placeholder/image_error.png",
  userId: "test-user",
  createdAt: new Date("2026-11-05T00:00:00Z"),
  updatedAt: new Date("2026-11-05T00:00:00Z"),
  pv: 0,
  favoriteCount: 0,
  category: { id: 1, name: "测试" },
  user: { id: "test-user", name: "测试用户", avatar: "", email: "test@example.com" },
}))
const processor = remark().use(strip).freeze()
const getPlainText = async (text) =>
  String(await processor.process(text))
    .trim()
    .slice(0, 58) + "..."
const delay = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 30))
const success = (message, data) => ({ code: 200, message, data })
const failure = (message, data) => ({ code: 0, message, data })

function loadService(source) {
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 },
  })
  function project(value, shape) {
    if (!value || typeof value !== "object") return value
    return Object.fromEntries(Object.entries(shape).map(([key, field]) => {
      if (field === true) return [key, value[key]]
      const nestedShape = field && typeof field === "object" ? field.select ?? field : null
      return [key, nestedShape ? project(value[key], nestedShape) : value[key]]
    }))
  }
  const postStore = {
    findMany: (args = {}) => delay(rows.map((row) => {
      if (args.select) return project(row, args.select)
      if (!args.include) return row
      const result = Object.fromEntries(Object.entries(row).filter(([key]) => key !== "category" && key !== "user"))
      for (const [key, field] of Object.entries(args.include)) {
        result[key] = field === true ? row[key] : project(row[key], field.select ?? field)
      }
      return result
    })),
    count: () => delay(6),
  }
  const mocks = {
    react: { cache: (fn) => fn },
    lodash: { merge: (target, value) => ({ ...target, ...value, where: { ...target.where, ...value?.where } }) },
    "@prisma/client": {},
    "@/lib/prisma": { __esModule: true, default: { post: postStore } },
    "@/types/post": { postWithUserInclude, postListSelect },
    "@/lib/actionMessageBack": { backSuccessMessage: success, backFailMessage: failure },
    "@/lib/utils": { getPlainText },
    "@/lib/markdown": { getPlainText },
    "@/service/auth": { checkAuth: async () => ({ id: "test-user" }) },
    "@/validators/post": {},
    "next/server": { after: () => {} },
    "next/cache": { revalidatePath: () => {} },
    "next/dist/client/components/redirect-error": { isRedirectError: () => false },
    "@/lib/auth": {},
    "@/lib/admin-guard": { requireAction: async () => {}, scopeOf: async () => ({ all: true, userId: "test-user" }) },
    "@/lib/paging": { normalizePaging: (paging = {}) => ({ page: 1, pageSize: 10, ...paging }) },
  }
  const mod = { exports: {} }
  new Function("require", "module", "exports", outputText)(
    (id) => {
      if (!(id in mocks)) throw new Error(`Unexpected benchmark import: ${id}`)
      return mocks[id]
    },
    mod,
    mod.exports
  )
  return mod.exports
}

async function measure(service) {
  const elapsed = []
  let result
  await service.getPostsByPage({ page: 1, pageSize: 6 }) // warm-up
  for (let run = 0; run < 7; run += 1) {
    const started = performance.now()
    result = await service.getPostsByPage({ page: 1, pageSize: 6 })
    if (result.code !== 200) throw new Error(result.message)
    elapsed.push(performance.now() - started)
  }
  const payload = JSON.stringify(result)
  return {
    medianMs: Number(elapsed.toSorted((a, b) => a - b)[3].toFixed(2)),
    samplesMs: elapsed.map((value) => Number(value.toFixed(2))),
    jsonBytes: Buffer.byteLength(payload),
    gzipBytes: gzipSync(payload).length,
    serializedContentFields: result.data.list.filter((post) => "content" in post).length,
  }
}

const report = {
  date,
  node: process.version,
  baselineRef,
  candidateRef: execFileSync("git", [...gitOptions, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  candidateSource,
  method:
    "Offline controlled benchmark; real service functions from the baseline commit and working tree; 6 synthetic articles; 30 ms per database operation; 1 warm-up + 7 runs. Not production page metrics.",
  articleBodyBytes: Buffer.byteLength(content),
  before: await measure(loadService(original)),
  after: await measure(loadService(current)),
}
mkdirSync("docs/performance", { recursive: true })
writeFileSync(`docs/performance/benchmark-${date}.json`, JSON.stringify(report, null, 2) + "\n")
console.log(JSON.stringify(report, null, 2))
