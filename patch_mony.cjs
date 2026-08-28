const fs = require('fs');
let code = fs.readFileSync('src/components/shared/MonySharedView.tsx', 'utf8');

const deleteGroupFn = `
  const handleDeleteGroup = (groupIdx: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este grupo? Toda la información de gastos se perderá para todos los integrantes.')) return;
    
    updateProfileData(draft => {
      if (draft.sharedAccounts && draft.sharedAccounts[groupIdx]) {
        draft.sharedAccounts.splice(groupIdx, 1);
      }
    });
    
    setSelectedGroupIdx(null);
    showToast('Grupo eliminado exitosamente', '🗑️');
  };
`;

code = code.replace(
  '  const handleRemoveParticipantFromGroup = (groupIdx: number, participantName: string) => {',
  deleteGroupFn + '\n  const handleRemoveParticipantFromGroup = (groupIdx: number, participantName: string) => {'
);

code = code.replace(
  `                      <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                        Grupo: {group.name}
                      </h3>`,
  `                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                          {group.name}
                        </h3>
                        <button onClick={() => handleDeleteGroup(selectedGroupIdx)} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 transition-colors" title="Eliminar Grupo">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>`
);

fs.writeFileSync('src/components/shared/MonySharedView.tsx', code);
console.log("Patched MonySharedView");
