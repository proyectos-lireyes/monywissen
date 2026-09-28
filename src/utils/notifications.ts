/**
 * Monywissen Notification Manager
 * Robust Native Android (Capacitor) & Browser System Notifications
 * Daily Payment Reminders with Alarm Scheduling & Android Notification Channels
 */

import { DebtItem, ExpenseItem } from '../types';
import { todayStr } from './financialEngine';
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
        description: 'Notificaciones diarias de vencimientos, deudas y finanzas',
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
 * Test notification on demand
 */
export async function testNotificationNow(): Promise<{ success: boolean; message: string }> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) {
      return {
        success: false,
        message: 'Permiso de notificaciones denegado. Activa los permisos en los ajustes de tu dispositivo.'
      };
    }

    if (Capacitor.isNativePlatform()) {
      await initNotificationChannels();
      await LocalNotifications.schedule({
        notifications: [
          {
            id: TEST_NOTIFICATION_ID,
            title: '🔔 Monywissen: Prueba de Notificación',
            body: '¡Excelente! Las notificaciones de Monywissen están funcionando correctamente en tu teléfono Android.',
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

    sendLocalNotification(
      '🔔 Monywissen: Prueba de Notificación',
      '¡Excelente! Las notificaciones de Monywissen están activas.'
    );
    return { success: true, message: 'Notificación de prueba enviada.' };
  } catch (error: any) {
    return { success: false, message: 'Error enviando notificación: ' + (error?.message || error) };
  }
}

/**
 * Schedules native Android Alarm for daily recurring payment reminder at the specified time
 */
export async function scheduleNativeDailyReminder(
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

    if (!notifEnabled) return;

    const granted = await requestNotificationPermission();
    if (!granted) return;

    const [hourStr, minStr] = (notifTimeStr || '08:00').split(':');
    const targetHour = parseInt(hourStr || '8', 10);
    const targetMin = parseInt(minStr || '0', 10);

    // Schedule exact daily recurring notification via Android AlarmManager
    await LocalNotifications.schedule({
      notifications: [
        {
          id: REMINDER_NOTIFICATION_ID,
          title: `🔔 Recordatorio Financiero Monywissen`,
          body: `¡Hora de revisar tus pagos y movimientos del día! Abre Monywissen para mantener tus cuentas al día.`,
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
    console.log(`⏰ Recordatorio diario nativo de Android programado para las ${targetHour.toString().padStart(2, '0')}:${targetMin.toString().padStart(2, '0')}`);
  } catch (e) {
    console.warn('Error programando recordatorio nativo en Android:', e);
  }
}

/**
 * Checks for due payments today and overdue payments (used during active app session)
 */
export function checkAndTriggerDailyReminder(
  expenses: ExpenseItem[],
  debts: DebtItem[],
  notifEnabled = true,
  notifTimeStr = '08:00'
) {
  if (!notifEnabled) return;

  const today = new Date();
  const currentHour = today.getHours();
  const currentMinute = today.getMinutes();
  const todayDateStr = todayStr();
  const dayOfMonth = today.getDate();

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

  // Find due payments for today
  const dueExpensesToday = (expenses || []).filter(e => {
    if ((e as any).done) return false;
    if (e.freq === 'monthly' && Number(e.day) === dayOfMonth) return true;
    if (e.freq === 'one-time' && e.date === todayDateStr) return true;
    if (e.start === todayDateStr) return true;
    return false;
  });

  const dueDebtsToday = (debts || []).filter(d => {
    if ((d as any).done) return false;
    if (d.dueDay && Number(d.dueDay) === dayOfMonth) return true;
    if (d.start === todayDateStr) return true;
    return false;
  });

  // Find overdue payments (retrasados)
  const overdueExpenses = (expenses || []).filter(e => {
    if ((e as any).done) return false;
    if (e.freq === 'one-time' && e.date && e.date < todayDateStr) return true;
    if (e.freq === 'monthly' && Number(e.day) < dayOfMonth) return true;
    if (e.start && e.start < todayDateStr) return true;
    return false;
  });

  const overdueDebts = (debts || []).filter(d => {
    if ((d as any).done) return false;
    if (d.dueDay && Number(d.dueDay) < dayOfMonth) return true;
    if (d.start && d.start < todayDateStr) return true;
    return false;
  });

  const totalToday = dueExpensesToday.length + dueDebtsToday.length;
  const totalOverdue = overdueExpenses.length + overdueDebts.length;

  if (totalToday > 0 || totalOverdue > 0) {
    // Save that we triggered today
    localStorage.setItem('mony_last_daily_reminder', todayDateStr);

    const parts: string[] = [];
    if (totalOverdue > 0) parts.push(`⚠️ ${totalOverdue} pago(s) atrasado(s)`);
    if (totalToday > 0) parts.push(`📅 ${totalToday} pago(s) pendiente(s) para hoy`);

    const message = parts.join(' y ') + '. ¡Abre Monywissen para gestionarlos!';
    
    sendLocalNotification(`🔔 Recordatorio de Pago Mony (${notifTimeStr || '08:00'})`, message);
  }
}
