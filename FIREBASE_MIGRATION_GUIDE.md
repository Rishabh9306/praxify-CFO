# 🔥 Firebase Firestore Migration Guide

## Overview
Praxifi CFO has migrated from Redis to Firebase Firestore for secure, persistent storage of user sessions, conversations, reports, and analysis results.

### Why Firebase Firestore?
- ✅ **Secure & Persistent**: Data is encrypted and stored permanently (vs Redis caching)
- ✅ **Per-User Isolation**: Each user's data is completely isolated by email
- ✅ **Real-time Sync**: Instant updates across devices
- ✅ **Scalable**: Auto-scales to millions of users on free tier
- ✅ **Firebase Auth Integration**: Seamless integration with frontend authentication
- ✅ **Free Tier**: 50K reads + 20K writes per day (more than enough for MVP)

---

## 🚀 Quick Start

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" or select existing project
3. Enable **Firestore Database**:
   - Click "Firestore Database" in left menu
   - Click "Create database"
   - Choose "Start in **production mode**"
   - Select your preferred region
   - Click "Enable"

4. Enable **Authentication** (if not already):
   - Click "Authentication" in left menu
   - Click "Get Started"
   - Enable "Google" provider

### Step 2: Create Service Account

1. Go to **Project Settings** (gear icon) → **Service Accounts**
2. Click "**Generate new private key**"
3. Download the JSON file
4. **IMPORTANT**: Keep this file secure! Never commit to Git

### Step 3: Configure Firestore Security Rules

In Firebase Console → Firestore Database → Rules, set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write only their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.token.email == userId;
      
      // Allow access to user's sessions
      match /sessions/{sessionId} {
        allow read, write: if request.auth != null && request.auth.token.email == userId;
        
        // Allow access to session's messages and reports
        match /{document=**} {
          allow read, write: if request.auth != null && request.auth.token.email == userId;
        }
      }
    }
    
    // Allow anonymous users (for backward compatibility)
    match /users/anonymous {
      allow read, write: if true;
      match /{document=**} {
        allow read, write: if true;
      }
    }
  }
}
```

Click **Publish** to save rules.

### Step 4: Set Environment Variables

#### Option A: JSON String (Recommended for Docker/Cloud)

```bash
# .env file or environment variables
export FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"your-project",...}'
```

#### Option B: File Path (Local Development)

```bash
# Save service account JSON as firebase-service-account.json in project root
export FIREBASE_SERVICE_ACCOUNT_PATH=/app/firebase-service-account.json

# For docker-compose
export FIREBASE_SERVICE_ACCOUNT_LOCAL_PATH=./firebase-service-account.json
```

### Step 5: Install Dependencies

```bash
cd praxifi-CFO
pip install firebase-admin==6.5.0 google-cloud-firestore==2.16.0
```

Or rebuild Docker:
```bash
docker-compose build --no-cache
```

### Step 6: Start Application

```bash
# Docker
docker-compose up -d

# Local
python -m aiml_engine.main
```

Check logs for:
```
✅ Successfully initialized Firebase Admin SDK
✅ Successfully connected to Firestore
```

---

## 📊 Data Structure

### Firestore Collections

```
users/
  {user_email}/
    sessions/
      {session_id}/
        metadata:
          - last_activity: timestamp
          - user_email: string
          - has_reports: boolean
        
        messages/
          {message_id}/
            - query_id: string
            - summary: object
            - timestamp: timestamp
            - created_at: string (ISO)
        
        reports/
          {report_id}/
            - report_id: string
            - data: object
            - timestamp: timestamp
            - created_at: string (ISO)
```

### Example Data

```json
{
  "users": {
    "swayam@praxifi.com": {
      "sessions": {
        "abc-123-def": {
          "metadata": {
            "last_activity": "2026-01-06T10:30:00Z",
            "user_email": "swayam@praxifi.com",
            "has_reports": true
          },
          "messages": [
            {
              "query_id": "msg-001",
              "summary": {
                "user_query": "What's our profit trend?",
                "ai_response": "Your profit has grown 15%...",
                "key_kpis": {...}
              },
              "timestamp": "2026-01-06T10:25:00Z"
            }
          ],
          "reports": [
            {
              "report_id": "rpt-001",
              "data": {...},
              "timestamp": "2026-01-06T10:30:00Z"
            }
          ]
        }
      }
    }
  }
}
```

---

## 🔐 API Usage

### Frontend Integration

Add Firebase Auth ID token to requests:

```typescript
// Get current user's ID token
const user = auth.currentUser;
const idToken = await user.getIdToken();

