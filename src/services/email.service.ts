import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { googleOAuth2Client } from '../config/oauth.config';
import { validateGoogleToken } from './integration.service';
import { AppDataSource } from '../config/database.config';
import { Integration, IntegrationAppTypeEnum } from '../database/entities/integration.entity';
import { Meeting } from '../database/entities/meeting.entity';
import { Event } from '../database/entities/event.entity';

interface EmailContent {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Get Gmail API client for sending emails
const getGmailClient = async (userId: string) => {
  const integrationRepository = AppDataSource.getRepository(Integration);
  
  const integration = await integrationRepository.findOne({
    where: {
      user: { id: userId },
      app_type: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR,
    },
    relations: ["user"]
  });

  if (!integration) {
    throw new Error('No Google integration found for user');
  }

  // Validate and refresh token if needed
  const validToken = await validateGoogleToken(
    integration.access_token,
    integration.refresh_token,
    integration.expiry_date
  );

  googleOAuth2Client.setCredentials({ access_token: validToken });
  
  return google.gmail({ version: 'v1', auth: googleOAuth2Client });
};

// Send email using Gmail API
const sendGmailEmail = async (userId: string, emailContent: EmailContent) => {
  try {
    const gmail = await getGmailClient(userId);
    
    const email = [
      `To: ${emailContent.to}`,
      `Subject: ${emailContent.subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      emailContent.html
    ].join('\n');

    const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    });

    console.log(`Email sent to ${emailContent.to}`);
    return true;
  } catch (error) {
    console.error('Error sending email via Gmail API:', error);
    throw error;
  }
};

// Generate meeting confirmation email HTML
const generateMeetingConfirmationEmail = (meeting: Meeting, event: Event) => {
  const meetingDate = new Date(meeting.startTime);
  const formattedDate = meetingDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = meetingDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const rescheduleButton = `
    <a href="https://sarvcal.vercel.app/reschedule/${meeting.id}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 20px;">
      Reschedule Meeting
    </a>
  `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Meeting Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4285f4; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .meeting-details { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .button { display: inline-block; background: #4285f4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Meeting Confirmed!</h1>
            </div>
            <div class="content">
                <h2>Hello ${meeting.guestName},</h2>
                <p>Your meeting has been successfully scheduled. Here are the details:</p>
                
                <div class="meeting-details">
                    <h3>${event.title}</h3>
                    <p><strong>Date:</strong> ${formattedDate}</p>
                    <p><strong>Time:</strong> ${formattedTime}</p>
                    <p><strong>Duration:</strong> ${event.duration || 30} minutes</p>
                    <p><strong>Host:</strong> ${event.user.name}</p>
                    ${meeting.additionalInfo ? `<p><strong>Additional Info:</strong> ${meeting.additionalInfo}</p>` : ''}
                </div>
                
                ${meeting.meetLink ? `
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${meeting.meetLink}" class="button">Join Meeting</a>
                </div>
                ` : ''}
                
                <p>We look forward to meeting with you!</p>
                <p>If you need to make any changes, please contact us.</p>
                <p>If you need to reschedule, click the button below:</p>
                ${rescheduleButton}
            </div>
            <div class="footer">
                <p>This meeting was scheduled through SarvCal</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Generate meeting notification email for host
const generateHostNotificationEmail = (meeting: Meeting, event: Event) => {
  const meetingDate = new Date(meeting.startTime);
  const formattedDate = meetingDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = meetingDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const rescheduleButton = `
    <a href="https://sarvcal.vercel.app/reschedule/${meeting.id}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 20px;">
      Reschedule Meeting
    </a>
  `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>New Meeting Scheduled</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #34a853; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .meeting-details { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .button { display: inline-block; background: #34a853; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>New Meeting Scheduled</h1>
            </div>
            <div class="content">
                <h2>Hello ${event.user.name},</h2>
                <p>A new meeting has been scheduled for your event:</p>
                
                <div class="meeting-details">
                    <h3>${event.title}</h3>
                    <p><strong>Guest:</strong> ${meeting.guestName} (${meeting.guestEmail})</p>
                    <p><strong>Date:</strong> ${formattedDate}</p>
                    <p><strong>Time:</strong> ${formattedTime}</p>
                    <p><strong>Duration:</strong> ${event.duration || 30} minutes</p>
                    ${meeting.additionalInfo ? `<p><strong>Additional Info:</strong> ${meeting.additionalInfo}</p>` : ''}
                </div>
                
                ${meeting.meetLink ? `
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${meeting.meetLink}" class="button">Join Meeting</a>
                </div>
                ` : ''}
                
                <p>The meeting has been added to your calendar.</p>
                <p>The guest can reschedule using this link:</p>
                ${rescheduleButton}
            </div>
            <div class="footer">
                <p>This notification was sent by SarvCal</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Send meeting confirmation email to guest
export const sendMeetingConfirmationEmail = async (meeting: Meeting, event: Event) => {
  try {
    const emailContent: EmailContent = {
      to: meeting.guestEmail,
      subject: `Meeting Confirmation: ${event.title}`,
      html: generateMeetingConfirmationEmail(meeting, event),
    };

    await sendGmailEmail(event.user.id, emailContent);
    console.log(`Meeting confirmation email sent to ${meeting.guestEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending meeting confirmation email:', error);
    return false;
  }
};

// Send meeting notification email to host
export const sendHostNotificationEmail = async (meeting: Meeting, event: Event) => {
  try {
    const emailContent: EmailContent = {
      to: event.user.email,
      subject: `New Meeting Scheduled: ${event.title}`,
      html: generateHostNotificationEmail(meeting, event),
    };

    await sendGmailEmail(event.user.id, emailContent);
    console.log(`Host notification email sent to ${event.user.email}`);
    return true;
  } catch (error) {
    console.error('Error sending host notification email:', error);
    return false;
  }
};

// Send meeting cancellation email
export const sendMeetingCancellationEmail = async (meeting: Meeting, event: Event, cancelledBy: 'guest' | 'host') => {
  try {
    const meetingDate = new Date(meeting.startTime);
    const formattedDate = meetingDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = meetingDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    const guestEmailContent: EmailContent = {
      to: meeting.guestEmail,
      subject: `Meeting Cancelled: ${event.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Meeting Cancelled</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #ea4335; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .meeting-details { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
                .footer { text-align: center; margin-top: 20px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Meeting Cancelled</h1>
                </div>
                <div class="content">
                    <h2>Hello ${meeting.guestName},</h2>
                    <p>Your scheduled meeting has been cancelled.</p>
                    
                    <div class="meeting-details">
                        <h3>${event.title}</h3>
                        <p><strong>Date:</strong> ${formattedDate}</p>
                        <p><strong>Time:</strong> ${formattedTime}</p>
                        <p><strong>Host:</strong> ${event.user.name}</p>
                    </div>
                    
                    <p>We apologize for any inconvenience this may cause.</p>
                    <p>If you need to reschedule, please feel free to book a new meeting.</p>
                </div>
                <div class="footer">
                    <p>This notification was sent by SarvCal</p>
                </div>
            </div>
        </body>
        </html>
      `,
    };

    const hostEmailContent: EmailContent = {
      to: event.user.email,
      subject: `Meeting Cancelled: ${event.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Meeting Cancelled</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #ea4335; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .meeting-details { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
                .footer { text-align: center; margin-top: 20px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Meeting Cancelled</h1>
                </div>
                <div class="content">
                    <h2>Hello ${event.user.name},</h2>
                    <p>The following meeting has been cancelled:</p>
                    
                    <div class="meeting-details">
                        <h3>${event.title}</h3>
                        <p><strong>Guest:</strong> ${meeting.guestName} (${meeting.guestEmail})</p>
                        <p><strong>Date:</strong> ${formattedDate}</p>
                        <p><strong>Time:</strong> ${formattedTime}</p>
                    </div>
                    
                    <p>The meeting has been removed from your calendar.</p>
                </div>
                <div class="footer">
                    <p>This notification was sent by SarvCal</p>
                </div>
            </div>
        </body>
        </html>
      `,
    };

    // Send to guest
    await sendGmailEmail(event.user.id, guestEmailContent);
    
    // Send to host (if cancelled by guest)
    if (cancelledBy === 'guest') {
      await sendGmailEmail(event.user.id, hostEmailContent);
    }

    console.log(`Meeting cancellation emails sent`);
    return true;
  } catch (error) {
    console.error('Error sending meeting cancellation email:', error);
    return false;
  }
};
