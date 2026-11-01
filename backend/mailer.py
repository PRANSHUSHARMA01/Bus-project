"""
Email Notification Service (AWS SES + Console Dev Fallback)
Provides bilingual (English + Hindi) transactional emails for Smart Public Bus Tracking.
"""

import os
import sys

AWS_REGION = os.environ.get("AWS_DEFAULT_REGION", "ap-south-1")
SES_FROM_EMAIL = os.environ.get("SES_FROM_EMAIL", "login@pranshusharma.tech")
DEV_MODE = os.environ.get("DEV_MODE", "true").lower() in ("true", "1", "yes")

def get_ses_client():
    try:
        import boto3
        # Will pick up instance profile credentials automatically on EC2
        return boto3.client("ses", region_name=AWS_REGION)
    except Exception:
        return None

def build_otp_email_html(code: str, language: str = "en") -> str:
    """Builds a responsive, branded, bilingual HTML email for OTP login."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Verification Code - Smart Public Bus Tracking</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px 32px; text-align: left;">
              <span style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                🚌 Smart Public Bus
              </span>
              <span style="display: block; font-size: 13px; color: #94a3b8; margin-top: 4px;">
                Delhi Transit System · Team Qubits
              </span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="font-size: 20px; font-weight: 700; margin: 0 0 12px 0; color: #0f172a;">
                Your Verification Code / आपका सत्यापन कोड
              </h1>
              <p style="font-size: 14px; line-height: 1.5; color: #475569; margin: 0 0 24px 0;">
                Use the 6-digit code below to sign in to Smart Public Bus Tracking.
                <br>
                स्मार्ट पब्लिक बस ट्रैकिंग में साइन इन करने के लिए नीचे दिए गए 6 अंकों के कोड का उपयोग करें।
              </p>

              <!-- OTP Chip -->
              <div style="background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0f172a;">
                  {code}
                </div>
              </div>

              <!-- Safety Warning -->
              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: 600;">
                  ⚠️ Valid for 5 minutes. Never share this code with anyone, including staff.
                </p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #b45309;">
                  यह कोड 5 मिनट के लिए मान्य है। इसे किसी के साथ साझा न करें।
                </p>
              </div>

              <p style="font-size: 12px; color: #64748b; margin: 24px 0 0 0; line-height: 1.5;">
                If you did not request this verification code, please ignore this email.
                <br>
                यदि आपने यह कोड नहीं मांगा है, तो इस ईमेल को अनदेखा करें।
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 11px; color: #94a3b8;">
              Smart Public Bus Tracking · <a href="https://pranshusharma.tech" style="color: #2563eb; text-decoration: none;">pranshusharma.tech</a>
              <br>
              Protected under the Digital Personal Data Protection (DPDP) Act, 2023.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

def send_otp_email(to_email: str, code: str, language: str = "en") -> bool:
    """
    Sends bilingual OTP email using Amazon SES in production,
    or cleanly prints to console in development mode.
    """
    subject = f"{code} is your Smart Public Bus verification code / सत्यापन कोड"
    text_content = (
        f"Smart Public Bus Tracking - Verification Code\n"
        f"----------------------------------------------\n"
        f"Your verification code is: {code}\n"
        f"Valid for 5 minutes. Never share this code with anyone.\n\n"
        f"स्मार्ट पब्लिक बस ट्रैकिंग सत्यापन कोड:\n"
        f"आपका सत्यापन कोड है: {code}\n"
        f"यह कोड 5 मिनट के लिए मान्य है। इसे किसी के साथ साझा न करें।\n\n"
        f"Domain: https://pranshusharma.tech\n"
    )

    ses = get_ses_client()
    if ses and not DEV_MODE:
        try:
            html_content = build_otp_email_html(code, language)
            ses.send_email(
                Source=SES_FROM_EMAIL,
                Destination={"ToAddresses": [to_email]},
                Message={
                    "Subject": {"Data": subject, "Charset": "UTF-8"},
                    "Body": {
                        "Text": {"Data": text_content, "Charset": "UTF-8"},
                        "Html": {"Data": html_content, "Charset": "UTF-8"}
                    }
                }
            )
            print(f"[SES] Successfully dispatched OTP email to {to_email}")
            return True
        except Exception as e:
            print(f"[SES ERROR] Failed to send via SES: {e}. Falling back to console log.")

    # Development Console Logger (Clearly printed with high visibility)
    print("\n" + "=" * 70, flush=True)
    print("[DEV EMAIL SIMULATOR] TRANSACTIONAL OTP DISPATCHED", flush=True)
    print(f"To:      {to_email}", flush=True)
    print(f"Subject: {subject.encode('ascii', errors='ignore').decode()}", flush=True)
    print(f"Code:    >>>>> {code} <<<<<", flush=True)
    print("Expiry:  5 Minutes (Never share this code)", flush=True)
    print("=" * 70 + "\n", flush=True)
    return True
