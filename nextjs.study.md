# 文档标记

🚩：使用ctrl+鼠标左键可跳转内容标题

🐓：进阶内容

🤦‍♀️：未明白的

# [项目结构图](#使用)

```tex
next-app 项目名称
├─ eslint.config.mjs
├─ instrumentation.ts (服务器进程启动时执行的文件代码)
├─ middleware.ts (中间件处理文件：可以处理跨域代理)
├─ next.config.ts (next的配置文件)
├─ package-lock.json
├─ package.json
├─ postcss.config.mjs
├─ public (全局的静态资源存放目录：可通过/next.svg直接读取)
│  ├─ file.svg
│  ├─ globe.svg
│  ├─ next.svg
│  ├─ vercel.svg
│  └─ window.svg
├─ README.md
├─ src (源码目录：可有可无)
│  └─ app (app路由存放页面的目录 pages目录也是同理)
│     ├─ favicon.ico
│     ├─ globals.css (全局css)
│     ├─ layout.tsx (根布局 必要文件)
│     └─ page.tsx (首页页面 可删除)
└─ tsconfig.json
```

# CSS合并顺序

```tex
组件.module.css->页面.module.css->布局.css->根布局.css
```

# Meta设置

1. 不能从同一路由段中同时导出 `metadata` 对象和 `generateMetadata` 函数。
2. `metadata` 对象和 `generateMetadata` 函数导出仅在服务器组件中受支持。
3. `generateMetadata`中的`fetch`请求会自动记住`generateMetadata`、`generateStaticParams`、布局、页面和服务器组件中的相同数据。
4. `redirect()` 和 `notFound()` Next.js方法也可以在 `generateMetadata` 中使用 ..
5. `searchParams` 仅适用于 `page.js` 段..

## title设置

### template 设置默认标题 ，子页面继承默认标题

```tsx
//app/layout.tsx 设置默认标题和模版
export const metadata: Metadata = {
    title: {
        template: '%s | kkk',
        default: 'kkk',
    },
}

// app/blog/layout.tsx  此时如果跳转到这个页面 则显示 博客 | kkk
export const metadata: Metadata = {
    title: "博客"
}

```



## metadata配置项大全

### 基本元数据 (Basic Metadata)

这些是描述您页面核心信息的基础标签。

| 配置项 (`Property`) | 类型 (`Type`)                                      | 作用描述                                                     |
| ------------------- | -------------------------------------------------- | ------------------------------------------------------------ |
| `title`             | `string` | `{ default: string, template: string }` | 页面标题。可以是一个简单的字符串，也可以是一个模板对象，例如 `{ template: '%s | 我的网站' }`，`%s` 会被子页面的标题替换。 |
| `description`       | `string`                                           | 页面的 `<meta name="description">` 标签内容，用于搜索引擎结果页（SERP）的摘要，对 SEO 非常重要。 |
| `applicationName`   | `string`                                           | 网站应用的名称，生成 `<meta name="application-name">` 标签。 |
| `authors`           | `Array<{ name: string, url?: string | URL }>`      | 页面内容的作者信息，生成 `<meta name="author">`。可以包含作者主页的链接。 |
| `generator`         | `string`                                           | 生成此页面的软件名称。Next.js 会自动填充为 "Next.js"。       |
| `keywords`          | `Array<string>`                                    | 页面的关键字。**注意：现代主流搜索引擎（如 Google）已基本忽略此标签的 SEO 价值。** |
| `referrer`          | `string`                                           | 控制浏览器的 `Referrer` HTTP 头的策略，决定在用户从当前页面导航到其他页面时，发送多少引荐来源信息。 |
| `creator`           | `string`                                           | 页面内容的创建者或机构的名称。                               |
| `publisher`         | `string`                                           | 页面的发布者或机构的名称。                                   |

导出到 Google 表格

------



### 视图与主题 (Viewport & Theme)



这些选项控制页面在移动设备上的显示外观和行为。

| 配置项 (`Property`) | 类型 (`Type`)                                               | 作用描述                                                     |
| ------------------- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| `themeColor`        | `string` | `Array<{ media: string, color: string }>`        | 设置移动端浏览器（如 Chrome for Android）的地址栏和工具栏颜色。可以为不同模式（如暗黑模式 `(prefers-color-scheme: dark)`）设置不同颜色。 |
| `colorScheme`       | `'normal' | 'light' | 'dark' | 'dark light' | 'light dark'` | 告知浏览器此页面支持的颜色方案，帮助浏览器渲染默认 UI（如滚动条、表单控件）的样式。 |
| `viewport`          | `string` | `{ width?: number, initialScale?: number, ... }` | 控制页面的视口（viewport）行为，是响应式设计的核心。通常默认为 `width=device-width, initial-scale=1`。 |

导出到 Google 表格

------



### 搜索引擎优化 (SEO)



这些选项专门用于与搜索引擎爬虫沟通。

| 配置项 (`Property`) | 类型 (`Type`)                                                | 作用描述                                                     |
| ------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| `robots`            | `string` | `{ index?: boolean, follow?: boolean, noarchive?: boolean, ... }` | 精细地控制搜索引擎爬虫的行为。可以指示爬虫是否索引此页面、是否跟踪页面上的链接、是否缓存页面快照等。 |
| `verification`      | `{ google?: string, yahoo?: string, yandex?: string, other?: Record<string, string> }` | 用于向各大搜索引擎验证您的网站所有权。Next.js 会根据您提供的内容生成对应的 `<meta name="google-site-verification" content="...">` 等标签。 |

导出到 Google 表格

------



### 社交媒体 - Open Graph (通用标准)



Open Graph (OG) 协议是应用最广泛的社交媒体分享标准，被 Facebook, LinkedIn, Discord, WhatsApp 等多数平台支持。

| 配置项 (`Property`)     | 类型 (`Type`)                                                | 作用描述                                                     |
| ----------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| `openGraph.title`       | `string`                                                     | 在社交媒体上分享时显示的标题 (`og:title`)。如果未提供，通常会回退使用 `metadata.title`。 |
| `openGraph.description` | `string`                                                     | 在社交媒体上分享时显示的描述 (`og:description`)。如果未提供，会回退使用 `metadata.description`。 |
| `openGraph.url`         | `string` | `URL`                                             | 该分享内容的唯一规范 URL (`og:url`)。                        |
| `openGraph.siteName`    | `string`                                                     | 您的网站名称 (`og:site_name`)。                              |
| `openGraph.images`      | `Array<string | { url: string, width?: number, height?: number, alt?: string }>` | 分享时显示的预览图 (`og:image`)。可以提供多张图片或带详细尺寸信息的图片对象。推荐尺寸为 1200x630。 |
| `openGraph.locale`      | `string`                                                     | 内容的语言区域，例如 `zh_CN`。                               |
| `openGraph.type`        | `'website' | 'article' | 'book' | ...`                       | 内容的类型。默认为 `website`。对于博客文章等应设置为 `article`。 |

导出到 Google 表格

------



### 社交媒体 - Twitter (X)



为 Twitter/X 平台提供专门的、更丰富的卡片展示效果。

| 配置项 (`Property`)   | 类型 (`Type`)                                          | 作用描述                                                     |
| --------------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| `twitter.card`        | `'summary' | 'summary_large_image' | 'app' | 'player'` | 在 Twitter 上分享时显示的卡片类型。`summary_large_image`（带大图的摘要卡片）最常用。 |
| `twitter.title`       | `string`                                               | 在 Twitter 卡片上显示的标题。                                |
| `twitter.description` | `string`                                               | 在 Twitter 卡片上显示的描述。                                |
| `twitter.siteId`      | `string`                                               | 您的网站在 Twitter 上的用户 ID。                             |
| `twitter.creator`     | `string`                                               | 内容创建者的 Twitter 用户名（例如 `@username`）。            |
| `twitter.images`      | `Array<string | { url: string, alt?: string }>`        | 在 Twitter 卡片上显示的预览图。如果未提供，Twitter 会回退使用 `openGraph.images`。 |

