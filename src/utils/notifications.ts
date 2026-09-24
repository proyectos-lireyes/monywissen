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

export async function sendLocalNotification(title: string, body: string, icon = '/icon.png') {
  if ((window as any).Capacitor && (window as any).Capacitor.isNativePlatform()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display === 'granted') {
        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id: Math.floor(Math.random() * 100000) + 1,
              schedule: { at: new Date(Date.now() + 1000) },
              sound: undefined,
              actionTypeId: '',
              extra: null
            }
          ]
        });
        return;
      }
    } catch (e) {
      console.warn('Capacitor LocalNotifications no disponible o sin permisos:', e);
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
 * Checks for due payments today and overdue payments, scheduling a native system notification
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
  const dueExpensesToday = expenses.filter(e => {
    if ((e as any).isPaid || (e as any).done) return false;
    if (e.freq === 'monthly' && Number(e.day) === dayOfMonth) return true;
    if (e.freq === 'one-time' && e.date === todayDateStr) return true;
    if (e.start === todayDateStr) return true;
    return false;
  });

  const dueDebtsToday = debts.filter(d => {
    if ((d as any).isPaid || (d as any).done) return false;
    if (d.dueDay && Number(d.dueDay) === dayOfMonth) return true;
    if (d.start === todayDateStr) return true;
    return false;
  });

  // Find overdue payments (retrasados)
  const overdueExpenses = expenses.filter(e => {
    if ((e as any).isPaid || (e as any).done) return false;
    if (e.freq === 'one-time' && e.date && e.date < todayDateStr) return true;
    if (e.freq === 'monthly' && Number(e.day) < dayOfMonth) return true;
    if (e.start && e.start < todayDateStr) return true;
    return false;
  });

  const overdueDebts = debts.filter(d => {
    if ((d as any).isPaid || (d as any).done) return false;
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
    
    // If permission granted, send notification
    requestNotificationPermission().then(granted => {
      if (granted) {
        sendLocalNotification(`🔔 Recordatorio de Pago Mony (${notifTimeStr || '08:00'})`, message);
      }
    });
  }
}
