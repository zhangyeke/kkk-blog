/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2026-03-26 02:32:37
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-04-28 17:38:11
 * @FilePath: \blog\components\k-view\MarkedEditor\MarkedEditor.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
"use client"
import i18next from 'i18next'
import {FC, useEffect, useRef} from 'react'
import '@mdxeditor/editor/style.css';
import {
    MDXEditor,
    type MDXEditorMethods,
    type MDXEditorProps, toolbarPlugin,
} from "@mdxeditor/editor";
import {useTheme} from "next-themes";

import {ALL_PLUGINS, MDX_EDITOR_ZH_CN, toolbarConfig} from "./boilerplate"
import {cn} from "@/lib/utils";

interface EditorProps extends Omit<MDXEditorProps, 'markdown'> {
    value?: string
}


void i18next.init({
    lng: 'sl',
    debug: false,
    resources: {
        sl: {
            translation: MDX_EDITOR_ZH_CN
        }
    }
})


const MarkedEditor: FC<EditorProps> = ({value = '', onChange, className, ...props}) => {
    const {theme} = useTheme()
    const editorRef = useRef<MDXEditorMethods>(null)
    useEffect(() => {
        if (!value && editorRef.current) {
            editorRef.current?.setMarkdown('')
        }
    }, [value]);


    return (
        <MDXEditor
            {...props}
            ref={editorRef}
            markdown={value}
            onChange={onChange}
            translation={(key, defaultValue, interpolations) => i18next.t(key, defaultValue, interpolations) as string}
            className={cn(`relative custom-editor mdxeditor ${theme} max-w-full`, className)} // 使用 Tailwind Typography 优化预览样式
            // 插件系统：按需引入功能
            plugins={[...ALL_PLUGINS, ...(props.readOnly ? [] : [toolbarPlugin(toolbarConfig)])]}
        />
    )
}


export default MarkedEditor