import { sendEmail } from './service'

interface GiftCardEmailData {
  recipientEmail: string
  recipientName: string
  code: string
  balance: number
  expiresAt: string
  designImage: string
}

/**
 * Send gift card email to recipient
 * Includes card design image, code, balance, and redemption instructions
 */
export async function sendGiftCardEmail(data: GiftCardEmailData) {
  const {
    recipientEmail,
    recipientName,
    code,
    balance,
    expiresAt,
    designImage,
  } = data

  // Format currency
  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Base URL for images
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.wingside.ng'
  const cardImageUrl = `${appUrl}/${designImage}`
  const orderUrl = `${appUrl}/order`

  // Create HTML email
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Wingside Gift Card</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #FDF5E5;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background-color: #F7C400;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #552627;
      font-size: 28px;
      font-weight: bold;
    }
    .content {
      padding: 40px 20px;
    }
    .greeting {
      font-size: 18px;
      color: #552627;
      margin-bottom: 20px;
    }
    .card-image {
      width: 100%;
      max-width: 500px;
      height: auto;
      margin: 20px auto;
      display: block;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .code-container {
      background: linear-gradient(135deg, #F7C400 0%, #FDB913 100%);
      border-radius: 12px;
      padding: 30px 20px;
      text-align: center;
      margin: 30px 0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .code-label {
      font-size: 14px;
      color: #552627;
      font-weight: 600;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .gift-code {
      font-size: 32px;
      font-weight: bold;
      color: #552627;
      letter-spacing: 4px;
      font-family: 'Courier New', monospace;
      margin: 10px 0;
    }
    .balance-info {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 2px solid rgba(85, 38, 39, 0.2);
    }
    .balance-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 10px 0;
      font-size: 16px;
    }
    .balance-label {
      color: #552627;
      font-weight: 600;
    }
    .balance-value {
      color: #552627;
      font-weight: bold;
      font-size: 18px;
    }
    .instructions {
      background-color: #FDF5E5;
      border-radius: 8px;
      padding: 25px;
      margin: 30px 0;
    }
    .instructions h2 {
      color: #552627;
      font-size: 20px;
      margin-top: 0;
      margin-bottom: 15px;
    }
    .instructions ol {
      color: #000000;
      font-size: 15px;
      line-height: 1.8;
      padding-left: 20px;
      margin: 0;
    }
    .instructions li {
      margin-bottom: 10px;
    }
    .cta-button {
      display: inline-block;
      background-color: #F7C400;
      color: #552627;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 16px;
      margin: 20px 0;
      transition: background-color 0.3s;
    }
    .cta-button:hover {
      background-color: #FDB913;
    }
    .expiry-warning {
      background-color: #FFF4E5;
      border-left: 4px solid #F7C400;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .expiry-warning p {
      margin: 0;
      color: #552627;
      font-size: 14px;
    }
    .footer {
      background-color: #552627;
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
      font-size: 13px;
    }
    .footer a {
      color: #F7C400;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .gift-code {
        font-size: 24px;
        letter-spacing: 2px;
      }
      .balance-row {
        flex-direction: column;
        align-items: flex-start;
      }
      .balance-value {
        margin-top: 5px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <h1>🎁 You've Received a Wingside Gift Card!</h1>
    </div>

    <!-- Content -->
    <div class="content">
      <p class="greeting">Hi ${recipientName},</p>

      <p>Great news! Someone special has sent you a Wingside gift card. Get ready to enjoy our delicious wings!</p>

      <!-- Card Design Image -->
      <img src="${cardImageUrl}" alt="Gift Card Design" class="card-image" />

      <!-- Gift Card Code -->
      <div class="code-container">
        <div class="code-label">Your Gift Card Code</div>
        <div class="gift-code">${code}</div>

        <div class="balance-info">
          <div class="balance-row">
            <span class="balance-label">Balance:</span>
            <span class="balance-value">${formatCurrency(balance)}</span>
          </div>
          <div class="balance-row">
            <span class="balance-label">Expires:</span>
            <span class="balance-value">${formatDate(expiresAt)}</span>
          </div>
        </div>
      </div>

      <!-- Redemption Instructions -->
      <div class="instructions">
        <h2>How to Redeem Your Gift Card</h2>
        <ol>
          <li><strong>Visit our order page</strong> and add your favorite wings to your cart</li>
          <li><strong>Proceed to checkout</strong> and look for the "Gift Card" section</li>
          <li><strong>Enter your code</strong> (${code}) and click "Apply"</li>
          <li><strong>Complete your order</strong> and enjoy your wings!</li>
        </ol>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center;">
        <a href="${orderUrl}" class="cta-button">Order Now</a>
      </div>

      <!-- Expiry Warning -->
      <div class="expiry-warning">
        <p><strong>⏰ Important:</strong> This gift card expires on ${formatDate(expiresAt)}. Make sure to use it before then!</p>
      </div>

      <p style="margin-top: 30px; color: #000000;">If you have any questions, feel free to contact us at <a href="mailto:reachus@wingside.ng" style="color: #F7C400;">reachus@wingside.ng</a></p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>Wingside</strong><br>
      The Best Wings in Town</p>
      <p style="margin-top: 15px;">
        <a href="${appUrl}">Visit Website</a> |
        <a href="${appUrl}/order">Order Now</a> |
        <a href="${appUrl}/about">About Us</a>
      </p>
      <p style="margin-top: 15px; font-size: 11px; color: #cccccc;">
        This is an automated email. Please do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
`

  const subject = `🎁 You've Received a ${formatCurrency(balance)} Wingside Gift Card!`

  return sendEmail({
    to: recipientEmail,
    subject,
    html,
  })
}
