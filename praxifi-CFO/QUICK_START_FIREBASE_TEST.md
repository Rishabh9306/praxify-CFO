# 🚀 Quick Start Guide - Testing Firebase with JSON String

## Your Setup (More Secure ✅)

You're using `FIREBASE_SERVICE_ACCOUNT_JSON` in `.env` file - this is **the recommended approach**!

---

## Step-by-Step Testing

### 1. Verify Your .env File

Your `.env` file should have:

```bash
# Google Gemini API
GOOGLE_API_KEY=your_actual_key

# Firebase Service Account (JSON string on one line)
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"your-project-id",...}'
```

**Important**: The JSON should be:
- ✅ Wrapped in single quotes `'...'`
- ✅ All on ONE line (no line breaks)
- ✅ Keep the `\n` in the private key (they should be there)

### 2. Install python-dotenv (if not already)

```bash
pip install python-dotenv
```

### 3. Run the Test Script

```bash
cd praxifi-CFO
python test_firestore_connection.py
```

**Expected Output:**
```
📂 Loading environment variables from .env...
✅ Loaded .env from: /path/to/.env
✅ FIREBASE_SERVICE_ACCOUNT_JSON found (XXXX characters)

🔥 Initializing Firestore connection...
✅ Successfully initialized Firebase Admin SDK
✅ Successfully connected to Firestore

📝 Testing write operation...
✅ Write successful to session: test-session-12345

📖 Testing read operation...
✅ Read successful! Retrieved 1 message(s)

📊 Retrieved data:
  Message 1:
    Query ID: test-query-1
    Summary: {'test': 'Firebase integration test', 'status': 'working', ...}

🔍 Testing session metadata retrieval...
✅ Metadata retrieved: {...}

📋 Testing list user sessions...
✅ Found 1 session(s) for user test@praxifi.com

🧹 Cleaning up test data...
✅ Test session deleted

============================================================
🎉 ALL TESTS PASSED! Firebase Firestore is working perfectly!
============================================================
```

### 4. If Test Passes → Start Backend

```bash
# Start FastAPI server
uvicorn aiml_engine.main:app --host 0.0.0.0 --port 8080 --reload
```

**Look for these logs:**
```
✅ Successfully initialized Firebase Admin SDK
✅ Successfully connected to Firestore
INFO:     Application startup complete.
```

### 5. Test API Endpoint

In a new terminal:

```bash
# Test health
curl http://localhost:8080/

# Test with your frontend (recommended)
# Frontend should be running on http://localhost:3000
```

### 6. Check Firebase Console

1. Go to https://console.firebase.google.com/
2. Select your project
3. Click **Firestore Database**
4. You should see:
   ```
   users/
     test@praxifi.com/
       sessions/
         test-session-XXXX/
   ```

---

## 🐛 Troubleshooting

### Error: "FIREBASE_SERVICE_ACCOUNT_JSON not found"

**Solution:**
```bash
# Check .env file exists
cat .env | grep FIREBASE_SERVICE_ACCOUNT_JSON

# Make sure it's in the same directory as test script
ls -la .env
```

### Error: "Could not parse service account"

**Solution:** Your JSON string might have issues

```bash
# Check if JSON is valid - save temporarily to test
echo $FIREBASE_SERVICE_ACCOUNT_JSON > temp.json
python -m json.tool temp.json
rm temp.json

# If invalid, re-copy from Firebase Console
# Make sure it's on ONE line in .env
```

### Error: "Import aiml_engine could not be resolved"

**Solution:**
```bash
# Install project in development mode
pip install -e .

# Or add to Python path
export PYTHONPATH="$PWD:$PYTHONPATH"
```

### Error: "PERMISSION_DENIED"

**Solution:** Update Firestore security rules

1. Go to Firebase Console → Firestore Database → Rules
2. Use rules from `FIREBASE_MIGRATION_GUIDE.md`
3. Click **Publish**

---

## ✅ Once Everything Works

### For Docker Deployment:

```bash
# Your .env will automatically be used by docker-compose
docker-compose build --no-cache
docker-compose up -d

# Check logs
docker-compose logs -f aiml-engine
```

**Docker will use the JSON string from .env** - no need to mount any files!

---

## 🔒 Security Best Practices (You're Already Following!)

✅ **DO** (Your approach):
- Store JSON in `.env` file
- Add `.env` to `.gitignore`
- Never commit credentials to Git

❌ **DON'T**:
- Commit `firebase-service-account.json` to Git
- Share `.env` file publicly
- Expose credentials in code

---

## 📝 Summary

Your setup is **secure and production-ready**! Just run:

1. `python test_firestore_connection.py` → Verify Firebase works
2. `uvicorn aiml_engine.main:app --reload` → Start backend
3. Test with frontend → Full integration check
4. `docker-compose up -d` → Deploy with Docker

**No JSON files in your repo = More secure! ✅**
