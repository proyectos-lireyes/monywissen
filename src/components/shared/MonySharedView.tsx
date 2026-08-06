import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateSharedSettlement, formatCurrency, formatDateStr, todayStr } from '../../utils/financialEngine';
import { QRCodeImage } from '../common/QRCodeImage';
import { QRScanner } from '../common/QRScanner';
import {
  Users,
  Handshake,
  BookOpen,
  Plus,
  Share2,
  QrCode,
  Search,
  MessageCircle,
  Copy,
  CheckCircle,
  XCircle,
  UserPlus,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Paperclip,
  Eye,
  DollarSign,
  Camera
} from 'lucide-react';
import { SharedGroup, P2PLoan, Contact, CurrencyCode } from '../../types';
import { db } from '../../utils/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

export const MonySharedView: React.FC = () => {
  const { profile, updateProfileData, showToast, convertAmount, currentProfileName } = useApp();
  const [tab, setTab] = useState<'groups' | 'p2p' | 'agenda'>('groups');
  const [selectedGroupIdx, setSelectedGroupIdx] = useState<number | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // P2P Loan Modal state
  const [showP2PModal, setShowP2PModal] = useState(false);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const [p2pFormType, setP2PFormType] = useState<'borrow' | 'lend'>('borrow');
  const [p2pForm, setP2PForm] = useState({
    person: '',
    amount: '',
    currency: 'USD_BCV' as CurrencyCode,
    desc: '',
    dueDate: '',
    receiptImg: '',
    borrowerAccountId: '',
  });

  // Selected Contact Detail Modal state
  const [selectedContactDetails, setSelectedContactDetails] = useState<Contact | null>(null);

  // Abono Modal state
  const [abonoLoanId, setAbonoLoanId] = useState<string | null>(null);
  const [abonoAmt, setAbonoAmt] = useState('');
  const [abonoCurr, setAbonoCurr] = useState<CurrencyCode>('USD_BCV');
  const [abonoReceipt, setAbonoReceipt] = useState('');

  // Receipt Image Preview Modal
  const [previewReceiptImg, setPreviewReceiptImg] = useState<string | null>(null);

  // Group Creation Modal state
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [extraFriendInput, setExtraFriendInput] = useState('');
  const [customMembers, setCustomMembers] = useState<string[]>([]);
  const [newMemberInput, setNewMemberInput] = useState('');
  const [saveMembersToContacts, setSaveMembersToContacts] = useState(false);
  const [groupSplitType, setGroupSplitType] = useState<'equal' | 'percentage'>('equal');

  // Group Expense Modal state
  const [showGroupExpenseModal, setShowGroupExpenseModal] = useState(false);
  const [groupExpenseGroupIdx, setGroupExpenseGroupIdx] = useState<number | null>(null);
  const [groupExpenseDesc, setGroupExpenseDesc] = useState('');
  const [groupExpenseAmount, setGroupExpenseAmount] = useState('');
  const [groupExpenseCurrency, setGroupExpenseCurrency] = useState<'USD_BCV' | 'EUR_BCV' | 'USDT' | 'BS'>('USD_BCV');
  const [groupExpensePaidBy, setGroupExpensePaidBy] = useState('');

  // Contact Creation & QR Modal state
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showQRScanModal, setShowQRScanModal] = useState(false);
  const [showQRCamera, setShowQRCamera] = useState(false);
  const [qrScanInput, setQrScanInput] = useState('');
  const [contactAliasInput, setContactAliasInput] = useState('');
  const [contactEmailInput, setContactEmailInput] = useState('');
  const [contactPhoneInput, setContactPhoneInput] = useState('');

  const handleQRScanSuccess = (decodedText: string) => {
    setShowQRCamera(false);
    setQrScanInput(decodedText);
    setTimeout(() => {
      handleParseQRContactString(decodedText);
    }, 100);
  };

  const handleParseQRContactString = (text: string) => {
    if (!text.trim()) {
      showToast('No hay contenido en el QR', '⚠️');
      return;
    }
    
    let parsedAlias = '';
    let parsedEmail = '';
    let parsedPhone = '';

    try {
      const data = JSON.parse(text.trim());
      if (data.alias || data.name || data.email || data.type === 'monywissen_contact') {
        parsedAlias = data.alias || data.name || '';
        parsedEmail = data.email || '';
        parsedPhone = data.phone || data.telefono || '';
      }
    } catch {
      const lines = text.split('\n');
      lines.forEach(l => {
        const lower = l.toLowerCase();
        if (lower.includes('nombre:') || lower.includes('alias:')) parsedAlias = l.split(':')[1]?.trim() || '';
        if (lower.includes('correo:') || lower.includes('email:')) parsedEmail = l.split(':')[1]?.trim() || '';
        if (lower.includes('telefono:') || lower.includes('teléfono:') || lower.includes('phone:')) parsedPhone = l.split(':')[1]?.trim() || '';
      });
      if (!parsedAlias && !parsedEmail && !parsedPhone && text.length < 50) {
        parsedAlias = text.trim();
      }
    }

    if (!parsedAlias && !parsedEmail && !parsedPhone) {
      showToast('No se pudo identificar un contacto en el código QR', '❌');
      return;
    }

    setContactAliasInput(parsedAlias || 'Contacto QR');
    setContactEmailInput(parsedEmail);
    setContactPhoneInput(parsedPhone);
    setShowQRScanModal(false);
    setShowAddContactModal(true);
    showToast('Datos de contacto extraídos del QR exitosamente', '🪪');
  };

  const handleParseQRContact = () => {
    handleParseQRContactString(qrScanInput);
  };


  const groups = profile.sharedAccounts || [];
  const loans = profile.p2p || [];
  const contacts = profile.settings.contacts || [];

  const activeLoans = loans.filter(l => l.status !== 'closed' && l.status !== 'rejected' && l.status !== 'offline_closed');
  const closedLoans = loans.filter(l => l.status === 'closed' || l.status === 'rejected' || l.status === 'offline_closed');

  const openCreateGroupModal = () => {
    setGroupNameInput('');
    setSelectedFriends([]);
    setExtraFriendInput('');
    setCustomMembers([]);
    setNewMemberInput('');
    setSaveMembersToContacts(false);
    setGroupSplitType('equal');
    setShowGroupModal(true);
  };

  const handleAddCustomMember = () => {
    const val = newMemberInput.trim();
    if (!val) return;
    if (!customMembers.includes(val)) {
      setCustomMembers([...customMembers, val]);
    }
    setNewMemberInput('');
  };

  const saveGroup = () => {
    if (!groupNameInput.trim()) {
      showToast('Ingresa un nombre para el grupo', '⚠️');
      return;
    }

    const myAlias = profile.settings.myAlias || 'Yo';
    const participants = Array.from(
      new Set([
        myAlias,
        ...selectedFriends,
        ...customMembers,
        ...(extraFriendInput ? [extraFriendInput.trim()] : []),
      ])
    );

    const newGroup: SharedGroup = {
      id: `grp_${Date.now()}`,
      name: groupNameInput.trim(),
      participants,
      ownerAlias: myAlias,
      splitType: groupSplitType,
      expenses: [],
    };

    updateProfileData(draft => {
      draft.sharedAccounts = draft.sharedAccounts || [];
      draft.sharedAccounts.push(newGroup);

      if (saveMembersToContacts && customMembers.length > 0) {
        draft.settings.contacts = draft.settings.contacts || [];
        customMembers.forEach(mem => {
          if (!draft.settings.contacts.some(c => c.alias === mem || c.email === mem)) {
            draft.settings.contacts.push({
              alias: mem,
              email: mem.includes('@') ? mem : `${mem.toLowerCase().replace(/\s+/g, '')}@mony.app`,
              phone: '',
            });
          }
        });
      }
    });

    showToast(`Grupo "${groupNameInput.trim()}" creado con ${participants.length} integrantes`, '👥');
    setShowGroupModal(false);
  };

  const handleAddParticipantToGroup = (groupIdx: number) => {
    const name = prompt('Nombre o Correo de la persona a agregar a este grupo:');
    if (!name || !name.trim()) return;
    const trimmed = name.trim();
    updateProfileData(draft => {
      if (draft.sharedAccounts && draft.sharedAccounts[groupIdx]) {
        if (!draft.sharedAccounts[groupIdx].participants.includes(trimmed)) {
          draft.sharedAccounts[groupIdx].participants.push(trimmed);
        }
      }
    });
    showToast(`"${trimmed}" agregado al grupo`, '👤');
  };

  const openAddGroupExpenseModal = (groupIdx: number) => {
    const group = groups[groupIdx];
    if (!group) return;
    setGroupExpenseGroupIdx(groupIdx);
    setGroupExpenseDesc('');
    setGroupExpenseAmount('');
    setGroupExpenseCurrency('USD_BCV');
    setGroupExpensePaidBy(group.participants[0] || 'Yo');
    setShowGroupExpenseModal(true);
  };

  const saveGroupExpense = () => {
    if (groupExpenseGroupIdx === null) return;
    const rawAmt = parseFloat(groupExpenseAmount);
    if (!groupExpenseDesc.trim() || isNaN(rawAmt) || rawAmt <= 0) {
      showToast('Ingresa un concepto y monto válido', '⚠️');
      return;
    }

    // Convert from selected currency (BS, EUR_BCV, USDT, USD_BCV) to USD BCV
    const convertedUsd = convertAmount(rawAmt, groupExpenseCurrency);
    const roundedUsd = Math.round(convertedUsd * 100) / 100;

    const descNote = groupExpenseCurrency !== 'USD_BCV'
      ? `${groupExpenseDesc.trim()} (${rawAmt} ${groupExpenseCurrency})`
      : groupExpenseDesc.trim();

    updateProfileData(draft => {
      if (draft.sharedAccounts && draft.sharedAccounts[groupExpenseGroupIdx]) {
        draft.sharedAccounts[groupExpenseGroupIdx].expenses.push({
          id: `she_${Date.now()}`,
          desc: descNote,
          amount: roundedUsd,
          paidBy: groupExpensePaidBy || 'Yo',
          date: todayStr(),
        });
      }
    });

    showToast(`Gasto registrado: $${roundedUsd.toFixed(2)} USD BCV`, '🛍️');
    setShowGroupExpenseModal(false);
  };


  const openAddContactModal = () => {
    setContactAliasInput('');
    setContactEmailInput('');
    setContactPhoneInput('');
    setShowAddContactModal(true);
  };

  const saveContact = () => {
    if (!contactAliasInput.trim() || !contactEmailInput.trim()) {
      showToast('Ingresa alias y correo del contacto', '⚠️');
      return;
    }

    updateProfileData(draft => {
      draft.settings.contacts = draft.settings.contacts || [];
      draft.settings.contacts.push({
        alias: contactAliasInput.trim(),
        email: contactEmailInput.trim(),
        phone: contactPhoneInput.trim(),
      });
    });

    showToast(`Contacto "${contactAliasInput.trim()}" guardado`, '🪪');
    setShowAddContactModal(false);
  };

  const handleCreateLoan = (type: 'borrow' | 'lend', prefilledPerson?: string) => {
    setEditingLoanId(null);
    setP2PFormType(type);
    const defaultAccount = profile.settings.paymentMethods && profile.settings.paymentMethods.length > 0
      ? profile.settings.paymentMethods[0].id
      : '';
    setP2PForm({
      person: prefilledPerson || '',
      amount: '',
      currency: 'USD_BCV',
      desc: '',
      dueDate: '',
      receiptImg: '',
      borrowerAccountId: defaultAccount,
    });
    setShowP2PModal(true);
  };

  const handleEditLoan = (loan: P2PLoan) => {
    const isBorrower = loan.borrowerAlias === (profile.settings.myAlias || 'Yo');
    setEditingLoanId(loan.id);
    setP2PFormType(isBorrower ? 'borrow' : 'lend');
    setP2PForm({
      person: isBorrower ? loan.lenderAlias : loan.borrowerAlias,
      amount: String(loan.rawAmount || loan.amount),
      currency: loan.currency || 'USD_BCV',
      desc: loan.desc || '',
      dueDate: loan.dueDate || '',
      receiptImg: loan.receiptImg || '',
      borrowerAccountId: loan.borrowerAccountData?.id || '',
    });
    setShowP2PModal(true);
  };

  const handleDeleteLoan = (loanId: string) => {
    if (confirm('¿Estás seguro de eliminar este registro de préstamo P2P?')) {
      updateProfileData(draft => {
        if (draft.p2p) {
          draft.p2p = draft.p2p.filter(l => l.id !== loanId);
        }
        if (draft.expenses) draft.expenses = draft.expenses.filter(e => e.id !== loanId);
        if (draft.incomes) draft.incomes = draft.incomes.filter(i => i.id !== loanId);
      });
      showToast('Préstamo P2P eliminado', '🗑️');
    }
  };

  const saveP2PLoan = () => {
    const rawNum = parseFloat(p2pForm.amount);
    if (!p2pForm.person || !rawNum || rawNum <= 0) {
      showToast("Datos inválidos", "❌");
      return;
    }

    const usdVal = convertAmount(rawNum, p2pForm.currency);

    // Check if the person is a network contact with an email
    const matchingContact = contacts.find(c => c.alias.toLowerCase() === p2pForm.person.toLowerCase() || c.email.toLowerCase() === p2pForm.person.toLowerCase());
    const isNetworkUser = !!(matchingContact && matchingContact.email);

    if (editingLoanId) {
      updateProfileData(draft => {
        if (!draft.p2p) return;
        const loan = draft.p2p.find(l => l.id === editingLoanId);
        if (loan) {
          const diff = usdVal - loan.amount;
          loan.amount = usdVal;
          loan.rawAmount = rawNum;
          loan.currency = p2pForm.currency;
          loan.pendingBalance = Math.max(0, (loan.pendingBalance ?? loan.amount) + diff);
          loan.dueDate = p2pForm.dueDate || undefined;
          loan.desc = p2pForm.desc || undefined;
          loan.receiptImg = p2pForm.receiptImg || undefined;
        }
      });
      showToast('Préstamo P2P actualizado', '✏️');
    } else {
      const initialStatus = isNetworkUser
        ? (p2pFormType === 'borrow' ? 'requested' : 'sent')
        : 'offline_active';

      const selectedPayAccount = profile.settings.paymentMethods?.find(p => p.id === p2pForm.borrowerAccountId) || profile.settings.paymentMethods?.[0] || null;

      const newLoan: P2PLoan = {
        id: `p2p_${Date.now()}`,
        borrowerAlias: p2pFormType === 'borrow' ? profile.settings.myAlias || 'Yo' : p2pForm.person,
        lenderAlias: p2pFormType === 'lend' ? profile.settings.myAlias || 'Yo' : p2pForm.person,
        borrowerEmail: p2pFormType === 'borrow' ? profile.settings.myEmail : (matchingContact?.email || undefined),
        lenderEmail: p2pFormType === 'lend' ? profile.settings.myEmail : (matchingContact?.email || undefined),
        borrowerAccountData: selectedPayAccount,
        amount: usdVal,
        rawAmount: rawNum,
        currency: p2pForm.currency,
        pendingBalance: usdVal,
        dueDate: p2pForm.dueDate || undefined,
        desc: p2pForm.desc || undefined,
        receiptImg: p2pForm.receiptImg || undefined,
        status: initialStatus as any,
        offline: !isNetworkUser,
        timestamp: Date.now(),
      };

      updateProfileData(draft => {
        draft.p2p = draft.p2p || [];
        draft.p2p.push(newLoan);
        
        if (p2pFormType === 'lend') {
          draft.expenses = draft.expenses || [];
          draft.expenses.push({
            id: newLoan.id,
            name: `Préstamo a ${newLoan.borrowerAlias}`,
            amount: usdVal,
            freq: 'one-time',
            date: todayStr(),
            flex: false,
            receiptImg: p2pForm.receiptImg || undefined,
          });
          draft.overrides = draft.overrides || {};
          draft.overrides[`expense_${newLoan.id}_${todayStr()}`] = { actualDate: todayStr(), done: true };
        } else {
          draft.incomes = draft.incomes || [];
          draft.incomes.push({
            id: newLoan.id,
            name: `Préstamo de ${newLoan.lenderAlias}`,
            amount: usdVal,
            freq: 'one-time',
            date: todayStr()
          });
          draft.overrides = draft.overrides || {};
          draft.overrides[`income_${newLoan.id}_${todayStr()}`] = { actualDate: todayStr(), done: true };
        }
      });

      if (isNetworkUser) {
        showToast(`Solicitud enviada a ${matchingContact.alias} en la red MonyShared 🌐`, '🚀');
      } else {
        showToast(`Préstamo registrado localmente (Offline)`, '💸');
      }
    }
    setShowP2PModal(false);
  };

  const openAbonoModal = (loanId: string) => {
    setAbonoLoanId(loanId);
    setAbonoAmt('');
    setAbonoCurr('USD_BCV');
    setAbonoReceipt('');
  };

  const handleSaveAbono = () => {
    const rawNum = parseFloat(abonoAmt);
    if (!abonoLoanId || !rawNum || rawNum <= 0) {
      showToast('Ingresa un monto válido', '⚠️');
      return;
    }

    const usdVal = convertAmount(rawNum, abonoCurr);

    updateProfileData(draft => {
      if (!draft.p2p) return;
      const loan = draft.p2p.find(l => l.id === abonoLoanId);
      if (loan) {
        loan.pendingBalance = Math.max(0, (loan.pendingBalance ?? loan.amount) - usdVal);
        if (loan.pendingBalance <= 0) {
          loan.status = 'closed';
        }
        if (abonoReceipt) {
          loan.receiptImg = abonoReceipt;
        }
      }
    });

    setAbonoLoanId(null);
    showToast('Abono registrado exitosamente', '✅');
  };

  const handleRegisterPayment = (loanId: string, currentPending: number) => {
    const amtStr = prompt(`Monto a abonar (Pendiente: ${formatCurrency(currentPending)}):`);
    const amount = parseFloat(amtStr || '0');
    if (!amount || amount <= 0 || amount > currentPending) return;

    updateProfileData(draft => {
      if (!draft.p2p) return;
      const loan = draft.p2p.find(l => l.id === loanId);
      if (loan) {
        loan.pendingBalance = (loan.pendingBalance ?? loan.amount) - amount;
        if (loan.pendingBalance <= 0) {
          loan.status = 'closed';
        }
      }
    });
    showToast('Abono registrado', '✅');
  };

  const handleAddContact = () => {
    const alias = prompt('Alias o nombre del contacto:');
    if (!alias) return;
    const email = prompt('Correo del contacto:');
    if (!email) return;

    updateProfileData(draft => {
      draft.settings.contacts = draft.settings.contacts || [];
      draft.settings.contacts.push({ alias, email });
    });

    showToast(`Contacto "${alias}" guardado`, '🪪');
  };

  const handleFindOnNetwork = () => {
    setShowSearchModal(true);
    setSearchResults([]);
    setSearchQuery('');
  };

  const executeCloudSearch = async () => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return;

    setIsSearching(true);
    setSearchResults([]);

    try {
      let q;
      if (term.includes('@')) {
        q = query(collection(db, 'users'), where('email', '==', term));
      } else {
        const endTerm = term.slice(0, -1) + String.fromCharCode(term.charCodeAt(term.length - 1) + 1);
        q = query(
          collection(db, 'users'),
          where('alias_lower', '>=', term),
          where('alias_lower', '<', endTerm),
          limit(10)
        );
      }

      const snap = await getDocs(q);
      const results = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      setSearchResults(results);
    } catch (error) {
      console.error("Error en búsqueda Cloud:", error);
      showToast("Error al conectar con la red", "❌");
    } finally {
      setIsSearching(false);
    }
  };

  const addFromCloud = (user: any) => {
    updateProfileData(draft => {
      draft.settings.contacts = draft.settings.contacts || [];
      if (!draft.settings.contacts.find(c => c.email === user.email)) {
        draft.settings.contacts.push({ alias: user.alias, email: user.email, phone: user.phone || '' });
      }
    });
    showToast(`Contacto ${user.alias} guardado`, '✅');
    setShowSearchModal(false);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Sub Tabs Bar */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex justify-around">
        <button
          onClick={() => { setTab('groups'); setSelectedGroupIdx(null); }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            tab === 'groups'
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users className="w-4 h-4" /> Grupos
        </button>
        <button
          onClick={() => { setTab('p2p'); setSelectedGroupIdx(null); }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            tab === 'p2p'
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Handshake className="w-4 h-4" /> Préstamos P2P
        </button>
        <button
          onClick={() => { setTab('agenda'); setSelectedGroupIdx(null); }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            tab === 'agenda'
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Agenda
        </button>
      </div>

      {/* TAB 1: GRUPOS */}
      {tab === 'groups' && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          {selectedGroupIdx === null ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Cuentas Compartidas
                  </h3>
                  <p className="text-xs text-slate-400">Dividir gastos de viajes, casa o eventos.</p>
                </div>
                <button
                  onClick={openCreateGroupModal}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Nuevo Grupo
                </button>
              </div>

              {groups.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">
                  No tienes grupos de gastos compartidos.
                </p>
              ) : (
                <div className="space-y-2">
                  {groups.map((group, idx) => {
                    const settlement = calculateSharedSettlement(group);
                    return (
                      <div
                        key={group.id || idx}
                        onClick={() => setSelectedGroupIdx(idx)}
                        className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-between cursor-pointer"
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {group.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            👥 {group.participants.length} integrantes
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-extrabold text-xs rounded-xl border border-emerald-200 dark:border-emerald-800">
                            Total: {formatCurrency(settlement.total)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* Selected Group Detail */
            <div className="space-y-4">
              {(() => {
                const group = groups[selectedGroupIdx];
                const settlement = calculateSharedSettlement(group);
                return (
                  <>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => setSelectedGroupIdx(null)}
                        className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                      >
                        ❮ Volver a Grupos
                      </button>
                      <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                        Grupo: {group.name}
                      </h3>
                      <button
                        onClick={() => openAddGroupExpenseModal(selectedGroupIdx)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-blue-700 transition-colors"
                      >
                        + Gasto
                      </button>
                    </div>

                    {/* Total Gastado Banner */}
                    <div className="p-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-blue-100 font-extrabold">
                          Gasto Total Acumulado del Grupo
                        </p>
                        <p className="text-xl font-black">
                          {formatCurrency(settlement.total)} <span className="text-xs text-blue-200 font-normal">USD BCV</span>
                        </p>
                        <p className="text-[10px] text-blue-200 font-semibold">
                          ≈ Bs. {(settlement.total / (convertAmount(1, 'BS') || 0.02)).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] bg-white/20 backdrop-blur-xs text-white px-2.5 py-1 rounded-full font-bold">
                          {group.expenses.length} {group.expenses.length === 1 ? 'Gasto' : 'Gastos'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                          👥 Integrantes del Grupo ({group.participants.length})
                        </span>
                        <button
                          onClick={() => handleAddParticipantToGroup(selectedGroupIdx)}
                          className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 rounded-lg text-[11px] font-bold hover:bg-blue-200 transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Agregar Persona
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {group.participants.map((p, pIdx) => (
                          <span key={pIdx} className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            👤 {p}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase">Compras y Pagos</h4>
                      {group.expenses.length === 0 ? (
                        <p className="text-xs text-slate-400 py-4 text-center">Sin gastos en este grupo.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {group.expenses.map((e, eIdx) => (
                            <div key={e.id || eIdx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between text-xs">
                              <div>
                                <p className="font-bold text-slate-900 dark:text-slate-100">{e.desc}</p>
                                <p className="text-[10px] text-slate-400">Pagó: {e.paidBy}</p>
                              </div>
                              <span className="font-extrabold text-blue-600">{formatCurrency(e.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 pt-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase">Liquidación Final</h4>
                      {settlement.transfers.length === 0 ? (
                        <p className="text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl text-center">
                          ✅ ¡Cuentas claras! Nadie debe nada.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {settlement.transfers.map((t, tIdx) => (
                            <div key={tIdx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between text-xs">
                              <p className="text-slate-700 dark:text-slate-200">
                                <b className="text-rose-600">{t.from}</b> debe a <b className="text-emerald-600">{t.to}</b>
                              </p>
                              <span className="font-extrabold text-slate-900 dark:text-slate-100">{formatCurrency(t.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRESTAMOS P2P */}
      {tab === 'p2p' && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Préstamos Personales P2P</h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleCreateLoan('borrow')}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                + Recibí
              </button>
              <button
                onClick={() => handleCreateLoan('lend')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                + Presté
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {activeLoans.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No hay préstamos P2P activos.</p>
            ) : (
              activeLoans.map(loan => {
                const isBorrower = loan.borrowerAlias === (profile.settings.myAlias || 'Yo');
                const otherParty = isBorrower ? loan.lenderAlias : loan.borrowerAlias;
                const pending = loan.pendingBalance ?? loan.amount;
                const currLabel = loan.currency === 'BS' ? 'Bs' : (loan.currency === 'EUR_BCV' ? '€' : (loan.currency === 'USDT' ? 'USDT' : '$'));
                
                return (
                  <div key={loan.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 relative overflow-hidden space-y-2">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isBorrower ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                    <div className="flex justify-between items-start pl-2">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          {isBorrower ? 'Le debes a ' : 'Te debe '}{otherParty}
                          {!loan.offline && (
                            <span className="text-[9px] bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-extrabold px-1.5 py-0.5 rounded-md">
                              🌐 Red MonyShared
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <span>Total Original: <b>{formatCurrency(loan.amount)}</b></span>
                          {loan.rawAmount && loan.currency !== 'USD_BCV' && (
                            <span className="text-slate-400 font-semibold">
                              ({loan.rawAmount.toLocaleString()} {currLabel})
                            </span>
                          )}
                          {loan.desc && <span>• {loan.desc}</span>}
                        </p>
                        {loan.status === 'requested' && (
                          <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                            ⏳ Solicitud enviada en red (Pendiente confirmación)
                          </p>
                        )}
                        {loan.status === 'sent' && (
                          <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                            📲 Transferencia enviada (Notificado)
                          </p>
                        )}
                        {loan.dueDate && (
                          <p className="text-[10px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span> Vence: {loan.dueDate}
                          </p>
                        )}

                        {/* Receipt badge if available */}
                        {loan.receiptImg && (
                          <button
                            onClick={() => setPreviewReceiptImg(loan.receiptImg!)}
                            className="mt-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-[10px] font-bold flex items-center gap-1"
                          >
                            <ImageIcon className="w-3 h-3 text-indigo-600" />
                            <span>Ver Comprobante</span>
                          </button>
                        )}
                      </div>

                      <div className="text-right flex flex-col items-end gap-1.5">
                        <span className={`text-sm font-black ${isBorrower ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {formatCurrency(pending)}
                        </span>

                        <div className="flex items-center gap-1">
                          {pending > 0 && (
                            <button
                              onClick={() => openAbonoModal(loan.id)}
                              className="text-[10px] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2.5 py-1 rounded-lg font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 shadow-xs"
                            >
                              Abonar
                            </button>
                          )}
                          <button
                            onClick={() => handleEditLoan(loan)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
                            title="Editar préstamo"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteLoan(loan.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Eliminar préstamo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: AGENDA */}
      {tab === 'agenda' && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Mis Contactos</h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowQRModal(true)}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                title="Mi Código QR"
              >
                <QrCode className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setQrScanInput('');
                  setShowQRScanModal(true);
                }}
                className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800 transition-colors"
                title="Pegar texto QR"
              >
                <QrCode className="w-3.5 h-3.5" /> Pegar QR
              </button>
              <button
                onClick={() => setShowQRCamera(true)}
                className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800 transition-colors"
                title="Escanear con Cámara"
              >
                <Camera className="w-3.5 h-3.5" /> Escanear QR
              </button>
              <button
                onClick={openAddContactModal}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                + Contacto
              </button>
              <button
                onClick={handleFindOnNetwork}
                className="px-3.5 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-xl text-xs font-semibold"
              >
                Buscar en la red
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {contacts.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No tienes contactos en tu agenda.</p>
            ) : (
              contacts.map((c, cIdx) => (
                <div
                  key={cIdx}
                  onClick={() => setSelectedContactDetails(c)}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-black text-xs flex items-center justify-center border border-indigo-200 dark:border-indigo-800 overflow-hidden shrink-0">
                      {c.avatar ? (
                        <img src={c.avatar} alt={c.alias} className="w-full h-full object-cover" />
                      ) : (
                        c.alias.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{c.alias}</p>
                      <p className="text-[10px] text-slate-400">{c.email || c.phone || 'Sin datos de contacto'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedContactDetails(c);
                    }}
                    className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 rounded-xl text-[11px] font-bold border border-indigo-200 dark:border-indigo-800"
                  >
                    Ver Tarjeta
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Contact Profile & QR Card Modal */}
      {selectedContactDetails && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-sm w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedContactDetails(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <div className="text-center space-y-2 pt-2">
              <div className="w-16 h-16 rounded-full bg-indigo-600 text-white font-black text-xl flex items-center justify-center mx-auto shadow-md overflow-hidden border-2 border-indigo-400">
                {selectedContactDetails.avatar ? (
                  <img src={selectedContactDetails.avatar} alt={selectedContactDetails.alias} className="w-full h-full object-cover" />
                ) : (
                  selectedContactDetails.alias.slice(0, 2).toUpperCase()
                )}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  {selectedContactDetails.alias}
                </h3>
                <p className="text-xs text-slate-500 font-medium">{selectedContactDetails.email}</p>
                {selectedContactDetails.phone && (
                  <p className="text-[11px] text-slate-400 font-semibold">{selectedContactDetails.phone}</p>
                )}
              </div>
            </div>

            {/* QR Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-center space-y-2 border border-slate-200 dark:border-slate-700">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tarjeta QR de Contacto</p>
              <div className="flex justify-center">
                <QRCodeImage
                  value={JSON.stringify({
                    type: 'monywissen_contact',
                    alias: selectedContactDetails.alias,
                    email: selectedContactDetails.email || '',
                    phone: selectedContactDetails.phone || '',
                  })}
                  size={160}
                  className="w-36 h-36 rounded-xl border border-slate-200 dark:border-slate-700 bg-white p-2 shadow-sm"
                />
              </div>
              <p className="text-[10px] text-slate-400">Escanea este código real para realizar pagos o préstamos directos</p>
            </div>

            {/* Direct Loan Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const targetAlias = selectedContactDetails.alias;
                  setSelectedContactDetails(null);
                  handleCreateLoan('borrow', targetAlias);
                }}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all text-center shadow-xs"
              >
                🤝 Pedir Préstamo
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetAlias = selectedContactDetails.alias;
                  setSelectedContactDetails(null);
                  handleCreateLoan('lend', targetAlias);
                }}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all text-center shadow-xs"
              >
                💸 Otorgar Préstamo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-sm w-full max-h-[90vh] overflow-y-auto text-center space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Tu Tarjeta de Contacto</h3>
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl flex justify-center border border-slate-200 dark:border-slate-700">
              <QRCodeImage
                value={JSON.stringify({
                  type: 'monywissen_contact',
                  alias: profile.settings.myAlias || currentProfileName,
                  email: profile.settings.myEmail || profile.settings.email || '',
                  phone: profile.settings.myPhone || '',
                })}
                size={200}
                className="w-44 h-44 rounded-xl border border-slate-200 dark:border-slate-700 bg-white p-2 shadow-sm"
              />
            </div>
            <p className="text-xs text-slate-500">Muestra este código para que te agreguen fácilmente.</p>
            <button onClick={() => setShowQRModal(false)} className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold">
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Cloud Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                <Search className="w-5 h-5" /> Directorio Monywissen
              </h3>
              <button onClick={() => setShowSearchModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && executeCloudSearch()}
                placeholder="Buscar por Alias o Email..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
              />
              <button onClick={executeCloudSearch} disabled={isSearching} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold disabled:opacity-50">
                {isSearching ? '...' : 'Buscar'}
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {searchResults.length === 0 && !isSearching && searchQuery && (
                <p className="text-xs text-slate-500 text-center py-4">No se encontraron usuarios.</p>
              )}
              {searchResults.map(user => (
                <div key={user.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">👤 {user.alias}</p>
                    <p className="text-[10px] text-slate-500 font-mono">✉️ {user.email}</p>
                  </div>
                  <button
                    onClick={() => addFromCloud(user)}
                    className="px-3 py-1.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-lg text-xs font-bold"
                  >
                    ➕ Agregar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* P2P Modal (Create or Edit) */}
      {showP2PModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {editingLoanId
                ? 'Editar Préstamo P2P'
                : (p2pFormType === 'borrow' ? 'Solicitar Préstamo' : 'Registrar Préstamo Otorgado')}
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {p2pFormType === 'borrow' ? '¿A quién le pedirás / debes?' : '¿A quién le prestaste / te debe?'}
                </label>
                <input
                  type="text"
                  list="contacts_list"
                  value={p2pForm.person}
                  onChange={e => setP2PForm({...p2pForm, person: e.target.value})}
                  placeholder="Escribe o selecciona un contacto..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                />
                <datalist id="contacts_list">
                  {contacts.map(c => <option key={c.email || c.alias} value={c.alias} />)}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Monto</label>
                  <input
                    type="number"
                    value={p2pForm.amount}
                    onChange={e => setP2PForm({...p2pForm, amount: e.target.value})}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Moneda</label>
                  <select
                    value={p2pForm.currency}
                    onChange={e => setP2PForm({...p2pForm, currency: e.target.value as CurrencyCode})}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
                  >
                    <option value="USD_BCV">USD ($)</option>
                    <option value="BS">Bolívares (Bs)</option>
                    <option value="EUR_BCV">Euros (€)</option>
                    <option value="USDT">USDT (₮)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Vencimiento (Opcional)</label>
                <input
                  type="date"
                  value={p2pForm.dueDate}
                  onChange={e => setP2PForm({...p2pForm, dueDate: e.target.value})}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>

              {p2pFormType === 'borrow' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Cuenta Destino para Recibir el Préstamo
                  </label>
                  <select
                    value={p2pForm.borrowerAccountId}
                    onChange={e => setP2PForm({...p2pForm, borrowerAccountId: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                  >
                    {profile.settings.paymentMethods && profile.settings.paymentMethods.length > 0 ? (
                      profile.settings.paymentMethods.map(pm => (
                        <option key={pm.id} value={pm.id}>
                          {pm.bank} ({pm.name} - {pm.account || pm.phone})
                        </option>
                      ))
                    ) : (
                      <option value="">(Registra métodos de pago en Ajustes)</option>
                    )}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Esta cuenta se le mostrará a la persona para que te transfiera directamente.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Motivo / Descripción (Opcional)</label>
                <input
                  type="text"
                  value={p2pForm.desc}
                  onChange={e => setP2PForm({...p2pForm, desc: e.target.value})}
                  placeholder="Ej. Para completar la cena"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>

              {/* Receipt Image Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Comprobante / Captura (Opcional)</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const { Camera: CapCamera, CameraResultType, CameraSource } = await import('@capacitor/camera');
                        const image = await CapCamera.getPhoto({
                          quality: 80,
                          allowEditing: false,
                          resultType: CameraResultType.DataUrl,
                          source: CameraSource.Camera,
                          promptLabelHeader: 'Tomar Foto',
                          promptLabelPhoto: 'De la Galería',
                          promptLabelPicture: 'Tomar Foto'
                        });
                        if (image.dataUrl) {
                          setP2PForm(prev => ({ ...prev, receiptImg: image.dataUrl as string }));
                        }
                      } catch (err) {
                        console.error('Error tomando foto:', err);
                      }
                    }}
                    className="flex-1 px-2 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span className="truncate">Cámara</span>
                  </button>
                  <label className="flex-1 px-2 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-blue-600" />
                    <span className="truncate">Galería</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = ev => {
                            setP2PForm(prev => ({ ...prev, receiptImg: ev.target?.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {p2pForm.receiptImg && (
                    <button
                      type="button"
                      onClick={() => setPreviewReceiptImg(p2pForm.receiptImg)}
                      className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-xl shrink-0"
                      title="Ver Comprobante"
                    >
                      <span className="text-[10px] font-black mr-1">✅</span>
                      <Eye className="w-4 h-4 inline" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowP2PModal(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl text-sm font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={saveP2PLoan}
                className={`flex-1 py-2 text-white rounded-xl text-sm font-bold ${p2pFormType === 'borrow' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Abono Modal */}
      {abonoLoanId !== null && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-sm w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span>Registrar Abono Parcial</span>
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Monto Abono</label>
                  <input
                    type="number"
                    value={abonoAmt}
                    onChange={e => setAbonoAmt(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Moneda</label>
                  <select
                    value={abonoCurr}
                    onChange={e => setAbonoCurr(e.target.value as CurrencyCode)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
                  >
                    <option value="USD_BCV">USD ($)</option>
                    <option value="BS">Bolívares (Bs)</option>
                    <option value="EUR_BCV">Euros (€)</option>
                    <option value="USDT">USDT (₮)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Comprobante de Abono (Opcional)</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const { Camera: CapCamera, CameraResultType, CameraSource } = await import('@capacitor/camera');
                        const image = await CapCamera.getPhoto({
                          quality: 80,
                          allowEditing: false,
                          resultType: CameraResultType.DataUrl,
                          source: CameraSource.Camera,
                          promptLabelHeader: 'Tomar Foto',
                          promptLabelPhoto: 'De la Galería',
                          promptLabelPicture: 'Tomar Foto'
                        });
                        if (image.dataUrl) {
                          setAbonoReceipt(image.dataUrl as string);
                        }
                      } catch (err) {
                        console.error('Error tomando foto:', err);
                      }
                    }}
                    className="flex-1 px-2 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>Cámara</span>
                  </button>
                  <label className="flex-1 px-2 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-emerald-600" />
                    <span>Galería</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = ev => setAbonoReceipt(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {abonoReceipt && (
                    <button
                      type="button"
                      onClick={() => setPreviewReceiptImg(abonoReceipt)}
                      className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-xl shrink-0"
                      title="Ver Comprobante"
                    >
                      <span className="text-[10px] font-black mr-1">✅</span>
                      <Eye className="w-4 h-4 inline" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setAbonoLoanId(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAbono}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Confirmar Abono
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Receipt Modal */}
      {previewReceiptImg && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-3 relative shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <span>Comprobante de Pago</span>
              </h4>
              <button
                onClick={() => setPreviewReceiptImg(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-2xl flex items-center justify-center bg-slate-950 p-2">
              <img src={previewReceiptImg} alt="Comprobante" className="max-w-full max-h-[60vh] object-contain rounded-xl" />
            </div>
            <button
              onClick={() => setPreviewReceiptImg(null)}
              className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Crear Nuevo Grupo de Gastos</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nombre del Grupo</label>
                <input
                  type="text"
                  value={groupNameInput}
                  onChange={e => setGroupNameInput(e.target.value)}
                  placeholder="Ej. Viaje Morrocoy, Alquiler Casa, Cenas"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Seleccionar Amigos / Contactos
                </label>
                {contacts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No tienes contactos guardados en la agenda. Puedes escribir sus nombres abajo.
                  </p>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    {contacts.map(c => {
                      const isChecked = selectedFriends.includes(c.alias);
                      return (
                        <label
                          key={c.alias}
                          className="flex items-center gap-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedFriends(selectedFriends.filter(f => f !== c.alias));
                              } else {
                                setSelectedFriends([...selectedFriends, c.alias]);
                              }
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>👤 {c.alias} ({c.email})</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Agregar Personas (No registradas en contactos)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMemberInput}
                    onChange={e => setNewMemberInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomMember();
                      }
                    }}
                    placeholder="Escribe nombre o correo (Ej. Carlos, Pedro...)"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomMember}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shrink-0"
                  >
                    + Agregar
                  </button>
                </div>

                {customMembers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {customMembers.map(mem => (
                      <span
                        key={mem}
                        className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-blue-200 dark:border-blue-900/40"
                      >
                        👤 {mem}
                        <button
                          type="button"
                          onClick={() => setCustomMembers(customMembers.filter(m => m !== mem))}
                          className="hover:text-rose-600 ml-1 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {customMembers.length > 0 && (
                  <label className="flex items-center gap-2 mt-2 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveMembersToContacts}
                      onChange={e => setSaveMembersToContacts(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Guardar también en mi agenda de contactos</span>
                  </label>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Distribución de Gastos</label>
                <select
                  value={groupSplitType}
                  onChange={e => setGroupSplitType(e.target.value as 'equal' | 'percentage')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100"
                >
                  <option value="equal">Igualitario (Partes Iguales)</option>
                  <option value="percentage">Por Porcentajes Personalizados</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowGroupModal(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={saveGroup}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Crear Grupo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Group Expense Modal */}
      {showGroupExpenseModal && groupExpenseGroupIdx !== null && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              <span>Registrar Gasto del Grupo</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">¿En qué se gastó?</label>
                <input
                  type="text"
                  value={groupExpenseDesc}
                  onChange={e => setGroupExpenseDesc(e.target.value)}
                  placeholder="Ej. Supermercado, Restaurant, Gasolina"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Moneda del Gasto</label>
                <select
                  value={groupExpenseCurrency}
                  onChange={e => setGroupExpenseCurrency(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-slate-100 mb-2"
                >
                  <option value="USD_BCV">💵 USD ($ - BCV)</option>
                  <option value="BS">🇻🇪 Bolívares (Bs. - Tasa Oficial BCV)</option>
                  <option value="EUR_BCV">💶 Euros (€ - BCV)</option>
                  <option value="USDT">🪙 USDT ($)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Monto ({groupExpenseCurrency === 'BS' ? 'Bs.' : groupExpenseCurrency === 'EUR_BCV' ? '€' : '$'})
                </label>
                <input
                  type="number"
                  value={groupExpenseAmount}
                  onChange={e => setGroupExpenseAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-slate-100"
                />
                {groupExpenseAmount && !isNaN(parseFloat(groupExpenseAmount)) && parseFloat(groupExpenseAmount) > 0 && (
                  <div className="mt-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
                    <span>💡 Conversión BCV:</span>
                    <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                      ${convertAmount(parseFloat(groupExpenseAmount), groupExpenseCurrency).toFixed(2)} USD
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">¿Quién Pagó?</label>
                <select
                  value={groupExpensePaidBy}
                  onChange={e => setGroupExpensePaidBy(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-slate-100"
                >
                  {(groups[groupExpenseGroupIdx]?.participants || ['Yo']).map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowGroupExpenseModal(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={saveGroupExpense}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Guardar Gasto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddContactModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-sm w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              <span>Nuevo Contacto</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nombre / Alias</label>
                <input
                  type="text"
                  value={contactAliasInput}
                  onChange={e => setContactAliasInput(e.target.value)}
                  placeholder="Ej. Maria Delgado"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={contactEmailInput}
                  onChange={e => setContactEmailInput(e.target.value)}
                  placeholder="maria@gmail.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Teléfono / Pago Móvil (Opcional)</label>
                <input
                  type="text"
                  value={contactPhoneInput}
                  onChange={e => setContactPhoneInput(e.target.value)}
                  placeholder="0412-1234567"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddContactModal(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={saveContact}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Guardar Contacto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Reader / Parser Modal */}
      {showQRScanModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-sm w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-indigo-600" />
              <span>Agregar Contacto por QR</span>
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pega el texto, JSON o contenido escaneado de un código QR de contacto para importarlo directamente a tu agenda.
            </p>

            <textarea
              rows={4}
              value={qrScanInput}
              onChange={e => setQrScanInput(e.target.value)}
              placeholder='Pega aquí el contenido del QR (Ej. {"type":"mony_contact","alias":"Carlos","email":"carlos@gmail.com"})'
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowQRScanModal(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleParseQRContact}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Importar Contacto
              </button>
            </div>
          </div>
        </div>
      )}

      {showQRCamera && (
        <QRScanner
          onClose={() => setShowQRCamera(false)}
          onScanSuccess={handleQRScanSuccess}
        />
      )}
    </div>
  );
};
