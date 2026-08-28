import re

with open('src/components/shared/MonySharedView.tsx', 'r') as f:
    content = f.read()

# Add the new functions
new_funcs = """  const handleAddParticipantToGroup = (groupIdx: number) => {
    const name = prompt('Nombre o Correo de la persona a agregar a este grupo:');
    if (!name || !name.trim()) return;
    const trimmed = name.trim();
    updateProfileData(draft => {
      if (draft.sharedAccounts && draft.sharedAccounts[groupIdx]) {
        if (!draft.sharedAccounts[groupIdx].participants.includes(trimmed)) {
          draft.sharedAccounts[groupIdx].participants.push(trimmed);
        }
      }
    });
    showToast(`"${trimmed}" agregado al grupo`, '👤');
  };

  const handleEditParticipantInGroup = (groupIdx: number, oldName: string) => {
    const newName = prompt('Editar nombre del integrante:', oldName);
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
    showToast(`Nombre actualizado a "${trimmed}"`, '✏️');
  };

  const handleRemoveParticipantFromGroup = (groupIdx: number, participantName: string) => {
    const myAlias = profile.settings.myAlias || 'Yo';
    if (participantName === myAlias) {
      showToast('No puedes eliminarte a ti mismo del grupo.', '⚠️');
      return;
    }
    
    if (!confirm(`¿Eliminar a ${participantName} del grupo?`)) return;
    
    updateProfileData(draft => {
      if (draft.sharedAccounts && draft.sharedAccounts[groupIdx]) {
        const group = draft.sharedAccounts[groupIdx];
        group.participants = group.participants.filter((p: string) => p !== participantName);
      }
    });
    showToast(`"${participantName}" eliminado del grupo`, '🗑️');
  };"""

content = re.sub(
    r'  const handleAddParticipantToGroup = \(groupIdx: number\) => \{[\s\S]*?showToast\(`"\$\{trimmed\}" agregado al grupo`, \'👤\'\);\n  \};',
    new_funcs,
    content
)

# Render section
old_render = """                      <div className="flex flex-wrap gap-1.5">
                        {group.participants.map((p, pIdx) => {
                          const status = group.participantStatus?.[p];
                          let statusIcon = '';
                          let statusClass = '';
                          
                          if (status === 'pending') {
                            statusIcon = ' ⏳';
                            statusClass = ' border-amber-300 dark:border-amber-700/50';
                          } else if (status === 'accepted') {
                            statusIcon = ' ✅';
                            statusClass = ' border-emerald-300 dark:border-emerald-700/50';
                          } else if (status === 'rejected') {
                            statusIcon = ' ❌';
                            statusClass = ' border-rose-300 dark:border-rose-700/50';
                          }

                          return (
                            <span key={pIdx} className={`px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 ${statusClass}`}>
                              👤 {p}
                              <span className="text-[10px]">{statusIcon}</span>
                            </span>
                          );
                        })}
                      </div>"""

new_render = """                      <div className="flex flex-wrap gap-1.5">
                        {group.participants.map((p, pIdx) => {
                          const status = group.participantStatus?.[p];
                          let statusIcon = '';
                          let statusClass = '';
                          
                          if (status === 'pending') {
                            statusIcon = ' ⏳';
                            statusClass = ' border-amber-300 dark:border-amber-700/50';
                          } else if (status === 'accepted') {
                            statusIcon = ' ✅';
                            statusClass = ' border-emerald-300 dark:border-emerald-700/50';
                          } else if (status === 'rejected') {
                            statusIcon = ' ❌';
                            statusClass = ' border-rose-300 dark:border-rose-700/50';
                          }
                          
                          const myAlias = profile.settings.myAlias || 'Yo';
                          const isMe = p === myAlias;

                          return (
                            <div key={pIdx} className={`px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 ${statusClass}`}>
                              <span>👤 {p}</span>
                              <span className="text-[10px]">{statusIcon}</span>
                              {!isMe && (
                                <div className="flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-1.5 ml-0.5">
                                  <button onClick={() => handleEditParticipantInGroup(selectedGroupIdx, p)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 rounded transition-colors">
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button onClick={() => handleRemoveParticipantFromGroup(selectedGroupIdx, p)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 rounded transition-colors">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>"""

content = content.replace(old_render, new_render)

with open('src/components/shared/MonySharedView.tsx', 'w') as f:
    f.write(content)

print("Updated MonySharedView.tsx")

