/**
 * Monywissen Notification Manager
 * Robust Native Android (Capacitor) & Browser System Notifications
 * Targeted Payment Reminders:
 * - Daily notification ONLY if there are pending payments due today or overdue.
 * - Weekly summary notification every Monday summarizing pending payments for the week.
 */

import { UserProfile } from '../types';
import { todayStr, calculateProjections } from './financialEngine';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const REMINDER_NOTIFICATION_ID = 1001;
const TEST_NOTIFICATION_ID = 1002;
const NOTIFICATION_CHANNEL_ID = 'mony_reminders';

/**
 * Initializes notification channel for Android 8.0+ (API 26+)
 */
export async function initNotificationChannels() {
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.createChannel({
        id: NOTIFICATION_CHANNEL_ID,
        name: 'Recordatorios de Pago Mony',
        description: 'Notificaciones inteligentes de vencimientos, deudas y finanzas',
        importance: 5, // High priority (heads up / sound)
        visibility: 1, // Public
        sound: undefined,
        vibration: true,
        lights: true,
        lightColor: '#3b82f6',
      });
    } catch (e) {
      console.warn('Error creating notification channel:', e);
    }
  }
}

/**
 * Request notification permission from Android / iOS / Web
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      await initNotificationChannels();
      const check = await LocalNotifications.checkPermissions();
      if (check.display === 'granted') {
        return true;
      }
      const perm = await LocalNotifications.requestPermissions();
      return perm.display === 'granted';
    } catch (e) {
      console.warn('Error requesting Capacitor notification permission:', e);
      return false;
    }
  }

  // Web Browser fallback
  if (!('Notification' in window)) {
    console.warn('Este navegador no soporta notificaciones de sistema.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Send an immediate local notification (works in native Android or web)
 */
export async function sendLocalNotification(title: string, body: string, icon = '/icon.png') {
  if (Capacitor.isNativePlatform()) {
    try {
      await initNotificationChannels();
      const hasPerm = await requestNotificationPermission();
      if (hasPerm) {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Math.random() * 90000) + 2000,
              title,
              body,
              channelId: NOTIFICATION_CHANNEL_ID,
              schedule: { at: new Date(Date.now() + 500) },
              sound: undefined,
              actionTypeId: '',
              extra: null
            }
          ]
        });
        return;
      }
    } catch (e) {
      console.warn('Capacitor LocalNotifications schedule error:', e);
    }
  }

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon,
        badge: icon,
      });
    } catch (e) {
      console.error('Error enviando notificación de navegador:', e);
    }
  }
}

/**
 * Calculates pending payments for today and for the current week (Monday-Sunday)
 * to build targeted notification content.
 */
export function getNotificationDetails(
  profile?: UserProfile,
  exchangeRates: Record<string, number> = {}
) {
  if (!profile) {
    return { shouldNotify: false, title: '', body: '', isMondaySummary: false, todayCount: 0, weekCount: 0 };
  }

  const todayObj = new Date();
  const todayDateStr = todayStr(); // YYYY-MM-DD
  const isMonday = todayObj.getDay() === 1;

  // Calculate start (Monday) and end (Sunday) of current week
  const dayOfWeek = todayObj.getDay(); // 0 = Sun, 1 = Mon, 2 = Tue...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const mondayObj = new Date(todayObj);
  mondayObj.setDate(todayObj.getDate() + diffToMonday);
  const mondayStr = mondayObj.toISOString().slice(0, 10);

  const sundayObj = new Date(mondayObj);
  sundayObj.setDate(mondayObj.getDate() + 6);
  const sundayStr = sundayObj.toISOString().slice(0, 10);

  // Generate projections for profile
  const plan = calculateProjections(profile, exchangeRates) || [];

  // Filter pending non-income occurrences (expenses, debts, savings)
  const pendingOccurrences = plan.filter(occ => 
    !occ.done && 
    !occ.discarded && 
    (occ.type === 'expense' || occ.type === 'debt' || occ.type === 'saving')
  );

  // 1. Pending due TODAY or OVERDUE
  const todayPending = pendingOccurrences.filter(occ => {
    const occD = occ.targetDate || occ.date;
    return occD <= todayDateStr;
  });

  const todayCount = todayPending.length;
  const todayTotal = todayPending.reduce((sum, o) => sum + Math.abs(o.amt || 0), 0);

  // 2. Pending due THIS WEEK (Monday to Sunday)
  const weekPending = pendingOccurrences.filter(occ => {
    const occD = occ.targetDate || occ.date;
    return occD >= mondayStr && occD <= sundayStr;
  });

  const weekCount = weekPending.length;
  const weekTotal = weekPending.reduce((sum, o) => sum + Math.abs(o.amt || 0), 0);

  const fmtAmt = (val: number) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // IF TODAY IS MONDAY -> Weekly Summary Notification
  if (isMonday) {
    if (weekCount === 0 && todayCount === 0) {
      return { shouldNotify: false, title: '', body: '', isMondaySummary: true, todayCount: 0, weekCount: 0 };
    }

    const title = `📅 Resumen Semanal de Pagos Mony`;
    let body = `Esta semana tienes ${weekCount} pago(s) pendiente(s) por un total de ${fmtAmt(weekTotal)}.`;
    if (todayCount > 0) {
      body += ` (Hoy vencen ${todayCount} pago(s) por ${fmtAmt(todayTotal)}).`;
    }
    body += ` ¡Abre Monywissen para organizar tu semana!`;

    return {
      shouldNotify: true,
      title,
      body,
      isMondaySummary: true,
      todayCount,
      weekCount
    };
  }

  // IF TODAY IS TUESDAY THROUGH SUNDAY -> Only notify IF there are pending payments for today or overdue
  if (todayCount > 0) {
    const title = `🔔 Recordatorio de Pago para Hoy`;
    const body = `Tienes ${todayCount} pago(s) pendiente(s) para hoy por un total de ${fmtAmt(todayTotal)}. ¡Abre Monywissen para gestionarlos!`;

    return {
      shouldNotify: true,
      title,
      body,
      isMondaySummary: false,
      todayCount,
      weekCount
    };
  }

  // No pending payments for today -> DO NOT NOTIFY
  return { shouldNotify: false, title: '', body: '', isMondaySummary: false, todayCount: 0, weekCount };
}

