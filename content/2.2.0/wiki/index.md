# HDCharts 2.2.0

This release adds a new chart type, improves chart controls, and introduces modular publishing options.

## What's New in 2.2.0

### Release highlights

- Introduced modular publishing + BOM support, while keeping the umbrella dependency option.
- Improved large-data chart handling with smoother scrolling and zoom across all chart types.
- Added axes support across all chart types for clearer labels and easier reading.
- Added new line chart animation modes (`Morph`, `Timeline`) for different data update flows.
- Added `StackedAreaChart` as a new core chart type.
- Improved the [demo gallery](/demo/2.2.0/) layout and navigation for easier browsing.
- Updated [examples](/2.2.0/wiki/examples) with cleaner, default-focused chart demos.
- Launched a charts [Playground](/playground/).

### Modular publishing updates

Use the umbrella artifact (same behavior as before):

```kotlin
implementation("io.github.dautovicharis:charts:{{artifactVersion}}")
```

Use modular artifacts (pick what you need):

```kotlin
implementation("io.github.dautovicharis:charts-line:{{artifactVersion}}")
implementation("io.github.dautovicharis:charts-pie:{{artifactVersion}}")
implementation("io.github.dautovicharis:charts-bar:{{artifactVersion}}")
implementation("io.github.dautovicharis:charts-stacked-bar:{{artifactVersion}}")
implementation("io.github.dautovicharis:charts-stacked-area:{{artifactVersion}}")
implementation("io.github.dautovicharis:charts-radar:{{artifactVersion}}")
```

Use BOM for aligned versions (where Gradle platforms are supported):

```kotlin
implementation(platform("io.github.dautovicharis:charts-bom:{{artifactVersion}}"))
implementation("io.github.dautovicharis:charts-line")
implementation("io.github.dautovicharis:charts-pie")
implementation("io.github.dautovicharis:charts-bar")
implementation("io.github.dautovicharis:charts-stacked-bar")
implementation("io.github.dautovicharis:charts-stacked-area")
implementation("io.github.dautovicharis:charts-radar")
```

## Breaking Changes / Migration

- Breaking changes: None found when comparing `2.1.0` API docs to `2.2.0`.
- Migration: No required changes from `2.1.0`.

## Getting Started

New to HDCharts? Check out our [Getting Started Guide](/2.2.0/wiki/getting-started) to learn how to integrate the library into your project and create your first charts in minutes.
