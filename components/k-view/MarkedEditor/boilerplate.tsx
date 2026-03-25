import React from 'react'
import {toast} from "sonner";

import {
    AdmonitionDirectiveDescriptor,
    BlockTypeSelect,
    BoldItalicUnderlineToggles,
    ChangeAdmonitionType,
    ChangeCodeMirrorLanguage,
    codeBlockPlugin,
    codeMirrorPlugin,
    CodeToggle,
    ConditionalContents,
    CreateLink,
    diffSourcePlugin,
    DirectiveNode,
    directivesPlugin,
    EditorInFocus,
    frontmatterPlugin,
    headingsPlugin,
    HighlightToggle,
    imagePlugin, InsertAdmonition, InsertCodeBlock,
    InsertImage, InsertSandpack, InsertTable, InsertThematicBreak,
    linkDialogPlugin,
    linkPlugin,
    listsPlugin,
    ListsToggle,
    markdownShortcutPlugin,
    quotePlugin,
    SandpackConfig,
    sandpackPlugin,
    Separator, ShowSandpackInfo,
    StrikeThroughSupSubToggles,
    tablePlugin,
    thematicBreakPlugin,
    toolbarPlugin,
    UndoRedo
} from '@mdxeditor/editor'
import {uploadImagePromise} from "@/lib/utils";

/*国际化语言包*/
export const MDX_EDITOR_ZH_CN = {
    // 编辑区域
    contentArea: {
        editableMarkdown: "Markdown 编辑区域"
    },

    // 工具栏
    toolbar: {
        insertSandpack: "插入代码沙盒",
        superscript: "上标",
        subscript: "下标",
        highlight: "高亮",
        removeHighlight: "取消高亮",
        removeSuperscript: "取消上标",
        removeSubscript: "取消下标",
        inlineCode: "内联代码",
        removeInlineCode: "取消内联代码",
        undo: '撤销',
        redo: '重做',
        bold: '加粗',
        removeBold: '取消加粗',
        italic: '斜体',
        removeItalic: '取消斜体',
        underline: '下划线',
        removeUnderline: '取消下划线',
        strikethrough: '删除线',
        bulletedList: '无序列表',
        numberedList: '有序列表',
        checkList: '任务列表',
        quote: '引用',
        code: '内联代码',
        codeBlock: '插入代码块',
        link: '插入链接',
        image: '插入图片',
        table: '插入表格',
        thematicBreak: '分割线',
        admonition: '插入提示框',
        frontmatter: '编辑前置元数据',
        // 块类型选择
        blockTypeSelect: {
            selectBlockTypeTooltip: "选择文本类型",
            placeholder: "样式"
        },
        blockTypes: {
            paragraph: "正文",
            quote: "引用",
            heading: "标题 {{level}}"
        }
    },

    // 链接编辑器
    linkEditor: {
        edit: '编辑链接',
        remove: '移除链接',
        title: '标题',
        url: '链接地址',
        openInNewWindow: '在新窗口打开'
    },

    // 图片编辑器
    imageEditor: {
        alt: '替代文本 (Alt)',
        title: '图片标题',
        src: '图片地址',
        editImage: '编辑图片',
        removeImage: '删除图片',
        uploadImage: '上传图片'
    },

    // 表格编辑器
    tableEditor: {
        insertTable: '插入表格',
        addColumnBefore: '在左侧添加列',
        addColumnAfter: '在右侧添加列',
        addRowBefore: '在上方添加行',
        addRowAfter: '在下方添加行',
        deleteColumn: '删除当前列',
        deleteRow: '删除当前行',
        deleteTable: '删除整个表格'
    },

    // 代码块
    codeBlock: {
        language: '编程语言',
        selectLanguage: '选择语言'
    },

    // 提示框
    admonitions: {
        note: '备注',
        tip: '提示',
        info: '信息',
        caution: '注意',
        danger: '危险'
    },
    uploadImage: {
        uploadInstructions: "请选择要上传的图片文件",
        dialogTitle: "上传图片",
        addViaUrlInstructions: "或直接输入图片URL",
        title: "标题",
        alt: "替代文本",
        autoCompletePlaceholder: "请输入图片路径",
    },

    // 通用控件
    dialogControls: {
        save: '保存',
        cancel: '取消'
    },
    propertyPanel: {
        title: '属性设置'
    }
};


/*代码片段*/
const defaultSnippetContent = `
export default function App() {
  return (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>
    </div>
  );
}
`.trim()


