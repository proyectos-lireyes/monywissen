import re

with open('src/components/modals/ItemFormModal.tsx', 'r') as f:
    content = f.read()

# Add custom debts map:
search_select = """                        <option value="card">💳 Tarjeta de Crédito</option>
                        <option value="loan_interest">🏦 Préstamo con Interés</option>
                        <option value="loan_no_interest">🤝 Préstamo sin Interés</option>
                      </select>"""

replace_select = """                        <option value="card">💳 Tarjeta de Crédito</option>
                        <option value="loan_interest">🏦 Préstamo con Interés</option>
                        <option value="loan_no_interest">🤝 Préstamo sin Interés</option>
                        {profile.settings.customDebts && profile.settings.customDebts.map(cd => (
                           <option key={cd.id} value={cd.id}>✨ {cd.name}</option>
                        ))}
                      </select>"""

content = content.replace(search_select, replace_select)

with open('src/components/modals/ItemFormModal.tsx', 'w') as f:
    f.write(content)

