import re

with open('src/components/modals/ItemFormModal.tsx', 'r') as f:
    content = f.read()

search_default = "setDebtType('fixed');"
replace_default = "setDebtType('');"
content = content.replace(search_default, replace_default)

search_select = """                      <select
                        value={debtType}
                        onChange={e => {
                          const selected = e.target.value;"""

replace_select = """                      <select
                        value={debtType}
                        onChange={e => {
                          const selected = e.target.value;"""

# Let's use string replace for the select options
search_options = """                      >
                        <option value="card">💳 Tarjeta de Crédito</option>"""

replace_options = """                      >
                        <option value="" disabled>Seleccione...</option>
                        <option value="card">💳 Tarjeta de Crédito</option>"""

content = content.replace(search_options, replace_options)

with open('src/components/modals/ItemFormModal.tsx', 'w') as f:
    f.write(content)
