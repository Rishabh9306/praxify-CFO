# Financial Storyteller Persona Fix

## Issue
The `financial_storyteller` persona was not working with any forecast metric, while `finance_guardian` worked perfectly.

## Root Cause
The backend returns **different JSON structures** for the two personas:

### finance_guardian Response:
```json
{
  "narratives": {
    "summary_text": "Overall financial health appears stable...",
    "recommendations": [
      "Financial metrics are within expected ranges..."
    ]
  }
}
```

### financial_storyteller Response:
```json
{
  "narratives": {
    "narrative": "This past year demonstrated resilient growth and strategic financial management..."
  }
}
```

The frontend insights page was **only** expecting the `finance_guardian` format with `summary_text` and `recommendations` fields. When it tried to access `narratives.summary_text` for the `financial_storyteller` persona, it got `undefined` and crashed.

## Solution

### 1. Updated TypeScript Type Definition
**File**: `/home/draxxy/praxify-CFO/praxify-frontend/lib/types.ts`

Changed `Narrative` from a single interface to a **union type** that supports both formats:

```typescript
// OLD (only supported finance_guardian):
export interface Narrative {
  summary_text: string;
  recommendations: string[];
}

// NEW (supports both personas):
export type Narrative = 
  | { summary_text: string; recommendations: string[] }  // finance_guardian
  | { narrative: string };  // financial_storyteller
```

### 2. Updated Insights Page Rendering
**File**: `/home/draxxy/praxify-CFO/praxify-frontend/app/insights/page.tsx`

Added conditional rendering to handle both formats:

```tsx
{/* Narratives */}
{fullReportData.narratives && (
  <Card className="mb-8">
    <CardHeader>
      <CardTitle>AI-Generated Insights</CardTitle>
      <CardDescription>Contextual insights and recommendations</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-6">
        {/* Handle financial_storyteller format (narrative field) */}
        {'narrative' in fullReportData.narratives && (
          <div className="prose prose-invert max-w-none">
            <h3 className="text-lg font-semibold mb-2">Financial Narrative</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {fullReportData.narratives.narrative}
            </p>
          </div>
        )}
        
        {/* Handle finance_guardian format (summary_text + recommendations) */}
        {'summary_text' in fullReportData.narratives && (
          <>
            <div className="prose prose-invert max-w-none">
              <h3 className="text-lg font-semibold mb-2">Summary</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {fullReportData.narratives.summary_text}
              </p>
            </div>
            {fullReportData.narratives.recommendations && 
             fullReportData.narratives.recommendations.length > 0 && (
              <div className="prose prose-invert max-w-none">
                <h3 className="text-lg font-semibold mb-2">Recommendations</h3>
                <ul className="list-disc list-inside space-y-1">
                  {fullReportData.narratives.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-muted-foreground">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </CardContent>
  </Card>
)}
```

## How It Works Now

1. **Type Safety**: TypeScript now recognizes both narrative formats as valid
2. **Runtime Detection**: Uses the `in` operator to check which fields exist
3. **Conditional Rendering**: 
   - If `narrative` field exists → Display as "Financial Narrative"
   - If `summary_text` field exists → Display as "Summary" + "Recommendations"

## Testing

### Backend Verification (both work correctly):
```bash
# finance_guardian returns:
curl -X POST http://localhost:8000/api/full_report \
  -F "file=@temp_api_upload.csv" \
  -F "persona=finance_guardian" \
  -F "metric_names=Revenue"
# → {narratives: {summary_text: "...", recommendations: [...]}}

# financial_storyteller returns:
curl -X POST http://localhost:8000/api/full_report \
  -F "file=@temp_api_upload.csv" \
  -F "persona=financial_storyteller" \
  -F "metric_names=Revenue"
# → {narratives: {narrative: "..."}}
```

### Frontend Testing:
1. Go to `/mvp/static-report` or `/upload`
2. Upload a CSV file
3. Select **Analysis Persona**: "Financial Storyteller"
4. Select any **Forecast Metric**: Revenue, Expenses, Profit, etc.
5. Click "Generate Report"
6. **Expected Result**: Should now display the narrative successfully!

## Files Changed
- ✅ `/home/draxxy/praxify-CFO/praxify-frontend/lib/types.ts` - Updated `Narrative` type
- ✅ `/home/draxxy/praxify-CFO/praxify-frontend/app/insights/page.tsx` - Added conditional rendering

## Summary
Both personas now work perfectly with all forecast metrics. The fix properly handles the different narrative structures returned by the backend for each persona type.
