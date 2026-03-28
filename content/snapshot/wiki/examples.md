# Code Examples

### Pie

![Pie Demo](/content/{{version}}/wiki/assets/pie_default.gif)

```kotlin
@Composable
private fun ShowPie() {
    val dataSet = listOf(32f, 21f, 24f, 14f, 9f).toChartDataSet(
        title = "Household Energy",
        postfix = "%",
        labels = listOf("Heating", "Cooling", "Appliances", "Water Heating", "Lighting")
    )

    PieChart(dataSet)
}
```

### Line

![Line Demo](/content/{{version}}/wiki/assets/line_default.gif)

```kotlin
@Composable
private fun ShowLine() {
    val dataSet = listOf(42f, 38f, 45f, 51f, 47f, 54f, 49f).toChartDataSet(
        title = "Daily Support Tickets",
        labels = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
    )

    LineChart(dataSet)
}
```

### MultiLine

![MultiLine Demo](/content/{{version}}/wiki/assets/multi_line_default.gif)

```kotlin
@Composable
private fun ShowMultiLine() {
    val items = listOf(
        "Web Store" to listOf(420f, 510f, 480f, 530f, 560f, 590f),
        "Mobile App" to listOf(360f, 420f, 410f, 460f, 500f, 540f),
        "Partner Sales" to listOf(280f, 320f, 340f, 360f, 390f, 420f)
    )

    val dataSet = items.toMultiChartDataSet(
        title = "Weekly Revenue by Channel",
        prefix = "$",
        categories = listOf("Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6")
    )

    LineChart(dataSet)
}
```

### Bar

![Bar Demo](/content/{{version}}/wiki/assets/bar_default.gif)

```kotlin
@Composable
private fun ShowBar() {
    val dataSet = listOf(45f, -12f, 38f, 27f, -19f, 42f, 31f).toChartDataSet(
        title = "Daily Net Cash Flow",
        labels = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
    )

    BarChart(dataSet)
}
```

### Stacked Bar

![Stacked Bar Demo](/content/{{version}}/wiki/assets/stacked_bar_default.gif)

```kotlin
@Composable
private fun ShowStackedBar() {
    val items = listOf(
        "North America" to listOf(320f, 340f, 360f, 390f),
        "Europe" to listOf(210f, 230f, 245f, 260f),
        "Asia Pacific" to listOf(180f, 205f, 225f, 250f)
    )

    val dataSet = items.toMultiChartDataSet(
        title = "Quarterly Revenue by Region",
        prefix = "$",
        categories = listOf("Q1", "Q2", "Q3", "Q4")
    )

    StackedBarChart(dataSet)
}
```

### Histogram

![Histogram Demo](/content/{{version}}/wiki/assets/histogram_default.gif)

```kotlin
@Composable
private fun ShowHistogram() {
    val dataSet = listOf(3f, 6f, 11f, 16f, 14f, 9f, 5f).toChartDataSet(
        title = "Request Duration Distribution",
        labels = listOf("0-50ms", "50-100ms", "100-150ms", "150-200ms", "200-250ms", "250-300ms", "300ms+")
    )

    HistogramChart(dataSet)
}
```

### Stacked Area

![Stacked Area Demo](/content/{{version}}/wiki/assets/stacked_area_default.gif)

```kotlin
@Composable
private fun ShowStackedArea() {
    val items = listOf(
        "Free Plan" to listOf(620f, 650f, 690f, 720f, 760f, 800f),
        "Standard Plan" to listOf(240f, 260f, 285f, 310f, 340f, 365f),
        "Premium Plan" to listOf(90f, 95f, 105f, 118f, 130f, 142f)
    )

    val dataSet = items.toMultiChartDataSet(
        title = "Monthly Active Subscribers by Plan",
        categories = listOf("Jan", "Feb", "Mar", "Apr", "May", "Jun")
    )

    StackedAreaChart(dataSet)
}
```

### Radar

![Radar Demo](/content/{{version}}/wiki/assets/radar_default.gif)

```kotlin
@Composable
private fun ShowRadar() {
    val categories = listOf(
        "Performance",
        "Reliability",
        "Usability",
        "Security",
        "Scalability",
        "Observability"
    )

    val dataSet = listOf(84f, 79f, 76f, 88f, 82f, 74f).toChartDataSet(
        title = "Platform Readiness Score",
        labels = categories
    )

    RadarChart(dataSet)
}
```


## Style Customization

To customize chart appearance, start from each chart's `*ChartDefaults.style(...)` factory and override only the fields you need.

```kotlin
@Composable
private fun ShowStyledBar() {
    val dataSet = listOf(45f, -12f, 38f, 27f, -19f, 42f, 31f).toChartDataSet(
        title = "Daily Net Cash Flow",
        prefix = "$",
        labels = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
    )

    val style = BarChartDefaults.style(
        barColor = Color(0xFF0F766E),
        barAlpha = 0.78f,
        space = 14.dp,
        gridVisible = true,
        gridSteps = 5,
        gridColor = Color(0xFF94A3B8),
        selectionLineColor = Color(0xFFEA580C),
        yAxisLabelCount = 6,
        chartViewStyle = ChartViewDefaults.style(
            width = 340.dp,
            cornerRadius = 18.dp,
            shadow = 2.dp,
            backgroundColor = Color(0xFFF8FAFC),
        ),
    )

    BarChart(dataSet = dataSet, style = style)
}
```
