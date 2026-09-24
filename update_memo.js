const fs = require('fs');
let code = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

// I need to find the `const expectedCuotas = React.useMemo(() => {` block
// and replace it.

