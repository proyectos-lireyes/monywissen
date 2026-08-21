import re

with open('src/components/modals/ItemFormModal.tsx', 'r') as f:
    content = f.read()

target = """                                <span className={`text-xs font-bold ${cuota.isPaid ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'} group-hover:text-blue-600 transition-colors`}>
                                  Cuota {cuota.index} {cuota.isPaid && `- ${formatCurrencyExt(cuota.paidAmount, cuota.paidCurrency)}`}
                                </span>
                                <span className="text-[10px] text-slate-500">{cuota.date} {cuota.isPaid && `(Pagado)`}</span>
                              </div>
                            </div>
                            {!cuota.isPaid && ( <span className='text-xs font-bold text-slate-400'>{formatCurrencyExt(cuota.requiredPay, currency)}</span> )}
                          </div>"""

replacement = """                                <span className={`text-xs font-bold ${cuota.isPaid ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'} group-hover:text-blue-600 transition-colors`}>
                                  Cuota {cuota.index} {cuota.isPaid ? `- ${formatCurrencyExt(cuota.paidAmount, cuota.paidCurrency)}` : (cuota.paidAmount > 0 ? `(Abonado: ${formatCurrencyExt(cuota.paidAmount, cuota.paidCurrency)})` : '')}
                                </span>
                                <span className="text-[10px] text-slate-500">{cuota.date} {cuota.isPaid && `(Pagado)`}</span>
                              </div>
                            </div>
                            {!cuota.isPaid && ( <span className='text-xs font-bold text-slate-400'>{cuota.paidAmount > 0 ? 'Falta: ' : ''}{formatCurrencyExt(cuota.requiredPay, currency)}</span> )}
                          </div>"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/components/modals/ItemFormModal.tsx', 'w') as f:
        f.write(content)
    print("Patched ItemFormModal")
else:
    print("Target not found")
