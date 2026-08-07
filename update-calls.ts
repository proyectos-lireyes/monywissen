import fs from 'fs';

function updateFile(file: string, before: string, after: string) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(before, after);
  fs.writeFileSync(file, content);
}

// AppContext.tsx
updateFile('src/context/AppContext.tsx', 'const plan = calculateProjections(profile);', 'const plan = calculateProjections(profile, state.exchangeRates);');

// DashboardView.tsx
let dbContent = fs.readFileSync('src/components/dashboard/DashboardView.tsx', 'utf8');
dbContent = dbContent.replace(
  'const { profile, updateProfileData, showToast, setActiveView, integrityReport } = useApp();',
  'const { profile, updateProfileData, showToast, setActiveView, integrityReport, exchangeRates } = useApp();'
);
dbContent = dbContent.replace(
  'const plan = calculateProjections(profile);',
  'const plan = calculateProjections(profile, exchangeRates);'
);
fs.writeFileSync('src/components/dashboard/DashboardView.tsx', dbContent);

// CalendarView.tsx
let calContent = fs.readFileSync('src/components/calendar/CalendarView.tsx', 'utf8');
calContent = calContent.replace(
  'const { profile, updateProfileData } = useApp();',
  'const { profile, updateProfileData, exchangeRates } = useApp();'
);
calContent = calContent.replace(
  'const plan = calculateProjections(profile);',
  'const plan = calculateProjections(profile, exchangeRates);'
);
fs.writeFileSync('src/components/calendar/CalendarView.tsx', calContent);

// App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace(
  'const { profile, activeView, setActiveView } = useApp();',
  'const { profile, activeView, setActiveView, exchangeRates } = useApp();'
);
appContent = appContent.replace(
  'const plan = calculateProjections(profile);',
  'const plan = calculateProjections(profile, exchangeRates);'
);
fs.writeFileSync('src/App.tsx', appContent);

