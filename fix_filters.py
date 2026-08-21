import re

with open('src/components/calendar/CalendarView.tsx', 'r') as f:
    content = f.read()

# Replace the status checks
old_status_checks = """
    const isOverdue = !e.done && e.originalDate < today;
    const isPostponed = !e.done && (e.userPostponed || e.isDelayed || e.originalDate !== e.date);
    const isPending = !e.done && !isOverdue && !isPostponed;
    const isDone = e.done;

    if (!activeStateFilters.includes('show_done') && isDone) return false;

    const hasOtherFilters = activeStateFilters.some(f => f !== 'show_done');
    if (hasOtherFilters) {
      let show = false;
      if (activeStateFilters.includes('overdue') && isOverdue) show = true;
      if (activeStateFilters.includes('postponed') && isPostponed) show = true;
      if (activeStateFilters.includes('pending') && isPending) show = true;
      if (!show) return false;
    }
"""

new_status_checks = """
    const isOverdue = !e.done && e.originalDate < today;
    const isPostponed = !e.done && (e.userPostponed || (e.isDelayed && !e.insufficientFunds) || (e.originalDate && e.originalDate < e.date && !e.insufficientFunds));
    const isPulledEarly = !e.done && e.pulledEarly;
    const isDeficit = !e.done && e.insufficientFunds && e.amt < 0;
    const isPending = !e.done && !isOverdue && !isPostponed && !isPulledEarly && !isDeficit;
    const isDone = e.done;

    if (!activeStateFilters.includes('show_done') && isDone) return false;

    const hasOtherFilters = activeStateFilters.some(f => f !== 'show_done');
    if (hasOtherFilters) {
      let show = false;
      if (activeStateFilters.includes('overdue') && isOverdue) show = true;
      if (activeStateFilters.includes('postponed') && isPostponed) show = true;
      if (activeStateFilters.includes('pulledEarly') && isPulledEarly) show = true;
      if (activeStateFilters.includes('deficit') && isDeficit) show = true;
      if (activeStateFilters.includes('pending') && isPending) show = true;
      if (!show) return false;
    }
"""

content = content.replace(old_status_checks.strip(), new_status_checks.strip())

# Replace the filter chips in list view
old_chips = """
          {[
            { id: 'pending', label: '🔴 Pendientes' },
            { id: 'overdue', label: '⚠️ Atrasados' },
            { id: 'postponed', label: '🔄 Pospuestos' },
            { id: 'show_done', label: '👁️ Mostrar Listos' },
          ].map(f => {
"""

new_chips = """
          {[
            { id: 'pending', label: '🔴 Pendientes' },
            { id: 'overdue', label: '⚠️ Atrasados' },
            { id: 'postponed', label: '🔄 Pospuestos' },
            { id: 'pulledEarly', label: '⚡ Adelantados' },
            { id: 'deficit', label: '🚨 Quiebre' },
            { id: 'show_done', label: '👁️ Mostrar Listos' },
          ].map(f => {
"""

content = content.replace(old_chips.strip(), new_chips.strip())

with open('src/components/calendar/CalendarView.tsx', 'w') as f:
    f.write(content)
