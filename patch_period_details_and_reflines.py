import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

# 1. Add ReferenceLine to the charts that don't have it (4, 5, 1, and 0).
# We look for `<Tooltip content={<CustomTooltip />} wrapperStyle={{ pointerEvents: 'none' }} />`
# which appears before `<Legend` in all charts, and insert the ReferenceLine if it's not chartMode 3 (which already has it).
# Wait, actually, inserting it before `<Legend` is fine.

# Let's replace the item click handler in periodDetails modal:
# From:
# <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
# To:
# <div key={i} onClick={() => onOpenDetails(item.type, item.ref.id, item.originalDate, item.date)} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors">

content = content.replace(
    '<div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">',
    '<div key={i} onClick={() => onOpenDetails(item.type, item.ref.id, item.originalDate, item.date)} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors">'
)

# Also let's close the periodDetails modal when an item is clicked, so the user can interact with the edit modal without the period details overlay blocking it.
# Wait, the details modal is probably just another modal on top, or we can just close `periodDetails`.
content = content.replace(
    'onClick={() => onOpenDetails(item.type, item.ref.id, item.originalDate, item.date)}',
    'onClick={() => { setPeriodDetails(null); onOpenDetails(item.type, item.ref.id, item.originalDate, item.date); }}'
)

# 2. Add ReferenceLine
# Replace `wrapperStyle={{ cursor: 'pointer' }} />` with `wrapperStyle={{ cursor: 'pointer' }} />\n                  <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" yAxisId="left" />`
# Actually, let's just do a regex replace on the Legend line to append the ReferenceLine if it's not already there.

def insert_reference_line(match):
    full_match = match.group(0)
    # If it's already followed by ReferenceLine, skip
    if "ReferenceLine" in full_match:
        return full_match
    # Otherwise append it
    return full_match + '\n                  <ReferenceLine y={0} stroke="#cbd5e1" dark:stroke="#334155" strokeDasharray="3 3" yAxisId="left" />'

# First, chart modes 4, 5, 1, 0 might have `wrapperStyle={{ cursor: 'pointer' }} />` or `wrapperStyle={{ fontSize: '11px', paddingTop: '4px', cursor: 'pointer' }} />`
# Let's find `<Legend ... />` and add `<ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" yAxisId="left" />` right after it.
# We will just replace all ComposedCharts where there is a Legend.

content = re.sub(r'(<Legend [^>]*?/>)(?!\s*<ReferenceLine)', r'\1\n                  <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" yAxisId="left" />', content)


with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)

