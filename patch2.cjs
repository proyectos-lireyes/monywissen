const fs = require('fs');
let code = fs.readFileSync('src/components/shared/MonySharedView.tsx', 'utf8');

// 1. Inject States
code = code.replace(
  "const [groupExpensePaidBy, setGroupExpensePaidBy] = useState('');",
  "const [groupExpensePaidBy, setGroupExpensePaidBy] = useState('');\n  \n  const [genericConfirm, setGenericConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);\n  const [genericPrompt, setGenericPrompt] = useState<{ title: string; defaultValue?: string; placeholder?: string; onConfirm: (val: string) => void } | null>(null);\n  const [promptInputValue, setPromptInputValue] = useState('');"
);

// 2. Replace handleAddParticipantToGroup
code = code.replace(
  /const handleAddParticipantToGroup = \(groupIdx: number\) => {[\s\S]*?showToast\(\`"\$\{trimmed\}" agregado al grupo\`, '👤'\);\n  };/,
  `const handleAddParticipantToGroup = (groupIdx: number) => {
    setGenericPrompt({
      title: 'Nombre o Correo de la persona a agregar a este grupo:',
      placeholder: 'Ej. Juan, maria@email.com',
      onConfirm: (name) => {
        if (!name || !name.trim()) return;
        const trimmed = name.trim();
        updateProfileData(draft => {
          if (draft.sharedAccounts && draft.sharedAccounts[groupIdx]) {
            if (!draft.sharedAccounts[groupIdx].participants.includes(trimmed)) {
              draft.sharedAccounts[groupIdx].participants.push(trimmed);
            }
          }
        });
        showToast(\`"\${trimmed}" agregado al grupo\`, '👤');
      }
    });
  };`
);

// 3. Replace handleEditParticipantInGroup
code = code.replace(
  /const handleEditParticipantInGroup = \(groupIdx: number, oldName: string\) => {[\s\S]*?showToast\(\`Nombre actualizado a "\$\{trimmed\}"\`, '✏️'\);\n  };/,
  `const handleEditParticipantInGroup = (groupIdx: number, oldName: string) => {
    setGenericPrompt({
      title: 'Editar nombre del integrante:',
      defaultValue: oldName,
      onConfirm: (newName) => {
        if (!newName || !newName.trim() || newName.trim() === oldName) return;
        const trimmed = newName.trim();
        updateProfileData(draft => {
          if (draft.sharedAccounts && draft.sharedAccounts[groupIdx]) {
            const group = draft.sharedAccounts[groupIdx];
            const pIndex = group.participants.indexOf(oldName);
            if (pIndex !== -1) {
              group.participants[pIndex] = trimmed;
              if (group.participantStatus && group.participantStatus[oldName]) {
                group.participantStatus[trimmed] = group.participantStatus[oldName];
                delete group.participantStatus[oldName];
              }
              if (group.expenses) {
                group.expenses.forEach((e: any) => {
                  if (e.paidBy === oldName) e.paidBy = trimmed;
                });
              }
            }
          }
        });
        showToast(\`Nombre actualizado a "\${trimmed}"\`, '✏️');
      }
    });
  };`
);

// 4. Replace handleDeleteGroup
code = code.replace(
  /const handleDeleteGroup = \(groupIdx: number\) => {[\s\S]*?showToast\('Grupo eliminado exitosamente', '🗑️'\);\n  };/,
  `const handleDeleteGroup = (groupIdx: number) => {
    setGenericConfirm({
      message: '¿Estás seguro de que deseas eliminar este grupo? Toda la información de gastos se perderá para todos los integrantes.',
      onConfirm: () => {
        updateProfileData(draft => {
          if (draft.sharedAccounts && draft.sharedAccounts[groupIdx]) {
            draft.sharedAccounts.splice(groupIdx, 1);
          }
        });
        setSelectedGroupIdx(null);
        showToast('Grupo eliminado exitosamente', '🗑️');
      }
    });
  };`
);

// 5. Replace handleRemoveParticipantFromGroup
code = code.replace(
  /const handleRemoveParticipantFromGroup = \(groupIdx: number, participantName: string\) => {[\s\S]*?showToast\(\`"\$\{participantName\}" eliminado del grupo\`, '🗑️'\);\n  };/,
  `const handleRemoveParticipantFromGroup = (groupIdx: number, participantName: string) => {
    const myAlias = profile.settings.myAlias || 'Yo';
    if (participantName === myAlias) {
      showToast('No puedes eliminarte a ti mismo del grupo.', '⚠️');
      return;
    }
    
    setGenericConfirm({
      message: \`¿Eliminar a \${participantName} del grupo? Se borrarán también los gastos que haya registrado.\`,
      onConfirm: () => {
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
        showToast(\`"\${participantName}" eliminado del grupo\`, '🗑️');
      }
    });
  };`
);

// 6. Replace handleRegisterPayment
code = code.replace(
  /const handleRegisterPayment = \(loanId: string, currentPending: number\) => {[\s\S]*?showToast\('Abono registrado', '✅'\);\n  };/,
  `const handleRegisterPayment = (loanId: string, currentPending: number) => {
    setGenericPrompt({
      title: \`Monto a abonar (Pendiente: \${formatCurrency(currentPending)}):\`,
      placeholder: 'Ej. 20',
      onConfirm: (amtStr) => {
        const amount = parseFloat(amtStr || '0');
        if (!amount || amount <= 0 || amount > currentPending) return;
        
        updateProfileData(draft => {
          if (!draft.p2p) return;
          const loan = draft.p2p.find(l => l.id === loanId);
          if (loan) {
            loan.pendingBalance = (loan.pendingBalance ?? loan.amount) - amount;
            if (loan.pendingBalance <= 0) {
              loan.status = 'closed';
            }
          }
        });
        showToast('Abono registrado', '✅');
      }
    });
  };`
);

// 7. Replace handleAddContact
code = code.replace(
  /const handleAddContact = \(\) => {[\s\S]*?showToast\(\`Contacto "\$\{alias\}" guardado\`, '🪪'\);\n  };/,
  `const handleAddContact = () => {
    setGenericPrompt({
      title: 'Alias o nombre del contacto:',
      onConfirm: (alias) => {
        if (!alias) return;
        setTimeout(() => {
          setGenericPrompt({
            title: \`Correo de "\${alias}":\`,
            onConfirm: (email) => {
              if (!email) return;
              updateProfileData(draft => {
                draft.settings.contacts = draft.settings.contacts || [];
                draft.settings.contacts.push({ alias, email });
              });
              showToast(\`Contacto "\${alias}" guardado\`, '🪪');
            }
          });
        }, 100);
      }
    });
  };`
);

// 8. Inject UI Elements at the end
const uiCode = `
      {/* Generic Confirm Dialog */}
      {genericConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              ⚠️ Confirmar Acción
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {genericConfirm.message}
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setGenericConfirm(null)}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  genericConfirm.onConfirm();
                  setGenericConfirm(null);
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generic Prompt Dialog */}
      {genericPrompt && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {genericPrompt.title}
            </h3>
            <input
              type="text"
              autoFocus
              id="genericPromptInput"
              defaultValue={genericPrompt.defaultValue || ''}
              placeholder={genericPrompt.placeholder || ''}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100"
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setGenericPrompt(null);
                }}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('genericPromptInput');
                  const val = el ? el.value : '';
                  genericPrompt.onConfirm(val);
                  setGenericPrompt(null);
                }}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
};
`;

code = code.replace(/    <\/div>\s*<\/div>\s*\);\s*};\s*$/m, uiCode);

fs.writeFileSync('src/components/shared/MonySharedView.tsx', code);
console.log("Patched everything");
