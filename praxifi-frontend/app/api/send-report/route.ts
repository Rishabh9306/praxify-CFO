/**
 * API Route for sending report emails via MailerSend
 * POST /api/send-report
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, from, subject, html, attachments } = body;

    // Validate required fields
    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      );
    }

    // Get MailerSend API key from environment
    const mailersendApiKey = process.env.MAILERSEND_API_KEY;
    
    if (!mailersendApiKey) {
      console.error('❌ MAILERSEND_API_KEY not configured');
      return NextResponse.json(
        { error: 'Email service not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Prepare attachments in MailerSend format
    const formattedAttachments = attachments?.map((attachment: any) => ({
      content: attachment.content,
      filename: attachment.filename,
      disposition: 'attachment'
    })) || [];

    // Send email via MailerSend API
    const response = await fetch('https://api.mailersend.com/v1/email', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mailersendApiKey}`,
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        from: {
          email: from || 'noreply@praxifi.com',
          name: 'Praxifi'
        },
        to: [
          {
            email: to
          }
        ],
        subject: subject,
        html: html,
        attachments: formattedAttachments
      }),
    });

    // MailerSend returns 202 on success
    if (response.status === 202) {
      const data = await response.json();
      console.log('✅ Email sent successfully via MailerSend');
      
      return NextResponse.json({
        success: true,
        messageId: data.message_id || `mailersend-${Date.now()}`,
      });
    }

    // Handle errors
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }

    console.error('❌ MailerSend API error:', response.status, errorData);
    return NextResponse.json(
      { error: errorData.message || errorData.errors?.[0] || 'Failed to send email' },
      { status: response.status }
    );
    
  } catch (error) {
    console.error('❌ Error in send-report API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
