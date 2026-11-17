/** Format an optional count with thousands separators. */
export function formatNumber(value: number | null | undefined): string {
  return (value ?? 0).toLocaleString("en-US")
}

export const numberReg = /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/

export function isNumber(value: string | number): boolean {
  return numberReg.test(value.toString())
}

export function isStringNumber<Value>(value: Value): value is Extract<Value, string> {
  return typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))
}

/** Convert numeric strings while keeping other values unchanged. */
export function str2num<Value>(value: Value): Value | number {
  return isStringNumber(value) ? Number(value) : value
}

/** Append a unit to numeric values while preserving already formatted strings. */
export function addUnit(value: number | string, unit = "px"): string {
  if (typeof value === "string") return value
  return isNumber(value) ? `${value}${unit}` : ""
}
