import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

# Add activeDot onClick to every Line
target = 'dot={true}'
replacement = "dot={true} activeDot={{ onClick: (e: any, payload: any) => { e.stopPropagation(); setPeriodDetails(payload.payload); }, cursor: 'pointer' }}"
content = content.replace(target, replacement)

# For the false dot lines (daily flow lines), we still want the ComposedChart onClick to work, but let's make sure the tooltip tells them "Click anywhere in this column to see details"
# Also, I will remove the onClick from ComposedChart and rely entirely on activeDot, OR keep ComposedChart onClick but ensure it doesn't fire if they are just dragging.
# Actually, ComposedChart onClick is fine, but maybe they don't realize they can click anywhere in the column.

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)

print("Success")
