import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

# The extra old chart modes start around line 640.
# We need to remove them up to the actual closing of the divs.
pattern = re.compile(r'\) : chartMode === 4 \? \(.*?\{\/\* Upcoming 30-Day Timeline \*\/\}', re.DOTALL)

replacement = """          </div>
        </div>
      </div>
      {/* Upcoming 30-Day Timeline */}"""

content = pattern.sub(replacement, content)

with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
    f.write(content)
