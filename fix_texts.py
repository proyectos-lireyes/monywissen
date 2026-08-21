import re

with open('src/components/calendar/CalendarView.tsx', 'r') as f:
    cal_content = f.read()

target_cal = """                          <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400 leading-tight mb-1">
                            ⚠️ Saldo insuficiente para este pago.
                          </p>"""

replacement_cal = """                          <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400 leading-tight mb-1">
                            {e.balance < 0 ? '⚠️ Saldo insuficiente para este pago.' : '⚠️ Este pago rompe tu colchón de seguridad.'}
                          </p>"""

if target_cal in cal_content:
    with open('src/components/calendar/CalendarView.tsx', 'w') as f:
        f.write(cal_content.replace(target_cal, replacement_cal))
    print("Success Calendar")
else:
    print("Target not found in Calendar")

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    dash_content = f.read()

target_dash = """              <p className="text-sm font-semibold text-rose-900 dark:text-rose-100">
                El pago "{criticalAlert.reason}" genera un saldo negativo el {formatDateStr(criticalAlert.date)}.
              </p>"""

replacement_dash = """              <p className="text-sm font-semibold text-rose-900 dark:text-rose-100">
                El pago "{criticalAlert.reason}" {(profile.settings.minBalance || 0) > 0 ? 'rompe tu colchón de seguridad' : 'genera un saldo negativo'} el {formatDateStr(criticalAlert.date)}.
              </p>"""

if target_dash in dash_content:
    with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
        f.write(dash_content.replace(target_dash, replacement_dash))
    print("Success Dashboard")
else:
    print("Target not found in Dashboard")
