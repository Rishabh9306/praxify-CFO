# Quick Start Guide - New Insights Dashboard

## What Was Changed
The `/insights` page (`/home/draxxy/praxifi/praxifi-frontend/app/insights/page.tsx`) has been completely rewritten to display comprehensive BI analytics from the `response.json` file.

## Key Features Added

### 1. **Tabbed Interface**
- **Overview Tab**: Profit drivers, correlations, anomalies, recommendations
- **Forecasts Tab**: 14 different forecast visualizations with confidence intervals
- **Breakdowns Tab**: Regional/departmental analysis with pie and bar charts
- **Diagnostics Tab**: Model health, risk periods, data quality reports

### 2. **Enhanced KPIs**
- 8 primary KPIs + 12 enhanced metrics
- Trend indicators
- Professional card layouts
- Icon-based visual hierarchy

### 3. **Charts & Visualizations**
- 14 forecast charts (line + area composition)
- Multiple bar charts for breakdowns
- Pie charts for distributions
- Area charts for trends
- Interactive tooltips throughout

### 4. **Dark Theme Styling**
- Black background (#000000)
- White text with opacity variants
- Primary color: #FFC700 (Yellow)
- Glass morphism effects
- Consistent with existing design system

## How to Test

### 1. Start the Development Server
```bash
cd praxifi-frontend
npm run dev
# or
pnpm dev
```

### 2. Upload a File
Navigate to `/mvp/static-report` and upload a CSV file to generate a report.

### 3. View the Dashboard
After report generation, you'll be redirected to `/insights` to see the new dashboard.

### 4. Test Each Tab
- Click through all 4 tabs (Overview, Forecasts, Breakdowns, Diagnostics)
- Hover over charts to see tooltips
- Verify all data is displaying correctly

## JSON Data Structure Supported

The dashboard reads from `response.json` with this structure:
```json
{
  "session_id": "...",
  "ai_response": "...",
  "full_analysis_report": {
    "dashboard_mode": "finance_guardian",
    "metadata": { "generated_at": "...", "data_start_date": "...", "data_end_date": "..." },
    "kpis": { "total_revenue": 0, "total_expenses": 0, ... },
    "forecast_chart": { "revenue": [...], "expenses": [...], ... },
    "anomalies_table": [...],
    "narratives": { "summary_text": "...", "analyst_insights": [...], "recommendations": [...] },
    "correlation_insights": [...],
    "profit_drivers": { "feature_attributions": [...] },
    "enhanced_kpis": { ... },
    "model_health_report": { ... },
    "visualizations": { "breakdowns": {...}, "time_series": {...} },
    "tables": { "diagnostics": {...} },
    "supporting_reports": { "validation_report": {...}, "corrections_log": [...] },
    "raw_data_preview": [...]
  }
}
```

## Customization Options

### Change Primary Color
Find and replace `#FFC700` with your desired color throughout the file.

### Adjust Chart Heights
Modify the `height` prop in `<ResponsiveContainer>`:
```tsx
<ResponsiveContainer width="100%" height={400}>
```

### Add/Remove KPIs
Edit the KPI grid section around line 330:
```tsx
<KPICard
  title="Your Metric"
  value={kpis.your_metric || 0}
  icon={YourIcon}
  isCurrency={true}
/>
```

### Modify Color Palette
Edit the COLORS array at the top:
```tsx
const COLORS = ['#FFC700', '#10b981', '#3b82f6', ...];
```

## Troubleshooting

### Issue: No data showing
**Solution**: Check that `fullReportData` is properly set in the app context. The component redirects to `/mvp/static-report` if no data is found.

### Issue: Charts not rendering
**Solution**: Verify that the forecast data exists in the JSON response. The component checks for data before rendering charts.

### Issue: TypeScript errors
**Solution**: The component uses `(fullReportData as any).full_analysis_report` to handle both old and new JSON formats. Ensure your response.json follows the expected structure.

### Issue: Styling looks off
**Solution**: Check that Tailwind CSS is properly configured and the app is using the black theme. Verify `globals.css` has the correct CSS variables.

## Dependencies Required

Make sure these are installed:
```json
{
  "recharts": "^2.x.x",
  "lucide-react": "^0.x.x",
  "@radix-ui/react-tabs": "^1.x.x"
}
```

If missing, install with:
```bash
npm install recharts lucide-react @radix-ui/react-tabs
# or
pnpm add recharts lucide-react @radix-ui/react-tabs
```

## Performance Tips

1. **Large Datasets**: The component limits raw data preview to 5 rows
2. **Many Forecasts**: Each metric is rendered in its own tab section
3. **Scroll Optimization**: Long lists have max-height with overflow-y-auto

## Next Steps

1. ✅ Test with real financial data
2. ✅ Verify all charts render correctly
3. ✅ Check responsive design on mobile
4. ✅ Test dark theme consistency
5. ✅ Validate data accuracy
6. Consider adding export/download features
7. Consider adding print styles
8. Consider adding data refresh functionality

## Support

For questions or issues:
1. Check the detailed documentation in `INSIGHTS_DASHBOARD_UPDATE.md`
2. Review the response.json structure
3. Verify component imports are correct
4. Check browser console for errors

## Files Modified
- ✅ `/home/draxxy/praxifi/praxifi-frontend/app/insights/page.tsx` - Complete rewrite

## Files Created
- ✅ `/home/draxxy/praxifi/INSIGHTS_DASHBOARD_UPDATE.md` - Detailed documentation
- ✅ `/home/draxxy/praxifi/QUICKSTART_INSIGHTS.md` - This guide

---

**Status**: ✅ Ready for Testing  
**Last Updated**: November 21, 2025  
**Version**: 2.0.0