export const virtuosoSampleSandpackConfig: SandpackConfig = {
    defaultPreset: 'react',
    presets: [
        {
            label: 'React',
            name: 'react',
            meta: 'live react',
            sandpackTemplate: 'react',
            sandpackTheme: 'light',
            snippetFileName: '/App.js',
            snippetLanguage: 'jsx',
            initialSnippetContent: defaultSnippetContent
        },

        {
            label: 'Virtuoso',
            name: 'virtuoso',
            meta: 'live virtuoso',
            sandpackTemplate: 'react-ts',
            sandpackTheme: 'light',
            snippetFileName: '/App.tsx',
            initialSnippetContent: defaultSnippetContent,
            dependencies: {
                'react-virtuoso': 'latest',
                '@ngneat/falso': 'latest'
            },
            /*          files: {
                          '/data.ts': dataCode
                      }*/
        }
    ]
}

export function imageUploadHandler(image: File) {
    const uploadPromise = uploadImagePromise(image, false)
    toast.promise(uploadPromise, {
        loading: "正在上传图片...",
        success: () => '图片上传成功',
        error: (err) => {
            return typeof err === 'function' ? err().message : '图片上传失败'
        }
    })
    return uploadPromise
}

/*interface YoutubeDirectiveNode extends LeafDirective {
    name: 'youtube'
    attributes: { id: string }
}*/

/*
export const YoutubeDirectiveDescriptor: DirectiveDescriptor<YoutubeDirectiveNode> = {
    name: 'youtube',
    type: 'leafDirective',
    testNode(node) {
        return node.name === 'youtube'
    },
    attributes: ['id'],
    hasChildren: false,
    Editor: ({ mdastNode, lexicalNode, parentEditor }) => {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <button
                    onClick={() => {
                        parentEditor.update(() => {
                            lexicalNode.selectNext()
                            lexicalNode.remove()
                        })
                    }}
                >
                    delete
                </button>
                <iframe
                    width="560"
                    height="315"
                    src={`https://www.youtube.com/embed/${mdastNode.attributes.id}`}
                    title="YouTube video player"
                    style={{ border: 0 }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                ></iframe>
            </div>
        )
    }
}
*/


function whenInAdmonition(editorInFocus: EditorInFocus | null) {
    const node = editorInFocus?.rootNode
    if (!node || node.getType() !== 'directive') {
        return false
    }

    return ['note', 'tip', 'danger', 'info', 'caution'].includes((node as DirectiveNode).getMdastNode().name)
}


export const ALL_PLUGINS = [

    listsPlugin(),
    quotePlugin(),
    headingsPlugin({allowedHeadingLevels: [1, 2, 3, 4, 5, 6]}),
    linkPlugin(),
    linkDialogPlugin(),
    imagePlugin({
        // 可选图片地址
        imageAutocompleteSuggestions: [],
        imageUploadHandler
    }),
    tablePlugin(),
    thematicBreakPlugin(),
    frontmatterPlugin(),
    codeBlockPlugin({defaultCodeBlockLanguage: ''}),
    sandpackPlugin({sandpackConfig: virtuosoSampleSandpackConfig}),
    codeMirrorPlugin({
        codeBlockLanguages: {
            js: 'JavaScript',
            css: 'CSS',
            txt: 'Plain Text',
            tsx: 'TypeScript',
            '': 'Unspecified'
        }
    }),
    directivesPlugin({
        directiveDescriptors: [
            // YoutubeDirectiveDescriptor,
            AdmonitionDirectiveDescriptor
        ]
    }),
    diffSourcePlugin({viewMode: 'rich-text', diffMarkdown: 'boo'}),
    markdownShortcutPlugin(),
    toolbarPlugin({
        toolbarContents: () => (
            <ConditionalContents
                options={[
                    {
                        when: (editor) => editor?.editorType === 'codeblock',
                        contents: () => <ChangeCodeMirrorLanguage/>
                    },
                    {when: (editor) => editor?.editorType === 'sandpack', contents: () => <ShowSandpackInfo/>},
                    {
                        fallback: () => (
                            <>
                                <UndoRedo/>
                                <Separator/>
                                <BoldItalicUnderlineToggles/>
                                <CodeToggle/>
                                <HighlightToggle/>
                                <Separator/>
                                <StrikeThroughSupSubToggles/>
                                <Separator/>
                                <ListsToggle/>
                                <Separator/>
                                <ConditionalContents
                                    options={[{
                                        when: whenInAdmonition,
                                        contents: () => <ChangeAdmonitionType/>
                                    }, {fallback: () => <BlockTypeSelect/>}]}
                                />
                                <Separator/>

                                <CreateLink/>
                                <InsertImage/>

                                <Separator/>

                                <InsertTable/>
                                <InsertThematicBreak/>

                                <Separator/>
                                <InsertCodeBlock/>
                                <InsertSandpack/>
                                <ConditionalContents
                                    options={[
                                        {
                                            when: (editorInFocus) => !whenInAdmonition(editorInFocus),
                                            contents: () => (
                                                <>
                                                    <Separator/>
                                                    <InsertAdmonition/>
                                                </>
                                            )
                                        }
                                    ]}
                                />
                            </>
                        )
                    }
                ]}
            />


        )
    }),

]
