# Breaking Changes

## charts-core

### Do I need to update call sites?
- No, if you already call `ChartViewDefaults.style(...)` and keep the default square chart area.
- Yes, if you want a non-square chart area; pass the new `modifierChart` argument.

### What changed
- `ChartViewDefaults.style(...)` now includes `modifierChart: Modifier` (default `Modifier.aspectRatio(1f)`) and threads it through `ChartViewStyle`.

### Migration (only if required)
```kotlin
// Before
val chartViewStyle = ChartViewDefaults.style()

// After
val chartViewStyle = ChartViewDefaults.style(
    modifierChart = Modifier.aspectRatio(16f / 9f),
)
```

- Recommended: Prefer named arguments when calling style factory functions.

## charts-bar

### Do I need to update call sites?
- No, if you call `BarChartDefaults.style(...)` with named arguments only.
- Yes, if you pass `BarChartDefaults.style(...)` arguments positionally after `barColor`, or if you call internal `validateBarData(...)` directly.

### What changed
- `BarChartDefaults.style(...)` adds `barColors: List<Color> = emptyList()` immediately after `barColor`.
- `validateBarData(...)` now accepts `colorsSize` to validate `barColors` length against data points.

### Migration (only if required)
```kotlin
// Before
val barStyle = BarChartDefaults.style(
    MaterialTheme.colorScheme.primary,
    0.4f,
    10.dp,
)

// After
val barStyle = BarChartDefaults.style(
    barColor = MaterialTheme.colorScheme.primary,
    barAlpha = 0.4f,
    space = 10.dp,
)
```

- Recommended: Use named arguments for `BarChartDefaults.style(...)` to stay resilient to future parameter additions.

## charts-pie

### Do I need to update call sites?
- No, if you never passed `innerPadding` to `PieChartDefaults.style(...)`.
- Yes, if you previously passed `innerPadding`; move that value into `chartViewStyle`.

### What changed
- `PieChartDefaults.style(...)` removed `innerPadding`.
- Pie content padding now comes from `chartViewStyle.innerPadding`.

### Migration (only if required)
```kotlin
// Before
val pieStyle = PieChartDefaults.style(
    innerPadding = 24.dp,
)

// After
val pieStyle = PieChartDefaults.style(
    chartViewStyle = ChartViewDefaults.style(innerPadding = 24.dp),
)
```

- Recommended: Keep pie container spacing and chart-view spacing aligned through one `ChartViewStyle` instance.
