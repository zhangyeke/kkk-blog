---
name: install-shadcn-skill
description: >-
  Installs the official shadcn/ui Agent Skill into Cursor (project or global) via
  the skills CLI. Use when the user wants to add shadcn skills to Cursor, enable
  shadcn/ui context for the agent, run `npx skills add`, or follow ui.shadcn.com
  skills documentation.
---

# 在 Cursor 中安装 shadcn/ui Skill

本 skill 用于**把官方 shadcn/ui 的 Agent Skill 装进 Cursor**：装好后，代理会按你仓库里的 `components.json` 和 `shadcn info --json` 生成更贴合项目的组件代码。

## 何时先做 shadcn 初始化

- 若项目**还没有** `components.json`，先在本仓库根目录执行 shadcn 初始化（例如 `npx shadcn@latest init`），再安装 skill。
- 官方 skill 依赖项目检测与配置注入；没有 shadcn 配置时，收益会打折扣。

## 安装（推荐：写入当前仓库）

在**仓库根目录**执行：

```bash
npx skills add shadcn/ui
```

非交互（CLI 会提示可用 `-y`）：

```bash
npx skills add shadcn/ui -y
```

安装成功后，skill 资源通常出现在项目下的 `.cursor/skills/`（例如 `shadcn` 子目录）。将变更提交进 git，团队即可共享。

## 全局安装（所有项目可用）

CLI 支持 `--global`（简写 `-g`），可把 skill 装到用户级 skills 目录（与 Cursor 个人 skills 路径一致时使用 `~/.cursor/skills/`），例如：

```bash
npx skills add shadcn/ui -g -y
```

**不要**把自定义 skill 放进 `~/.cursor/skills-cursor/`：该目录由 Cursor 内置 skill 占用。

## 装好后代理会多知道什么

- 读取 `components.json`：框架、Tailwind、路径别名、已装组件等。
- 运行 `shadcn info --json` 注入当前项目解析结果。
- CLI 与子命令、`docs` / `search`、主题与 registry、以及（如你配置了）**shadcn MCP** 相关用法。

详见官方文档：[Skills - shadcn/ui](https://ui.shadcn.com/docs/skills)。

## 可选：shadcn MCP

若需要代理从 registry 搜索、浏览、安装组件，可按 [MCP Server](https://ui.shadcn.com/docs/mcp) 配置；与 skill 互补，不是替代关系。

## 故障排查

- **克隆 / 网络失败**：`npx skills add` 会从 GitHub 拉取 `shadcn/ui`；需能访问 `https://github.com/shadcn/ui.git`，或配置可用代理后重试。
- **装完未见效果**：确认 skill 文件已在 `.cursor/skills/`（或全局目录）；新开 Agent 对话或重启 Cursor 后再试。

## 延伸阅读

- [skills.sh](https://skills.sh/) — Skills 生态与更多包。
- [shadcn CLI](https://ui.shadcn.com/docs/cli) — 命令参考。
