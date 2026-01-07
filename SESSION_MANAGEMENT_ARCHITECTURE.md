# 🔄 Session Management & Conversation History Architecture

## Overview

This document explains how session management and conversation history work across different endpoints in the Praxifi CFO AI system, particularly focusing on the difference between conversational AI chat and static report generation.

## Architecture Design

### Firestore Data Structure

```
users/
  └── {user_email}/
      └── sessions/
          └── {session_id}/
              ├── metadata (document)
              │   ├── last_activity
              │   ├── updated_at
              │   ├── user_email
              │   └── has_reports
              ├── messages/ (subcollection)
              │   └── {message_id}
              │       ├── query_id
              │       ├── summary
              │       │   ├── user_query
              │       │   ├── ai_response
              │       │   └── key_kpis
              │       ├── timestamp
              │       └── created_at
              └── reports/ (subcollection)
                  └── {report_id}
                      ├── report_id
                      ├── data (full report or summary)
                      ├── timestamp
                      └── created_at
```

## Endpoint-Specific Behavior

### 1. `/agent/analyze_and_respond` - Conversational AI Chat

**Purpose:** Interactive, context-aware conversations about financial data

**Session Management:**
- ✅ **Maintains conversation history** across multiple requests
- ✅ **Requires session_id** for follow-up questions
- ✅ **AI is context-aware** of previous questions and answers
- ✅ **Stores each turn** in `messages` subcollection

**How It Works:**

1. **First Request (No session_id):**
   ```
   User uploads CSV + asks "What's our revenue trend?"
   → System generates new session_id (e.g., "test-session-123")
   → Analyzes data, generates AI response
   → Stores message in Firestore: users/user@example.com/sessions/test-session-123/messages/
   → Returns: ai_response, session_id, conversation_history
   ```

2. **Follow-up Request (With session_id):**
   ```
   User provides session_id="test-session-123" + asks "What about expenses?"
   → System retrieves conversation history from Firestore
   → AI sees previous context: "What's our revenue trend?" + previous response
   → Generates context-aware response
   → Stores new message in same session
   → Returns: ai_response with full conversation_history
   ```

3. **Third Request (With same session_id):**
   ```
   User asks "How do these compare?"
   → System retrieves ALL previous messages (revenue question, expenses question)
   → AI understands "these" refers to revenue and expenses from earlier
   → Provides comparative analysis
   → Appends to conversation history
   ```

**Key Features:**
- 🧠 **Contextual Understanding:** AI remembers what was discussed
- 📝 **Turn-by-Turn Storage:** Each Q&A pair is stored as a message
- 🔗 **Session Continuity:** All messages linked by session_id
- 👤 **User Isolation:** Each user has separate conversation histories

**Example Flow:**
```javascript
// Request 1
POST /agent/analyze_and_respond
{
  file: financial_data.csv,
  user_query: "What are our top 3 KPIs?",
  session_id: null  // First request
}
// Response: { session_id: "sess_abc123", ai_response: "Top KPIs are...", conversation_history: [...] }

// Request 2 (continues conversation)
POST /agent/analyze_and_respond
{
  file: financial_data.csv,
  user_query: "How can we improve the second one?",  // References "second KPI" from previous response
  session_id: "sess_abc123"  // IMPORTANT: Provide saved session_id
}
// Response: AI knows what "second one" means from conversation history
```

---

### 2. `/full_report` - Static Report Generation

**Purpose:** One-shot comprehensive analysis and dashboard generation

**Session Management:**
- ✅ **No conversation history needed** - each report is standalone
- ✅ **Auto-generates session_id** if not provided
- ✅ **Stores complete report** in `reports` subcollection
- ⚠️ **Not for follow-up questions** - use `/agent/analyze_and_respond` instead

**How It Works:**

```
User uploads CSV + specifies mode="finance_guardian"
→ System generates session_id (e.g., "sess_1767724671")
→ Runs full analysis pipeline (forecasting, anomalies, visualizations)
→ Stores complete report in Firestore: users/user@example.com/sessions/sess_1767724671/reports/
→ Returns: comprehensive dashboard with all metrics
```

**Key Features:**
- 📊 **Comprehensive Analysis:** Full dashboard with forecasts, anomalies, KPIs
- 💾 **Report Archival:** Each report stored for future retrieval
- 🎯 **Single Execution:** No follow-up questions expected
- 📈 **Bulk Data:** Handles multiple CSV files (chronological merge)

---

## Session ID Management

### When to Use Different session_ids

| Scenario | Endpoint | session_id Strategy |
|----------|----------|-------------------|
| **Conversational Q&A about data** | `/agent/analyze_and_respond` | **Reuse same session_id** for entire conversation |
| **New conversation topic** | `/agent/analyze_and_respond` | **New session_id** (leave blank on first request) |
| **Generate dashboard report** | `/full_report` | **New session_id** for each report (auto-generated) |
| **Multiple reports over time** | `/full_report` | **Different session_ids** (each report independent) |

### Example Use Cases

#### ✅ Correct: Continuous Conversation
```javascript
// User wants to have a conversation about Q4 data
const sessionId = null;  // Will be generated on first request

// Turn 1
const resp1 = await analyzeAndRespond({ query: "What's our Q4 revenue?", sessionId });
sessionId = resp1.session_id;  // Save for next turn

// Turn 2 (reuse session_id)
const resp2 = await analyzeAndRespond({ query: "Why did it drop in December?", sessionId });

// Turn 3 (reuse session_id)
const resp3 = await analyzeAndRespond({ query: "What should we do about it?", sessionId });
```

