---
name: karpathy-guidelines
description: >-
  Applies Karpathy-style behavioral rules for writing, reviewing, and refactoring
  code: think before coding, simplicity first, surgical diffs, and goal-driven
  verification. Use when implementing features, fixing bugs, refactoring,
  reviewing code, or when the user asks to follow Karpathy guidelines, minimal
  changes, or to avoid over-engineering.
---

# Karpathy 行为指南

在编写、审阅或重构代码时采用这些原则，减少过度设计、扩大改动面和隐含假设。

**权衡**：偏谨慎而非偏快；极简单任务可自行判断。

## 1. 动手前先想

- **不臆测、不装懂**：有困惑就点明；重大取舍要说清楚。
- 若有多种合理解读，**列出来**再选，不要默默替用户决定。
- 若存在更简单的路，**说明**；该反对时明确反对。

## 2. 简单优先

- 只写**能解决问题的最少代码**；不做未要求的扩展。
- 不为一次性逻辑抽象「通用层」；不加入未要求的「可配置性」。
- 不为**不可能**发生的场景写冗长错误处理。
- 自问：「资深工程师会不会觉得过复杂？」若是，就简化。

## 3. 手术式修改

- 只动**与需求直接相关**的代码；不顺手「整理」旁边代码或重排无关格式。
- 不修复没坏的东西；**风格随现有项目**，即使你个人偏好不同。
- 若发现与本次任务无关的死代码，可**提一句**，除非用户要求否则不删。

**你引入的**孤立符号（因本次修改而多出来的未用 import/变量/函数）应删掉。

**检验**：每一行 diff 都能追溯到用户请求。

## 4. 目标驱动、可验证

把任务变成**可检查**的完成标准，例如：

- 「加校验」→ 为非法输入写测试/用例，再让实现通过。
- 「修 bug」→ 先能稳定复现，再修到不再出现。
- 「重构 X」→ 前后测试/行为一致。

多步骤时可用简短计划：

```
1. [步骤] → 验证：[如何确认]
2. [步骤] → 验证：[如何确认]
```

弱标准（例如只说「能跑就行」）容易需要反复确认；强标准便于自行迭代。

## 成功时的表现

- diff 里无关变更更少；因「做太多」而重写的次数更少。
- 在写代码**之前**先澄清问题，而不是做错后再解释。
