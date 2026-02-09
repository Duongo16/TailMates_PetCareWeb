import nodemailer from "nodemailer";

/**
 * Email Service - Handles sending OTP emails via Gmail SMTP
 */

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Generate beautiful HTML email template for OTP
 */
function generateOTPEmailHTML(otp: string, fullName?: string): string {
  const greeting = fullName ? `Xin chào ${fullName}` : "Xin chào";
  
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mã xác thực TailMates</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header Content -->
          <tr>
            <td style="padding: 30px 40px 20px; text-align: center; border-bottom: 2px solid #f0f0f0;">
              <h1 style="margin: 0; color: #004aad; font-size: 28px; font-weight: bold;">
                🐾 TailMates
              </h1>
              <p style="margin: 10px 0 0; color: #666666; font-size: 14px;">
                Nền tảng chăm sóc thú cưng toàn diện
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">
                ${greeting}! 👋
              </h2>
              
              <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.6;">
                Bạn đang đăng ký tài khoản TailMates. Vui lòng sử dụng mã OTP bên dưới để xác thực email của bạn:
              </p>
              
              <!-- OTP Box -->
              <div style="background: linear-gradient(135deg, #004aad 0%, #002d6a 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 0 0 30px; box-shadow: 0 4px 12px rgba(0, 74, 173, 0.2);">
                <p style="margin: 0 0 10px; color: rgba(255, 255, 255, 0.8); font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">
                  Mã xác thực của bạn
                </p>
                <div style="font-size: 42px; font-weight: bold; color: #ffffff; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${otp}
                </div>
              </div>
              
              <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 15px 20px; border-radius: 0 8px 8px 0; margin: 0 0 30px;">
                <p style="margin: 0; color: #9a3412; font-size: 14px;">
                  ⚠️ <strong>Lưu ý:</strong> Mã này sẽ hết hạn sau <strong>5 phút</strong>. Không chia sẻ mã này với bất kỳ ai.
                </p>
              </div>
              
              <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Nếu bạn không yêu cầu đăng ký tài khoản, vui lòng bỏ qua email này.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0 0 10px; color: #999999; font-size: 12px;">
                © 2026 TailMates. All rights reserved.
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                Đây là email tự động, vui lòng không trả lời email này.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send OTP email
 */
export async function sendOTPEmail(
  email: string,
  otp: string,
  fullName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("SMTP not configured. OTP:", otp);
      // In development, just log the OTP
      if (process.env.NODE_ENV === "development") {
        console.log(`[DEV] OTP for ${email}: ${otp}`);
        return { success: true };
      }
      return { success: false, error: "Email service not configured" };
    }

    const mailOptions = {
      from: `"TailMates" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `[TailMates] Mã xác thực của bạn: ${otp}`,
      html: generateOTPEmailHTML(otp, fullName),
      text: `Mã xác thực TailMates của bạn là: ${otp}. Mã này sẽ hết hạn sau 5 phút.`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
    
    return { success: true };
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to send email" 
    };
  }
}

/**
 * Verify SMTP connection
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log("SMTP connection verified");
    return true;
  } catch (error) {
    console.error("SMTP verification failed:", error);
    return false;
  }
}
