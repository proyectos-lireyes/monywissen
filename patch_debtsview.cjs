const fs = require('fs');
let code = fs.readFileSync('src/components/debts/DebtsView.tsx', 'utf8');

if (!code.includes('Confetti')) {
    code = code.replace("import { useApp } from '../../context/AppContext';", "import { useApp } from '../../context/AppContext';\nimport { Confetti } from '../shared/Confetti';");
    
    code = code.replace('const progressPct = original > 0 ? Math.min(100, Math.round((paid / original) * 100)) : 0;', 'const progressPct = original > 0 ? Math.min(100, Math.round((paid / original) * 100)) : 0;\n                const isCleared = progressPct === 100;');
    
    code = code.replace('<div\n                  key={item.id}\n                  onClick={() => openItemModal(item)}\n                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group"', '<div\n                  key={item.id}\n                  onClick={() => openItemModal(item)}\n                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group"\n                >\n                  <Confetti active={isCleared} />');
    
    // We already have:
    // <div
    //    key={item.id}
    //    onClick={() => openItemModal(item)}
    //    className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group"
    //  >
    
    // Let's do a simpler replace. 
    code = code.replace('className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group"\n                >', 'className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group"\n                >\n                  <Confetti active={isCleared} />');

    fs.writeFileSync('src/components/debts/DebtsView.tsx', code);
}
console.log("Patched DebtsView");
