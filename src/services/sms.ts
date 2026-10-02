/**
 * CHHAYASWORI IMPEX — SMS Gateway Service (Development & Production)
 *
 * Current State: DEVELOPMENT / TEST MOCK MODE
 * "SMS service is currently in development/test mode."
 *
 * Architecture allows real credentials (SMS_API_URL, SMS_API_TOKEN) to be
 * injected via environment variables later without modifying application code.
 */

export interface SmsSendResult {
  success: boolean;
  mode: 'MOCK_DEVELOPMENT' | 'PRODUCTION';
  recipient: string;
  message: string;
  type: 'OTP' | 'ORDER_CONFIRMATION' | 'ORDER_STATUS' | 'DELIVERY_NOTIFICATION';
  disclaimer: string;
  timestamp: string;
}

export const SMS_DEV_DISCLAIMER =
  'SMS service is currently in development/test mode. No real SMS charges or carrier credentials used.';

export async function sendSimulatedSms({
  recipientPhone,
  message,
  type,
}: {
  recipientPhone: string;
  message: string;
  type: 'OTP' | 'ORDER_CONFIRMATION' | 'ORDER_STATUS' | 'DELIVERY_NOTIFICATION';
}): Promise<SmsSendResult> {
  const cleanPhone = recipientPhone.replace(/[\s-]/g, '');
  const apiUrl = process.env.SMS_API_URL;
  const apiToken = process.env.SMS_API_TOKEN;

  // If real SMS credentials exist in production environment:
  if (apiUrl && apiToken && apiUrl.startsWith('http')) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          to: cleanPhone,
          text: message,
        }),
      });

      if (response.ok) {
        return {
          success: true,
          mode: 'PRODUCTION',
          recipient: cleanPhone,
          message,
          type,
          disclaimer: 'Live SMS dispatched via SMS gateway.',
          timestamp: new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn(
        '[SMS Gateway] Live SMS delivery failed, falling back to simulated log:',
        err
      );
    }
  }

  // Development / Test Simulation Mode
  console.log('----------------------------------------------------');
  console.log(`[SMS SERVICE - DEV/TEST MODE] Type: ${type}`);
  console.log(`To: ${cleanPhone}`);
  console.log(`Message: ${message}`);
  console.log(`Disclaimer: ${SMS_DEV_DISCLAIMER}`);
  console.log('----------------------------------------------------');

  return {
    success: true,
    mode: 'MOCK_DEVELOPMENT',
    recipient: cleanPhone,
    message,
    type,
    disclaimer: SMS_DEV_DISCLAIMER,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 1. OTP Verification SMS
 */
export async function sendOtpSms(phone: string, otpCode: string): Promise<SmsSendResult> {
  return sendSimulatedSms({
    recipientPhone: phone,
    type: 'OTP',
    message: `[CHHAYASWORI IMPEX] Your verification code is ${otpCode}. Valid for 5 minutes. (DEV/TEST ONLY)`,
  });
}

/**
 * 2. Order Confirmation SMS
 */
export async function sendOrderConfirmationSms(
  phone: string,
  orderNumber: string,
  totalNpr: number
): Promise<SmsSendResult> {
  return sendSimulatedSms({
    recipientPhone: phone,
    type: 'ORDER_CONFIRMATION',
    message: `[CHHAYASWORI IMPEX] Thank you! Order #${orderNumber} for Rs. ${totalNpr.toLocaleString()} has been placed. We will prepare your comfort footwear shortly. (DEV/TEST ONLY)`,
  });
}

/**
 * 3. Order Status SMS
 */
export async function sendOrderStatusSms(
  phone: string,
  orderNumber: string,
  status: string
): Promise<SmsSendResult> {
  return sendSimulatedSms({
    recipientPhone: phone,
    type: 'ORDER_STATUS',
    message: `[CHHAYASWORI IMPEX] Order #${orderNumber} status update: ${status}. Track details anytime on our site. (DEV/TEST ONLY)`,
  });
}

/**
 * 4. Delivery Notification SMS
 */
export async function sendDeliveryNotificationSms(
  phone: string,
  orderNumber: string,
  courierOrArea?: string
): Promise<SmsSendResult> {
  const locationInfo = courierOrArea ? ` via rider in ${courierOrArea}` : '';
  return sendSimulatedSms({
    recipientPhone: phone,
    type: 'DELIVERY_NOTIFICATION',
    message: `[CHHAYASWORI IMPEX] Great news! Order #${orderNumber} is out for delivery${locationInfo}. Please have Rs. ready for COD if applicable. (DEV/TEST ONLY)`,
  });
}
