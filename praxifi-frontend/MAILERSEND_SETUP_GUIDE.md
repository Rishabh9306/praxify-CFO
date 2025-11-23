# MailerSend Setup Guide for Praxifi

Complete guide to setting up MailerSend for sending PDF report emails from `noreply@praxifi.com`.

---

## 🎯 Why MailerSend?

- ✅ **Developer-Friendly**: Simple, clean API designed for transactional emails
- ✅ **Generous Free Tier**: 12,000 emails/month (3,000 in first month)
- ✅ **Easy Setup**: Straightforward domain verification with clear UI
- ✅ **Great Deliverability**: Built-in DKIM, SPF, and tracking
- ✅ **Real-Time Analytics**: Live activity feed and email logs
- ✅ **No Credit Card**: Free tier doesn't require payment details
- ✅ **Fast Support**: Responsive support team and great documentation

---

## 🚀 Quick Start (10 Minutes)

### Step 1: Create MailerSend Account (2 minutes)

1. Go to **https://www.mailersend.com/**
2. Click **"Sign Up Free"**
3. Fill in:
   - Email: Your email address
   - Password: Strong password
   - Company/Project name: `Praxifi`
4. Verify your email (check inbox for verification link)
5. Complete onboarding questionnaire

### Step 2: Get Your API Token (2 minutes)

1. Log into **https://app.mailersend.com/**
2. In the left sidebar, click **"Email"** → **"API Tokens"**
3. Click **"Generate new token"**
4. Configure token:
   - Token name: `Praxifi Production`
   - Domain access: **All domains** (or select specific domain later)
   - Scopes: Check **"Email send"** (minimum required)
   - Optional: Check **"Email read"** for logs access
5. Click **"Create token"**
6. **COPY THE TOKEN IMMEDIATELY** (starts with random string)
   - ⚠️ You won't be able to see it again!
   - Store it securely

### Step 3: Add API Token to Your Project (1 minute)

1. Open `praxifi-frontend/.env.local`
2. Replace the placeholder with your actual token:
   ```bash
   MAILERSEND_API_KEY=your_actual_token_here
   ```
3. Save the file

### Step 4: Restart Development Server (1 minute)

```bash
cd praxifi-frontend
pnpm run dev
```

Wait for **"Ready in X.Xs"** message.

### Step 5: Test Email Sending (2 minutes)

1. Open browser: **http://localhost:3000/insights**
2. Click **"Download Full Report PDF"**
3. Enter your email address
4. Click **"Send Report"**
5. Wait 30-60 seconds
6. Check your inbox!

**Note**: During initial testing without domain verification, emails will be sent from MailerSend's shared domain (`trial-xxx.mailersend.net`). This is normal and expected for testing.

---

## 🌐 Production Setup: Domain Verification

To send emails from `noreply@praxifi.com` instead of the trial domain, you need to verify ownership of `praxifi.com`.

### Prerequisites
- Access to Namecheap account with `praxifi.com`
- Admin privileges to modify DNS records
- 10-30 minutes for DNS propagation (can take up to 24 hours)

---

### Part A: Add Domain in MailerSend

#### Step 1: Add Your Domain

1. Log into **https://app.mailersend.com/**
2. Click **"Email"** → **"Domains"** in sidebar
3. Click **"Add domain"**
4. Enter: `praxifi.com`
5. Click **"Add domain"**

#### Step 2: Get DNS Records

After adding the domain, MailerSend will show you DNS records to add. You'll see something like:

**TXT Record for Domain Verification:**
```
Type: TXT
Host: @
Value: mailersend-verification=abc123def456...
```

**CNAME Records for Email Sending (DKIM):**
```
Type: CNAME
Host: ms1._domainkey
Value: ms1.praxifi.com.dkim.mailersend.net

Type: CNAME
Host: ms2._domainkey
Value: ms2.praxifi.com.dkim.mailersend.net
```

