import fs from 'fs';

let content = fs.readFileSync('src/components/debts/DebtsView.tsx', 'utf8');

const searchState = `  const [templateSearchQuery, setTemplateSearchQuery] = useState('');`;
const replaceState = `  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');`;
content = content.replace(searchState, replaceState);

const searchBase = `  let baseActiveDebts = debts.filter(d => getRemainingDebtAmount(d, overrides, exchangeRates) > 0.01);`;
const replaceBase = `  let filteredDebts = debts;
  if (searchTerm.trim()) {
    const q = searchTerm.toLowerCase();
    filteredDebts = debts.filter(d => d.name.toLowerCase().includes(q) || (d.type && d.type.toLowerCase().includes(q)));
  }

  let baseActiveDebts = filteredDebts.filter(d => getRemainingDebtAmount(d, overrides, exchangeRates) > 0.01);`;
content = content.replace(searchBase, replaceBase);

const searchSettled = `  let baseSettledDebts = debts.filter(d => {`;
const replaceSettled = `  let baseSettledDebts = filteredDebts.filter(d => {`;
content = content.replace(searchSettled, replaceSettled);

const searchInput = `        {(subTab === 'active' || subTab === 'settled') && (
          <div className="flex items-center justify-end px-1 mb-2">
            <select`;

const replaceInput = `        {(subTab === 'active' || subTab === 'settled') && (
          <div className="flex items-center justify-between px-1 mb-2">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-32 sm:w-48 text-xs px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:border-emerald-500"
            />
            <select`;

content = content.replace(searchInput, replaceInput);

fs.writeFileSync('src/components/debts/DebtsView.tsx', content);
