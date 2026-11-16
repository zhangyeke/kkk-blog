# Git 规范 | Git
> 适用范围: 全仓 | 最后更新: 2026-11-12
> 权威来源: `git-conventional-commits.yaml` + `git log` 实际提交记录

## 提交

### [GIT-01] 提交信息格式
- 规则：**Conventional Commits，中文描述，无 scope，不加句号**。
  ```
  <type>: <中文简述>
  ```
- 示例（真实提交）：
  ```
  feat: 图片上传支持选择图床线路
  fix: 地区级联失败时显示原因并支持重试
  refactor: BackTop 迁入 k-view 组件库
  chore: 提高 dev 进程内存上限
  ```

### [GIT-02] 允许的 type
- 规则：见 `git-conventional-commits.yaml`，仅用这 12 种：

| type | 用途 |
|---|---|
| `feat` | 新功能 |
| `fix` | 修复 bug |
| `perf` | 性能优化 |
| `refactor` | 重构（不改行为） |
| `style` | 样式/格式（不改逻辑） |
| `test` | 测试 |
| `build` | 构建配置 |
| `ops` | 运维/部署 |
| `docs` | 文档 |
| `chore` | 杂项 |
| `merge` | 合并 |
| `revert` | 回滚 |

### [GIT-03] scope
- 规则：`commitScopes: []` —— **不使用 scope**（不写 `feat(admin):`）。

### [GIT-04] 提交粒度
- 规则：一次提交只做一件事。**格式化与功能改动必须分开提交**（尤其 `app/admin/` 的缩进问题，`prettier --write` 造成的整文件重排不要混进功能 commit）。

### [GIT-05] WIP
- 规则：`^WIP ` 开头的提交不进入 changelog。临时提交可以，但合入前应 squash。

## 分支

### [GIT-06] 分支模型
- 规则：主干 `master`，远端另有 `main`。功能开发建议 `feat/xxx`、修复 `fix/xxx`，完成后合回 `master`。
- 现状：多数提交直接落在 `master`（单人项目）。

### [GIT-07] 合并
- 规则：不使用 `--no-verify` 跳过钩子；不 `push --force` 到主干。

## 发布

### [GIT-08] Tag 命名
- 规则：`v<major>.<minor>.<patch>`（`releaseTagGlobPattern: v[0-9]*.[0-9]*.[0-9]*`），如 `v1.4.0`。

### [GIT-09] Changelog
- 规则：只有 `feat` / `fix` / `perf` / `merge` 进入 changelog；分组标题：
  - `feat` → Features
  - `fix` → Bug Fixes
  - `perf` → Performance Improvements
  - `merge` → Merges
  - 破坏性变更 → BREAKING CHANGES

## 工程化

### [GIT-10] 提交前检查
- 规则：至少通过
  ```bash
  node node_modules/typescript/bin/tsc --noEmit
  pnpm test
  ```
- 改动 `proxy.ts` 必须同步更新 `proxy.test.ts` 并全绿。

### [GIT-11] 不提交的内容
- 规则：`.next/`、`node_modules/`、`tsbuildinfo`、本地工具目录已在 `.gitignore`；`prisma/manual-sql/*.sql` **必须提交**（是数据库真相）。

### [GIT-12] 敏感信息
- 规则：`.env` 不入库；测试账号密码等敏感信息不得写进代码或 `.code-spec/`。
