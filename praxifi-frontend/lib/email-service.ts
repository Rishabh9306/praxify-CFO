/**
 * Email Service for sending PDF reports
 * Uses Resend API for email delivery
 */

interface EmailData {
  to: string;
  pdfBlob: Blob;
  reportMode: string;
  reportDate: string;
}

/**
 * Send PDF report via email
 */
export async function sendReportEmail(data: EmailData): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📧 Preparing to send email to:', data.to);

    // Convert PDF blob to base64
    const base64PDF = await blobToBase64(data.pdfBlob);

    // Prepare email payload
    const emailPayload = {
      to: data.to,
      from: 'noreply@praxifi.com',
      subject: `Your Praxifi Financial Report - ${data.reportDate}`,
      html: generateEmailHTML(data.reportMode, data.reportDate),
      attachments: [
        {
          filename: `Praxifi_Report_${data.reportMode}_${data.reportDate}.pdf`,
          content: base64PDF.split(',')[1], // Remove data:application/pdf;base64, prefix
        },
      ],
    };

    // Send via API route
    const response = await fetch('/api/send-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send email');
    }

    const result = await response.json();
    console.log('✅ Email sent successfully:', result);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Convert Blob to Base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Generate HTML email content
 */
function generateEmailHTML(mode: string, date: string): string {
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
        <p style="margin: 10px 0 0; color: #94a3b8; font-size: 16px;">Your Agentic CFO Copilot</p>
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
          If you have any questions or need further analysis, please don't hesitate to reach out to us at contact@praxify.com.
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
