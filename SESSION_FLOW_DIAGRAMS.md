# 📊 Session Management Flow Diagrams

## Conversational AI Flow (`/agent/analyze_and_respond`)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     TURN 1: Initial Question                        │
└─────────────────────────────────────────────────────────────────────┘

Frontend                  Backend                         Firestore
   │                         │                                │
   ├──POST /analyze──────────►                                │
   │  - file: data.csv       │                                │
   │  - query: "What's our   │                                │
   │    revenue trend?"      │                                │
   │  - session_id: ""       │                                │
   │                         │                                │
   │                         ├─1. Generate session_id────────►│
   │                         │   "sess_abc123"                │
   │                         │                                │
   │                         ├─2. Check history──────────────►│
   │                         │                                │
   │                         │◄─3. Returns: []  (empty)───────┤
   │                         │                                │
   │                         ├─4. Analyze data                │
   │                         │   (no previous context)        │
   │                         │                                │
   │                         ├─5. Generate AI response        │
   │                         │   "Revenue shows..."           │
   │                         │                                │
   │                         ├─6. Store message──────────────►│
   │                         │   messages/{msg_1}             │
   │                         │   - user_query: "What's..."    │
   │                         │   - ai_response: "Revenue..."  │
   │                         │                                │
   │◄────Response─────────────┤                                │
   │  - session_id: "sess_abc123" ← SAVE THIS!               │
   │  - ai_response: "Revenue shows 15% growth..."            │
   │  - conversation_history: [1 message]                     │
   │                         │                                │


┌─────────────────────────────────────────────────────────────────────┐
│                  TURN 2: Follow-Up Question                         │
└─────────────────────────────────────────────────────────────────────┘

Frontend                  Backend                         Firestore
   │                         │                                │
   ├──POST /analyze──────────►                                │
   │  - file: data.csv       │                                │
   │  - query: "What about   │                                │
   │    the second metric?"  │                                │
   │  - session_id:          │                                │
   │    "sess_abc123" ◄──────┼── REUSE SAVED SESSION ID!     │
   │                         │                                │
   │                         ├─1. Retrieve history───────────►│
   │                         │   session: "sess_abc123"       │
   │                         │                                │
   │                         │◄─2. Returns: [msg_1] ──────────┤
   │                         │   - "What's our revenue trend?"│
   │                         │   - "Revenue shows 15%..."     │
   │                         │                                │
   │                         ├─3. Analyze data                │
   │                         │   WITH CONTEXT ✓               │
   │                         │   (AI sees previous Q&A)       │
   │                         │                                │
   │                         ├─4. Generate AI response        │
   │                         │   "The second metric you       │
   │                         │    asked about (profit)..."    │
   │                         │    ↑                           │
   │                         │    └─ AI understands "second"  │
   │                         │       from previous context!   │
   │                         │                                │
   │                         ├─5. Store new message──────────►│
   │                         │   messages/{msg_2}             │
   │                         │   - user_query: "What about..."│
   │                         │   - ai_response: "The second..." │
   │                         │                                │
   │◄────Response─────────────┤                                │
   │  - session_id: "sess_abc123" (same)                      │
   │  - ai_response: "The second metric (profit)..."          │
   │  - conversation_history: [2 messages]                    │
   │                         │                                │


┌─────────────────────────────────────────────────────────────────────┐
│                    TURN 3: Deep Context                             │
└─────────────────────────────────────────────────────────────────────┘

Frontend                  Backend                         Firestore
   │                         │                                │
   ├──POST /analyze──────────►                                │
   │  - query: "Based on our │                                │
   │    discussion, what     │                                │
   │    should I prioritize?"│                                │
   │  - session_id:          │                                │
   │    "sess_abc123"        │                                │
   │                         │                                │
   │                         ├─1. Retrieve history───────────►│
   │                         │                                │
   │                         │◄─2. Returns: [msg_1, msg_2]────┤
   │                         │   - Turn 1: Revenue question   │
   │                         │   - Turn 2: Profit question    │
   │                         │                                │
   │                         ├─3. Generate AI response        │
   │                         │   WITH FULL CONTEXT ✓          │
   │                         │   "Based on our discussion     │
   │                         │    of revenue (Turn 1) and     │
   │                         │    profit (Turn 2)..."         │
   │                         │    ↑                           │
   │                         │    └─ AI synthesizes insights  │
   │                         │       from entire conversation!│
   │                         │                                │
   │                         ├─4. Store message──────────────►│
   │                         │   messages/{msg_3}             │
   │                         │                                │
   │◄────Response─────────────┤                                │
   │  - conversation_history: [3 messages]                    │
   │  - ai_response: Context-aware action plan                │
   │                         │                                │
