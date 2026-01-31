// src/lib/sms.ts
import twilio from 'twilio';

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client (lazy initialization)
let twilioClient: twilio.Twilio | null = null;

function getClient(): twilio.Twilio {
  if (!twilioClient) {
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }
    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}

export interface ArbAlert {
  eventName: string;
  sport: string;
  profitPercent: number;
  stake: number;
  bets: Array<{
    outcome: string;
    bookmaker: string;
    odds: number;
    stake: number;
  }>;
  commenceTime: Date;
  isReminder?: boolean;  // True for high-value arbs that are being re-alerted
}

/**
 * Check if SMS is configured
 */
export function isSmsConfigured(): boolean {
  return !!(accountSid && authToken && fromNumber);
}

/**
 * Format phone number to E.164 format
 */
export function formatPhoneNumber(phone: string, defaultCountryCode = '+61'): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If it starts with 0, replace with country code
  if (cleaned.startsWith('0')) {
    cleaned = defaultCountryCode + cleaned.slice(1);
  }
  
  // If it doesn't start with +, add it
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
}

/**
 * Validate phone number format (basic validation)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const e164Regex = /^\+[1-9]\d{6,14}$/;
  return e164Regex.test(formatPhoneNumber(phone));
}

/**
 * Send SMS message
 */
export async function sendSms(to: string, body: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!isSmsConfigured()) {
    console.warn('[SMS] Twilio not configured, skipping SMS');
    return { success: false, error: 'SMS not configured' };
  }

  try {
    const client = getClient();
    const formattedTo = formatPhoneNumber(to);
    
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to: formattedTo,
    });

    console.log(`[SMS] Sent message ${message.sid} to ${formattedTo}`);
    return { success: true, messageId: message.sid };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[SMS] Failed to send:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Format arbitrage alert for SMS
 */
export function formatArbAlertSms(alert: ArbAlert): string {
  const profitFormatted = alert.profitPercent.toFixed(2);
  const timeFormatted = alert.commenceTime.toLocaleString('en-AU', {
    timeZone: 'Australia/Sydney',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  // Add REMINDER tag for high-value arbs being re-alerted
  const alertType = alert.isReminder ? '🔔 ARB REMINDER' : '🚨 ARB ALERT';
  
  let message = `${alertType}: ${profitFormatted}%\n`;
  message += `${alert.sport}\n`;
  message += `${alert.eventName}\n`;
  message += `⏰ ${timeFormatted}\n\n`;
  
  alert.bets.forEach((bet, i) => {
    message += `${i + 1}. ${bet.outcome}\n`;
    message += `   ${bet.bookmaker} @ ${bet.odds.toFixed(2)}\n`;
    message += `   Stake: $${bet.stake.toFixed(2)}\n`;
  });

  message += `\n💰 Guaranteed: $${(alert.stake * alert.profitPercent / 100).toFixed(2)} profit`;
  
  // Add "Still active!" for reminders
  if (alert.isReminder) {
    message += `\n⚡ Still active!`;
  }
  
  return message;
}

/**
 * Send arbitrage alert SMS
 */
export async function sendArbAlert(
  phoneNumber: string,
  alert: ArbAlert
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = formatArbAlertSms(alert);
  return sendSms(phoneNumber, message);
}

/**
 * Send test SMS to verify phone number
 */
export async function sendTestSms(
  phoneNumber: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = '✅ Edge Maxxer: Your phone number has been verified! You will now receive arbitrage alerts when opportunities matching your criteria are found.';
  return sendSms(phoneNumber, message);
}

/**
 * Send multiple arb alerts (batched)
 */
export async function sendMultipleArbAlerts(
  phoneNumber: string,
  alerts: ArbAlert[]
): Promise<{ success: boolean; sentCount: number; error?: string }> {
  if (alerts.length === 0) {
    return { success: true, sentCount: 0 };
  }

  // If only one alert, send full details
  if (alerts.length === 1) {
    const result = await sendArbAlert(phoneNumber, alerts[0]);
    return { success: result.success, sentCount: result.success ? 1 : 0, error: result.error };
  }

  // Multiple alerts - send summary
  const topAlerts = alerts.slice(0, 5); // Max 5 in one SMS
  
  let message = `🚨 ${alerts.length} ARB ALERTS FOUND!\n\n`;
  
  topAlerts.forEach((alert, i) => {
    message += `${i + 1}. ${alert.profitPercent.toFixed(2)}% - ${alert.eventName.substring(0, 30)}\n`;
  });

  if (alerts.length > 5) {
    message += `\n...and ${alerts.length - 5} more!\n`;
  }

  message += '\nOpen Edge Maxxer to view details.';

  const result = await sendSms(phoneNumber, message);
  return { success: result.success, sentCount: result.success ? alerts.length : 0, error: result.error };
}