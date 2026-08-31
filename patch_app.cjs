const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('InitialBalanceModal')) {
    code = code.replace("import { OnboardingModal } from './components/modals/OnboardingModal';", "import { OnboardingModal } from './components/modals/OnboardingModal';\nimport { InitialBalanceModal } from './components/modals/InitialBalanceModal';");
    
    code = code.replace("<OnboardingModal />", "<OnboardingModal />\n      <InitialBalanceModal />");
    fs.writeFileSync('src/App.tsx', code);
}
console.log("Patched App.tsx");
