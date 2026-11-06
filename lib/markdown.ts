import { remark } from "remark"
import strip from "strip-markdown"

// Reuse the frozen processor across summaries instead of rebuilding it per article.
const plainTextProcessor = remark().use(strip).freeze()

export async function getPlainText(content: string, length = 58) {
  const file = await plainTextProcessor.process(content)
  const text = String(file).trim()
  return text.slice(0, length) + (text.length > length ? "..." : "")
}
