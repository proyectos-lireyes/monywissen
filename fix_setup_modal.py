import re

with open('src/components/dashboard/DashboardView.tsx', 'r') as f:
    content = f.read()

target = """                onClick={() => {
                  updateProfileData(draft => {
                    draft.settings.planStart = tempPlanStart;
                    draft.settings.openingBalance = tempOpeningBalance;
                  });
                  setShowSetupModal(false);
                  showToast('Inicio de plan actualizado correctamente', '✅');
                }}"""

replacement = """                onClick={() => {
                  updateProfileData(draft => {
                    draft.settings.planStart = tempPlanStart;
                    draft.settings.openingBalance = tempOpeningBalance;
                    
                    // Clear past compensations just in case
                    if (draft.overrides) {
                      Object.keys(draft.overrides).forEach(k => {
                        if (k.startsWith('comp_')) {
                          delete draft.overrides[k];
                        }
                      });
                    }
                  });
                  setShowSetupModal(false);
                  showToast('Inicio de plan actualizado correctamente', '✅');
                }}"""

if target in content:
    with open('src/components/dashboard/DashboardView.tsx', 'w') as f:
        f.write(content.replace(target, replacement))
    print("Success Setup")
else:
    print("Target not found in Setup")
