# 🚀 Quick Start Guide - Conversational AI

## Start Services

```bash
# Terminal 1: Backend
cd praxifi-CFO
python -m uvicorn aiml_engine.api.app:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd praxifi-frontend
npm run dev
```

## Test Conversation

1. Open `http://localhost:3000`
2. Upload CSV: `praxifi-CFO/data/dataset.csv`
3. Click "Launch AI Agent"
4. Open DevTools Console (F12)

### Test Script:
```
Q1: "What are our top 3 KPIs?"
→ Check console: session_id created

Q2: "How does the second KPI compare?"
→ AI should understand "second" from Q1

Q3: "Based on our discussion, what should I prioritize?"
→ AI should reference insights from Q1 & Q2
```

## API Quick Reference

### Conversational AI
```typescript
POST /api/agent/analyze_and_respond
Body (FormData):
  - file: CSV file
  - user_query: "Your question"
  - session_id: "session-123" (optional, omit for first request)

Response:
{
  session_id: "session-123",
  ai_response: "AI answer...",
  conversation_history: [{...}],
  full_analysis_report: {...}
}
```

### Static Report
```typescript
POST /api/full_report
Body (FormData):
  - file: CSV file
  - mode: "finance_guardian" | "financial_storyteller"
  - session_id: (optional)

Response:
{
  session_id: "sess_123",
  ai_response: "Executive summary...",
  full_analysis_report: {...}
}
```

## Key Files Changed

```
praxifi-frontend/
├── lib/types.ts              ← Updated interfaces
├── app/chat/page.tsx         ← Fixed history parsing
└── app/upload/page.tsx       ← Corrected parameters
```

## Verify It Works

### Console Should Show:
```
📤 Starting new conversation (no session_id)
✅ Received response: { session_id: "...", history_length: 1 }

📤 Continuing conversation with session_id: test-session-abc123
✅ Received response: { session_id: "...", history_length: 2 }
```

### UI Should Show:
- Session ID at top of chat page
- Conversation history (all previous Q&A pairs)
- Context-aware AI responses

### Firestore Should Have:
```
users/anonymous/sessions/{session_id}/
├── metadata/
└── messages/
    ├── {msg_1}/
    ├── {msg_2}/
    └── {msg_3}/
```

## Debug Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Console shows session_id logs
- [ ] Same session_id across requests
- [ ] History length increments
- [ ] AI understands context

## Success Indicator

✅ **The Golden Test:**
```
User: "What are our biggest risks?"
AI: [Lists 3 risks]

User: "How urgent is the second one?"
AI: [References specific second risk] ← AI remembers!
```

If AI asks "which risk?" → ❌ Session not working
If AI answers specifically → ✅ Working correctly!

## Documentation

- `INTEGRATION_COMPLETE.md` - Full integration summary
- `FRONTEND_INTEGRATION_GUIDE.md` - Detailed frontend guide
- `INTEGRATION_TEST_CHECKLIST.md` - Complete test suite
- `SESSION_MANAGEMENT_ARCHITECTURE.md` - Architecture details

## Quick Fixes

| Problem | Fix |
|---------|-----|
| "AI doesn't remember" | Check console for `session_id` |
| "History not showing" | Verify `conversation_history` in response |
| "404 error" | Check `NEXT_PUBLIC_API_URL` env variable |
| "CORS error" | Verify backend CORS settings |

## Ready to Use! 🎉

The system is fully integrated. Start testing with real conversations!
