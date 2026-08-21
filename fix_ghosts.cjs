const fs = require('fs');
let content = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

const replacement = `
            {type === 'debt' && (() => {
              const activePlanKeys = new Set(expectedCuotas.map(c => c.key));
              const orphanedPayments = debtPaymentHistory.filter(h => !activePlanKeys.has(h.key));
              if (orphanedPayments.length === 0) return null;
              return (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 mt-4">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                      Se detectaron {orphanedPayments.length} pago(s) fantasma (descuadrados por cambios de fecha).
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        updateProfileData(draft => {
                          if (draft.overrides) {
                            orphanedPayments.forEach(op => {
                              delete draft.overrides[op.key];
                            });
                          }
                        });
                        showToast('Pagos fantasma limpiados', '🧹');
                      }}
                      className="px-2 py-1.5 bg-amber-600 text-white text-[10px] rounded-lg font-bold hover:bg-amber-700 shrink-0"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
              );
            })()}

            {type === 'debt' && expectedCuotas.length > 0 && (
`;

content = content.replace(
  /\{type === 'debt' && expectedCuotas\.length > 0 && \(/,
  replacement
);

fs.writeFileSync('src/components/modals/ItemFormModal.tsx', content);
