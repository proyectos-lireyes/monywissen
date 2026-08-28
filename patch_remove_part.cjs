const fs = require('fs');
let code = fs.readFileSync('src/components/shared/MonySharedView.tsx', 'utf8');

code = code.replace(
  /if \(!confirm\(\`¿Eliminar a \$\{participantName\} del grupo\?\`\)\) return;[\s\S]*?showToast\(\`"\$\{participantName\}" eliminado del grupo\`, '🗑️'\);/g,
  `if (!confirm(\`¿Eliminar a \${participantName} del grupo? Se borrarán también los gastos que haya registrado.\`)) return;
    
    updateProfileData(draft => {
      if (draft.sharedAccounts && draft.sharedAccounts[groupIdx]) {
        const group = draft.sharedAccounts[groupIdx];
        group.participants = group.participants.filter((p: string) => p !== participantName);
        if (group.expenses) {
          group.expenses = group.expenses.filter((e: any) => e.paidBy !== participantName);
        }
        if (group.participantStatus && group.participantStatus[participantName]) {
          delete group.participantStatus[participantName];
        }
      }
    });
    showToast(\`"\${participantName}" eliminado del grupo\`, '🗑️');`
);

fs.writeFileSync('src/components/shared/MonySharedView.tsx', code);
console.log("Patched handleRemoveParticipantFromGroup");
