# ✅ Frontend-Backend Integration Test Checklist

## Pre-Test Setup

- [ ] Backend running on `http://localhost:8000`
- [ ] Frontend running on `http://localhost:3000`
- [ ] Browser DevTools Console open for debugging
- [ ] Test CSV file ready (e.g., `praxifi-CFO/data/dataset.csv`)

---

## Test 1: New Conversation Flow

### Steps:
1. [ ] Open `http://localhost:3000/upload`
2. [ ] Upload test CSV file
3. [ ] Click "Launch AI Agent"
4. [ ] Wait for redirect to `/chat` page

### Expected Results:
- [ ] Console shows: `📤 Starting new conversation (no session_id)`
- [ ] Console shows: `✅ Received response: { session_id: "...", history_length: 1 }`
- [ ] Chat page displays session ID at top
- [ ] Initial AI response is visible
- [ ] Chat input is enabled

### Debug:
```javascript
// In browser console:
console.log('Session ID:', window.localStorage.getItem('praxifi-cfo-sessions'));
```

---

## Test 2: Context-Aware Follow-Up Questions

### Steps:
1. [ ] In chat page from Test 1, ask: "What are our top 3 KPIs?"
2. [ ] Wait for response
3. [ ] Ask follow-up: "How does the second one compare to industry standards?"
4. [ ] Wait for response

### Expected Results:
- [ ] Console shows: `📤 Continuing conversation with session_id: ...`
- [ ] Console shows: `history_length: 2` after first follow-up
- [ ] Console shows: `history_length: 3` after second follow-up
- [ ] AI response in step 3 references "second KPI" from step 1
- [ ] AI doesn't ask "which metric?" - it knows from context

### Key Indicator of Success:
✅ AI says something like: "The second KPI (profit margin at X%) compares..."
❌ AI says: "What second metric are you referring to?"

---

## Test 3: Deep Contextual Understanding

### Steps:
1. [ ] Continue in same chat session
2. [ ] Ask: "Based on our discussion, what's the single most urgent action?"
3. [ ] Wait for response

### Expected Results:
- [ ] AI response synthesizes insights from ALL previous questions
- [ ] AI mentions specific metrics/issues discussed earlier
- [ ] Response shows understanding of entire conversation flow

### Key Indicator of Success:
✅ AI says: "Based on our discussion of [metric from Q1] and [issue from Q2]..."
❌ AI gives generic response without referencing previous context

---

## Test 4: Conversation History Persistence

### Steps:
1. [ ] Note current session ID from chat page header
2. [ ] Navigate away: Click on "Dashboard" or any other page
3. [ ] Navigate back to `/chat` page
4. [ ] Check conversation history

### Expected Results:
- [ ] Same session ID displayed
- [ ] All previous Q&A pairs visible in chat
- [ ] Can continue asking questions in same session

---

## Test 5: New Session Creation

### Steps:
1. [ ] In chat page, refresh the browser (Cmd+R / Ctrl+R)
2. [ ] Upload a NEW CSV file using the paperclip icon
3. [ ] Ask a question
4. [ ] Check console and session ID

### Expected Results:
- [ ] New session_id generated
- [ ] Previous conversation cleared
- [ ] Fresh start with new data

---

## Test 6: Static Report Generation

### Steps:
1. [ ] Navigate to `/upload`
2. [ ] Upload test CSV file
3. [ ] Select mode: "Finance Guardian"
4. [ ] Click "Generate Full Report"
5. [ ] Wait for redirect to `/insights`

### Expected Results:
- [ ] Report generated successfully
- [ ] Different session_id than conversational chat
- [ ] Full dashboard with KPIs, forecasts, anomalies visible
- [ ] No conversation history (by design)

---

## Test 7: Parallel Sessions (Verify Isolation)

### Steps:
1. [ ] Generate full report (session_id = `sess_A`)
2. [ ] Navigate to `/upload`
3. [ ] Upload same file, click "Launch AI Agent"
4. [ ] Start conversation (session_id = `sess_B`)
5. [ ] Verify both sessions are independent

### Expected Results:
- [ ] Report session !== Chat session
- [ ] Both sessions stored in `sessionHistory` (check localStorage)
- [ ] Can access both from `/reports` page
- [ ] No cross-contamination

---

## Test 8: Error Handling

### Steps:
1. [ ] Stop backend server
2. [ ] Try to send a message in chat
3. [ ] Check error display

### Expected Results:
- [ ] User-friendly error message shown
- [ ] Console shows error details
- [ ] App doesn't crash
- [ ] Can retry after backend restarts

---

## Test 9: File Upload in Chat

### Steps:
1. [ ] In chat page, click paperclip icon
2. [ ] Upload a different CSV file
3. [ ] Ask: "Analyze this new data"
4. [ ] Check if new session starts