/**
 * Test notification on demand
 */
export async function testNotificationNow(
  profile?: UserProfile,
  exchangeRates: Record<string, number> = {}
): Promise<{ success: boolean; message: string }> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) {
      return {
        success: false,
        message: 'Permiso de notificaciones denegado. Activa los permisos en los ajustes de tu dispositivo.'
      };
    }

    const details = profile ? getNotificationDetails(profile, exchangeRates) : null;
    const title = details && details.shouldNotify ? details.title : '🔔 Monywissen: Prueba de Notificación';
    const body = details && details.shouldNotify 
      ? details.body 
      : '¡Excelente! Las notificaciones de Monywissen están activas. Se te notificará solo cuando tengas pagos pendientes o los lunes con tu resumen semanal.';

    if (Capacitor.isNativePlatform()) {
      await initNotificationChannels();
      await LocalNotifications.schedule({
        notifications: [
          {
            id: TEST_NOTIFICATION_ID,
            title,
            body,
            channelId: NOTIFICATION_CHANNEL_ID,
            schedule: { at: new Date(Date.now() + 1000) },
            sound: undefined,
            actionTypeId: '',
            extra: null
          }
        ]
      });
      return { success: true, message: 'Notificación de prueba enviada a tu dispositivo Android.' };
    }

    sendLocalNotification(title, body);
    return { success: true, message: 'Notificación de prueba enviada.' };
  } catch (error: any) {
    return { success: false, message: 'Error enviando notificación: ' + (error?.message || error) };
  }
}

/**
 * Schedules native Android Alarm for payment reminder at specified time if payments exist
 */
export async function scheduleNativeDailyReminder(
  profile?: UserProfile,
  exchangeRates: Record<string, number> = {},
  notifTimeStr = '08:00',
  notifEnabled = true
) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await initNotificationChannels();
    // Cancel existing scheduled daily reminder
    await LocalNotifications.cancel({
      notifications: [{ id: REMINDER_NOTIFICATION_ID }]
    });

    if (!notifEnabled || !profile) return;

    const granted = await requestNotificationPermission();
    if (!granted) return;

    const details = getNotificationDetails(profile, exchangeRates);
    if (!details.shouldNotify) {
      console.log('⏰ Sin pagos pendientes para notificar hoy/esta semana.');
      return;
    }

    const [hourStr, minStr] = (notifTimeStr || '08:00').split(':');
    const targetHour = parseInt(hourStr || '8', 10);
    const targetMin = parseInt(minStr || '0', 10);

    // Schedule exact notification via Android AlarmManager
    await LocalNotifications.schedule({
      notifications: [
        {
          id: REMINDER_NOTIFICATION_ID,
          title: details.title,
          body: details.body,
          channelId: NOTIFICATION_CHANNEL_ID,
          schedule: {
            on: {
              hour: targetHour,
              minute: targetMin
            },
            allowWhileIdle: true
          },
          sound: undefined,
          actionTypeId: '',
          extra: null
        }
      ]
    });
    console.log(`⏰ Recordatorio nativo de Android programado (${details.title}) para las ${targetHour.toString().padStart(2, '0')}:${targetMin.toString().padStart(2, '0')}`);
  } catch (e) {
    console.warn('Error programando recordatorio nativo en Android:', e);
  }
}

/**
 * Checks for due payments today or weekly summary on Mondays (used during active app session)
 */
export function checkAndTriggerDailyReminder(
  profile?: UserProfile,
  exchangeRates: Record<string, number> = {},
  notifEnabled = true,
  notifTimeStr = '08:00'
) {
  if (!notifEnabled || !profile) return;

  const today = new Date();
  const currentHour = today.getHours();
  const currentMinute = today.getMinutes();
  const todayDateStr = todayStr();

  const [targetHour, targetMin] = (notifTimeStr || '08:00').split(':').map(Number);
  
  // Check if we reached the notification time
  if (currentHour < targetHour || (currentHour === targetHour && currentMinute < targetMin)) {
    return; // Not time yet
  }

  // Check if already reminded today to prevent duplicate popups
  const lastReminderDate = localStorage.getItem('mony_last_daily_reminder');
  if (lastReminderDate === todayDateStr) {
    return;
  }

  const details = getNotificationDetails(profile, exchangeRates);

  if (details.shouldNotify) {
    localStorage.setItem('mony_last_daily_reminder', todayDateStr);
    sendLocalNotification(details.title, details.body);
  }
}
