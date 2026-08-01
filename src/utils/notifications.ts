/**
 * Monywissen Notification Manager
 * Native Browser / Mobile Notifications & Daily 8:00 AM Payment Reminders
 */

import { DebtItem, ExpenseItem } from '../types';
import { todayStr } from './financialEngine';

export async function requestNotificationPermission(): Promise<boolean> {
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

export function sendLocalNotification(title: string, body: string, icon = '/icon.png') {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon,
        badge: icon,
      });
    } catch (e) {
      console.error('Error enviando notificación local:', e);
    }
  }
}

/**
 * Checks for due payments today or tomorrow and schedules/triggers the 8:00 AM reminder
 */
export function checkAndTriggerDaily8AMReminder(
  expenses: ExpenseItem[],
  debts: DebtItem[],
  notifEnabled = true
) {
  if (!notifEnabled) return;

  const today = new Date();
  const currentHour = today.getHours();
  const todayDateStr = todayStr();
  const dayOfMonth = today.getDate();

  // Check if already reminded today to prevent duplicate popups
  const lastReminderDate = localStorage.getItem('mony_last_8am_reminder');
  if (lastReminderDate === todayDateStr) {
    return;
  }

  // Find due payments for today
  const dueExpensesToday = expenses.filter(e => {
    if (e.freq === 'monthly' && Number(e.day) === dayOfMonth) return true;
    if (e.freq === 'one-time' && e.date === todayDateStr) return true;
    return false;
  });

  const dueDebtsToday = debts.filter(d => {
    if (d.dueDay && Number(d.dueDay) === dayOfMonth) return true;
    return false;
  });

  const totalDueCount = dueExpensesToday.length + dueDebtsToday.length;

  if (totalDueCount > 0) {
    // Save that we triggered today
    localStorage.setItem('mony_last_8am_reminder', todayDateStr);

    const message = `Tienes ${totalDueCount} pago(s) pendiente(s) programados para el día de hoy. ¡Revisa tu agenda de Mony!`;
    
    // If permission granted, send notification
    requestNotificationPermission().then(granted => {
      if (granted) {
        sendLocalNotification('🔔 Recordatorio de Pago Mony (8:00 AM)', message);
      }
    });
  }
}