### Expected Results:
- [ ] File attaches successfully
- [ ] Shows file name and size
- [ ] Can remove file before sending
- [ ] New analysis on new file

---

## Test 10: Real Conversation Example

### Conversation Script:
```
User: What are our biggest financial risks?
AI: [Lists 3 risks with data]

User: How urgent is the second risk?
AI: [Should reference specific second risk from previous response]

User: What can we do about it this quarter?
AI: [Should provide actionable recommendations based on risk discussed]

User: What's the expected ROI if we implement your suggestion?
AI: [Should calculate based on context of the specific risk and recommendation]
```

### Expected Results:
- [ ] All 4 responses are contextually connected
- [ ] AI never asks "which risk?" or "which suggestion?"
- [ ] Final ROI calculation is specific to the discussed scenario

---

## Debug Commands

### Check Session Storage
```javascript
// In browser console
const sessions = JSON.parse(localStorage.getItem('praxifi-cfo-sessions') || '[]');
console.table(sessions.map(s => ({
  id: s.session_id,
  file: s.file_name,
  query: s.last_query,
  time: new Date(s.timestamp).toLocaleString()
})));
```

### Check Current Context
```javascript
// In browser console (React DevTools)
$r.state // If class component
$r.context // For context values
```

### Monitor Network Requests
1. Open DevTools → Network tab
2. Filter: `analyze_and_respond`
3. Check request payload for `session_id`
4. Check response for `conversation_history` length

---

## Performance Checks

- [ ] First message response time: < 10 seconds
- [ ] Follow-up response time: < 8 seconds
- [ ] Chat UI remains responsive during loading
- [ ] No memory leaks after 10+ messages
- [ ] Smooth scrolling with 20+ messages

---

## Firestore Verification (Backend)

### Check Data Storage
1. [ ] Open Firebase Console → Firestore
2. [ ] Navigate to: `users/anonymous/sessions/{session_id}/messages/`
3. [ ] Verify all conversation turns are stored
4. [ ] Check timestamps are sequential
5. [ ] Verify `summary.user_query` and `summary.ai_response` exist

---

## Success Criteria

### ✅ All Tests Must Pass:
- [x] Session creation works
- [x] Session ID persists across requests
- [x] Conversation history grows correctly
- [x] AI responses are context-aware
- [x] Backend stores messages in Firestore
- [x] Frontend parses history correctly
- [x] Error handling is graceful
- [x] Report and chat sessions are independent

### ✅ The Golden Test:
**Can a user have a natural 5-turn conversation where each question builds on previous answers?**

If YES → Integration is successful! 🎉
If NO → Check console logs and Firestore data

---

## Common Issues & Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| "AI doesn't remember" | Check console for `session_id` being sent |
| "History not showing" | Verify `conversation_history` array in response |
| "Session ID changes" | Check if context is persisting `sessionId` |
| "CORS error" | Verify backend allows frontend origin |
| "404 endpoint" | Check API URL matches backend route |

---

## Final Verification

Run this in browser console after successful conversation:

```javascript
const verify = async () => {
  const sessions = JSON.parse(localStorage.getItem('praxifi-cfo-sessions') || '[]');
  console.log('✅ Total sessions:', sessions.length);
  
  const latest = sessions[0];
  if (latest?.data?.conversation_history) {
    console.log('✅ Latest session ID:', latest.session_id);
    console.log('✅ Conversation turns:', latest.data.conversation_history.length);
    console.log('✅ Session working correctly!');
  } else {
    console.error('❌ No conversation history found');
  }
};

verify();
```

**Expected output:**
```
✅ Total sessions: 1
✅ Latest session ID: test-session-abc123
✅ Conversation turns: 3
✅ Session working correctly!
```

---

## Test Report Template

```markdown
## Test Results - [Date]

**Tester:** [Name]
**Backend Version:** [Commit/Tag]
**Frontend Version:** [Commit/Tag]

### Test Results:
- [ ] Test 1: New Conversation - PASS/FAIL
- [ ] Test 2: Context-Aware Follow-ups - PASS/FAIL
- [ ] Test 3: Deep Context - PASS/FAIL
- [ ] Test 4: History Persistence - PASS/FAIL
- [ ] Test 5: New Session - PASS/FAIL
- [ ] Test 6: Static Report - PASS/FAIL
- [ ] Test 7: Parallel Sessions - PASS/FAIL
- [ ] Test 8: Error Handling - PASS/FAIL
- [ ] Test 9: File Upload - PASS/FAIL
- [ ] Test 10: Real Conversation - PASS/FAIL

### Issues Found:
1. [Description]
2. [Description]

### Overall Status: ✅ PASS / ❌ FAIL

### Notes:
[Any additional observations]
```

---

**Ready to test? Follow the checklist from top to bottom!** 🚀
