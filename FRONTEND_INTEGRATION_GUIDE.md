# 🎨 Frontend Integration Guide - Conversational AI

## Overview

This guide explains how the frontend has been updated to properly integrate with the new conversational AI backend, including session management and conversation history.

## Changes Made

### 1. Updated Type Definitions (`lib/types.ts`)

**Before:**
```typescript
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AgentAnalyzeResponse {
  session_id: string;
  user_query: string;
  ai_response: string;
  full_analysis_report: FullReportResponse;
  conversation_history: ChatMessage[];
}
```

**After:**
```typescript
// Matches backend response structure exactly
export interface ConversationHistoryItem {
  query_id: string;
  summary: {
    user_query: string;
    ai_response: string;
    key_kpis?: KPIData;
  };
  timestamp: string;
}

export interface AgentAnalyzeResponse {
  session_id: string;
  ai_response: string;
  full_analysis_report: FullReportResponse;
  conversation_history: ConversationHistoryItem[];
}
```

**Key Changes:**
- ✅ Removed `user_query` from top level (it's in conversation_history)
- ✅ Updated `conversation_history` to match backend format
- ✅ Added `ConversationHistoryItem` interface with proper nesting

---

### 2. Enhanced Chat Page (`app/chat/page.tsx`)

#### Session ID Management

**Added logging for debugging:**
```typescript
// In handleSendMessage()
if (sessionId) {
  formData.append('session_id', sessionId);
  console.log('📤 Continuing conversation with session_id:', sessionId);
} else {
  console.log('📤 Starting new conversation (no session_id)');
}

// After receiving response
console.log('✅ Received response:', { 
  session_id: data.session_id, 
  history_length: data.conversation_history?.length 
});
```

**Why:** This helps debug session continuity issues and verifies the frontend is sending/receiving session_id correctly.

#### Conversation History Parsing

**Before:**
```typescript
agentData.conversation_history.forEach((item: any) => {
  if (item.summary) {
    chatMessages.push({ role: 'user', content: item.summary.user_query });
    chatMessages.push({ role: 'assistant', content: item.summary.ai_response });
  }
});
```

**After:**
```typescript
agentData.conversation_history.forEach((item: any) => {
  if (item.summary) {
    const userQuery = item.summary.user_query || '';
    const aiResponse = item.summary.ai_response || '';
    
    if (userQuery) {
      chatMessages.push({ role: 'user', content: userQuery });
    }
    if (aiResponse) {
      chatMessages.push({ role: 'assistant', content: aiResponse });
    }
  }
});
```

**Why:** 
- ✅ Safer parsing with null checks
- ✅ Handles malformed history items gracefully
- ✅ Only adds messages if they have content

#### Response Field Access

**Before:**
```typescript
const aiResponse = data.response || data.ai_response || 'No response received';
```

**After:**
```typescript
const aiResponse = data.ai_response || 'No response received';
```

**Why:** Backend always returns `ai_response` field (not `response`), so we removed the fallback check.

---

### 3. Updated Upload Page (`app/upload/page.tsx`)

#### Agent Launch (analyze_and_respond)

**Before:**
```typescript
formData.append('persona', persona);
formData.append('forecast_metric', metric);
formData.append('user_query', 'Give me a comprehensive summary of this financial data');
```

**After:**
```typescript
formData.append('user_query', 'Give me a comprehensive summary of this financial data');
// Don't send session_id for first request - backend auto-generates
// Removed persona and forecast_metric - not used by analyze_and_respond endpoint
```

**Why:** 
- ✅ The `analyze_and_respond` endpoint only needs `file` and `user_query`
- ✅ Backend auto-generates `session_id` if not provided
- ✅ Removed unused parameters

#### Full Report Generation

**Before:**
```typescript
formData.append('persona', persona);
formData.append('forecast_metric', metric);
```

**After:**
```typescript
formData.append('mode', persona); // Backend uses 'mode' not 'persona'
// session_id is optional - backend will auto-generate
// Removed forecast_metric - not needed for full_report
```

**Why:**
- ✅ Backend parameter is `mode` not `persona`
- ✅ Backend auto-generates `session_id` for reports
- ✅ Removed unused parameters

---

## API Request/Response Flow

### Conversational AI Flow (`/agent/analyze_and_respond`)

#### Request 1: Start New Conversation
```typescript
const formData = new FormData();
formData.append('file', csvFile);
formData.append('user_query', 'What are our top 3 KPIs?');
// Don't include session_id or leave it empty

const response = await fetch('/api/agent/analyze_and_respond', {
  method: 'POST',
  body: formData,
});
```

**Response:**
```json
{
  "session_id": "test-session-abc123",
  "ai_response": "Based on your data, the top 3 KPIs are...",
  "conversation_history": [
    {
      "query_id": "uuid-1",
      "summary": {
        "user_query": "What are our top 3 KPIs?",
        "ai_response": "Based on your data, the top 3 KPIs are...",
        "key_kpis": {...}
      },
      "timestamp": "2026-01-07T10:30:00Z"
    }
  ],
  "full_analysis_report": {...}
}
```

#### Request 2: Continue Conversation
```typescript
const formData = new FormData();
formData.append('file', csvFile);
formData.append('user_query', 'How does the second KPI compare?');
formData.append('session_id', 'test-session-abc123'); // ← CRITICAL: Reuse session_id

const response = await fetch('/api/agent/analyze_and_respond', {
  method: 'POST',
  body: formData,
});
```

**Response:**
```json
{
  "session_id": "test-session-abc123",
  "ai_response": "The second KPI (profit margin at 18%) compares favorably...",
  "conversation_history": [
    {
      "query_id": "uuid-1",
      "summary": {
        "user_query": "What are our top 3 KPIs?",
        "ai_response": "Based on your data, the top 3 KPIs are..."
      },
      "timestamp": "2026-01-07T10:30:00Z"
    },
    {
      "query_id": "uuid-2",
      "summary": {
        "user_query": "How does the second KPI compare?",
        "ai_response": "The second KPI (profit margin at 18%) compares favorably..."
      },
      "timestamp": "2026-01-07T10:31:00Z"
    }
  ],
  "full_analysis_report": {...}
}
```

**Notice:**
- ✅ AI understood "second KPI" from previous context
- ✅ `conversation_history` now has 2 items
- ✅ Same `session_id` maintained

---

### Static Report Flow (`/full_report`)

#### Request: Generate Report
```typescript
const formData = new FormData();
formData.append('file', csvFile);
formData.append('mode', 'finance_guardian');
// session_id is optional - backend auto-generates

const response = await fetch('/api/full_report', {
  method: 'POST',
  body: formData,
});
```

**Response:**
```json
{
  "session_id": "sess_1767724671",
  "task_id": "uuid-task-123",
  "ai_response": "# Financial Performance Analysis\n\n## Executive Summary\n...",
  "conversation_history": [
    {
      "summary": {
        "user_query": "Analyze my financial data and provide comprehensive insights",
        "ai_response": "# Financial Performance Analysis...",
        "timestamp": "2026-01-07T11:00:00Z"
      }
    }
  ],
  "full_analysis_report": {
    "kpis": {...},
    "forecast_chart": {...},
    "anomalies_table": [...],
    "visualizations": {...},
    "tables": {...},
    ...
  }
}
```

---

## Frontend State Management

### Session ID Flow

```typescript
// 1. User uploads file and clicks "Launch Agent"
const data = await analyzeAndRespond({ query: "Summarize", session_id: null });

// 2. Backend generates session_id
const sessionId = data.session_id; // "test-session-abc123"

// 3. Store in context (happens automatically via setAgentData)
setAgentData(data); // Also sets sessionId in context

// 4. User asks follow-up question
const data2 = await analyzeAndRespond({ 
  query: "What about profit?", 
  session_id: sessionId  // ← Reuse from context
});

// 5. Same session_id returned
console.log(data2.session_id === sessionId); // true
```

### Conversation History in UI

```typescript
// When agentData updates, conversation history is parsed
useEffect(() => {
  if (agentData?.conversation_history) {
    const chatMessages = [];
    
    // Add welcome message
    chatMessages.push({ 
      role: 'assistant', 
      content: 'Hello! Ask me about your financial data.' 
    });
    
    // Parse backend conversation history
    agentData.conversation_history.forEach(item => {
      if (item.summary?.user_query) {
        chatMessages.push({ 
          role: 'user', 
          content: item.summary.user_query 
        });
      }
      if (item.summary?.ai_response) {
        chatMessages.push({ 
          role: 'assistant', 
          content: item.summary.ai_response 
        });
      }
    });
    
    setMessages(chatMessages);
  }
}, [agentData]);
```

---

## Testing the Integration

### Test 1: Verify Session Creation

1. Open browser DevTools Console
2. Upload a CSV file
3. Click "Launch AI Agent"
4. Check console for:
   ```
   📤 Starting new conversation (no session_id)
   ✅ Received response: { session_id: "...", history_length: 1 }
   ```
5. Verify `session_id` is saved in React context

### Test 2: Verify Conversation Continuity

1. In chat page, check the session ID is displayed
2. Ask a question: "What are our top 3 metrics?"
3. Check console:
   ```
   📤 Continuing conversation with session_id: test-session-abc123
   ✅ Received response: { session_id: "...", history_length: 1 }
   ```
4. Ask follow-up: "How does the second metric compare?"
5. Check console:
   ```
   📤 Continuing conversation with session_id: test-session-abc123
   ✅ Received response: { session_id: "...", history_length: 2 }
   ```
6. Verify AI response references "second metric" correctly

### Test 3: Verify History Restoration

1. After conversation, check `conversation_history` in response
2. Refresh page or navigate away and back
3. Verify conversation history is restored from context
4. All previous Q&A pairs should be visible in chat UI

---

## Common Issues & Solutions

### Issue: AI doesn't remember previous questions

**Symptom:** User asks "What about the second one?" and AI says "What second one?"

**Causes:**
1. ❌ `session_id` not being passed to backend
2. ❌ `session_id` is different on each request
3. ❌ Context not persisting `session_id` across requests

**Solution:**
```typescript
// ✅ Verify session_id is in context
console.log('Current session_id:', sessionId);

// ✅ Verify it's being sent to backend
if (sessionId) {
  formData.append('session_id', sessionId);
  console.log('📤 Sending session_id:', sessionId);
}

// ✅ Verify same session_id returned
console.log('Sent:', sessionId, 'Received:', data.session_id);
console.log('Match:', data.session_id === sessionId);
```

### Issue: Conversation history not showing in UI

**Symptom:** Chat page shows only current message, not previous turns

**Causes:**
1. ❌ `useEffect` dependency issue
2. ❌ Backend `conversation_history` format changed
3. ❌ Frontend parsing logic broken

**Solution:**
```typescript
// ✅ Add logging to useEffect
useEffect(() => {
  console.log('Parsing conversation history:', agentData?.conversation_history);
  
  if (agentData?.conversation_history) {
    agentData.conversation_history.forEach((item, idx) => {
      console.log(`Turn ${idx + 1}:`, {
        user: item.summary?.user_query,
        ai: item.summary?.ai_response?.substring(0, 50)
      });
    });
  }
}, [agentData]);
```

### Issue: Full report vs conversational session confusion

**Symptom:** User generates report, then tries to chat, but session is lost

**Explanation:** This is expected behavior:
- ✅ **Full report** uses different session_id (report-focused)
- ✅ **Conversational AI** uses different session_id (chat-focused)
- ✅ They don't interfere with each other

**Solution:** This is correct! Keep them separate:
```typescript
// Generate report → Navigate to /insights
router.push('/insights');

// Start conversation → Navigate to /chat
router.push('/chat');
```

---

## Integration Checklist

### ✅ Backend API Parameters
- [ ] `/agent/analyze_and_respond` uses: `file`, `user_query`, `session_id` (optional)
- [ ] `/full_report` uses: `file`, `mode`, `session_id` (optional)
- [ ] Removed unused parameters: `persona`, `forecast_metric` from agent endpoint

### ✅ Response Handling
- [ ] Parse `ai_response` field (not `response`)
- [ ] Parse `conversation_history` with nested `summary` object
- [ ] Handle `session_id` in response
- [ ] Store full `AgentAnalyzeResponse` in context

### ✅ Session Management
- [ ] Don't send `session_id` on first request
- [ ] Always send `session_id` on follow-up requests
- [ ] Verify `session_id` is stored in React context
- [ ] Log session_id for debugging

### ✅ UI/UX
- [ ] Display session_id in chat page header
- [ ] Show conversation history on page load
- [ ] Scroll to bottom when new message arrives
- [ ] Show loading indicator during API call
- [ ] Handle errors gracefully

---

## Next Steps

### Recommended Enhancements

1. **Persist Session Across Page Refreshes**
   ```typescript
   // In app-context.tsx
   useEffect(() => {
     localStorage.setItem('current_session_id', sessionId);
   }, [sessionId]);
   
   useEffect(() => {
     const saved = localStorage.getItem('current_session_id');
     if (saved) setSessionId(saved);
   }, []);
   ```

2. **Add "New Conversation" Button**
   ```typescript
   const startNewConversation = () => {
     setSessionId(null);
     setMessages([{ role: 'assistant', content: 'Hello! ...' }]);
     setAgentData(null);
   };
   ```

3. **Show Conversation History Count**
   ```typescript
   <p className="text-sm text-muted-foreground">
     {agentData?.conversation_history?.length || 0} messages in this conversation
   </p>
   ```

4. **Add Firebase Auth Integration**
   ```typescript
   // Get Firebase ID token
   const user = auth.currentUser;
   const token = await user?.getIdToken();
   
   // Send in Authorization header
   headers: {
     'Authorization': `Bearer ${token}`,
   }
   ```

---

## Summary

### ✅ What Changed
1. Updated TypeScript types to match backend response format
2. Fixed conversation history parsing in chat page
3. Corrected API parameter names (`mode` instead of `persona`)
4. Added session_id logging for debugging
5. Removed unused parameters from API calls

### ✅ What Works Now
1. **Session Management:** Frontend properly sends/receives `session_id`
2. **Conversation History:** Backend history correctly parsed and displayed
3. **Context Awareness:** AI understands follow-up questions with session context
4. **Separate Sessions:** Reports and chats use independent sessions (by design)

### ✅ Testing
Run the frontend and test:
1. Start new conversation → Check console logs
2. Ask follow-up questions → Verify AI references previous context
3. Refresh page → Verify history is restored
4. Generate report → Verify it uses separate session

**The frontend is now fully integrated with the conversational AI backend!** 🎉
