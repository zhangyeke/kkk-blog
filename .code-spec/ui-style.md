# UI 风格规范 | UI Style
> 适用范围: `app/`、`components/`、`styles/` | 最后更新: 2026-11-12
> 权威来源: `styles/admin-theme.css`、`app/globals.css`、`components.json` + 组件抽样

## 配色

### [UI-01] 主题色
- 规则：前台与后台**两套主题互不复用**。
  - 前台博客：Tailwind 默认 token + `--primary` 系
  - 后台管理：独立命名空间 `--adm-*`，**禁止在后台使用 `--primary` / 蓝色系**
- 示例：后台主操作按钮用 `background: var(--adm-ink)`，不用 `bg-primary`

### [UI-02] CSS 变量体系
- 规则：后台全部颜色走 `--adm-*`，定义在 `styles/admin-theme.css` 的 `.admin-shell` 作用域下：
  | 变量 | 用途 |
  |---|---|
  | `--adm-paper` | 页面底色 |
  | `--adm-paper-2` | 卡片底色 |
  | `--adm-paper-3` | 次级填充（hover、标签底） |
  | `--adm-ink` | 主文字 / 主操作填充 |
  | `--adm-ink-2` | 次级文字 |
  | `--adm-ink-3` | 弱化文字 |
  | `--adm-line` | 主发丝线 |
  | `--adm-line-2` | 次发丝线 |
  | `--adm-c1..c4` | 强调色（靛 / 粉 / 绿 / 金） |
- **不要硬编码十六进制**，一律 `var(--adm-*)`。

### [UI-03] 功能色
- 规则：语义色用 `--adm-c3`（成功/正常）、`--adm-c4`（警告/草稿）、`--adm-c2`（强调/粉）、`--adm-c1`（信息/靛）。危险操作用 `--adm-c2` 系或红色 token，**不要用 Tailwind 的 `red-500`**。
- 状态徽章写法（真实存在）：
  ```tsx
  { color: "var(--adm-c3)", borderColor: "color-mix(in oklab, var(--adm-c3) 45%, var(--adm-line))",
    background: "color-mix(in oklab, var(--adm-c3) 12%, transparent)" }
  ```

### [UI-04] 中性色
- 规则：文字只用 `--adm-ink / -ink-2 / -ink-3` 三级；边框只用 `--adm-line / -line-2`。超过三级灰阶视为违规。

### [UI-05] 暗色模式
- 规则：`html.dark` 下 `.admin-shell` 重新定义同名变量，**组件里不需要写任何 dark: 分支**——只要用 `var(--adm-*)` 就自动适配。
- 例外：`components/ui/*`（shadcn 通用层）用的是 Tailwind 的 `--background/--foreground`，在后台使用时需包在 `.admin-shell` 内。

## 字体与排版

### [UI-06] 字体族
- 规则：正文 `var(--sans)`；**标题/数字用衬线** `var(--adm-serif)`（Songti SC / Noto Serif SC 栈），对应工具类 `.adm-serif`。
- 示例：`<div className="adm-serif text-[15px]">标题</div>`

### [UI-07] 字号体系
- 规则：后台偏紧凑，常用三档：`text-[15px]`（卡片/区块标题）、`text-[14px]`（表格主字段）、`text-[13px]`（正文/表单）、`text-[12px]`（辅助信息/表头）。**不要用 `text-sm/text-base` 这类语义类**，直接用像素值以保持一致。

### [UI-08] 字重
- 规则：默认 400；标题靠**字体族**（衬线）而非加粗区分；只有强调数字用 `font-medium`。

### [UI-09] 行高
- 规则：正文 `leading-normal`；表格单元格靠 `py-2` 控制高度，不额外设行高。

## 间距与形状

### [UI-10] 间距体系
- 规则：以 4px 为基准，常用 `gap-1 / gap-2 / gap-3`、`px-4 / py-2`、`mb-2 / mb-3`。
  - 卡片内边距：表格卡 `px-4`，内容卡 `p-3`～`p-4`
  - 区块间距：`mb-2`（紧凑）/ `mb-3`（常规）

