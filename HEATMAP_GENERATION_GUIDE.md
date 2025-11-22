# 🌡️ Praxify CFO - Heatmap Generation Guide

**Document Version:** 1.0  
**Date:** November 22, 2025  
**Purpose:** Guide for generating heatmaps from API response.json

---

## 📋 Overview

Praxify CFO's API response includes **comprehensive correlation and visualization data** that can be used to generate **multiple types of heatmaps** for financial analysis. This guide identifies all heatmap opportunities in the response structure.

---

## ✅ Available Heatmap Types

### 1️⃣ **Correlation Heatmap** (Primary)

**Location in Response:**
```json
{
  "visualizations": {
    "correlations": {
      "correlation_matrix": {
        "columns": ["revenue", "expenses", "profit", "cashflow", "marketing_spend", ...],
        "values": [
          [1.0, 0.85, 0.92, 0.67, 0.45, ...],
          [0.85, 1.0, 0.73, 0.54, 0.38, ...],
          [0.92, 0.73, 1.0, 0.68, 0.41, ...],
          ...
        ]
      }
    }
  }
}
```

**Heatmap Type:** Metric Correlation Matrix  
**Use Case:** Understand relationships between all financial metrics  
**Dimensions:** N×N matrix (where N = number of metrics)  
**Value Range:** -1.0 to +1.0 (correlation coefficient)

**Visualization Details:**
- **Color Scale:** 
  - Red/Hot colors: Strong positive correlation (0.7 to 1.0)
  - Blue/Cold colors: Strong negative correlation (-1.0 to -0.7)
  - White/Neutral: Weak/No correlation (-0.3 to 0.3)
- **Diagonal:** Always 1.0 (self-correlation)
- **Symmetrical:** Matrix is symmetric across diagonal

**JavaScript Example:**
```javascript
const correlationData = response.visualizations.correlations.correlation_matrix;
const columns = correlationData.columns;
const values = correlationData.values;

// Use with libraries like:
// - Plotly.js: Plotly.newPlot('heatmap', [{z: values, x: columns, y: columns, type: 'heatmap'}])
// - Chart.js with matrix plugin
// - D3.js heatmap
// - Highcharts heatmap
```

---

### 2️⃣ **Regional Correlation Heatmaps** (Segmented)

**Location in Response:**
```json
{
  "visualizations": {
    "correlations": {
      "regional_correlations": {
        "North America": {
          "columns": ["revenue", "expenses", "profit", ...],
          "values": [[1.0, 0.88, 0.94, ...], ...]
        },
        "Europe": {
          "columns": ["revenue", "expenses", "profit", ...],
          "values": [[1.0, 0.82, 0.89, ...], ...]
        },
        "Asia": {
          "columns": ["revenue", "expenses", "profit", ...],
          "values": [[1.0, 0.79, 0.91, ...], ...]
        }
      }
    }
  }
}
```

**Heatmap Type:** Region-Specific Correlation Matrices  
**Use Case:** Compare metric correlations across different regions  
**Count:** One heatmap per region (typically 3-5 regions)

**Visualization Strategy:**
- **Option A:** Side-by-side heatmaps (compare regions)
- **Option B:** Tabbed interface (select region)
- **Option C:** Difference heatmap (show delta between regions)

---

### 3️⃣ **Time-Series Heatmap** (Derived)

**Source Data:**
```json
{
  "tables": {
    "summaries": {
      "quarterly_summary": [
        {"quarter": "2023-Q1", "revenue": 920000, "profit": 285600, "expenses": 634400, ...},
        {"quarter": "2023-Q2", "revenue": 955000, "profit": 296550, "expenses": 658450, ...},
        {"quarter": "2023-Q3", "revenue": 1005000, "profit": 312150, "expenses": 692850, ...},
        ...
      ]
    }
  }
}
```

**Heatmap Type:** Metric Performance Over Time  
**Use Case:** Identify seasonal patterns and trends  
**Dimensions:** Metrics (rows) × Time Periods (columns)

**Example Transformation:**
```javascript
// Transform quarterly data into heatmap format
const quarters = quarterlyData.map(q => q.quarter);
const metrics = ['revenue', 'profit', 'expenses', 'cashflow'];
const heatmapValues = metrics.map(metric => 
  quarterlyData.map(q => q[metric])
);

// Result: 
// Rows: [Revenue, Profit, Expenses, Cashflow]
// Columns: [2023-Q1, 2023-Q2, 2023-Q3, ...]
// Values: Normalized or absolute values with color gradient
```

**Color Encoding:**
- Green gradient: Higher values (good performance)
- Red gradient: Lower values (poor performance)
- Use percentile-based coloring for better visualization

---

### 4️⃣ **Regional Performance Heatmap** (Geographic)

**Source Data:**
```json
{
  "visualizations": {
    "breakdowns": {
      "revenue_by_region": [
        {"region": "North America", "total_revenue": 1250000},
        {"region": "Europe", "total_revenue": 980000},
        {"region": "Asia", "total_revenue": 1702500}
      ],
      "profit_by_region": [
        {"region": "North America", "total_profit": 387500},
        {"region": "Europe", "total_profit": 303800},
        {"region": "Asia", "total_profit": 531775}
      ]
    }
  }
}
```

