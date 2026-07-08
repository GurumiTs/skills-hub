# Java Playbook

此 Playbook 定義 Java 專案在 SDLC pipeline 中的版本判斷、實作、測試、review 與 release 注意事項。

Java 不等同於最新版 JDK。針對既有專案時，必須先確認 JDK version、build tool、framework version、dependency version 與 deployment target。

## Scope

適用於：

- Java application、library、batch、service。
- Spring / Spring Boot / Jakarta EE / Java EE / custom framework。
- Maven / Gradle project。
- JDBC、JPA、Hibernate、MyBatis 或其他 data access。
- JUnit / TestNG / integration test。
- `/sdlc:implement`、`/sdlc:test`、`/sdlc:review` 的 Java version compatibility 判斷。

## Required Version Context

| Item | Evidence |
|---|---|
| JDK Version | `pom.xml`、`build.gradle`、toolchain、CI、Dockerfile |
| Build Tool | Maven / Gradle / Ant / custom |
| Framework | Spring Boot / Spring MVC / Jakarta EE / Java EE / custom |
| Dependency Versions | dependency management、lock file、parent pom、BOM |
| Packaging | jar / war / ear / container image |
| Runtime Hosting | app server、Tomcat、WebLogic、batch server、container |
| Test Framework | JUnit 4 / JUnit 5 / TestNG / existing custom runner |
| Data Platform | MSSQL / Oracle / BigQuery / other / unknown |

若 JDK 或 framework version 會影響 API / syntax / dependency，但不可確認，必須標示 `Needs More Evidence`。

## Version Compatibility Rules

不得無腦使用：

- 目標 JDK 不支援的 language feature。
- 目標 runtime 不支援的 API。
- 未確認可用的 Spring Boot / framework API。
- `var`、record、sealed class、switch expression 等不一定支援的語法。
- Jakarta namespace 取代 javax，除非專案已使用。
- 最新 JUnit 5 慣例取代既有 JUnit 4。

## Build and Dependency Rules

必須確認：

- Maven / Gradle plugin version。
- parent pom / BOM。
- dependency conflict。
- scope：compile / runtime / provided / test。
- app server 提供的 library。
- 是否允許更新 lock / wrapper / plugin。

不得為小改動新增大型 dependency，除非有 approved Change Proposal。

## Coding Conventions

應優先維持：

- 既有 package structure。
- 既有 service / repository / controller pattern。
- 既有 exception handling。
- 既有 logging pattern。
- 既有 transaction management。
- 既有 data access style。
- 既有 test style。

## Data Access Rules

若涉及 DB：

- JDBC / ORM / mapper pattern 必須符合既有專案。
- 避免 SQL injection。
- 確認 transaction boundary。
- 確認 connection pool / timeout。
- 確認 dialect：MSSQL、Oracle、BigQuery。
- DB 影響需 handoff 給 DB Agent。

## Testing Notes

測試需依既有專案：

- JUnit 4 / JUnit 5。
- TestNG。
- Spring test。
- integration test。
- mock framework。
- DB-assisted dry run。

若無法確認 test command，不得宣稱 Pass。

## Release Notes

Release planning 應考慮：

- jar / war / ear。
- app server deployment。
- JVM options。
- environment config。
- dependency conflict。
- DB migration order。
- rollback artifact。

## Review Checklist

| Area | Check |
|---|---|
| JDK | syntax / API 是否符合 JDK version |
| Framework | Spring / Java EE / Jakarta 版本是否相容 |
| Dependency | dependency / plugin / scope 是否合理 |
| Transaction | transaction boundary 與 rollback 是否清楚 |
| Data Access | SQL / ORM / mapper 是否安全 |
| Testing | JUnit / TestNG / integration evidence 是否完整 |
| Release | artifact、config、JVM、app server rollback |

## Output Format

```markdown
# Java Compatibility Notes

## Version Context

| Item | Value | Evidence / Notes |
|---|---|---|
| JDK Version | | |
| Build Tool | Maven / Gradle / Ant / Custom / Unknown | |
| Framework | | |
| Packaging | jar / war / ear / container / unknown | |
| Test Framework | | |
| Data Platform | | |

## Existing Patterns

## Implementation Constraints

## Dependency / Build Notes

## Data Access Notes

## Test / Dry Run Notes

## Release / Rollback Notes

## Gate Recommendation
```
