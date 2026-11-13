/**
 * 插槽在 `/admin` 这个父路由上需要有 page.tsx 才会渲染，
 * default.tsx 只负责其余子路径（/admin/posts 等）。两者内容相同，直接复用。
 */
export { default } from "./default"
