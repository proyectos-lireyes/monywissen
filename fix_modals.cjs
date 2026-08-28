const fs = require('fs');
let code = fs.readFileSync('src/components/shared/MonySharedView.tsx', 'utf8');

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
  );
};
`;

code = code.replace(/    <\/div>\s*\);\s*};\s*$/m, uiCode);

fs.writeFileSync('src/components/shared/MonySharedView.tsx', code);
console.log("Injected Modals");
