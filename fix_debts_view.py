import re

with open('src/components/debts/DebtsView.tsx', 'r') as f:
    content = f.read()

# Update customDebtForm initial state
form_state_target = "const [customDebtForm, setCustomDebtForm] = useState({ name: '', freq: 'monthly', hasInterest: false, usePlan: false, color: '#9c27b0', dueDay: '1' });"
form_state_replacement = "const [customDebtForm, setCustomDebtForm] = useState({ name: '', freq: 'monthly', hasInterest: false, usePlan: false, color: '#9c27b0', dueDay: '1', cutDay: '5', creditLimit: '', isCreditCard: false });"
content = content.replace(form_state_target, form_state_replacement)

# Update handleAddCustomDebt
add_target = """  const handleAddCustomDebt = () => {
    setEditingCustomDebt(null);
    setCustomDebtForm({ name: '', freq: 'monthly', hasInterest: false, usePlan: false, color: '#9c27b0', dueDay: '1' });
    setShowCustomDebtModal(true);
  };"""
add_replacement = """  const handleAddCustomDebt = () => {
    setEditingCustomDebt(null);
    setCustomDebtForm({ name: '', freq: 'monthly', hasInterest: false, usePlan: false, color: '#9c27b0', dueDay: '1', cutDay: '5', creditLimit: '', isCreditCard: false });
    setShowCustomDebtModal(true);
  };"""
content = content.replace(add_target, add_replacement)

# Update handleEditCustomDebt
edit_target = """  const handleEditCustomDebt = (id: string, cd: any) => {
    setEditingCustomDebt(id);
    setCustomDebtForm({
      name: cd.name,
      freq: cd.freq,
      hasInterest: cd.hasInterest,
      usePlan: cd.usePlan,
      color: cd.color || '#9c27b0',
      dueDay: cd.dueDay || '1'
    });
    setShowCustomDebtModal(true);
  };"""
edit_replacement = """  const handleEditCustomDebt = (id: string, cd: any) => {
    setEditingCustomDebt(id);
    setCustomDebtForm({
      name: cd.name,
      freq: cd.freq,
      hasInterest: cd.hasInterest,
      usePlan: cd.usePlan,
      color: cd.color || '#9c27b0',
      dueDay: cd.dueDay || '1',
      cutDay: cd.cutDay ? String(cd.cutDay) : '5',
      creditLimit: cd.creditLimit ? String(cd.creditLimit) : '',
      isCreditCard: id.startsWith('tdc_') || cd.isCreditCard || false
    });
    setShowCustomDebtModal(true);
  };"""
content = content.replace(edit_target, edit_replacement)

# Update handleSaveCustomDebt to generate correct ID and save new properties
save_target = """      } else {
        draft.settings.customDebts.push({
          id: `custom_${Date.now()}`,
          ...customDebtForm
        });
      }"""
save_replacement = """      } else {
        draft.settings.customDebts.push({
          id: customDebtForm.isCreditCard ? `tdc_${Date.now()}` : `custom_${Date.now()}`,
          ...customDebtForm
        });
      }"""
content = content.replace(save_target, save_replacement)

with open('src/components/debts/DebtsView.tsx', 'w') as f:
    f.write(content)

print("Success")
