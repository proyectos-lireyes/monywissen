import re

with open('src/utils/notifications.ts', 'r') as f:
    content = f.read()

target = """export function checkAndTriggerDaily8AMReminder(
  expenses: ExpenseItem[],
  debts: DebtItem[],
  notifEnabled = true
) {"""

replacement = """export function checkAndTriggerDailyReminder(
  expenses: ExpenseItem[],
  debts: DebtItem[],
  notifEnabled = true,
  notifTimeStr = '08:00'
) {"""
content = content.replace(target, replacement)

target2 = """  const currentHour = today.getHours();
  const todayDateStr = todayStr();
  const dayOfMonth = today.getDate();

  // Check if already reminded today to prevent duplicate popups
  const lastReminderDate = localStorage.getItem('mony_last_8am_reminder');
  if (lastReminderDate === todayDateStr) {
    return;
  }"""

replacement2 = """  const currentHour = today.getHours();
  const currentMinute = today.getMinutes();
  const todayDateStr = todayStr();
  const dayOfMonth = today.getDate();

  const [targetHour, targetMin] = notifTimeStr.split(':').map(Number);
  
  // Check if we reached the notification time
  if (currentHour < targetHour || (currentHour === targetHour && currentMinute < targetMin)) {
    return; // Not time yet
  }

  // Check if already reminded today to prevent duplicate popups
  const lastReminderDate = localStorage.getItem('mony_last_daily_reminder');
  if (lastReminderDate === todayDateStr) {
    return;
  }"""
content = content.replace(target2, replacement2)

target3 = """    // Save that we triggered today
    localStorage.setItem('mony_last_8am_reminder', todayDateStr);
    const message = `Tienes ${totalDueCount} pago(s) pendiente(s) programados para el día de hoy. ¡Revisa tu agenda de Mony!`;
    
    // If permission granted, send notification
    requestNotificationPermission().then(granted => {
      if (granted) {
        sendLocalNotification('🔔 Recordatorio de Pago Mony (8:00 AM)', message);
      }
    });"""

replacement3 = """    // Save that we triggered today
    localStorage.setItem('mony_last_daily_reminder', todayDateStr);
    const message = `Tienes ${totalDueCount} pago(s) pendiente(s) programados para el día de hoy. ¡Revisa tu agenda de Mony!`;
    
    // If permission granted, send notification
    requestNotificationPermission().then(granted => {
      if (granted) {
        sendLocalNotification(`🔔 Recordatorio de Pago Mony (${notifTimeStr})`, message);
      }
    });"""
content = content.replace(target3, replacement3)

with open('src/utils/notifications.ts', 'w') as f:
    f.write(content)

print("Success")
