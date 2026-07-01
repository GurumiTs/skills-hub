---
name: incident-rca
description: Use when the task involves production incidents, abnormal behavior, logs, outage analysis, root cause analysis, temporary mitigation, long-term corrective actions, or incident follow-up.
---
# Incident RCA Skill

## 1. 能力定位

此 Skill 提供 Incident Analysis / RCA capability。

## 2. 使用時機

使用於：

* 正式區異常。
* 服務中斷或功能異常。
* Log / error / user report 分析。
* 需要暫時處置與長期改善。
* 需要 RCA 文件。

## 3. 工作流程

1. 整理事件時間線。
2. 區分 confirmed facts、assumptions、unknowns。
3. 分析影響範圍。
4. 找出可能原因與需要補充的證據。
5. 提出 temporary mitigation。
6. 提出 long-term corrective actions。
7. 產生 follow-up items。

## 4. 輸出格式

```markdown
# Incident RCA Report

## Incident Summary
## Timeline
## Impact Scope
## Confirmed Facts
## Assumptions / Unknowns
## Root Cause Analysis
## Temporary Mitigation
## Long-term Corrective Actions
## Follow-up Items
```

## 5. 限制

* 不得在證據不足時斷言 root cause。
* 不得輸出 secrets 或敏感資料。
* 不得未經同意執行正式環境變更。
