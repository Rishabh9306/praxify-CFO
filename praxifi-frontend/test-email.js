/**
 * Test script to send email without PDF attachment
 * Verifies MailerSend setup and email content/workflow
 * 
 * Usage: node test-email.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Simple .env.local parser (no dependencies needed)
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) {
    return {};
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return env;
}

// Load environment variables
const env = loadEnv();

// Configuration
const TEST_EMAIL = 'swayampr.sahoo@gmail.com';
const REPORT_MODE = 'finance_guardian';
const REPORT_DATE = new Date().toLocaleDateString('en-US', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
});

// Generate the same HTML email that would be sent with report
function generateEmailHTML(mode, date) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Praxifi Financial Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px 30px; text-align: center;">
        <h1 style="margin: 0; color: #3b82f6; font-size: 36px; font-weight: bold;">PRAXIFI</h1>
        <p style="margin: 10px 0 0; color: #94a3b8; font-size: 16px;">Financial Intelligence Platform</p>
      </td>
    </tr>
    
    <!-- Content -->
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="margin: 0 0 20px; color: #0f172a; font-size: 24px;">Your Financial Report is Ready</h2>
        
        <p style="margin: 0 0 15px; color: #475569; font-size: 16px; line-height: 1.6;">
          Hello,
        </p>
        
        <p style="margin: 0 0 15px; color: #475569; font-size: 16px; line-height: 1.6;">
          Thank you for using Praxifi! Your comprehensive financial analysis report has been generated and is attached to this email.
        </p>
        
        <div style="background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0;">
          <p style="margin: 0 0 10px; color: #0f172a; font-weight: bold;">Report Details:</p>
          <ul style="margin: 0; padding: 0 0 0 20px; color: #475569;">
            <li style="margin-bottom: 8px;">Analysis Mode: <strong>${mode.replace(/_/g, ' ').toUpperCase()}</strong></li>
            <li style="margin-bottom: 8px;">Generated: <strong>${date}</strong></li>
            <li>Format: <strong>PDF (Complete Analysis)</strong></li>
          </ul>
        </div>
        
        <p style="margin: 0 0 15px; color: #475569; font-size: 16px; line-height: 1.6;">
          The attached report includes:
        </p>
        
        <ul style="margin: 0 0 25px; padding: 0 0 0 20px; color: #475569; font-size: 16px; line-height: 1.8;">
          <li>Key Performance Indicators (KPIs)</li>
          <li>Executive Summary & Insights</li>
          <li>Detailed Financial Forecasts</li>
          <li>Revenue & Expense Breakdowns</li>
          <li>Correlation Analysis</li>
          <li>Strategic Recommendations</li>
          <li>Anomaly Detection Results</li>
          <li>Model Health Report</li>
        </ul>
        
        <p style="margin: 0 0 15px; color: #475569; font-size: 16px; line-height: 1.6;">
          <strong>📧 This is a test email to verify email workflow.</strong> In production, a PDF report would be attached.
        </p>
        
        <p style="margin: 0 0 15px; color: #475569; font-size: 16px; line-height: 1.6;">
          If you have any questions or need further analysis, please don't hesitate to reach out to our support team.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://praxifi.com" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-size: 16px; font-weight: bold;">Visit Praxifi Dashboard</a>
        </div>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0 0 10px; color: #64748b; font-size: 14px;">
          &copy; ${new Date().getFullYear()} Praxifi. All rights reserved.
        </p>
        <p style="margin: 0; color: #94a3b8; font-size: 12px;">
          This is an automated message. Please do not reply to this email.
        </p>
        <p style="margin: 10px 0 0; color: #94a3b8; font-size: 12px;">
          <a href="https://praxifi.com/privacy" style="color: #3b82f6; text-decoration: none;">Privacy Policy</a> | 
          <a href="https://praxifi.com/terms" style="color: #3b82f6; text-decoration: none;">Terms of Service</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Send test email via MailerSend API
async function sendTestEmail() {
  const apiKey = env.MAILERSEND_API_KEY;
  
  if (!apiKey) {
    console.error('❌ MAILERSEND_API_KEY not found in .env.local');
    console.log('Please set MAILERSEND_API_KEY in your .env.local file');
    process.exit(1);
  }

  console.log('🚀 Starting email test...');
  console.log('📧 Recipient:', TEST_EMAIL);
  console.log('📅 Report Date:', REPORT_DATE);
  console.log('🔧 Mode:', REPORT_MODE);
  console.log('');

  const emailPayload = {
    from: {
      email: 'noreply@praxifi.com',
      name: 'Praxifi'
    },
    to: [
      {
        email: TEST_EMAIL
      }
    ],
    subject: `[TEST] Your Praxifi Financial Report - ${REPORT_DATE}`,
    html: generateEmailHTML(REPORT_MODE, REPORT_DATE)
    // No attachments for testing
  };

  const postData = JSON.stringify(emailPayload);

  const options = {
    hostname: 'api.mailersend.com',
    port: 443,
    path: '/v1/email',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'X-Requested-With': 'XMLHttpRequest'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📊 Response Status:', res.statusCode);
        console.log('📊 Response Headers:', JSON.stringify(res.headers, null, 2));
        
        if (res.statusCode === 202) {
          console.log('');
          console.log('✅ Email sent successfully!');
          console.log('');
          console.log('📬 Check your inbox:', TEST_EMAIL);
          console.log('🕐 Email should arrive in 1-2 minutes');
          console.log('');
          console.log('📊 MailerSend Activity Feed:');
          console.log('   https://app.mailersend.com/activity');
          console.log('');
          
          if (data) {
            try {
              const parsed = JSON.parse(data);
              console.log('📨 Message ID:', parsed.message_id || 'N/A');
              console.log('');
            } catch (e) {
              // Response might be empty on 202
            }
          }
          
          console.log('✨ What to verify in the email:');
          console.log('   1. Email arrives in inbox (not spam)');
          console.log('   2. Subject line is correct');
          console.log('   3. PRAXIFI header is visible');
          console.log('   4. All content sections render properly');
          console.log('   5. Blue "Visit Praxifi Dashboard" button works');
          console.log('   6. Footer links are present');
          console.log('   7. Professional layout on mobile and desktop');
          console.log('');
          
          resolve(true);
        } else {
          console.log('');
          console.error('❌ Email send failed!');
          console.error('Response:', data);
          console.log('');
          
          try {
            const errorData = JSON.parse(data);
            console.error('Error details:', JSON.stringify(errorData, null, 2));
          } catch (e) {
            console.error('Raw error:', data);
          }
          
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('');
      console.error('❌ Request failed:', error.message);
      console.error('');
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Run the test
console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('  📧 Praxifi Email Test Script (Without PDF)');
console.log('═══════════════════════════════════════════════════════');
console.log('');

sendTestEmail()
  .then(() => {
    console.log('✅ Test completed successfully!');
    console.log('');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error.message);
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Check MAILERSEND_API_KEY is set in .env.local');
    console.log('2. Verify API key has "Email send" permission');
    console.log('3. Check domain verification status at https://app.mailersend.com/domains');
    console.log('4. Review MailerSend activity: https://app.mailersend.com/activity');
    console.log('');
    process.exit(1);
  });