**Heatmap Type:** Regional Metric Comparison  
**Use Case:** Compare multiple metrics across regions  
**Dimensions:** Metrics (rows) × Regions (columns)

**Example Structure:**
```
               North America    Europe        Asia
Revenue        1,250,000       980,000       1,702,500
Profit         387,500         303,800       531,775
Expenses       862,500         676,200       1,170,725
Marketing      45,000          35,000        60,000
```

**Visualization Options:**
- **Absolute values** with color intensity
- **Normalized values** (% of total)
- **Z-score normalization** (compare across scales)

---

### 5️⃣ **Departmental Performance Heatmap**

**Source Data:**
```json
{
  "visualizations": {
    "breakdowns": {
      "expenses_by_department": [
        {"department": "Sales", "total_expenses": 450000},
        {"department": "Marketing", "total_expenses": 320000},
        {"department": "Operations", "total_expenses": 580000}
      ],
      "cashflow_by_department": [
        {"department": "Sales", "total_cashflow": 125000},
        {"department": "Marketing", "total_cashflow": 85000},
        {"department": "Operations", "total_cashflow": 105000}
      ]
    }
  }
}
```

**Heatmap Type:** Department Metric Comparison  
**Dimensions:** Metrics (rows) × Departments (columns)

---

### 6️⃣ **Anomaly Severity Heatmap** (Time-Based)

**Source Data:**
```json
{
  "anomalies_table": [
    {"date": "2024-03-15", "metric": "revenue", "severity": "HIGH", "value": 125000, ...},
    {"date": "2024-05-22", "metric": "expenses", "severity": "CRITICAL", "value": 95000, ...},
    {"date": "2024-07-10", "metric": "cashflow", "severity": "MEDIUM", "value": -15000, ...}
  ]
}
```

**Heatmap Type:** Anomaly Detection Timeline  
**Use Case:** Visual anomaly tracking across time and metrics  
**Dimensions:** Metrics (rows) × Time Periods (columns)  
**Value:** Severity score (0 = none, 1 = low, 2 = medium, 3 = high, 4 = critical)

**Color Encoding:**
- Green: No anomalies (0)
- Yellow: Low/Medium severity (1-2)
- Orange: High severity (3)
- Red: Critical severity (4)

---

### 7️⃣ **Forecast Confidence Heatmap**

**Source Data:**
```json
{
  "forecast_chart": {
    "revenue": [
      {"date": "2025-01-01", "predicted": 74250, "lower_bound": 52847, "upper_bound": 95653},
      {"date": "2025-02-01", "predicted": 59672, "lower_bound": 38269, "upper_bound": 81075},
      ...
    ],
    "profit": [...],
    "expenses": [...]
  }
}
```

**Heatmap Type:** Forecast Uncertainty Matrix  
**Calculation:** Confidence Interval Width = (upper_bound - lower_bound) / predicted  
**Use Case:** Identify which metrics have reliable forecasts

**Example:**
```
               Jan-2025    Feb-2025    Mar-2025
Revenue        57.6%       71.2%       68.3%     (width as %)
Profit         45.2%       52.8%       49.7%
Expenses       39.1%       43.5%       41.2%
```

**Color Encoding:**
- Green: Narrow CI (high confidence)
- Yellow: Medium CI (moderate confidence)
- Red: Wide CI (low confidence)

---

## 🎨 Heatmap Implementation Guide

### Library Recommendations

#### 1. **Plotly.js** (Recommended)
```javascript
const heatmapData = [{
  z: response.visualizations.correlations.correlation_matrix.values,
  x: response.visualizations.correlations.correlation_matrix.columns,
  y: response.visualizations.correlations.correlation_matrix.columns,
  type: 'heatmap',
  colorscale: 'RdBu',
  zmid: 0
}];

Plotly.newPlot('correlation-heatmap', heatmapData);
```

#### 2. **Chart.js with Matrix Plugin**
```javascript
import { Chart } from 'chart.js';
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';

Chart.register(MatrixController, MatrixElement);

new Chart(ctx, {
  type: 'matrix',
  data: {
    datasets: [{
      data: matrixData,
      backgroundColor: (context) => getColor(context.dataset.data[context.dataIndex].v),
      width: ({chart}) => (chart.chartArea || {}).width / columns.length - 1,
      height: ({chart}) => (chart.chartArea || {}).height / columns.length - 1
    }]
  }
});
```

#### 3. **D3.js** (Advanced)
```javascript
const svg = d3.select("#heatmap")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

const colorScale = d3.scaleSequential(d3.interpolateRdBu)
  .domain([-1, 1]);

svg.selectAll("rect")
  .data(matrixData)
  .enter()
  .append("rect")
  .attr("x", d => d.x * cellSize)
  .attr("y", d => d.y * cellSize)
  .attr("width", cellSize)
  .attr("height", cellSize)
  .style("fill", d => colorScale(d.value));
```

