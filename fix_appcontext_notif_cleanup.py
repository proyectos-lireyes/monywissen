import re

with open('src/context/AppContext.tsx', 'r') as f:
    content = f.read()

target = """  // Check 8:00 AM Daily Payment Reminders
  useEffect(() => {
    if (profile) {
      checkAndTriggerDaily8AMReminder(
        profile.expenses || [],
        profile.debts || [],
        profile.settings?.notificationsEnabled !== false
      );
    }
  }, [profile]);"""

content = content.replace(target, "")

with open('src/context/AppContext.tsx', 'w') as f:
    f.write(content)

print("Success")