```

---

## Static Report Flow (`/full_report`)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Report Generation Flow                           │
└─────────────────────────────────────────────────────────────────────┘

Frontend                  Backend                         Firestore
   │                         │                                │
   ├──POST /full_report──────►                                │
   │  - file: data.csv       │                                │
   │  - mode: "finance_      │                                │
   │    guardian"            │                                │
   │  - session_id: ""       │                                │
   │    (or auto-generate)   │                                │
   │                         │                                │
   │                         ├─1. Auto-generate session_id────►│
   │                         │   "sess_1767724671"            │
   │                         │                                │
   │                         ├─2. Run full analysis           │
   │                         │   - Forecasting (14 metrics)   │
   │                         │   - Anomaly detection          │
   │                         │   - Correlations               │
   │                         │   - Visualizations             │
   │                         │   - Tables                     │
   │                         │                                │
   │                         ├─3. Store complete report──────►│
   │                         │   reports/{report_id}          │
   │                         │   - kpis: {...}                │
   │                         │   - forecast_chart: {...}      │
   │                         │   - anomalies: [...]           │
   │                         │   - visualizations: {...}      │
   │                         │   - tables: {...}              │
   │                         │                                │
   │◄────Response─────────────┤                                │
   │  - session_id: "sess_1767724671"                         │
   │  - full_analysis_report: {comprehensive dashboard}       │
   │  - ai_response: Executive summary                        │
   │                         │                                │
   │                                                           │
   │  NOTE: Each report is independent.                       │
   │  No conversation context needed or used.                 │
   │  New session_id for each report generation.              │
   │                                                           │
```

---

## Firestore Data Structure

```
🔥 Firestore Database
│
├── users/
│   │
│   ├── anonymous/  ← For development (no auth)
│   │   └── sessions/
│   │       │
│   │       ├── test-session-123/  ← Conversational AI session
│   │       │   ├── metadata (document)
│   │       │   │   ├── last_activity: "2026-01-07T10:30:00Z"
│   │       │   │   ├── updated_at: "2026-01-07T10:32:15Z"
│   │       │   │   └── user_email: "anonymous"
│   │       │   │
│   │       │   └── messages/ (subcollection)
│   │       │       ├── msg_001/
│   │       │       │   ├── query_id: "uuid-1"
│   │       │       │   ├── summary:
│   │       │       │   │   ├── user_query: "What's our revenue?"
│   │       │       │   │   ├── ai_response: "Revenue is $1.2M..."
│   │       │       │   │   └── key_kpis: {...}
│   │       │       │   └── timestamp: "2026-01-07T10:30:00Z"
│   │       │       │
│   │       │       ├── msg_002/
│   │       │       │   ├── summary:
│   │       │       │   │   ├── user_query: "What about profit?"
│   │       │       │   │   └── ai_response: "Comparing to revenue..."
│   │       │       │   └── timestamp: "2026-01-07T10:31:00Z"
│   │       │       │
│   │       │       └── msg_003/
│   │       │           └── summary:
│   │       │               ├── user_query: "What should I do?"
│   │       │               └── ai_response: "Based on discussion..."
│   │       │
│   │       └── sess_1767724671/  ← Static report session
│   │           ├── metadata (document)
│   │           │   ├── last_activity: "2026-01-07T11:00:00Z"
│   │           │   ├── has_reports: true
│   │           │   └── user_email: "anonymous"
│   │           │
│   │           └── reports/ (subcollection)
│   │               └── report_task_xyz/
│   │                   ├── report_id: "report_task_xyz"
│   │                   ├── data:
│   │                   │   ├── kpis: {...}
│   │                   │   ├── forecast_chart: {...}
│   │                   │   ├── anomalies: [...]
│   │                   │   ├── visualizations: {...}
│   │                   │   └── tables: {...}
│   │                   └── timestamp: "2026-01-07T11:00:00Z"
│   │
│   └── user@company.com/  ← For authenticated users
│       └── sessions/
│           ├── sess_prod_123/  ← User's conversation
│           │   ├── metadata/
│           │   └── messages/
│           │       ├── msg_001/
│           │       ├── msg_002/
│           │       └── ...
│           │
│           └── sess_prod_456/  ← Another conversation
│               └── messages/
│                   └── ...
```

