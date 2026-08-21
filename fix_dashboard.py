import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

target = """  const handleAcceptOptimization = async (opt: any) => {
    const overrides = { ...profile.overrides };
    // Usually key is Type_Id_Date in our system
    // But in PlanOccurrence it's built from ref.id and originalDate
    // The override key for debts is usually `debt_${opt.itemId}_${opt.originalDate}`
    // For expenses: `expense_${opt.itemId}_${opt.originalDate}`
    const key = `${opt.itemType}_${opt.itemId}_${opt.originalDate}`;
    
    overrides[key] = {
      ...(overrides[key] || {}),
      actualDate: opt.suggestedDate,
      userPostponed: true,
    };
    
    await updateProfileData({ overrides });
    showToast(`Fecha optimizada al ${opt.suggestedDate}`, 'success');
  };"""

replacement = """  const handleAcceptOptimization = async (opt: any) => {
    const key = `${opt.itemType}_${opt.itemId}_${opt.originalDate}`;
    
    updateProfileData(draft => {
      if (!draft.overrides) draft.overrides = {};
      draft.overrides[key] = {
        ...(draft.overrides[key] || {}),
        actualDate: opt.suggestedDate,
        userPostponed: true,
      };
    });
    
    showToast(`Fecha optimizada al ${opt.suggestedDate}`, 'success');
  };"""

if target in content:
    with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
        f.write(content.replace(target, replacement))
    print("Success Dashboard")
else:
    print("Target not found in Dashboard")
