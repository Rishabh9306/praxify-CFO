# Firebase OAuth Setup Guide for Praxifi CFO

## ✅ What's Been Done

1. **Firebase SDK installed** (`firebase` package)
2. **Authentication files created**:
   - `lib/firebase.ts` - Firebase configuration & auth functions
   - `lib/auth-context.tsx` - React context for auth state
   - `components/protected-route.tsx` - Route protection component
3. **Login page created** at `/login` with matching UI/UX
4. **Header updated** with user info & sign out button
5. **Layout updated** to include AuthProvider

## 🔧 Firebase Console Setup Steps

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `praxifi-cfo` (or your preferred name)
4. Disable Google Analytics (optional, not needed for auth)
5. Click **"Create project"**

### Step 2: Register Web App
1. In your Firebase project, click the **Web icon** (</>)
2. Enter app nickname: `Praxifi Frontend`
3. **Don't** check "Firebase Hosting" (you're using Vercel)
4. Click **"Register app"**
5. **Copy the firebaseConfig object** - you'll need this!

### Step 3: Enable Google Authentication
1. In Firebase Console, go to **"Build" > "Authentication"**
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Click on **"Google"**
5. Toggle **"Enable"**
6. Enter **"Project support email"** (your email)
7. Click **"Save"**

### Step 4: Configure Authorized Domains
1. Still in Authentication > Settings
2. Go to **"Authorized domains"** tab
3. Add your domains:
   - `localhost` (already there by default)
   - `praxifi.vercel.app` (your production domain)
   - Any other staging/preview domains from Vercel
4. Click **"Add domain"**

### Step 5: Get Firebase Config Values
From the Firebase Console:
1. Go to **"Project settings"** (gear icon)
2. Scroll down to **"Your apps"**
3. Find your web app and click **"Config"**
4. Copy these values:

\`\`\`javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "praxifi-cfo.firebaseapp.com",
  projectId: "praxifi-cfo",
  storageBucket: "praxifi-cfo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
\`\`\`

### Step 6: Update Environment Variables
Open `/praxifi-frontend/.env.local` and replace the placeholders:

\`\`\`bash
# Replace these with your actual Firebase config values:
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...your_actual_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=praxifi-cfo.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=praxifi-cfo
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=praxifi-cfo.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123def456
\`\`\`

### Step 7: Restart Your Dev Server
\`\`\`bash
cd /Users/swayamsahoo/Projects/praxify-CFO/praxifi-frontend
# Kill current server (Ctrl+C) and restart:
pnpm run dev
\`\`\`

### Step 8: Test Authentication
1. Navigate to: `http://localhost:3000/login`
2. Click **"Continue with Google"**
3. Select your Google account
4. You should be redirected to `/upload` after successful login
5. Check the header - you should see your name and "Sign Out" button

## 🔒 Optional Security Enhancements

### Add Email/Password Sign-In (Optional)
1. In Firebase Console > Authentication > Sign-in method
2. Enable **"Email/Password"**
3. Update `lib/firebase.ts` to add email/password functions

### Set Up Firestore Rules (If using Firestore later)
\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
\`\`\`

### Enable Firebase Security Features
1. **App Check**: Protect against abuse
   - Go to Build > App Check
   - Register your app with reCAPTCHA v3
2. **Identity Platform**: Advanced user management (paid)

## 📝 How to Use Protected Routes

Wrap any page that requires authentication:

\`\`\`tsx
import { ProtectedRoute } from "@/components/protected-route"

export default function ProtectedPage() {
  return (
    <ProtectedRoute>
      <div>Your protected content here</div>
    </ProtectedRoute>
  )
}
\`\`\`

## 🎨 Login Page Features

✅ Matching Praxifi UI/UX (dark theme, glassmorphism, animations)
✅ Google OAuth with custom button design
✅ Responsive layout (mobile + desktop)
✅ Marketing content showcasing features
✅ Auto-redirect after login
✅ Loading states
✅ Error handling

## 🚀 Production Deployment (Vercel)

1. **Add environment variables to Vercel**:
   - Go to Vercel Dashboard > Your Project > Settings > Environment Variables
   - Add all `NEXT_PUBLIC_FIREBASE_*` variables
   - Set for: Production, Preview, Development

2. **Update Firebase Authorized Domains**:
   - Add your Vercel production domain
   - Add Vercel preview domains (*.vercel.app)

3. **Redeploy** on Vercel

## 🐛 Troubleshooting

### "Firebase: Error (auth/unauthorized-domain)"
- **Fix**: Add your domain to Firebase Console > Authentication > Authorized domains

### "Firebase config is undefined"
- **Fix**: Check `.env.local` has all Firebase variables with `NEXT_PUBLIC_` prefix
- Restart dev server after adding env vars

### Sign-in popup blocked
- **Fix**: Allow popups for localhost in browser settings
- Or use `signInWithRedirect` instead of `signInWithPopup`

### User info not showing in header
- **Fix**: Make sure AuthProvider is wrapping your app in `layout.tsx`
- Check browser console for auth state changes

## 📚 Additional Resources

- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Firebase Console](https://console.firebase.google.com/)

## ✨ Next Steps

After Firebase is configured, you can:
1. Add user profiles stored in Firestore
2. Implement role-based access control
3. Add email verification
4. Set up password reset flow
5. Track user analytics in Firebase
6. Add custom claims for admin users

---

**Need Help?** Check the Firebase Console error logs or browser console for detailed error messages.