---

## Key Differences: Conversational vs Report

| Aspect | Conversational AI | Static Report |
|--------|------------------|---------------|
| **Endpoint** | `/agent/analyze_and_respond` | `/full_report` |
| **Session Strategy** | **Reuse same session_id** | **New session_id each time** |
| **Storage** | `messages/` subcollection | `reports/` subcollection |
| **History Usage** | ✅ AI uses previous turns | ❌ No history needed |
| **Context Awareness** | ✅ Understands follow-ups | ❌ Standalone analysis |
| **Typical Use** | "What about X?" "Tell me more" | Dashboard generation |
| **Response Time** | Fast (focused query) | Slower (comprehensive) |

---

## Decision Tree: Which Endpoint?

```
User uploads financial data
          │
          ├─ Wants to ask questions and discuss?
          │  ├─ YES → Use /agent/analyze_and_respond
          │  │         - First question: session_id=""
          │  │         - Follow-ups: session_id={saved_id}
          │  │         - AI remembers context
          │  │
          │  └─ NO → Next question
          │
          └─ Needs comprehensive dashboard/report?
             ├─ YES → Use /full_report
             │         - Auto-generates session_id
             │         - Returns complete analysis
             │         - No follow-up needed
             │
             └─ BOTH → Use both!
                       1. Generate report with /full_report
                       2. Ask questions with /analyze_and_respond
                          (separate sessions - that's OK!)
```

---

## Testing Flow

```
┌───────────────────────────────────────────────────────────────┐
│                  Test Script Execution                        │
└───────────────────────────────────────────────────────────────┘

$ python3 test_conversational_session.py
          │
          ├─ Turn 1: "What are our top 3 KPIs?"
          │    ├─ Creates session_id
          │    ├─ Stores msg_001 in Firestore
          │    └─ Returns AI response
          │
          ├─ Turn 2: "How does the second KPI compare?"
          │    ├─ Reuses session_id
          │    ├─ Retrieves msg_001 from Firestore
          │    ├─ AI sees "top 3 KPIs" context
          │    ├─ AI understands "second" refers to 2nd KPI
          │    ├─ Stores msg_002
          │    └─ Returns context-aware response
          │
          └─ Turn 3: "Based on our discussion, action plan?"
               ├─ Reuses session_id
               ├─ Retrieves msg_001 + msg_002
               ├─ AI synthesizes from full conversation
               ├─ Stores msg_003
               └─ Returns comprehensive action plan
                    ↓
          ┌──────────────────────────┐
          │  ✅ ALL TESTS PASSED     │
          │  🎉 Session management   │
          │     working correctly!   │
          └──────────────────────────┘
```

---

## Summary: The Fix in Visual Form

### Before (Broken)

```
User: "What's our revenue?"
  → AI: "Revenue is $1.2M"  [Stored in Firestore]

User: "What about the second metric?"
  → AI: ❌ "What second metric?"  [No context used]
```

### After (Fixed)

```
User: "What's our revenue?"
  → AI: "Revenue is $1.2M"  [Stored in Firestore]

User: "What about the second metric?"
  ↓
  [System retrieves previous message from Firestore]
  ↓
  AI sees: "Previous: User asked about revenue, I said $1.2M..."
  ↓
  → AI: ✅ "The second metric (profit at $450K) shows..."
```

---

## Architecture Decision Record

**Problem:** AI couldn't maintain conversation context

**Root Cause:** History was being stored and retrieved, but not passed to AI response generator

**Solution:** Pass `conversation_history` to `generate_response()` method

**Impact:**
- ✅ AI now context-aware across conversation turns
- ✅ Users can ask follow-up questions naturally
- ✅ No breaking changes to API or data structure
- ✅ Backward compatible (history parameter optional)

**Status:** ✅ **IMPLEMENTED & TESTED**
