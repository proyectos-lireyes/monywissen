import re

with open('src/context/AppContext.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { checkAndTriggerDaily8AMReminder } from '../utils/notifications';", "import { checkAndTriggerDailyReminder } from '../utils/notifications';")

target_notif = """  const rawProfile = (state.profiles && state.profiles[currentProfileName])
    ? state.profiles[currentProfileName]
    : getDefaultSeed().profiles.Personal;"""

replacement_notif = """  const rawProfile = (state.profiles && state.profiles[currentProfileName])
    ? state.profiles[currentProfileName]
    : getDefaultSeed().profiles.Personal;

  useEffect(() => {
    // Check notifications every minute
    const interval = setInterval(() => {
      const notifEnabled = rawProfile.settings.notificationsEnabled !== false;
      checkAndTriggerDailyReminder(
        rawProfile.expenses,
        rawProfile.debts,
        notifEnabled,
        rawProfile.settings.notifTime || '08:00'
      );
    }, 60000);
    return () => clearInterval(interval);
  }, [rawProfile]);"""
content = content.replace(target_notif, replacement_notif)

with open('src/context/AppContext.tsx', 'w') as f:
    f.write(content)

print("Success")
