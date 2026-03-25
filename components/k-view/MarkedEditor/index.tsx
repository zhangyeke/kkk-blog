"use client"
import i18next from 'i18next'
import {FC, ForwardedRef} from 'react'
import '@mdxeditor/editor/style.css';
import {
    MDXEditor,
    type MDXEditorMethods,
    type MDXEditorProps,
} from "@mdxeditor/editor";
import {useTheme} from "next-themes";

import {ALL_PLUGINS, MDX_EDITOR_ZH_CN} from "./boilerplate"
import {cn} from "@/lib/utils";

interface EditorProps extends Omit<MDXEditorProps, 'markdown'> {
    editorRef?: ForwardedRef<MDXEditorMethods> | null
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


const MarkedEditor: FC<EditorProps> = ({value = '', onChange, editorRef, className, ...props}) => {
    const {theme} = useTheme()

    return (
        <MDXEditor
            {...props}
            ref={editorRef}
            markdown={value}
            onChange={onChange}
            translation={(key, defaultValue, interpolations) => i18next.t(key, defaultValue, interpolations) as string}
            className={cn(`custom-editor mdxeditor ${theme} max-w-full dark:bg-input/30 rounded-md shadow-sm shadow-input`, className)} // 使用 Tailwind Typography 优化预览样式
            contentEditableClassName="min-h-[500px] "
            // 插件系统：按需引入功能
            plugins={ALL_PLUGINS}
        />
    )
}


export default MarkedEditor