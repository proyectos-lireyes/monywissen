const fs = require('fs');
let code = fs.readFileSync('src/components/modals/ItemFormModal.tsx', 'utf8');

code = code.replace(
  /<option value="15-30">15 y 30<\/option>\n\s*<option value="14-28">14 y 28<\/option>\n\s*<option value="13-27">13 y 27<\/option>/,
  `<option value="15-30">15 y 30</option>
                                <option value="14-28">14 y 28</option>
                                <option value="13-27">13 y 27</option>
                                <option value="exact_14">Cada 14 días (Cashea)</option>
                                <option value="exact_15">Cada 15 días</option>`
);

fs.writeFileSync('src/components/modals/ItemFormModal.tsx', code);