导出到 Google 表格

------



### 网站图标 (Icons)



定义在各种场景下代表您网站的图标。

| 配置项 (`Property`) | 类型 (`Type`)                              | 作用描述                                                     |
| ------------------- | ------------------------------------------ | ------------------------------------------------------------ |
| `icons.icon`        | `string` | `UrlObject` | `Array<...>`      | 网站的主要图标 (favicon)，用于浏览器标签页等。可以提供多种尺寸和类型。 |
| `icons.shortcut`    | `string` | `UrlObject` | `Array<...>`      | 用于 `rel="shortcut icon"` 的传统 favicon，主要为了向后兼容。 |
| `icons.apple`       | `string` | `UrlObject` | `Array<...>`      | 用于苹果设备“添加到主屏幕”的图标 (`apple-touch-icon`)。推荐尺寸 180x180。 |
| `icons.other`       | `Array<{ rel: string, url: string, ... }>` | 用于定义其他非标准的图标链接，例如 `rel="mask-icon"` 用于 Safari 的固定标签页图标。 |

导出到 Google 表格

------



### 替代链接 (Alternate Links)



为当前页面提供不同版本或格式的链接，对 SEO 和内容分发非常重要。

| 配置项 (`Property`)    | 类型 (`Type`)                        | 作用描述                                                     |
| ---------------------- | ------------------------------------ | ------------------------------------------------------------ |
| `alternates.canonical` | `string` | `UrlObject`               | 指定页面的**规范 URL**。当一个内容可以通过多个 URL 访问时，用它来告诉搜索引擎哪个才是“官方”版本，以避免重复内容惩罚。 |
| `alternates.languages` | `Record<string, string | UrlObject>` | 提供页面的其他语言版本 URL，用于国际化 SEO。例如 `{ 'en-US': '/en-US/about', 'de-DE': '/de-DE/about' }`。 |
| `alternates.media`     | `Record<string, string | UrlObject>` | 提供页面的其他媒体类型版本，例如一个只适配移动设备的 URL。   |
| `alternates.types`     | `Record<string, string | UrlObject>` | 提供页面的其他内容类型版本，最常用于链接到 RSS 或 Atom feed，例如 `{ 'application/rss+xml': '/rss.xml' }`。 |

导出到 Google 表格

------



### 其他元数据 (Other Metadata)



| 配置项 (`Property`) | 类型 (`Type`)              | 作用描述                                                     |
| ------------------- | -------------------------- | ------------------------------------------------------------ |
| `manifest`          | `string` | `URL`           | 指向 `manifest.json` 文件的路径，是 PWA（渐进式 Web 应用）的核心配置文件。 |
| `archives`          | `string` | `Array<string>` | 指向该页面的归档（Archive）页面的 URL。                      |
| `bookmarks`         | `string` | `Array<string>` | 指向该页面的一个合适的书签（Bookmark）URL。通常就是当前页面的永久链接。 |
| `category`          | `string`                   | 页面的内容分类。                                             |

## 默认meta配置

```html
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

## 静态metadata

```tsx
import type { Metadata } from 'next'
 //在page导出metadata字段
export const metadata: Metadata = {
  title: 'My Blog',
  description: '...',
}
 
export default function Page() {}
```

## 动态metadata

例如使用fetch获取动态文章标题

```tsx
import type { Metadata, ResolvingMetadata } from 'next'
 
type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}
 
export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const slug = (await params).slug
 
  // fetch post information
  const post = await fetch(`https://api.vercel.app/blog/${slug}`).then((res) =>
    res.json()
  )
 
  return {
    title: post.title,
    description: post.description,
  }
}
 
export default function Page({ params, searchParams }: Props) {}
```

## 🚩[meta文件配置](#Metadata Files  元数据文件)

# 字体

## [加载谷歌字体](https://nextjs.org/docs/app/getting-started/fonts#google-fonts)

```js
import { Geist } from 'next/font/google'
 
export const geist = Geist({
  weight: '400', //字体粗细
  subsets: ['latin'],
})
```

## [加载本地字体](https://nextjs.org/docs/app/getting-started/fonts#local-fonts)

```js
import localFont from 'next/font/local'
 