### [UI-11] 圆角体系
- 规则：卡片 `rounded-lg`；按钮/输入 `rounded-md`；弹窗 `rounded-xl`；徽章 `rounded-full`。

### [UI-12] 阴影体系
- 规则：后台**基本不用阴影**，靠 `border` + `--adm-line` 发丝线区分层级。弹窗可用 `shadow-lg`。

## 布局

### [UI-13] 布局方案
- 规则：Flex 为主。后台页面骨架固定为**纵向三段**：
  ```tsx
  <div className="flex h-full min-h-0 flex-col">
    <div className="shrink-0 mb-2">{/* 工具条 */}</div>
    <div className="min-h-0 flex-1 overflow-auto">{/* 表格卡片，表头 sticky */}</div>
  </div>
  ```
- 页面外壳 `h-dvh overflow-hidden`，**页面本身不允许出现滚动条**，滚动只发生在表格区域。

### [UI-14] 响应式断点
- 规则：`md`（768px）为侧栏显隐分界；表格窄屏隐藏次要列用 `col.hideOnMobile`（DataTable 已支持）。

### [UI-15] 容器/栅格
- 规则：后台内容区 `mx-auto w-full max-w-[1600px]`；设置类窄页面 `max-w-[900px]`。

## 样式方案

### [UI-16] 全局 CSS 类
- 规则：后台提供两个全局类：`.adm-serif`（衬线标题）、`.adm-rise`（入场动画，配合 `style={{"--i": n}}` 做 stagger）。新增全局类必须写进 `styles/admin-theme.css` 并加注释。

### [UI-17] 样式方案
- 规则：**Tailwind v4 为主 + 内联 `style` 传 CSS 变量**。动态颜色必须走 `style={{ color: "var(--adm-ink-2)" }}`，不能用字符串拼接类名。
- 禁止：CSS Modules（除已有）、styled-components。

### [UI-18] 全局样式入口
- 规则：`app/globals.css`（Tailwind 入口）+ `styles/admin-theme.css`（后台主题，被 `app/admin/layout.tsx` 引入）。新增后台样式写后者。

## 组件体系

### [UI-19] 组件库
- 规则：**shadcn/ui**（`components/ui/*`，Radix 底座）+ **自有 k-view**（`components/k-view/*`）。依赖见 `package.json`，`components.json` 配置了别名。
- 不要引入第二套 UI 库（如 Ant Design / Element）。

### [UI-20] 组件注册方式
- 规则：直接 import，无全局注册。`@/components/ui/button`、`@/components/k-view/DataTable`。

### [UI-21] 高频组件清单
| 场景 | 组件 |
|---|---|
| 表格 | `components/k-view/DataTable`（含 `header`/`footer` 插槽、`DataTablePager`） |
| 筛选条 | `components/k-view/FilterForm`（URL 为唯一数据源） |
| 行操作 | `components/k-view/RowActions` |
| 表格工具条 | `app/admin/components/TableToolbar` + `toolbarActionClass` |
| 弹窗 | `components/ui/dialog`、`components/k-view/Popup` |
| 确认框 | `components/ui/alert-dialog` |
| 图标 | `app/admin/components/admin-icons.tsx`（`<AdminIcon name>`）+ `lucide-react` |

### [UI-22] 高频组件 Props 约定
- 规则：`DataTable` 的列定义 `DataTableColumn<T>`（`key/title/width/align/render`）；`RowActions` 的 `actions: RowActionItem[]` + `can`。
- **不要修改这些公共组件的 props 签名**（多页面依赖），扩展走新增可选字段。

### [UI-23] 组件命名
- 规则：`PascalCase`，后缀表达角色：`XxxTable` / `XxxDialog` / `XxxForm` / `XxxToolbar` / `XxxManager`。

### [UI-24] 组件目录组织
- 规则：页面私有组件放**页面同目录**（`app/admin/posts/components/` 或 `app/admin/posts/PostsTable.tsx`）；跨页复用才提升到 `app/admin/components/` 或 `components/k-view/`。

