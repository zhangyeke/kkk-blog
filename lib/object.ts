import { get, set } from "lodash"

/** Read a nested value with an optional fallback. */
export function getDeepValue<T, S>(object: T, path: string, defaultValue?: S): ReturnType<typeof get> {
  return get(object, path, defaultValue)
}

/** Set a nested value on an existing object. */
export function setDeepValue<T extends object, V>(object: T, path: string, value: V): T {
  return set(object, path, value) as T
}