// Make API request with Authorization header
const response = await fetch('http://localhost:8080/agent/analyze_and_respond', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${idToken}`
  },
  body: formData
});
```

### Backend API Changes

The `/agent/analyze_and_respond` endpoint now:
- ✅ Accepts optional `Authorization: Bearer <firebase-token>` header
- ✅ Extracts user email from token
- ✅ Stores all data per user in Firestore
- ✅ Falls back to "anonymous" user for backward compatibility

---

## 🔍 Monitoring & Management

### View Data in Firebase Console

1. Go to Firebase Console → Firestore Database
2. Browse collections: `users/{email}/sessions/{session_id}`
3. View messages and reports in real-time

### Query Examples

```python
from aiml_engine.core.firestore_memory import FirestoreMemory

memory = FirestoreMemory()

# Get user's conversation history
history = memory.recall_related_history(
    user_email="user@example.com",
    session_id="abc-123"
)

# List all sessions for a user
sessions = memory.list_user_sessions(
    user_email="user@example.com",
    limit=50
)

# Get specific report
report = memory.get_report(
    user_email="user@example.com",
    session_id="abc-123",
    report_id="rpt-001"
)

# Clean up old sessions (30+ days)
memory.cleanup_old_sessions(
    user_email="user@example.com",
    days_old=30
)
```

---

## 📈 Free Tier Limits

### Firestore Quotas (Free Tier)

| Operation | Daily Limit | Cost if Exceeded |
|-----------|-------------|------------------|
| Document Reads | 50,000 | $0.06 per 100K |
| Document Writes | 20,000 | $0.18 per 100K |
| Document Deletes | 20,000 | $0.02 per 100K |
| Storage | 1 GB | $0.18 per GB/month |

### Estimated Usage (1000 daily active users)

- **Conversation messages**: ~5 writes/user/day = 5,000 writes ✅
- **Session metadata**: ~5 updates/user/day = 5,000 writes ✅
- **Reading history**: ~10 reads/user/day = 10,000 reads ✅
- **Total**: ~20,000 operations/day (within free tier) ✅

### Optimization Tips

1. **Batch writes** where possible
2. **Use transactions** for atomic updates
3. **Set up indexes** for common queries
4. **Enable TTL** for auto-cleanup (future enhancement)

---

## 🔧 Troubleshooting

### Error: "Could not initialize Firestore"

**Solution**: Check environment variables are set correctly

```bash
# Verify environment variable
echo $FIREBASE_SERVICE_ACCOUNT_JSON

# Or check file exists
ls -la firebase-service-account.json
```

### Error: "Invalid authentication token"

**Solution**: Token expired or invalid. Frontend should refresh token:

```typescript
// Force token refresh
const freshToken = await user.getIdToken(true);
```

### Error: "PERMISSION_DENIED"

**Solution**: Update Firestore security rules to allow user access

### Performance Issues

**Solution**: 
1. Check Firestore indexes in Firebase Console
2. Reduce `limit` parameter in queries
3. Implement pagination for large datasets

---

## 🎯 Migration Checklist

- [x] Create Firebase project
- [x] Enable Firestore Database
- [x] Generate service account key
- [x] Set up Firestore security rules
- [x] Configure environment variables
- [x] Install Firebase dependencies
- [x] Remove Redis from docker-compose
- [x] Update API endpoints to use Firestore
- [x] Add Firebase Auth middleware
- [x] Test conversation flow
- [x] Test report storage
- [x] Monitor Firestore usage

---

## 📚 Additional Resources

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore Pricing](https://firebase.google.com/pricing)

---

## 🆘 Support

For issues or questions:
1. Check Firebase Console logs
2. Review Docker/app logs: `docker-compose logs -f aiml-engine`
3. Contact Praxifi team

---

**Last Updated**: January 6, 2026
**Author**: Praxifi Team