#### 4. **Highcharts**
```javascript
Highcharts.chart('container', {
  chart: { type: 'heatmap' },
  title: { text: 'Financial Correlation Matrix' },
  xAxis: { categories: columns },
  yAxis: { categories: columns },
  colorAxis: {
    min: -1,
    max: 1,
    stops: [
      [0, '#3060cf'],
      [0.5, '#fffbbc'],
      [1, '#c4463a']
    ]
  },
  series: [{
    name: 'Correlation',
    borderWidth: 1,
    data: transformedData
  }]
});
```

---

## 📊 Heatmap Use Cases Summary

| Heatmap Type | Response Path | Dimensions | Best For |
|--------------|---------------|------------|----------|
| **Correlation Matrix** | `visualizations.correlations.correlation_matrix` | N×N metrics | Understanding metric relationships |
| **Regional Correlations** | `visualizations.correlations.regional_correlations` | N×N per region | Regional pattern comparison |
| **Time-Series** | `tables.summaries.quarterly_summary` | Metrics × Time | Seasonal pattern detection |
| **Regional Performance** | `visualizations.breakdowns.*_by_region` | Metrics × Regions | Geographic performance comparison |
| **Departmental Performance** | `visualizations.breakdowns.*_by_department` | Metrics × Departments | Department efficiency analysis |
| **Anomaly Severity** | `anomalies_table` | Metrics × Time | Risk timeline visualization |
| **Forecast Confidence** | `forecast_chart.*` | Metrics × Future Dates | Forecast reliability assessment |

---

## 🔧 Data Transformation Examples

### Example 1: Correlation Matrix → Heatmap
```javascript
function prepareCorrelationHeatmap(response) {
  const corrData = response.visualizations.correlations.correlation_matrix;
  
  return {
    columns: corrData.columns,
    rows: corrData.columns,
    values: corrData.values,
    colorScale: {
      min: -1,
      mid: 0,
      max: 1,
      colors: ['#0571b0', '#ffffff', '#ca0020']
    }
  };
}
```

### Example 2: Regional Data → Heatmap
```javascript
function prepareRegionalHeatmap(response) {
  const breakdowns = response.visualizations.breakdowns;
  
  const metrics = ['revenue', 'profit', 'expenses', 'marketing_spend'];
  const regions = [...new Set(breakdowns.revenue_by_region.map(r => r.region))];
  
  const values = metrics.map(metric => 
    regions.map(region => {
      const data = breakdowns[`${metric}_by_region`];
      const regionData = data.find(d => d.region === region);
      return regionData ? regionData[`total_${metric}`] : 0;
    })
  );
  
  return {
    rows: metrics,
    columns: regions,
    values: values,
    colorScale: 'Viridis' // Use continuous scale for absolute values
  };
}
```

### Example 3: Quarterly Time-Series → Heatmap
```javascript
function prepareTimeSeriesHeatmap(response) {
  const quarterly = response.tables.summaries.quarterly_summary;
  
  const metrics = ['revenue', 'profit', 'expenses', 'cashflow'];
  const quarters = quarterly.map(q => q.quarter);
  
  // Normalize values to 0-100 scale for better visualization
  const values = metrics.map(metric => {
    const metricValues = quarterly.map(q => q[metric]);
    const max = Math.max(...metricValues);
    const min = Math.min(...metricValues);
    return metricValues.map(v => ((v - min) / (max - min)) * 100);
  });
  
  return {
    rows: metrics,
    columns: quarters,
    values: values,
    colorScale: 'Greens' // Performance heatmap
  };
}
```

---

## 🎯 Best Practices

### 1. **Color Scale Selection**
- **Diverging scales** (Blue-White-Red): Use for correlations (-1 to +1)
- **Sequential scales** (Green gradient): Use for performance metrics
- **Categorical scales**: Use for severity levels (anomalies)

### 2. **Normalization**
- Use **Z-score normalization** when comparing metrics with different scales
- Use **Min-max normalization** for 0-100% visualization
- Use **Percentile ranking** for relative performance

### 3. **Interactivity**
- Add **tooltips** showing exact values on hover
- Enable **zoom/pan** for large matrices
- Add **click handlers** to drill down into details
- Include **legends** with clear value ranges

### 4. **Responsiveness**
- Use **adaptive cell sizes** based on screen width
- Provide **mobile-optimized** versions with condensed views
- Allow **metric selection** for focused analysis

---

## ✅ Summary

**YES, heatmaps can absolutely be generated from the response.json!**

The API provides **7 different types of heatmap data**:

1. ✅ **Correlation Matrix** - Ready to use (direct values)
2. ✅ **Regional Correlations** - Ready to use (segmented by region)
3. ✅ **Time-Series Performance** - Requires transformation from quarterly data
4. ✅ **Regional Performance** - Requires aggregation from breakdowns
5. ✅ **Departmental Performance** - Requires aggregation from breakdowns
6. ✅ **Anomaly Severity Timeline** - Requires transformation from anomalies
7. ✅ **Forecast Confidence** - Requires calculation from forecast bounds

**Most Important:** The `visualizations.correlations.correlation_matrix` is **heatmap-ready** and requires **zero transformation**!

---

**Document Date:** November 22, 2025  
**Status:** ✅ Complete  
**API Version:** 2.0

