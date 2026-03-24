/**
 * SMS送信ユーティリティ
 * 予約確認・リマインド・多言語対応
 */

import twilio from 'twilio';
import type { Twilio } from 'twilio';

let _client: Twilio | null = null;

function getTwilioClient(): Twilio | null {
  if (!_client) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) {
      console.warn('Twilio not configured (TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN missing), SMS disabled');
      return null;
    }
    _client = twilio(sid, token);
  }
  return _client;
}

const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';
const STORE_NAME = '和食処さくら';  // TODO: DB連携後は動的取得

interface ReservationSmsData {
  callerName: string;
  callerNumber: string;
  summary: string;
  keyDetails: string;
  category: string;
  language?: string;
}

/**
 * お客様にSMS送信（予約確認）
 */
export async function sendCustomerSms(to: string, data: ReservationSmsData): Promise<boolean> {
  const client = getTwilioClient();
  if (!client || !FROM_NUMBER) {
    console.warn('Twilio not configured, skipping SMS to customer');
    return false;
  }
  try {
    const lang = data.language || 'ja';
    let message: string;

    if (lang === 'en') {
      message = [
        `[${STORE_NAME}] Thank you for your reservation.`,
        '',
        data.keyDetails,
        '',
        `To change or cancel, please call us.`,
        `TEL: ${FROM_NUMBER}`,
      ].join('\n');
    } else if (lang === 'zh') {
      message = [
        `【${STORE_NAME}】感谢您的预约。`,
        '',
        data.keyDetails,
        '',
        `如需更改或取消，请致电我们。`,
        `TEL: ${FROM_NUMBER}`,
      ].join('\n');
    } else {
      message = [
        `【${STORE_NAME}】ご予約ありがとうございます。`,
        '',
        data.keyDetails,
        '',
        `ご変更・キャンセルはお電話にてお願いいたします。`,
        `TEL: ${FROM_NUMBER}`,
      ].join('\n');
    }

    const result = await client.messages.create({
      body: message,
      from: FROM_NUMBER,
      to,
    });

    console.log(`SMS sent to customer ${to}: ${result.sid} (status: ${result.status})`);
    return true;
  } catch (e: any) {
    console.error(`SMS to customer failed: ${e.message}`);
    return false;
  }
}

/**
 * 店舗オーナーにSMS送信（新規予約通知）
 */
export async function sendOwnerSms(to: string, data: ReservationSmsData): Promise<boolean> {
  const client = getTwilioClient();
  if (!client || !FROM_NUMBER) {
    console.warn('Twilio not configured, skipping SMS to owner');
    return false;
  }
  try {
    const message = [
      `【新規予約通知】`,
      `${data.callerName}様`,
      `TEL: ${data.callerNumber}`,
      '',
      data.keyDetails,
      '',
      `要約: ${data.summary}`,
    ].join('\n');

    const result = await client.messages.create({
      body: message,
      from: FROM_NUMBER,
      to,
    });

    console.log(`SMS sent to owner ${to}: ${result.sid} (status: ${result.status})`);
    return true;
  } catch (e: any) {
    console.error(`SMS to owner failed: ${e.message}`);
    return false;
  }
}

/**
 * リマインドSMS送信（前日）
 */
export async function sendReminderDayBefore(
  to: string,
  customerName: string,
  date: string,
  time: string,
  partySize: number,
  language: string = 'ja',
): Promise<boolean> {
  const client = getTwilioClient();
  if (!client || !FROM_NUMBER) {
    console.warn('Twilio not configured, skipping reminder SMS');
    return false;
  }
  try {
    let message: string;

    if (language === 'en') {
      message = [
        `[${STORE_NAME}] Reservation Reminder`,
        '',
        `Dear ${customerName},`,
        `This is a reminder for your reservation tomorrow.`,
        '',
        `Date: ${date}`,
        `Time: ${time}`,
        `Party size: ${partySize}`,
        '',
        `We look forward to seeing you!`,
        `To change or cancel: ${FROM_NUMBER}`,
      ].join('\n');
    } else if (language === 'zh') {
      message = [
        `【${STORE_NAME}】预约提醒`,
        '',
        `${customerName}您好，`,
        `提醒您明天的预约。`,
        '',
        `日期: ${date}`,
        `时间: ${time}`,
        `人数: ${partySize}位`,
        '',
        `期待您的光临！`,
        `变更/取消请致电: ${FROM_NUMBER}`,
      ].join('\n');
    } else {
      message = [
        `【${STORE_NAME}】ご予約リマインド`,
        '',
        `${customerName}様、明日のご予約のお知らせです。`,
        '',
        `日時: ${date} ${time}`,
        `人数: ${partySize}名様`,
        '',
        `ご来店お待ちしております。`,
        `ご変更・キャンセル: ${FROM_NUMBER}`,
      ].join('\n');
    }

    const result = await client.messages.create({
      body: message,
      from: FROM_NUMBER,
      to,
    });

    console.log(`Reminder SMS sent to ${to}: ${result.sid}`);
    return true;
  } catch (e: any) {
    console.error(`Reminder SMS failed: ${e.message}`);
    return false;
  }
}

/**
 * リマインドSMS送信（当日確認）
 */
export async function sendReminderSameDay(
  to: string,
  customerName: string,
  time: string,
  language: string = 'ja',
): Promise<boolean> {
  const client = getTwilioClient();
  if (!client || !FROM_NUMBER) {
    console.warn('Twilio not configured, skipping same-day reminder SMS');
    return false;
  }
  try {
    let message: string;

    if (language === 'en') {
      message = [
        `[${STORE_NAME}] Today's Reservation`,
        '',
        `Dear ${customerName},`,
        `Just a reminder about your reservation today at ${time}.`,
        '',
        `See you soon!`,
        `If plans change: ${FROM_NUMBER}`,
      ].join('\n');
    } else if (language === 'zh') {
      message = [
        `【${STORE_NAME}】今日预约确认`,
        '',
        `${customerName}您好，`,
        `提醒您今天${time}的预约。`,
        '',
        `期待您的到来！`,
        `如有变动请致电: ${FROM_NUMBER}`,
      ].join('\n');
    } else {
      message = [
        `【${STORE_NAME}】本日のご予約確認`,
        '',
        `${customerName}様、本日${time}のご予約を承っております。`,
        '',
        `ご来店お待ちしております。`,
        `ご変更: ${FROM_NUMBER}`,
      ].join('\n');
    }

    const result = await client.messages.create({
      body: message,
      from: FROM_NUMBER,
      to,
    });

    console.log(`Same-day reminder sent to ${to}: ${result.sid}`);
    return true;
  } catch (e: any) {
    console.error(`Same-day reminder failed: ${e.message}`);
    return false;
  }
}