## 交互

### [UI-25] Hooks 规范
- 规则：`hooks/useXxx.ts(x)`。已有：`useAutoFormSubmit`（表单提交）、`use-image-upload`、`use-debounce`、`usePermission`（`components/admin/permission-context`）。

### [UI-26] 工具函数
- 规则：通用工具放 `lib/`，命名 `kebab-case.ts`；`cn()`（`lib/utils`）统一做类名合并。

### [UI-27] 表单校验
- 规则：**zod schema 驱动**。schema 放 `validators/`，通过 `components/k-view/Form`（autoform）自动渲染字段；服务端 action 里再 `schema.parse(input)` 一次。
- 示例：`validators/menu.ts` → `createMenuSchema`，前端 `Form schema={...}`，后端 `createMenuSchema.parse(input)`。

### [UI-28] Toast / Modal 约定
- 规则：提示统一 `sonner` 的 `toast.success / toast.error`，**禁止 `window.alert` / `window.confirm`**。删除确认统一 `components/ui/alert-dialog`。

### [UI-29] 加载状态
- 规则：按钮 pending 用 `disabled` + 文案/图标切换；表格首屏用骨架或服务端 Suspense；弹窗内异步加载显示居中转圈。

### [UI-30] 空状态
- 规则：`DataTable` 的 `empty` 插槽必须给两行文案——主句（`text-[15px]`）+ 引导句（`text-[13px]`，`--adm-ink-3`）。
- 示例：`没有符合条件的文章` / `换个筛选条件，或新建一篇`

### [UI-31] 动画时长
- 规则：入场 `adm-rise` 约 420ms；交互过渡 `transition-colors` 150ms。不做长动画。

### [UI-32] 缓动函数
- 规则：默认 `ease-out`；展开/折叠用 `cubic-bezier(0.22, 1, 0.36, 1)`。

### [UI-33] 图标
- 规则：`lucide-react`（通用）+ `admin-icons.tsx` 的 `ADMIN_ICONS`（侧栏/菜单图标，key 存 DB）。尺寸 `size-4`（按钮内）/ `size-5`（侧栏）。**图标名要能在 `ADMIN_ICONS` 里解析，否则回落 `fallback`**。

### [UI-34] 国际化
- 规则：后台中文硬编码，未接入 i18n；前台有 `i18next`。后台新增文案直接写中文。

### [UI-35] z-index
- 规则：侧栏/顶栏 < 下拉 < 弹窗遮罩 < Toast。用 Radix 默认层级，不手写 `z-[9999]`。

### [UI-36] 新建页面应使用的全局样式
- 规则：页面根节点 `mx-auto w-full max-w-[1600px]`；区块包 `adm-rise` + `--i` 序号；卡片 `rounded-lg border` + `background: var(--adm-paper-2)` + `borderColor: var(--adm-line)`。

### [UI-37] 新建页面应使用的全局组件
- 规则：列表页必须复用 `FilterForm` + `DataTable` + `DataTablePager` + `TableToolbar`，不要手写 table/分页。

### [UI-38] 新建组件必传入参
- 规则：`className` 可选并走 `cn()` 合并；交互组件必须有 `disabled`/`pending` 态；弹窗必须有 `open` + `onOpenChange`。

## 项目特有约定

### [UI-39] Radix Portal 的主题作用域
- 规则：`Dialog`/`Popover`/`AlertDialog` 通过 Portal 挂到 `body`，**在 `.admin-shell` 之外**，`var(--adm-*)` 会失效（表现为透明背景）。必须在弹窗根节点加 `className="admin-shell"`。
- 示例：`<DialogContent className="admin-shell ...">`

### [UI-40] 后台禁止蓝色
- 规则：后台视觉是「文库本」——暖纸底 + 墨色 + 宋体。**禁止出现蓝色按钮/链接/高亮**（`--adm-c1` 的靛色只用于极少量的信息标记）。
