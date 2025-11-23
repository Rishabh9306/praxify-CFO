# Email Report Setup Guide

## ✅ Implementation Complete

The email report feature has been fully implemented! Here's what was added:

### 🎯 Features

1. **Email Dialog** - Beautiful modal that appears when user clicks "Download Full Report PDF"
2. **Email Validation** - Validates email format before sending
3. **PDF Generation** - Generates complete PDF with all report data
4. **Email Sending** - Sends professional HTML email with PDF attachment
5. **Skip Option** - Users can skip and download directly if they prefer

### 📁 Files Created/Modified

1. **`lib/email-service.ts`** - Email sending logic
2. **`app/api/send-report/route.ts`** - API endpoint for email
3. **`components/EmailReportDialog.tsx`** - Beautiful dialog UI
4. **`lib/pdf-generator-server.ts`** - Updated to support Blob return
5. **`app/insights/page.tsx`** - Integrated email dialog

---

## 🔧 Setup Instructions

### Step 1: Sign Up for Resend

1. Go to **https://resend.com**
2. Click "Sign Up" (it's **FREE** for up to 100 emails/day, 3,000 emails/month)
3. Verify your email address

### Step 2: Get Your API Key

1. After logging in, go to **API Keys** section: https://resend.com/api-keys
2. Click "Create API Key"
3. Give it a name (e.g., "Praxifi Production")
4. Copy the API key (starts with `re_...`)

### Step 3: Configure Domain (REQUIRED for production)

Resend requires you to verify your domain to send from `noreply@praxifi.com`:

1. Go to **Domains** section: https://resend.com/domains
2. Click "Add Domain"
3. Enter your domain: `praxifi.com`
4. Add the DNS records Resend provides to your domain registrar:
   - **SPF Record** (TXT)
   - **DKIM Record** (TXT)
   - **DMARC Record** (TXT)
5. Click "Verify" - verification usually takes 5-30 minutes

**For Testing (Skip Domain Verification):**
- Use the default Resend domain: `onboarding@resend.dev`
- Update `from` in `lib/email-service.ts` line 33:
  ```typescript
  from: 'onboarding@resend.dev', // Change from 'noreply@praxifi.com'
  ```

### Step 4: Add Environment Variable

1. Create `.env.local` file in `praxifi-frontend/` folder:
   ```bash
   cd praxifi-frontend
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your API key:
   ```env
   RESEND_API_KEY=re_your_actual_api_key_here
   ```

3. **IMPORTANT:** Restart your Next.js dev server:
   ```bash
   # Stop the current server (Ctrl+C)
   pnpm dev
   ```

### Step 5: Test the Feature

1. Open **http://localhost:3000/insights**
2. Click **"Download Full Report PDF"** button
3. Enter your email address in the dialog
4. Click **"Send Report"**
5. Check your inbox! (Check spam folder if not received in 2-3 minutes)

---

## 🌐 DNS Records Example

If your domain is with **GoDaddy**, **Cloudflare**, or **Namecheap**, add these records:

### SPF Record
- **Type:** TXT
- **Name:** `@` or `praxifi.com`
- **Value:** `v=spf1 include:_spf.resend.com ~all`

### DKIM Record
- **Type:** TXT
- **Name:** `resend._domainkey` (Resend will provide exact name)
- **Value:** `[Long string provided by Resend]`

### DMARC Record (Optional but recommended)
- **Type:** TXT
- **Name:** `_dmarc`
- **Value:** `v=DMARC1; p=none; rua=mailto:admin@praxifi.com`

---

## 💰 Pricing (Resend)

- **FREE Tier:** 
  - 100 emails/day
  - 3,000 emails/month
  - Perfect for MVP and small usage

- **Paid Plans (if needed later):**
  - Pro: $20/month - 50,000 emails
  - Enterprise: Custom pricing

---

## 🔒 Security Notes

1. **Never commit `.env.local`** - Already in `.gitignore`
2. **API key is server-side only** - Secure in Next.js API routes
3. **Email validation** - Frontend validation prevents spam
4. **Rate limiting** - Consider adding rate limits in production

---

## 🎨 Email Template

The email includes:
- ✨ Professional HTML design with Praxifi branding
- 📊 Report details (mode, date, format)
- 📎 PDF attachment with complete report
- 🔗 Link back to Praxifi dashboard
- 📧 Footer with privacy policy and unsubscribe

---

## 🧪 Testing Checklist

- [ ] Email dialog appears when clicking "Download Full Report PDF"
- [ ] Email validation works (shows error for invalid emails)
- [ ] "Skip" button downloads PDF directly without email
- [ ] "Send Report" button shows loading state
- [ ] Email arrives in inbox with PDF attachment
- [ ] PDF opens correctly and contains all data
- [ ] Success message appears after sending
- [ ] Error handling works (try with invalid API key)

---

## 🚀 Production Deployment

For production (Vercel, AWS, etc.):

1. Add `RESEND_API_KEY` to environment variables in hosting platform
2. Verify domain at Resend dashboard
3. Update email addresses if needed
4. Test thoroughly before going live
5. Monitor Resend dashboard for delivery rates

---

## 🆘 Troubleshooting

### "Email service not configured" error
- ❌ `RESEND_API_KEY` not set in `.env.local`
- ✅ Solution: Add API key and restart dev server

### "Failed to send email" error
- ❌ API key is invalid or expired
- ✅ Solution: Generate new API key from Resend dashboard

### Emails not arriving
- ❌ Domain not verified (using `noreply@praxifi.com`)
- ✅ Solution: Verify domain or use `onboarding@resend.dev` for testing

### "CORS error" in browser
- ❌ API route not found
- ✅ Solution: Make sure API route exists at `app/api/send-report/route.ts`

---

## 📞 Support

If you encounter issues:
1. Check Resend dashboard logs: https://resend.com/logs
2. Check browser console for errors
3. Check server terminal for API errors
4. Verify `.env.local` is loaded (restart server)

---

## ✅ Summary

**What you need to do:**

1. Sign up at **https://resend.com** (FREE)
2. Get API key from dashboard
3. Add domain verification records (or use test domain)
4. Create `.env.local` with your API key
5. Restart dev server
6. Test the feature!

**That's it!** 🎉 The email feature is fully implemented and ready to use.
