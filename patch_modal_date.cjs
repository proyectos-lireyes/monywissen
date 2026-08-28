const fs = require('fs');
let code = fs.readFileSync('src/components/modals/OccurrenceDetailModal.tsx', 'utf8');

code = code.replace(
  `  // Initialize input amount based on selected currency
  useEffect(() => {
    if (!isOpen) return;`,
  `  useEffect(() => {
    if (isOpen && originalDate) {
      setActualDate(planDate || originalDate);
      setPostponeDate(planDate || originalDate);
      setShowCustomPay(false);
      setShowPostponeInput(false);
    }
  }, [isOpen, originalDate, planDate]);

  // Initialize input amount based on selected currency
  useEffect(() => {
    if (!isOpen) return;`
);

fs.writeFileSync('src/components/modals/OccurrenceDetailModal.tsx', code);
console.log("Patched modal initial dates");
