const fs = require('fs');
let content = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

const effectCode = `
  useEffect(() => {
    if (type === 'debt' && expectedCuotas.length > 0) {
      const activePlanKeys = new Set(expectedCuotas.map(c => c.key));
      const orphanedPayments = debtPaymentHistory.filter(h => !activePlanKeys.has(h.key));
      if (orphanedPayments.length > 0) {
        updateProfileData(draft => {
          if (draft.overrides) {
            let changed = false;
            orphanedPayments.forEach(op => {
              if (draft.overrides[op.key]) {
                 delete draft.overrides[op.key];
                 changed = true;
              }
            });
            // Let immer handle the mutation
          }
        });
      }
    }
  }, [type, expectedCuotas, debtPaymentHistory, updateProfileData]);
`;

// Insert the effect after debtPaymentHistory
content = content.replace(
  /const handleDeleteDebtPayment = \(rec: any\) => \{/g,
  effectCode + '\n  const handleDeleteDebtPayment = (rec: any) => {'
);

// Remove the UI part
const uiRegex = /\{type === 'debt' && \(\(\) => \{[\s\S]*?\}\)\(\)\}/;
content = content.replace(uiRegex, '');

fs.writeFileSync('src/components/modals/ItemFormModal.tsx', content);
