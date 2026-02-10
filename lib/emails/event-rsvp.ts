import { sendEmail } from './service';

interface EventRSVPEmailData {
  recipientEmail: string;
  recipientName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  attending: 'yes' | 'maybe' | 'no';
  calendarLink?: string;
}

export async function sendEventRSVPConfirmation(data: EventRSVPEmailData) {
  const {
    recipientEmail,
    recipientName,
    eventTitle,
    eventDate,
    eventTime,
    eventLocation,
    attending,
    calendarLink,
  } = data;

  // Format attendance status
  const attendanceText = {
    yes: "We're excited to see you there!",
    maybe: "We hope you can make it!",
    no: "We'll miss you! Hope to see you at future events.",
  }[attending];

  const attendanceColor = {
    yes: '#16A34A', // Green
    maybe: '#F59E0B', // Amber
    no: '#EF4444', // Red
  }[attending];

  const attendanceLabel = {
    yes: 'Yes, I will attend',
    maybe: 'Maybe',
    no: "Can't attend",
  }[attending];

  // Format date nicely
  const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event RSVP Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f7f7f7;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f7f7f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #552627 0%, #8B4446 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #F7C400; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                RSVP Confirmed!
              </h1>
              <p style="margin: 10px 0 0 0; color: #FDF5E5; font-size: 14px;">
                Thank you for your response
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 30px 20px 30px;">
              <p style="margin: 0; font-size: 16px; color: #333333; line-height: 1.5;">
                Hi <strong>${recipientName}</strong>,
              </p>
              <p style="margin: 15px 0 0 0; font-size: 16px; color: #333333; line-height: 1.5;">
                Your RSVP for <strong>${eventTitle}</strong> has been confirmed.
              </p>
            </td>
          </tr>

          <!-- Attendance Status Badge -->
          <tr>
            <td style="padding: 0 30px;">
              <div style="background-color: ${attendanceColor}; color: white; padding: 15px 20px; border-radius: 8px; text-align: center; font-weight: 600; font-size: 16px;">
                ${attendanceLabel}
              </div>
              <p style="margin: 15px 0 0 0; font-size: 15px; color: #555555; text-align: center; line-height: 1.5;">
                ${attendanceText}
              </p>
            </td>
          </tr>

          <!-- Event Details Card -->
          <tr>
            <td style="padding: 30px 30px 20px 30px;">
              <div style="background-color: #FDF5E5; border-left: 4px solid #F7C400; padding: 20px; border-radius: 8px;">
                <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #552627; font-weight: 700;">
                  📅 Event Details
                </h2>

                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #666666; font-weight: 600; width: 100px;">Event:</td>
                    <td style="padding: 8px 0; font-size: 14px; color: #333333;">${eventTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #666666; font-weight: 600;">Date:</td>
                    <td style="padding: 8px 0; font-size: 14px; color: #333333;">${formattedDate}</td>
                  </tr>
                  ${eventTime ? `
                  <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #666666; font-weight: 600;">Time:</td>
                    <td style="padding: 8px 0; font-size: 14px; color: #333333;">${eventTime}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #666666; font-weight: 600;">Location:</td>
                    <td style="padding: 8px 0; font-size: 14px; color: #333333;">${eventLocation}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          ${attending === 'yes' && calendarLink ? `
          <!-- Add to Calendar Button (only for "Yes" responses) -->
          <tr>
            <td style="padding: 20px 30px 30px 30px; text-align: center;">
              <a href="${calendarLink}" target="_blank" style="display: inline-block; background-color: #F7C400; color: #552627; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 16px; transition: background-color 0.3s;">
                📅 Add to Calendar
              </a>
              <p style="margin: 12px 0 0 0; font-size: 13px; color: #888888;">
                Don't forget to mark your calendar!
              </p>
            </td>
          </tr>
          ` : ''}

          <!-- Footer Message -->
          <tr>
            <td style="padding: 20px 30px 30px 30px;">
              <p style="margin: 0; font-size: 14px; color: #555555; line-height: 1.6;">
                We're looking forward to making this event special! If you have any questions, feel free to reach out to us.
              </p>
            </td>
          </tr>

          <!-- Social Links & Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 15px 0; font-size: 14px; color: #888888;">
                Stay connected with Wingside
              </p>
              <div style="margin-bottom: 20px;">
                <a href="https://instagram.com/wingside.ng" target="_blank" style="display: inline-block; margin: 0 8px; color: #552627; text-decoration: none;">Instagram</a>
                <span style="color: #cccccc;">|</span>
                <a href="https://twitter.com/wingside_ng" target="_blank" style="display: inline-block; margin: 0 8px; color: #552627; text-decoration: none;">Twitter</a>
                <span style="color: #cccccc;">|</span>
                <a href="https://facebook.com/wingside.ng" target="_blank" style="display: inline-block; margin: 0 8px; color: #552627; text-decoration: none;">Facebook</a>
              </div>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                © ${new Date().getFullYear()} Wingside Foods Limited. All rights reserved.
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #999999;">
                <a href="https://www.wingside.ng" style="color: #F7C400; text-decoration: none;">Visit our website</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const result = await sendEmail({
      to: recipientEmail,
      subject: `RSVP Confirmed: ${eventTitle}`,
      html: htmlContent,
    });

    if (result.success) {
      console.log(`✅ Event RSVP confirmation sent to ${recipientEmail}`);
      return { success: true };
    } else {
      console.error(`❌ Failed to send RSVP confirmation:`, result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Error sending RSVP confirmation email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
