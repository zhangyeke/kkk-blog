import type {MDXComponents} from 'mdx/types'

export function useMDXComponents(components: MDXComponents): MDXComponents {
    return {
        ...components,
        // 添加自定义组件 可在全局.md mdx文件使用
        // 'MyInput': MyInput
    }
}