import re

with open('src/components/modals/ItemFormModal.tsx', 'r') as f:
    content = f.read()

# Let's find where we conditionally render APR
search_apr = """                          {debtType === 'loan_interest' && ("""
replace_apr = """                          {(debtType === 'loan_interest' || (profile.settings.customDebts && profile.settings.customDebts.find(d => d.id === debtType)?.hasInterest)) && ("""
content = content.replace(search_apr, replace_apr)

# Let's replace the estimation part
search_estimation = """                        {parseInt(String(installments) || '1') > 0 && parseFloat(String(balance) || '0') > 0 && (
                           <div className="p-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center">
                              {debtType === 'loan_interest' && parseFloat(String(apr) || '0') > 0
                                ? `Pago estimado por cuota: ${formatCurrency((parseFloat(String(balance)) * (1 + (parseFloat(String(apr))/100))) / parseInt(String(installments)))}`
                                : `Pago por cuota: ${formatCurrency(parseFloat(String(balance)) / parseInt(String(installments)))}`
                              }
                           </div>
                        )}"""

replace_estimation = """                        {parseInt(String(installments) || '1') > 0 && parseFloat(String(balance) || '0') > 0 && (
                           <div className="p-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center">
                              {(() => {
                                 const bal = parseFloat(String(balance) || '0');
                                 const inst = parseInt(String(installments) || '1');
                                 const hasInt = debtType === 'loan_interest' || (profile.settings.customDebts && profile.settings.customDebts.find(d => d.id === debtType)?.hasInterest);
                                 let pmt = bal / inst;
                                 if (hasInt && parseFloat(String(apr) || '0') > 0) {
                                    // standard amortization: r = annual rate / 12 (assuming monthly for simplicity here)
                                    const r = (parseFloat(String(apr)) / 100) / 12;
                                    if (r > 0) {
                                      pmt = bal * (r * Math.pow(1 + r, inst)) / (Math.pow(1 + r, inst) - 1);
                                    }
                                 }
                                 return `Pago estimado por cuota: ${formatCurrency(pmt)}`;
                              })()}
                           </div>
                        )}"""
content = content.replace(search_estimation, replace_estimation)

with open('src/components/modals/ItemFormModal.tsx', 'w') as f:
    f.write(content)