**Optional - SPF Record (if you don't have one):**
```
Type: TXT
Host: @
Value: v=spf1 include:spf.mailersend.net ~all
```

**Optional - Custom Return-Path:**
```
Type: CNAME
Host: bounces
Value: bounces.mailersend.net
```

---

### Part B: Add DNS Records in Namecheap

#### Step 1: Access Namecheap DNS Settings

1. Log into **https://www.namecheap.com/**
2. Click **"Domain List"** in left sidebar
3. Find `praxifi.com` and click **"Manage"**
4. Click **"Advanced DNS"** tab

#### Step 2: Add TXT Record (Domain Verification)

1. Scroll to **"HOST RECORDS"** section
2. Click **"Add New Record"**
3. Fill in:
   - **Type**: `TXT Record`
   - **Host**: `@` (represents root domain praxifi.com)
   - **Value**: Paste the `mailersend-verification=...` string from MailerSend
   - **TTL**: `Automatic` (or `1 min` for faster propagation)
4. Click **green checkmark** to save

#### Step 3: Add CNAME Records (DKIM Signing)

For **ms1._domainkey**:
1. Click **"Add New Record"**
2. Fill in:
   - **Type**: `CNAME Record`
   - **Host**: `ms1._domainkey` (exactly as shown in MailerSend)
   - **Value**: `ms1.praxifi.com.dkim.mailersend.net` (from MailerSend)
   - **TTL**: `Automatic`
3. Click **green checkmark**

For **ms2._domainkey**:
1. Click **"Add New Record"**
2. Fill in:
   - **Type**: `CNAME Record`
   - **Host**: `ms2._domainkey`
   - **Value**: `ms2.praxifi.com.dkim.mailersend.net`
   - **TTL**: `Automatic`
3. Click **green checkmark**

#### Step 4: Add SPF Record (Optional but Recommended)

**Check if you already have an SPF record:**
- Look for existing TXT record with `Host: @` and `Value: v=spf1...`

**If you DON'T have an SPF record:**
1. Click **"Add New Record"**
2. Fill in:
   - **Type**: `TXT Record`
   - **Host**: `@`
   - **Value**: `v=spf1 include:spf.mailersend.net ~all`
   - **TTL**: `Automatic`
3. Click **green checkmark**

**If you ALREADY have an SPF record:**
1. Find the existing TXT record with `v=spf1...`
2. Click **edit (pencil icon)**
3. Add `include:spf.mailersend.net` before `~all` or `-all`
   - Example: `v=spf1 include:spf.mailersend.net include:_spf.google.com ~all`
4. Save

⚠️ **Important**: You can only have ONE SPF record per domain. If you have multiple, merge them.

#### Step 5: Add Return-Path CNAME (Optional)

1. Click **"Add New Record"**
2. Fill in:
   - **Type**: `CNAME Record`
   - **Host**: `bounces`
   - **Value**: `bounces.mailersend.net`
   - **TTL**: `Automatic`
3. Click **green checkmark**

#### Step 6: Save All Changes

1. Scroll to top or bottom of page
2. Click **"Save All Changes"** (green button)
3. Confirm if prompted

---

### Part C: Verify Domain in MailerSend

#### Wait for DNS Propagation

DNS changes can take:
- **Minimum**: 10-30 minutes
- **Average**: 1-2 hours
- **Maximum**: 24-48 hours (rare)

#### Check DNS Propagation (Optional)

Use online tools to verify records are live:
- **https://dnschecker.org/**
- **https://mxtoolbox.com/SuperTool.aspx**

Search for:
- `praxifi.com` (TXT records - should show mailersend-verification)
- `ms1._domainkey.praxifi.com` (should show CNAME → mailersend.net)
- `ms2._domainkey.praxifi.com` (should show CNAME → mailersend.net)

#### Verify in MailerSend Dashboard

1. Go to **https://app.mailersend.com/**
2. Click **"Email"** → **"Domains"**
3. Find `praxifi.com` in the list
4. Click **"Verify DNS records"** button
5. Wait for verification (usually instant if DNS propagated)

**Status indicators:**
- 🔴 **Not Verified**: DNS records not found yet (wait longer)
- 🟡 **Partially Verified**: Some records found, some missing
- 🟢 **Verified**: All records verified, ready to send!

Once verified, you'll see ✅ next to all DNS records.

---

### Part D: Update "From" Email Address

After domain verification is complete:

**Option 1: Update default in code**

Edit `app/api/send-report/route.ts` (line ~46):
```typescript
from: {
  email: from || 'noreply@praxifi.com',  // Already set correctly!
  name: 'Praxifi'
}
```

**Option 2: Keep code as-is**

The code already defaults to `noreply@praxifi.com`, so no changes needed!

---

## 📊 Verify Email Delivery

### Check Activity Feed

1. Go to **https://app.mailersend.com/**
2. Click **"Email"** → **"Activity"** in sidebar
3. You'll see all sent emails with:
   - **Recipient**: Who received the email
   - **Subject**: Email subject line
   - **Status**: 
     - 🟢 **Delivered**: Successfully delivered to inbox
     - 🟡 **Queued/Sent**: In transit
     - 🔴 **Failed/Bounced**: Delivery failed
     - 🟠 **Opened**: Recipient opened the email (if tracking enabled)
   - **Time**: When email was sent

### Click on an Email for Details

- Full delivery timeline
- SMTP logs
- Attachment info (PDF size, filename)
- Bounce/error messages (if any)

---

## 🛠️ Troubleshooting

### "MAILERSEND_API_KEY not configured"

**Problem**: API token not found in environment variables.

**Solution**:
1. Check `.env.local` exists in `praxifi-frontend` folder
2. Verify it contains: `MAILERSEND_API_KEY=your_token_here`
3. Token should NOT have quotes around it
4. Restart dev server: `pnpm run dev`

---

### "Failed to send email" (401 Unauthorized)

**Problem**: API token is invalid or expired.

**Solution**:
1. Go to MailerSend → API Tokens
2. Check if token is still active
3. If not, generate a new token
4. Update `.env.local` with new token
5. Restart dev server

---

### "Failed to send email" (403 Forbidden)

**Problem**: API token doesn't have required permissions.

**Solution**:
1. Go to MailerSend → API Tokens
2. Delete old token
3. Create new token with **"Email send"** scope enabled
4. Update `.env.local`
5. Restart dev server

---

### "Domain not verified" Error

**Problem**: Trying to send from `noreply@praxifi.com` before domain verification.

**Temporary Solution**:
- Change `from` email to trial domain temporarily
- Or wait for verification to complete

**Permanent Solution**:
- Complete domain verification steps above
- Wait 1-24 hours for DNS propagation
- Verify in MailerSend dashboard

---

### Email Not Arriving in Inbox

**Problem**: Email sent successfully but not received.

**Check**:
1. **Spam/Junk folder** (most common)
2. **Activity Feed** in MailerSend:
   - Go to Email → Activity
   - Check status (Delivered, Bounced, etc.)
3. **Wait 5 minutes** (can take time)
4. **Try different email provider**:
   - Gmail, Outlook, Yahoo, ProtonMail
5. **Check email address** for typos

**If using trial domain**:
- Trial emails may have lower deliverability
- Verify your domain to improve inbox placement

---

### DNS Records Not Propagating

**Problem**: DNS verification failing after adding records.

**Solutions**:

1. **Wait longer**: Can take up to 24 hours
2. **Check for typos**:
   - Host must be exact: `ms1._domainkey` (not `ms1.domainkey`)
   - Value must be exact (copy-paste from MailerSend)
3. **Remove extra dots**:
   - Host should be `ms1._domainkey` (NOT `ms1._domainkey.`)
   - Namecheap adds the domain automatically
4. **Check DNS propagation**:
   ```bash
   # On Mac/Linux terminal:
   dig TXT praxifi.com
   dig CNAME ms1._domainkey.praxifi.com
   ```
5. **Clear Namecheap DNS cache**:
   - Contact Namecheap support to flush DNS cache
6. **Verify TTL**:
   - Set TTL to `1 min` or `5 min` for faster propagation
   - After verification, can increase to `1 hour` or `Automatic`

---

### Multiple SPF Records Conflict

**Problem**: Error about multiple SPF records.

**Explanation**: You can only have ONE SPF record per domain. Multiple SPF records will break email delivery.

**Solution**:
1. Find all TXT records with `v=spf1...`
2. **Merge them into one**:
   ```
   Before:
   v=spf1 include:spf.mailersend.net ~all
   v=spf1 include:_spf.google.com ~all
   
   After (merged):
   v=spf1 include:spf.mailersend.net include:_spf.google.com ~all
   ```
3. Delete extra SPF records
4. Keep only the merged one

---

### PDF Attachment Not Opening

**Problem**: Email received but PDF won't open.

**Check**:
1. **Browser console** for errors (F12 → Console)
2. **PDF size**: MailerSend limit is 25MB per email
3. **Generation errors**: Check if PDF generated successfully first
4. **Download vs Send**: Try "Download" button to verify PDF works locally
5. **Email client**: Some email clients (Gmail) scan PDFs and may delay display

---

### Rate Limiting / Too Many Requests

**Problem**: Error 429 or "rate limit exceeded".

**Explanation**: Free tier has limits:
- **12,000 emails/month** (3,000 in first month)
- **~400 emails/day** average
- **No burst limits** documented, but be reasonable

**Solution**:
1. Check usage in MailerSend → Dashboard
2. Upgrade to paid plan if needed (starts at $25/month for 50k emails)
3. Implement client-side rate limiting to prevent accidental spam

---

## 🔒 Security Best Practices

### API Token Management

1. **Never commit tokens to Git**
   - `.env.local` is in `.gitignore` ✅
   - Double-check before pushing code

2. **Use different tokens for environments**
   - Development: One token for testing
   - Production: Different token with restricted permissions

3. **Rotate tokens regularly**
   - Create new token every 3-6 months
   - Delete old tokens immediately after replacement

4. **Restrict token permissions**
   - Only enable "Email send" scope
   - Don't use "Full access" unless necessary

### Prevent Email Abuse

1. **Rate limiting** (client-side):
   - Disable button after click
   - Show loading state
   - Prevent multiple rapid clicks

2. **Backend validation**:
   - Validate email format
   - Check for suspicious patterns
   - Consider CAPTCHA for public endpoints

3. **Monitor usage**:
   - Check MailerSend activity feed daily
   - Set up usage alerts (if available)
   - Review bounce rates

---

## 📈 Email Deliverability Tips

### Improve Inbox Placement

1. **Verify domain** (required for good deliverability)
2. **Warm up slowly**:
   - Start with small volumes
   - Gradually increase over weeks
3. **Monitor bounce rate**:
   - Keep below 5%
   - Remove invalid emails from list
4. **Use professional content**:
   - No spammy words ("FREE!", "WIN!", etc.)
   - Balance text and HTML
   - Include unsubscribe link (not required for transactional, but good practice)

### DMARC Setup (Optional but Recommended)

After domain verification, add DMARC for better security:

1. In Namecheap, add TXT record:
   - **Host**: `_dmarc`
   - **Value**: `v=DMARC1; p=none; rua=mailto:your-email@praxifi.com`
   - **TTL**: `Automatic`

2. Monitor DMARC reports for issues

---

## 📋 Quick Reference

### API Token Location
```bash
.env.local
MAILERSEND_API_KEY=your_token_here
```

### MailerSend Dashboard URLs
- **Main Dashboard**: https://app.mailersend.com/
- **API Tokens**: https://app.mailersend.com/api-tokens
- **Domains**: https://app.mailersend.com/domains
- **Activity Feed**: https://app.mailersend.com/activity
- **Documentation**: https://developers.mailersend.com/

### DNS Records Summary (Namecheap)
| Type | Host | Value | Required |
|------|------|-------|----------|
| TXT | `@` | `mailersend-verification=...` | ✅ Yes |
| CNAME | `ms1._domainkey` | `ms1.praxifi.com.dkim.mailersend.net` | ✅ Yes |
| CNAME | `ms2._domainkey` | `ms2.praxifi.com.dkim.mailersend.net` | ✅ Yes |
| TXT | `@` | `v=spf1 include:spf.mailersend.net ~all` | 🟡 Recommended |
| CNAME | `bounces` | `bounces.mailersend.net` | 🟢 Optional |

### Test Email Flow
1. http://localhost:3000/insights
2. "Download Full Report PDF" → Enter email → "Send Report"
3. Check MailerSend Activity: https://app.mailersend.com/activity
4. Check inbox (wait 1-2 minutes)

### Free Tier Limits
- **12,000 emails/month** (3,000 in first month)
- **25MB per email** (including attachments)
- **No credit card required**
- All features included

---

## 🎯 Production Readiness Checklist

Before going live with `noreply@praxifi.com`:

- [ ] MailerSend account created and verified
- [ ] API token generated and added to `.env.local`
- [ ] Domain `praxifi.com` added in MailerSend
- [ ] TXT record for verification added to Namecheap
- [ ] CNAME records for DKIM added to Namecheap
- [ ] SPF record added/updated in Namecheap
- [ ] Return-Path CNAME added to Namecheap (optional)
- [ ] DNS records verified in MailerSend dashboard (all ✅)
- [ ] Test email sent and received successfully
- [ ] PDF attachment opens correctly
- [ ] Email doesn't land in spam folder
- [ ] Activity feed shows "Delivered" status
- [ ] Code uses `noreply@praxifi.com` as sender
- [ ] Production `.env` file secured (not committed to Git)

---

## 🚀 You're All Set!

MailerSend is now configured for Praxifi. Your users can receive beautiful PDF reports directly in their inbox!

**Need Help?**
- MailerSend Support: https://support.mailersend.com/
- MailerSend Discord: https://discord.gg/mailersend
- API Documentation: https://developers.mailersend.com/

**Next Steps:**
1. Complete domain verification (if not done)
2. Send test emails to different providers (Gmail, Outlook, Yahoo)
3. Monitor deliverability in Activity feed
4. Consider adding user preferences (email notifications on/off)

---

**Last Updated**: November 2025
**For**: Praxifi CFO Platform
**Domain**: praxifi.com (Namecheap)
**Email**: noreply@praxifi.com