export const myFont = localFont({
  src: './my-font.woff2',
  // 定义css变量名
  variable: "--global-font"
})
```


## 使用

```jsx
//引入之前声明的字体文件
import {myFont} from "字体文件路径"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
      //使用字体css变量名
    <html lang="en" className={`${myFont.className} ${myFont.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```



## Font API 参数

| Key 值                                                       | `font/google` | `font/local` | Type 数值类型              | des 描述                                                     | Required 是否必填 |
| ------------------------------------------------------------ | ------------- | ------------ | -------------------------- | ------------------------------------------------------------ | ----------------- |
| [`src`](https://nextjs.org/docs/app/api-reference/components/font#src) | ❌             | ✅            | String or Array of Objects | 资源地址                                                     | Yes               |
| [`weight`](https://nextjs.org/docs/app/api-reference/components/font#weight) | ✅             | ✅            | String or Array            | 字体粗细                                                     | Required/Optional |
| [`style`](https://nextjs.org/docs/app/api-reference/components/font#style) | ✅             | ✅            | String or Array            | 参考[font-style](https://developer.mozilla.org/zh-CN/docs/Web/CSS/font-style)样式 | -                 |
| [`subsets`](https://nextjs.org/docs/app/api-reference/components/font#subsets) | ✅             |              | Array of Strings           |                                                              | -                 |
| [`axes`](https://nextjs.org/docs/app/api-reference/components/font#axes) | ✅             |              | Array of Strings           |                                                              | -                 |
| [`display`](https://nextjs.org/docs/app/api-reference/components/font#display) | ✅             | ✅            | String                     |                                                              | -                 |
| [`preload`](https://nextjs.org/docs/app/api-reference/components/font#preload) | ✅             | ✅            | Boolean                    | 预加载                                                       | -                 |
| [`fallback`](https://nextjs.org/docs/app/api-reference/components/font#fallback) | ✅             | ✅            | Array of Strings           | 加载失败备选字体                                             | -                 |
| [`adjustFontFallback`](https://nextjs.org/docs/app/api-reference/components/font#adjustfontfallback) | ✅             | ✅            | Boolean or String          | 是否应使用自动后备字体                                       | -                 |
| [`variable`](https://nextjs.org/docs/app/api-reference/components/font#variable) | ✅             | ✅            | String                     | css变量名如（--my-fint）                                     | -                 |
| [`declarations`](https://nextjs.org/docs/app/api-reference/components/font#declarations) | ❌             | ✅            | Array of Objects           |                                                              | -                 |

# 网络速度慢 UX优化

为了提高感知性能，你可以使用 `` 钩子在过渡过程中向用户显示内联视觉反馈（如链接上的旋转图标或文本闪烁、页面顶部的导航状态条）。.

```tsx
// components/loading.tsx
'use client'
import { useLinkStatus } from 'next/link'
export default function LoadingIndicator() {
  const { pending } = useLinkStatus()
  return pending ? (
    <div role="status" aria-label="Loading" className="spinner" />
  ) : null
}
```

# 获取数据

您可以使用以下方法在 服务端组件 中获取数据：

1. The [`fetch` API](https://nextjs.org/docs/app/getting-started/fetching-data#with-the-fetch-api) `fetch` API 的调用。 
2. An [ORM or database](https://nextjs.org/docs/app/getting-started/fetching-data#with-an-orm-or-database)

### 服务端

```tsx
//服务端页面请求
import React from "react";
import {ArticleList} from "@/app/blog/components/Article";
import {Suspense} from "@/components/Loader";
import http from "@/lib/http";


export default async function Web() {
    const data = await http.get('/shopapi/article/lists')
    return (
        <div className="text-primary">

            <Suspense >
                <ArticleList data={data}/>
            </Suspense>
        </div>
    )
}
```

### 客户端 (use)

使用[SWR](https://swr.vercel.app/) or [React Query](https://tanstack.com/query/latest)第三方库从客户端发送请求

从服务端请求流向客户端

```tsx
//服务端页面请求
import React from "react";
import {ArticleList} from "@/app/blog/components/Article";
import {Suspense} from "@/components/Loader";
import http from "@/lib/http";


export default async function Web() {
    return (
        <div className="text-primary">

            <Suspense >
                <ArticleList api={http.get('/shopapi/article/lists')}/>
            </Suspense>
        </div>
    )
}
```

```tsx
// 客户端使用use钩子读取Promise数据
"use client"
import React from "react"

export default function ArticleList(props: { api: Promise<any> }) {
    const list = React.use(props.api)
    console.log(list, "???")

    return (
        <div>

        </div>
    )
}

```



### [并行数据获取 ](https://nextjs.org/docs/app/getting-started/fetching-data#parallel-data-fetching)

可以通过在使用数据的组件外部定义请求并一起解析它们来并行启动请求，例如，使用 `Promise.all` ：。

```tsx
import Albums from './albums'
 
async function getArtist(username: string) {
  const res = await fetch(`https://api.example.com/artist/${username}`)
  return res.json()
}
 
async function getAlbums(username: string) {
  const res = await fetch(`https://api.example.com/artist/${username}/albums`)
  return res.json()
}
 
export default async function Page({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const artistData = getArtist(username)
  const albumsData = getAlbums(username)
 
  // Initiate both requests in parallel
  const [artist, albums] = await Promise.all([artistData, albumsData])
 
  return (
    <>
      <h1>{artist.name}</h1>
      <Albums list={albums} />
    </>
  )
}
```



### [预加载数据](https://nextjs.org/docs/app/getting-started/fetching-data#preloading-data)

可以在 `getGoodsList()` 之前调用 `preload()` 来紧急启动 `<Item/>` 数据依赖关系。当 `<Item/>` 被渲染时，它的数据已经被获取了

```tsx
import React from "react";
import {ArticleList} from "@/app/blog/components/Article";
import {Suspense} from "@/components/Loader";
import http from "@/lib/http";


function getList() {
    return http.get('/shopapi/article/lists')
}

function getGoodsList(){
    return http.get('/shopapi/goods/lists?page_no=1&page_size=10&category_id=10')
}

export const preload = () => {
    // void evaluates the given expression and returns undefined
    // https://developer.mozilla.org/docs/Web/JavaScript/Reference/Operators/void
    void getList()
}

export async function Item() {
    const result = await getList()

    console.log(result, "djsakljdasl")

    return (
        <div>
            {JSON.stringify(result)}
        </div>
    )
}

export default async function Web() {

    const res = await getGoodsList()
    console.log(res,"商品列表")
    if(!res.data.lists.length) return null
    return (
        <div className="text-primary">
            <Suspense>
                <Item></Item>
                <div>123</div>
                {/*<ArticleList api={http.get('/shopapi/article/lists')}/>*/}
            </Suspense>
        </div>
    )
}

```



# 🐓[更新数据](https://nextjs.org/docs/app/getting-started/updating-data) 

# 缓存和重新验证 

## [`fetch`](https://nextjs.org/docs/app/getting-started/caching-and-revalidating#fetch)

### cache

默认情况下，不会缓存 `fetch` 请求。您可以通过将 `cache` 选项设置为 `'force-cache'` 来缓存单个请求。

```tsx
export default async function Page() {
  const data = await fetch('https://...', { cache: 'force-cache' })
}
```

### next.revalidate

重新验证 `fetch` 请求返回的数据，您可以使用 `next.revalidate` 选项。

```tsx
export default async function Page() {
  //这将在指定的3600秒数后重新验证数据。
  const data = await fetch('https://...', { next: { revalidate: 3600 } })
}
```

### [`revalidateTag`](https://nextjs.org/docs/app/getting-started/caching-and-revalidating#revalidatetag)

`revalidateTag` 用于根据标记和事件重新验证缓存条目。要将其与 `fetch` 一起使用，首先使用 `next.tags` 选项标记函数

```tsx
export async function getUserById(id: string) {
  const data = await fetch(`https://...`, {
    next: {
      tags: ['user'],
    },
  })
}
```





## 🐓[`unstable_cache`](https://nextjs.org/docs/app/getting-started/caching-and-revalidating#unstable_cache)

`unstable_cache` 允许您缓存数据库查询和其他异步函数的结果。要使用它，请将 `unstable_cache` 包裹在函数周围

```tsx
import { unstable_cache } from 'next/cache'
import { getUserById } from '@/app/lib/data'
 
export default async function Page({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
 
  const getCachedUser = unstable_cache(
    async () => {
      return getUserById(userId)
    },
    [userId],//将用户ID添加到缓存键中
  {
    tags: ['user'],//Next.js 用于重新验证缓存的标签数组..
    revalidate: 3600,//缓存后的秒数应重新验证..
  }
  )
}
```



## React cache 

核心作用是：**在单次服务端渲染（Server Render）过程中，对数据请求或其他异步函数的结果进行缓存和去重（deduplication）。**

简单来说：它能确保在一次页面渲染中，即使您在多个不同的组件里调用了同一个数据请求函数，这个函数也**只会被真正执行一次**。

### `cache` 函数的作用和用法

#### 1. 解决的问题：重复数据请求

在一个复杂的页面中，不同的组件可能依赖于相同的数据。例如：

- 页面的 `<Header />` 组件需要获取当前登录用户的信息来显示头像。
- 页面的 `<Sidebar />` 组件也需要获取当前登录用户的信息来显示用户名。

如果没有 `cache`，`<Header />` 和 `<Sidebar />` 会各自调用一次 `getUser()` 函数，导致对数据库或 API 的两次重复请求，既浪费资源又拖慢了渲染速度。

#### 2.工作原理

`React.cache` 会包裹一个您提供的数据获取函数（例如 `getUser`），并返回一个**新的、带缓存功能的版本**。

- **首次调用**: 当您在渲染过程中第一次调用这个带缓存的函数时（例如 `cachedGetUser('123')`），它会正常执行原始的 `getUser` 函数，发起数据请求，然后将**返回的 Promise** 存入一个**仅限于本次请求生命周期**的缓存中。缓存的键（key）由函数本身和您传入的参数共同决定。
- **后续调用**: 在同一次渲染过程中，如果任何其他组件以**完全相同的参数**再次调用这个带缓存的函数（`cachedGetUser('123')`），它会直接从缓存中返回之前存储的那个 Promise，而**不会再次执行**原始的 `getUser` 函数。

#### **3.何时使用 `React.cache`?** **当您的数据获取函数不使用 `fetch` 时**

```tsx
// lib/data.ts
import { cache } from 'react';
import { db } from '@/lib/db'; // 假设数据库客户端

// 原始的数据获取函数
const getUserById_uncached = async (id: string) => {
  console.log(`正在从数据库查询用户: ${id}`); // 我们用这个日志来观察它是否被重复执行
  const user = await db.user.findUnique({ where: { id } });
  return user;
};

// 使用 React.cache 将其包裹起来
export const getUserById = cache(getUserById_uncached);
```



# 内置组件

### [Link](https://nextjs.org/docs/app/api-reference/components/link#reference)页面导航

```tsx
import Link from 'next/link'
 
//最终地址栏显示 /about?name=test
/*
replace:Boolean 替换当前页面 默认为false 
*/
export default function Page() {
  return (
    <Link  
      href={{
        pathname: '/about',
        query: { name: 'test' },
      }}
    >
      About
    </Link>
  )
}
```

#### replace 页面替换导航

`true`: 导航时，会**替换（replace）当前的历史记录。用户点击“后退”按钮会跳过**当前页面，返回到更早的页面。

#### prefetch 性能优化

控制是否在后台**预取（Prefetch）**链接页面的数据

**使用场景**:

- 在绝大多数情况下，保持默认的 `true` 即可享受性能优化。
- 对于那些用户不常点击、或者数据量非常大的链接，可以设置为 `false` 来节省用户带宽。

#### scroll 跳转页面是否滚动到顶部

常见的应用场景

1. 标签页并需要更改地址栏
2. 路由驱动的模态框或侧边栏
3. 动态内容过滤和排序
4. 任何不希望滚动位置重置的交互

```tsx
//比如这是一个商品列表页面  同时有两个过滤选项 all status
// 当点击全部 滚动条会滚动至顶部
<Link href={"/goods?filter=all"} scroll={true}>全部</Link>
// 当点击推荐 滚动条会保留目前的位置
<Link href={"/goods?filter=ret"} scroll={false}>推荐</Link>

//以下是商品列表 如果超出出现页面滚动条
```



### [Script](https://nextjs.org/docs/app/api-reference/components/script#props)加载策略

#### beforeInteractive(在整个站点之前)

1. 必须放在根布局文件
2. 会在第一方代码之前都会预加载和获取，而且不会阻止页面的水合
3. 无论你将该策略的组件放置在组件的任何位置都会提升到文档的head中
4. 不能监听onLoad(不支持在服务端组件使用)事件，考虑使用onReady(不支持在服务端组件使用)

```tsx
import Script from 'next/script'
 
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="https://example.com/script.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  )
}
```

#### afterInteractive(默认值，尽快加载)

1. 可任意放置到任何页面和布局中，只有打开该页面才会执行

#### lazyOnload(懒加载)

1. 浏览器空闲时并在获取页面的所有资源之后加载
2. 可任意放置到任何页面和布局中，只有打开该页面才会执行

### 🐓worker(尚不稳定)

1. 主要用于Web WorkerAPI 已释放线程资源

# 文件系统约定

## 动态路由段[folderName]

### 指定字段

假如需要跳转到一个文章详情时，需要指定文件结构为article/[id]/page.tsx

```tsx
<Link href={"/blog/article/12"}>跳转到详情</Link>
```

#### 服务器组件获取参数

```tsx
//article/[id]/page.tsx
export default async function Web({params}: Promise<{ params: { id: string } }>) {
    const {id} = await params
    return (
        <div>
            文章详情页
        </div>
    )
}

```

#### 客户端组件获取单个参数

```tsx
"use client"
import {useParams} from "next/navigation"

export default async function Web() {
    const params = useParams()
    return (
        <div>
            文章详情页
        </div>
    )
}

```



### 捕获所有字段

假如需要跳转到一个文章详情并要带上分类时，需要指定文件结构为article/[...params]/page.tsx

```tsx
<Link href={"/blog/article/12/2"}>跳转到详情</Link>
//无论带有多少个参数都会跳转到 article/[...params]/page.tsx页面
<Link href={"/blog/article/12/2/3"}>跳转到详情</Link>
```

#### 服务器组件获取参数

```tsx
// /blog/test/12/21312
export default async function Web({params}:Promise<any>) {
    const {keys} = await params
    const [id,type] = keys
    console.log("???", id,type)
    return (
        <div>
            文章详情页
        </div>
    )
}

```

#### 客户端组件获取多个参数

```tsx
// /blog/test/12/21312
"use client"
import {useParams} from "next/navigation"
export default function Web() {
    const {keys} = useParams()
    const [id, type] = keys
    console.log(id, type)
    return (
        <div>
            文章详情页
        </div>
    )
}

```

### 可选捕获所有字段

指定文件结构为article/[[...params]]/page.tsx

参数获取于[捕获所有字段](#捕获所有字段)🚩相似

### 获取查询参数?type=3

#### 服务器组件获取

```tsx
// article/1?type=23
export default async function Web({searchParams}:Promise<any>) {
    const queryParams = await searchParams
    console.log("???", queryParams)
    return (
        <div>
            文章详情页
        </div>
    )
}

```



#### 客户端组件获取

```tsx
"use client"
import { useSearchParams} from "next/navigation"
// article/1?type=23
export default function Web() {
    const search = useSearchParams()
    console.log("???",  search.get('type'))
    return (
        <div>
            文章详情页
        </div>
    )
}

```

## error.jsx

### 总结

1. 错误组件只能是客户端组件
2. 需要放置在和page文件相同的位置
3. 在客户端组件只能捕获渲染期间的错误

```tsx
// article/[id]/global-error.tsx
'use client' // Error boundaries must be Client Components
export default function Error({
                                  error,
                                  reset,
                              }: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    console.log(error,"错误信息 ")
    return (
        <div>
            <h2>Something went wrong!</h2>
            <button onClick={() => reset()}>Try again</button>
        </div>
    )
}
```

```tsx
// article/[id]/pages.tsx
"use client"
import React from "react";
export default function Web() {
    React.useEffect(()=>{
        //引发错误之后会渲染error.tsx
        throw new Error("发生错误")
    },[])

    return (
        <div>
            文章详情页
        </div>
    )
}
```

### 捕获异步错误

```tsx
"use client"
import React from "react";

function getList(){
    return new Promise((resolve,reject)=>{
        setTimeout(()=>{
            reject(new Error("发生了错误"))
        },500)
    })
}

export default function Web() {
    const [error,setError] = React.useState<Error | null>(null)
    React.useEffect(()=>{
        getList().catch(err=>{
            setError(err)
        })

    },[])
    if(error){
        throw error
    }

    return (
        <div>
            文章详情页
        </div>
    )
}
```

### 服务端捕获错误

```tsx
function getList(){
    return new Promise((resolve,reject)=>{
        setTimeout(()=>{
            reject()
        },500)
    })

}

export default async function Web() {
    try{
        await getList()
    }catch (err){
        console.log("错误",err)
        throw new Error("获取文章失败")
    }

    return (
        <div>
            文章详情页
        </div>
    )
}

```

### 全局错误

```tsx
// app/global-global-error.tsx  文件名必须是：global-error
'use client' // Error boundaries must be Client Components
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    // 必须定义html结构 替换根布局
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  )
}
```

## 🐓[instrumentation.js](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation)  

### 总结

1. 文件用于将可观察性工具集成到应用程序中，使您可以跟踪性能和行为，并在生产中调试问题
2. 要使用它，请将文件放在应用程序的根或`src`文件夹中

```ts
import { registerOTel } from '@vercel/otel'
 
export function register() {
  registerOTel('next-app')
}
```

## 🐓instrumentation-client.js

1. 无需导出任何功能，文件用于将可观察性工具集成到应用程序中，使您可以跟踪性能和行为，并在生产中调试问题
2. 要使用它，请将文件放在应用程序的根或`src`文件夹中

## 拦截路由UI

### 总结

1. 拦截路由的触发与否，关键在于**发起导航的页面所在的布局（Layout）\**和\**目标 URL**，而与发起页面的**嵌套深度无关**。(拦截基于布局，而非深度)
2. 拦截器本身应该与**展示它的布局（Layout）\**放在一起，而不是与\**它要拦截的目标路由**放在一起 （如：要blog首页展示文章详情，应该设置拦截路线app/blog/(.)article/[id]/pages.tsx，不推荐放置在被拦截目标路由下）
3. 如果在使用F5等刷新页面的时会重新导航至目标页面，流程如下：导航至详情页-被拦截-刷新-展示真正的详情页

### [匹配拦截路线](https://nextjs.org/docs/app/api-reference/file-conventions/intercepting-routes#convention)

- `(.)`在同一级别上匹配段。
- `(..)`以上一个级别匹配一个级别。
- `(..)(..)`与上述两个级别匹配。
- `(...)`匹配root`app`目录的段。

```tsx
// app/blog/article/[id]/pages.tsx 是原页面展示
export default async function Web() {
    return (
        <div>
            文章详情页
        </div>
    )
}
```

```tsx
// app/blog/(.)article/[id]/pages.tsx 拦截上方的页面 并用该页面进行替换
export default async function Web() {
    return (
        <div>
            被拦截的文章详情页
        </div>
    )
}

```

## layout.jsx

1. 不应手动添加`<head>`标签，例如`<title>`和`<meta>`
2. `app`目录必须包括一个根`app/layout.js`。
3. 创建多个根部布局,跨多个根部布局导航会导致全页加载

### React.use在客户端组件获取路由段参数params

```tsx
"use client"
import React from "react"
export default  function Web({params}:any) {
    const p = React.use(params)
    console.log(p ,"参数")

    return (
        <div>
            文章详情页
        </div>
    )
}

```

## loading.tsx

1. 放置在page.tsx相同的层级

```tsx
export default function Loading() {

    return (
        <div>
            加载中...
        </div>
    )
}

```

### [suspense](https://zh-hans.react.dev/reference/react/Suspense#suspense)  流式渲染

**流式渲染**允许服务器在渲染完成一部分后，就**立刻开始把这部分 HTML 以“流”的形式分块发送给浏览器**，无需等待整个页面在服务器上渲染完毕

#### 当内容正在加载时显示后备方案 

```tsx
// app/blog/article 
import {Suspense} from "react"
import Cate from "./components/Cate";
import Spinner from "@/components/Spinner/Spinner";
import Card from "@/app/blog/article/components/Card";

export default function Web() {
    return (
        <div className="text-primary">
            文章列表页
            <Suspense fallback={<Spinner/>}>
                <Cate></Cate>
            </Suspense>

            <Suspense fallback={<Spinner/>}>
                <Card></Card>
            </Suspense>
        </div>
    )
}

```

```tsx
// Cate.tsx
"use client";
import React from 'react';

const cache = new Map();


async function getBio() {
    // 添加一个假的延迟，以便让等待更加明显。
    await new Promise(resolve => {
        setTimeout(resolve, 3000);
    });

    return `The Beatles were an English rock band, 
    formed in Liverpool in 1960, that comprised 
    John Lennon, Paul McCartney, George Harrison 
    and Ringo Starr.`;
}

export function fetchData(url) {
    console.log("调用了")
    if (!cache.has(url)) {
        // 如果缓存里没有，就创建一个新的 Promise 并存进去
        cache.set(url, getBio());
    }

    // 总是从缓存里返回 Promise
    return cache.get(url);
}

export default function Card() {
    const cate = React.use(fetchData('1'))
    console.log("打印", cate)
    return (
        <div>
            获取列表
        </div>
    )
}

```

```tsx
// Cate.tsx
function getCate() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve()
        }, 2000)
    })
}

export default async function Cate() {
    const cate = await getCate()
    return (
        <div>
            获取分类
        </div>
    )
}

```

#### 在新内容加载时展示过时内容 

```tsx
"use client";
import React, {ChangeEvent, Suspense} from "react"
import Spinner from "@/components/Spinner/Spinner";
import Card from "@/app/blog/article/components/Card";
import {fetchData} from "@/app/api";

export function QueryResult(props: { query: string }) {

    const dd = React.use(fetchData('1'))
    if (dd !== props.query) return <div>
        输入的值：{props.query}
    </div>
    return (
        <div>{dd}</div>
    )
}

export default function Web() {
    const [query, setQuery] = React.useState('')
    const deferredQuery = React.useDeferredValue(query);
    const isStale = query !== deferredQuery;

    function handleChange(e: ChangeEvent) {
        setQuery((e.target as HTMLInputElement)?.value)
    }

    return (
        <div className="text-primary">
            <input value={query} placeholder={"请搜索"} onChange={handleChange}/>
            <Suspense fallback={<Spinner/>}>
                <div style={{opacity: isStale ? 0.5 : 1}}>
                    <QueryResult query={deferredQuery}/>
                </div>
            </Suspense>
            <Suspense fallback={<Spinner/>}>
                <Card></Card>
            </Suspense>
        </div>
    )
}

```

## 🐓[mdx-components.tsx](https://nextjs.org/docs/app/guides/mdx#install-dependencies)

1. 可以在本地使用.md、.mdx文件编写页面
2. 允许您自定义 MDX 文件在渲染时所使用的 React 组件，用您自己的组件来替换原生的 HTML 标签，并注入.md、.mdx全局可用的自定义组件。
3. 文件放置在同app、pages、src目录下

### 存放位置

```js
  my-project
  ├── app
  │   └── mdx-page
  │       └── page.(mdx/md)
  |── mdx-components.(tsx/js)
  └── package.json
```



```tsx
import type {MDXComponents} from 'mdx/types'

export function useMDXComponents(components: MDXComponents): MDXComponents {
    return {
        ...components,
        // 添加自定义组件 可在全局.md mdx文件使用
        // 'MyInput': MyInput
    }
}
```



### 安装依赖

```js
npm install @next/mdx @mdx-js/loader @mdx-js/react @types/mdx
```

### next.config.js  配置

```ts
import createMDX from '@next/mdx'
 
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure `pageExtensions` to include markdown and MDX files
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  // Optionally, add any other Next.js config below
}
 
const withMDX = createMDX({
  // 在此处添加markdown插件
  //默认情况下，next/mdx仅使用.mdx扩展程序编译文件。要使用WebPack处理.md文件，请更新extension选项：
   extension: /\.(md|mdx)$/,
})
 
// 合并 Next.js config
export default withMDX(nextConfig)
```

### props传参

传参与普通的组件相同

```tsx
# Welcome to my MDX page!

This is some **bold** and _italics_ text.

This is a list in markdown:

- One
- Two
- Three

Checkout my React component:
接受参数：{props.content}
{props.children}
```



### [远程MDX ](https://nextjs.org/docs/app/guides/mdx#remote-mdx)

```tsx
import { MDXRemote } from 'next-mdx-remote-client/rsc'
 
export default async function RemoteMdxPage() {
  // MDX text - can be from a database, CMS, fetch, anywhere...
  const res = await fetch('https://...')
  const markdown = await res.text()
  return <MDXRemote source={markdown} />
}
```

### [如何将Markdown转变为HTML？](https://nextjs.org/docs/app/guides/mdx#deep-dive-how-do-you-transform-markdown-into-html)

```ts
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
 
main()
 
async function main() {
  const file = await unified()
    .use(remarkParse) // Convert into markdown AST
    .use(remarkRehype) // Transform to HTML AST
    .use(rehypeSanitize) // Sanitize HTML input
    .use(rehypeStringify) // Convert AST into serialized HTML
    .process('Hello, Next.js!')
 
  console.log(String(file)) // <p>Hello, Next.js!</p>
}
```

## [middleware.js](https://nextjs.org/docs/app/api-reference/file-conventions/middleware)  中间件 

middleware.js用于在请求完成之前在服务器上编写中间件和运行代码。然后，根据传入请求，您可以通过重写，重定向，修改请求或响应标头或直接响应来修改响应。

1. 中间件在渲染路线之前执行，对于实现自定义服务器端逻辑（例如身份验证，日志记录或处理重定向）特别有用
2. 放置于app目录同一层级

### 配置对象

#### [Matcher 匹配器](https://nextjs.org/docs/app/api-reference/file-conventions/middleware#matcher)

```ts
export const config = {
  // 执行白名单 空的数组意味着不匹配任何路径
  matcher: ['/about/:path*', '/dashboard/:path*'],
}
```

### [NextResponse](https://nextjs.org/docs/app/api-reference/file-conventions/middleware#nextresponse)

#### redirect  重定向

```tsx
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // 在这里编写您的逻辑

    // 检查请求路径
    if (request.nextUrl.pathname.startsWith('/blog')) {
        const deskUrl = new URL('/desktop',request.url)
        // 返回一个重定向响应
        return NextResponse.redirect(deskUrl);
    }

    // 默认情况下，让请求继续
    return NextResponse.next();
}
```

#### rewrite  重写

1. 在保持URL地址栏不变的情况下，渲染其他页面内容
2. 不会重新发送新的请求

```ts
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // 在这里编写您的逻辑

    // 检查请求路径
    if (request.nextUrl.pathname.startsWith('/blog')) {
        const deskUrl = new URL('/desktop',request.url)
        // 返回一个重定向响应
        return NextResponse.rewrite(deskUrl);

    }

    // 默认情况下，让请求继续
    return NextResponse.next();
}
```

#### rewrite  和  redirect  总结对比

| 特性           | `NextResponse.rewrite()` (重写)  | `NextResponse.redirect()` (重定向)          |
| -------------- | -------------------------------- | ------------------------------------------- |
| **URL 地址栏** | **不变**                         | **改变**为新的 URL                          |
| **请求次数**   | 1 次                             | 2 次 (浏览器收到3xx后，再发一个新请求)      |
| **本质**       | **服务端行为**，对用户透明       | **客户端行为** (由服务端发起)，用户能感知到 |
| **SEO 影响**   | 需谨慎使用，可能导致内容重复问题 | 清晰地告诉搜索引擎页面已移动 (301/302)      |
| **常用动词**   | “渲染为 (renders as)”            | “跳转到 (goes to)”                          |

#### 使用cookie

```ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) {
  // Assume a "Cookie:nextjs=fast" header to be present on the incoming request
  // Getting cookies from the request using the `RequestCookies` API
  let cookie = request.cookies.get('nextjs') // 获取缓存
  console.log(cookie) // => { name: 'nextjs', value: 'fast', Path: '/' }
  const allCookies = request.cookies.getAll() // 获取所有缓存
  console.log(allCookies) // => [{ name: 'nextjs', value: 'fast' }]
 
  request.cookies.has('nextjs') // => true // 缓存是否存在
  request.cookies.delete('nextjs') // 删除单个缓存
  request.cookies.has('nextjs') // => false
 
  // 设置响应cookie
  const response = NextResponse.next()
  response.cookies.set('vercel', 'fast') // 设置缓存
  response.cookies.set({
    name: 'vercel',
    value: 'fast',
    path: '/',
  })
  cookie = response.cookies.get('vercel')
  console.log(cookie) // => { name: 'vercel', value: 'fast', Path: '/' }
  // The outgoing response will have a `Set-Cookie:vercel=fast;path=/` header.
  // request.cookies.clear() // 清空所有缓存
  return response
}
```

设置响应头

```ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) {
  // Clone the request headers and set a new header `x-hello-from-middleware1`
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-hello-from-middleware1', 'hello')
 
  // You can also set request headers in NextResponse.next
  const response = NextResponse.next({
    request: {
      // New request headers
      headers: requestHeaders,
    },
  })
 
  // Set a new response header `x-hello-from-middleware2`
  response.headers.set('x-hello-from-middleware2', 'hello')
  return response
}
```

#### 设置请求头 、响应头

```tsx
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-hello-from-middleware1', 'hello')

    // You can also set request headers in NextResponse.next
    const response = NextResponse.next({
        request: {
            // New request headers
            headers: requestHeaders,
        },
    })

    // Set a new response header `x-hello-from-middleware2`
    response.headers.set('x-hello-from-middleware2', 'hello')

    // 默认情况下，让请求继续
    return response
}
```

##### next/headers 查看请求头

```ts
import {headers} from "next/headers"
export default async function Web() {
    const headersList = await headers();

    console.log("看看请求头", headersList.get('x-hello-from-middleware1'))
    return (
        <div className="text-primary">

        </div>
    )
}

```

#### 设置CORS

```ts
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 允许通过的白名单
const allowedOrigins = ['https://acme.com', 'http://localhost:3000']
// 服务器可允许的请求方式 和 请求头头
const corsOptions = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}
export function middleware(request: NextRequest) {
    const origin = request.headers.get('origin') || ''
    const isAllowedOrigin = allowedOrigins.includes(origin)
    const response = NextResponse.next()
    // 是否为预检请求
    const isPreflight = request.method === 'OPTIONS'
    if (isPreflight) {
        const preflightHeaders = {
            ...(isAllowedOrigin && { 'Access-Control-Allow-Origin': origin }),
            ...corsOptions,
        }
        return NextResponse.json({}, { headers: preflightHeaders })
    }

    if (isAllowedOrigin) {
        response.headers.set('Access-Control-Allow-Origin', origin)
    }

    Object.entries(corsOptions).forEach(([key, value]) => {
        response.headers.set(key, value)
    })


    return response
}

```

### [waitUntil](https://developer.mozilla.org/docs/Web/API/ExtendableEvent/waitUntil)

1. 会等待fetch等请求执行完毕，同时又不阻塞用户的其他请求
2. 对于在后台执行工作很有用。

```ts
import { NextResponse } from 'next/server'
import type { NextFetchEvent, NextRequest } from 'next/server'
 
export function middleware(req: NextRequest, event: NextFetchEvent) {
  event.waitUntil(
    fetch('https://my-analytics-platform.com', {
      method: 'POST',
      body: JSON.stringify({ pathname: req.nextUrl.pathname }),
    })
  )
 
  return NextResponse.next()
}
```

## not-found.tsx

用于捕获未声明的路由段 

```tsx
export default async function NotFound() {

    return (
        <div>
            404
        </div>
    )
}
```

## 并行路由

假如/blog有一个menu，/blog/article也有一个 两个menu的内容和布局是不同但都是放置在layout.tsx中

```tsx
export default async function BlogLayout({children, header}: Slots<'children' | 'header'>) {
    return (
        <div>
            {header}
            {children}
        </div>
    )
}
```

声明并行路由文件

```tsx
/* /blog/@header/menu/page.tsx  用于展示当页面跳转到/blog/menu时   layout中的header插槽将会渲染以下内容 但并在/blog/menu/page.tsx声明该页面 否则无法进行跳转
*/
export default async function Page() {
    return (
        <div>
            特殊的菜单
        </div>
    )
}
```

```tsx
/* /blog/@header/default.tsx  用于展示默认或者公共部分的内容  */
export default async function Default() {
    return (
        <div>
            默认菜单
        </div>
    )
}
```

### 与🚩[拦截路由](#拦截路由UI)一起工作

假如：用户在浏览页面的过程中登录状态过期了，但并不希望跳转到/login，而是使用弹窗的方式再次登录

```tsx
// blog/login/page.tsx
export default async function Page() {
    return (
        <div>
            正常跳转的登录页
        </div>
    )
}
```

```tsx
// 拦截login路由 /blog/@modal/(.)login/page.tsx
export default async function Page() {
    return (
        <div>
            被拦截的登录页
        </div>
    )
}
```

## 🤦‍♀️🐓  [route.ts](https://nextjs.org/docs/app/api-reference/file-conventions/route#reference)

## 路由组 (folderName)

1. 不会出现在地址URL路径中
2. 可创建layout.tsx，子路由共享布局

## 🐓路由段配置

路由段配置允许您在每个页面（`page.tsx`）或布局（`layout.tsx`）文件中，通过导出一个或多个特定的常量，来精细地控制该路由段的渲染行为、缓存策略和动态特性。

```tsx
// 导出相应的配置项变量名和相应的参数值
export const dynamic = "auto"
```

可选配置项

| 配置项                                                       | 类型                                                         | 默认值                     | 描述                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ | -------------------------- | ------------------------------------------------------------ |
| [`experimental_ppr`](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#experimental_ppr) | `boolean`                                                    |                            | 是否启动部分预渲染                                           |
| [`dynamic`](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic) | `'auto' | 'force-dynamic' | 'error' | 'force-static'`        | `'auto'`                   | 控制页面是**静态生成（SSG）\**还是\**动态渲染（SSR）**       |
| [`dynamicParams`](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamicparams) | `boolean`                                                    | `true`                     | 用于动态路由（如 `app/blog/[slug]`），控制如何处理**未被 `generateStaticParams` 预先生成的路径**。 |
| [`revalidate`](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#revalidate) | `false | 0 | number`                                         | `false`                    | 页面的缓存生命周期（秒）                                     |
| [`fetchCache`](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#fetchcache) | `'auto' | 'default-cache' | 'only-cache' | 'force-cache' | 'force-no-store' | 'default-no-store' | 'only-no-store'` | `'auto'                    | 路由段级别**覆盖**内部所有 `fetch` 请求的默认缓存行为。      |
| [`runtime`](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#runtime) | `'nodejs' | 'edge'`                                          | `'nodejs'`                 | 选择此路由段的**服务端运行时环境**。                         |
| [`preferredRegion`](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#preferredregion) | `'auto' | 'global' | 'home' | string | string[]`             | `'auto'`                   | 向部署平台（如 Vercel）**建议**此路由段的函数应该部署在哪个地理区域。 |
| [`maxDuration`](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#maxduration) | `number`                                                     | Set by deployment platform | 延长 Serverless Function 的**最大执行超时时间**，默认值由部署平台决定（例如，Vercel Pro 套餐默认为 15 秒）。 |

### dynamic

**核心作用**: 控制页面是**静态生成（SSG）\**还是\**动态渲染（SSR）**。

**可选值详解**:

- `'auto'` (默认值): Next.js 自动判断。如果检测到动态函数（`cookies()`, `headers()`）或不缓存的 `fetch`，则切换为动态渲染，否则尝试静态化。
- `'force-dynamic'`: 强制此页面为**动态渲染 (SSR)**。每次请求都会在服务器上重新渲染。
- `'error'`: 强制此页面为**静态生成 (SSG)**。如果检测到动态函数的使用，会在构建时直接报错。
- `'force-static'`: 强制静态生成，并会在构建时“哑化”动态函数（例如，`cookies()` 会返回空对象）。

### dynamicParams

**核心作用**: 用于动态路由（如 `app/blog/[slug]`），控制如何处理**未被 `generateStaticParams` 预先生成的路径**。

可选值详解

- `true` (默认值): **允许**访问未预生成的路径。Next.js 会在用户首次访问时**按需生成**这个页面。
- `false`: **禁止**访问未预生成的路径。如果用户访问的 `slug` 在 `generateStaticParams` 列表中不存在，会直接返回 **404 Not Found** 页面。

- **应用场景**: 当您的动态路径是有限且确定的（例如，一个文档网站的所有页面、一个产品目录），将其设置为 `false` 可以锁定您的网站只服务于已知的有效页面，增加安全性。

### revalidate

**可选值详解**:

- `false` (默认值): 将此页面的数据视为**永久缓存**（行为类似 SSG），直到下一次部署才会更新。
- `0`: **不使用缓存**。每次请求都重新渲染页面（行为类似 SSR）。
- `number` (例如 `60`): 缓存有效期为 60 秒。过期后的第一次请求会返回旧的缓存数据，同时在后台触发页面重新生成。

### fetchCache

**核心作用**: 在路由段级别**覆盖**内部所有 `fetch` 请求的默认缓存行为。

**可选值详解**:

- `'auto'` (默认值): 不覆盖，`fetch` 请求遵循其自身的 `cache` 或 `revalidate` 选项。
- `'default-cache'`: 默认强制缓存所有未指定 `cache` 选项的 `fetch` 请求。
- `'force-cache'`: 强制缓存此段内的**所有** `fetch` 请求，忽略它们自身的 `cache: 'no-store'` 设置。
- `'force-no-store'`: 强制**不缓存**此段内的所有 `fetch` 请求，即使它们设置了 `revalidate`。

**应用场景**: 在一个高度动态的页面（如仪表盘）的 `layout.tsx` 中设置 `fetchCache: 'force-no-store'`，可以确保该布局下的所有组件获取的都是最新数据，而无需在每个 `fetch` 调用中都写 `cache: 'no-store'`。

## template.jsx

一句话总结它们的核心区别：`layout` 是持久的，跨页面导航时状态会保留；而 `template` 是临时的，每次导航都会创建一个新的实例，状态会被重置。

```tsx
export default function Template({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}
```

### 包裹关系

布局（Layout）会包裹模板（Template），模板再包裹页面（Page）。

### 主要使用场景

#### 实现进入/离开动画 (最重要的场景)

####  依赖 `useEffect` 且需在每次导航时触发的逻辑

#### 强制重置特定状态

## [Metadata Files](https://nextjs.org/docs/app/api-reference/file-conventions/metadata)  元数据文件

### favicon, icon, and apple-icon图标设置

| 文件名                                                       | 支持的文件类型                          | 有效位置   | 展示位置                                                     |
| ------------------------------------------------------------ | --------------------------------------- | ---------- | ------------------------------------------------------------ |
| [`favicon`](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons#favicon) | `.ico`                                  | `app/`     | 浏览器标签页 、浏览器书签栏/收藏夹、浏览器历史记录           |
| [`icon`](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons#icon) | `.ico`, `.jpg`, `.jpeg`, `.png`, `.svg` | `app/**/*` | 现代浏览器的标签页和书签、安卓设备“添加到主屏幕”、PWA 应用图标、搜索引擎结果 |
| [`apple-icon`](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons#apple-icon) | `.jpg`, `.jpeg`, `.png`                 | `app/**/*` | iOS/iPadOS “添加到主屏幕”、Safari 浏览器                     |

##### 使用代码生成图标

```jsx
import { ImageResponse } from 'next/og'
 
// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'
 
// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 24,
          background: 'black',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        A
      </div>
    ),
    // ImageResponse options
    {
      // For convenience, we can re-use the exported icons size metadata
      // config to also set the ImageResponse's width and height.
      ...size,
    }
  )
}
```

### [社交媒体分享图标（推特等）](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image)

`twitter-image` 文件大小不得超过 5MB ，`opengraph-image` 文件大小不得超过 8MB 。如果图像文件大小超过这些限制，则构建将失败。

#### [使用代码（.js、.ts、.tsx）生成图像](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image#generate-images-using-code-js-ts-tsx)

```ts
import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
 
// Image metadata
export const alt = 'About Acme'
export const size = {
  width: 1200,
  height: 630,
}
 
export const contentType = 'image/png'
 
// Image generation
export default async function Image() {
  // Font loading, process.cwd() is Next.js project directory
  const interSemiBold = await readFile(
    join(process.cwd(), 'assets/Inter-SemiBold.ttf')
  )
 
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 128,
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        About Acme
      </div>
    ),
    // ImageResponse options
    {
      // For convenience, we can re-use the exported opengraph-image
      // size config to also set the ImageResponse's width and height.
      ...size,
      fonts: [
        {
          name: 'Inter',
          data: interSemiBold,
          style: 'normal',
          weight: 400,
        },
      ],
    }
  )
}
```

### robots.(txt 、ts)

```tex
User-Agent: *
Allow: /
Disallow: /private/

Sitemap: https://acme.com/sitemap.xml
```

```ts
//app/robots.ts
import type { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/private/',
    },
    sitemap: 'https://acme.com/sitemap.xml',
  }
}
```

#### [ 自定义特定用户代理 ](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots#customizing-specific-user-agents)

```ts
import type { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: 'Googlebot', // 指定这组规则适用于哪个或哪些网络爬虫。
        allow: ['/'], //告诉指定的爬虫允许访问哪些路径。这通常用于在一个被禁止的目录中，特例允许访问某个子目录或文件
        disallow: '/private/',//告诉指定的爬虫禁止访问哪些路径。
        crawlDelay 2,//告知爬虫在两次抓取之间应等待多少秒，以防止对服务器造成过大压力。这是一个非标准但被广泛支持的指令。
      },
      {
        userAgent: ['Applebot', 'Bingbot'],
        disallow: ['/'],
      },
    ],
    sitemap: 'https://acme.com/sitemap.xml',
  }
}
```

### sitemap.(xml、ts)

```xml
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://acme.com</loc>
    <lastmod>2023-04-06T15:02:24.021Z</lastmod>
    <changefreq>yearly</changefreq>
    <priority>1</priority>
  </url>
  <url>
    <loc>https://acme.com/about</loc>
    <lastmod>2023-04-06T15:02:24.021Z</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://acme.com/blog</loc>
    <lastmod>2023-04-06T15:02:24.021Z</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
```

```ts
// app/sitemap.ts
import type { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://acme.com', // 页面的完整、绝对 URL 地址。
      lastModified: new Date(), //页面内容的最后修改日期。
      changeFrequency: 'yearly', //页面内容的可能更新频率。这只是给搜索引擎的一个提示，并非强制命令。可选值：'always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'
      priority: 1,//此 URL 相对于你自己网站上其他 URL的优先级。这不会影响你的页面在搜索结果中的排名，但可以帮助搜索引擎了解你认为哪些页面更重要。 一个 0.0 到 1.0 之间的数字。
    },
    {
      url: 'https://acme.com/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://acme.com/blog',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ]
}
```



### manifest.(json、ts)  页面清单

```json
{
  "name": "My Next.js Application",
  "short_name": "Next.js App",
  "description": "An application built with Next.js",
  "start_url": "/"
  // ...
}
```

```ts
import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Next.js App',
    short_name: 'Next.js App',
    description: 'Next.js App',
    start_url: '/',
    display: 'standalone',
    background_color: '#fff',
    theme_color: '#fff',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
```



# hook 

## next/navigation 导航

### 🚩[useParams](#客户端组件获取单个参数)  获取参数

### 🚩[useSearchParams](#客户端组件获取)  获取查询参数

### useSelectedLayoutSegment  获取当前页面路由段

1. 只能在layout文件中使用
2. 可用于制作头部导航栏的选中

```tsx
"use client"
import React from "react"
import {useSelectedLayoutSegment} from "next/navigation"

export default function Nav() {
    const segment = useSelectedLayoutSegment();
    console.log("获取路由段",segment)
    return (
        <div>
            {segment}
        </div>
    )
}
```

### useSelectedLayoutSegments  获取当前所处的路由段数组

1. 只能在layout文件中使用
2. 可用于制作面包屑组件

```tsx
"use client"
import React from "react"
import {useSelectedLayoutSegments} from "next/navigation"
export default function Page() {

    const segments = useSelectedLayoutSegments();
    console.log("获取所处路由段",segments)
    return (
        <div>
            {segments}
        </div>
    )
}

```

### usePathname   获取路由路径

```tsx
"use client"
import {usePathname} from "next/navigation"
export default  function Web() {
    const pathname = usePathname();
    console.log("获取路径",pathname)
    return (
        <div>
            文章详情页
        </div>
    )
}

```

## useLinkStatus 追踪导航状态

`useLinkStatus` 钩子允许您跟踪 `<Link>` 的待处理状态。您可以使用它来向用户显示内联视觉反馈（如微调或文本闪烁），同时完成对新路线的导航。

**在以下场景很有用**

1. 🚩[**Link**组件属性prefetch](#prefetch 性能优化)={false}预取已禁用或正在进行，这意味着导航被阻止
2. 目的地路线是动态的，不包含允许即时导航的🚩[loading](#loading.tsx).js文件。

```tsx
'use client'
import { useLinkStatus } from 'next/link'
export default function LoadingIndicator() {
  const { pending } = useLinkStatus()
  return pending ? (
    <div role="status" aria-label="Loading" className="spinner" />
  ) : null
}
```

### 需要注意的

1. `useLinkStatus` 必须在 `Link` 组件的后代组件中使用。
2. 如果已预取链接的路由，则将跳过 pending 状态
3. 快速连续单击多个链接时，仅显示最后一个链接的待处理状态
4. 这个钩子在 Pages Router 中不受支持，并且总是返回 `{ pending: false }`。

### [优雅地处理快速导航](https://nextjs.org/docs/app/api-reference/functions/use-link-status#gracefully-handling-fast-navigation)

如果导航到新路线的速度很快，用户可能会看到加载指示器的不必要闪烁。改善用户体验并仅在导航需要时间完成时显示加载指示器的一种方法是添加初始动画延迟（例如 100 毫秒）并将动画设置为不可见例如 `opacity: 0` 

```css
.spinner {
  /* ... */
  opacity: 0;
  animation:
    fadeIn 500ms 100ms forwards,
    rotate 1s linear infinite;
}
 
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
 
@keyframes rotate {
  to {
    transform: rotate(360deg);
  }
}
```



# 额外的知识

## [PWA](https://developer.mozilla.org/zh-CN/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)

## 预检请求

预检请求是由用户的浏览器在特定情况下自动发起的，

预检请求（即那个 `OPTIONS` 方法的请求）的设计初衷是**为了安全**。它就像在执行一个有潜在风险的操作前，进行的一次“安全确认”或“权限检查”。

### 简单请求

一个请求必须**同时满足以下所有条件**，才被视为“简单请求”：

1. **请求方法是以下三者之一**:
   - `GET`
   - `HEAD`
   - `POST`
2. **HTTP 请求头只包含以下“安全”字段**:
   - `Accept`
   - `Accept-Language`
   - `Content-Language`
   - `Content-Type`
   - 以及一些其他非关键性字段。
3. **`Content-Type` 的值仅限于以下三者之一**:
   - `application/x-www-form-urlencoded` (表单默认提交)
   - `multipart/form-data` (用于文件上传的表单)
   - `text/plain`



### 复杂请求

如果一个跨域请求**不满足上述任何一个条件**，它就会被视为“复杂请求”，从而触发预检请求。

以下场景**极其常见**，并且都会触发预检请求：

- **使用了 `PUT`、`DELETE`、`PATCH` 等方法**: 这些方法被认为可能对服务器资源进行修改，因此是非“简单”的。
- **发送了 JSON 格式的数据**: 当您在 `fetch` 请求中设置 `headers: { 'Content-Type': 'application/json' }` 时，这个 `Content-Type` 的值不属于“简单请求”的范围，因此会触发预检。**这是最常见的触发原因之一**。
- **包含了自定义的请求头**: 当您在请求中添加了任何非标准的请求头时，例如用于身份验证的 `Authorization` 头（`Authorization: 'Bearer ...'`），浏览器必须先通过预检请求询问服务器是否接受这个自定义头。

## RAW请求

“RAW 请求”就是 HTTP 请求在网络传输中的最真实、最朴素的样子。虽然我们日常开发中更多地是与框架处理过的、方便易用的对象打交道，但理解 RAW 请求的本质，对于我们进行高级调试、处理安全问题（如 Webhook）以及深入理解网络协议至关重要

### RAW 请求的结构

一个原始的 HTTP 请求本质上就是一段遵循特定格式的**纯文本**。它主要由四个部分组成：

1. **请求行 (Request Line)**: 包含请求方法 (GET, POST 等)、请求的资源路径 (URL) 和 HTTP 协议版本。
2. **请求头 (Headers)**: 包含关于请求的各种元数据，以“键: 值”的形式存在，例如 `Host`, `User-Agent`, `Content-Type`。
3. **空行 (Blank Line)**: 一个单独的空行（一个回车换行符 `CRLF`），用来分隔请求头和请求体。
4. **请求体 (Body/Payload)**: 真正要发送的数据，例如 POST 请求中的 JSON 数据或表单数据。对于 GET 请求，此部分通常为空。

### 示例

```HTTP
POST /api/users HTTP/1.1
Host: example.com
User-Agent: curl/7.85.0
Content-Type: application/json
Content-Length: 31
{"username":"alice","age":30}
```