#### ✅ Correct: Separate Reports
```javascript
// Generate monthly reports (each independent)
const jan_report = await fullReport({ file: jan_data.csv });  // session_id: sess_123
const feb_report = await fullReport({ file: feb_data.csv });  // session_id: sess_456
const mar_report = await fullReport({ file: mar_data.csv });  // session_id: sess_789
```

#### ❌ Incorrect: Mixing Endpoints with Same session_id
```javascript
// DON'T do this - it creates confusion
const report = await fullReport({ file: data.csv });  // session_id: sess_123
const chat = await analyzeAndRespond({ 
  query: "Tell me more", 
  sessionId: report.session_id  // ❌ Wrong - report and chat sessions are separate concepts
});
```

---

## Authentication & User Isolation

### Anonymous Users
```
User Email: "anonymous"
Session Path: users/anonymous/sessions/{session_id}/
```
- All anonymous users share the "anonymous" namespace
- Sessions are isolated by session_id
- ⚠️ No long-term privacy - avoid for production

### Authenticated Users (Firebase Auth)
```
User Email: "user@company.com"
Session Path: users/user@company.com/sessions/{session_id}/
```
- Each user has isolated namespace
- ✅ **Production-ready** for multi-tenant applications
- Sessions, messages, and reports are per-user
- GDPR/Privacy compliant

### Migration Path
```javascript
// Development (anonymous)
Authorization: null  // Falls back to "anonymous" user

// Production (authenticated)
Authorization: Bearer <firebase_token>  // Uses actual user email from token
```

---

## Conversation History Format

### Structure Returned by API
```json
{
  "conversation_history": [
    {
      "query_id": "uuid-1",
      "summary": {
        "user_query": "What's our revenue trend?",
        "ai_response": "Revenue shows a 15% growth...",
        "key_kpis": { "total_revenue": 1250000 }
      },
      "timestamp": "2026-01-07T10:30:00Z"
    },
    {
      "query_id": "uuid-2",
      "summary": {
        "user_query": "What about expenses?",
        "ai_response": "Expenses increased by 8%...",
        "key_kpis": { "total_expenses": 850000 }
      },
      "timestamp": "2026-01-07T10:31:30Z"
    }
  ]
}
```

### How AI Uses History
1. **Retrieves last 5 conversation turns** from Firestore
2. **Constructs context prompt** with previous Q&A pairs
3. **Sends to LLM** with current query
4. **LLM understands references** like "the second metric", "as discussed earlier"
5. **Generates context-aware response**

---

## Best Practices

### For Frontend Developers

1. **Store session_id in state/localStorage:**
   ```javascript
   // After first request
   localStorage.setItem('currentSessionId', response.session_id);
   
   // For follow-ups
   const sessionId = localStorage.getItem('currentSessionId');
   ```

2. **Clear session_id for new conversations:**
   ```javascript
   // User clicks "New Conversation" button
   localStorage.removeItem('currentSessionId');
   ```

3. **Show conversation history in UI:**
   ```javascript
   response.conversation_history.map(turn => ({
     user: turn.summary.user_query,
     assistant: turn.summary.ai_response
   }))
   ```

### For Backend/API Users

1. **Always pass session_id for follow-up questions** in `/agent/analyze_and_respond`
2. **Don't reuse session_ids across different data files** - start new session for new data
3. **Use `/full_report` for one-shot analysis**, not for conversations
4. **Implement user authentication** in production (Firebase Auth)

---

## Performance Considerations

### Firestore Reads/Writes

| Operation | Reads | Writes |
|-----------|-------|--------|
| First message (`analyze_and_respond`) | 1 (check session) | 2 (message + metadata) |
| Follow-up message | N (retrieve history) + 1 | 2 (new message + metadata) |
| Store report (`full_report`) | 1 (check session) | 2 (report + metadata) |

**Optimization Tips:**
- Limit conversation history to last 5-10 turns (configurable in `recall_related_history`)
- Use Firestore indexes for faster queries
- Batch writes when possible
- Monitor quota usage on Firebase free tier

---

## Debugging Session Issues

### Check Session Data in Firestore Console

1. Go to Firebase Console → Firestore Database
2. Navigate to: `users/{email}/sessions/{session_id}/`
3. Check:
   - **metadata** document: `last_activity`, `user_email`
   - **messages** subcollection: all conversation turns
   - **reports** subcollection: stored reports

### Common Issues

**Issue:** "AI doesn't remember previous questions"
- ✅ **Fix:** Ensure you're passing the correct `session_id` from previous response
- ✅ **Fix:** Verify Firestore is actually storing messages (check console)

**Issue:** "Multiple sessions created for same conversation"
- ✅ **Fix:** Don't generate new session_id on every request - reuse it
- ✅ **Fix:** Store session_id in frontend state/localStorage

**Issue:** "Getting other users' conversations"
- ✅ **Fix:** Implement proper Firebase Auth token validation
- ✅ **Fix:** Never hardcode user emails - extract from auth token

---

## Summary

### ✅ For Conversational AI (`analyze_and_respond`)
- **Single session_id** for entire conversation
- **Conversation history** stored in Firestore `messages` subcollection
- **AI is context-aware** using previous turns
- **Must provide session_id** for follow-up questions

### ✅ For Static Reports (`full_report`)
- **New session_id** for each report (auto-generated)
- **Complete report** stored in Firestore `reports` subcollection
- **No conversation context** needed or used
- **Standalone analysis** - not for Q&A

### ✅ Current Implementation Status
- ✅ Both endpoints store data correctly in Firestore
- ✅ User isolation working (per-email namespaces)
- ✅ Conversation history retrieval implemented
- ✅ AI now uses conversation context for responses (newly fixed)
- ✅ Session management working as designed

**The architecture is now production-ready for both anonymous and authenticated users!** 🎉
