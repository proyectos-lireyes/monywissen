import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AvatarViewerModal } from '../modals/AvatarViewerModal';
import { updateUserAvatar, saveUserProfileToFirestore, saveManualBackup, getManualBackups } from '../../utils/firebase';
import { Menu, Printer, Bell, ArrowRightLeft, X, ExternalLink, ShieldAlert, Clock, Handshake, Download, PiggyBank, CloudUpload, CloudDownload, RefreshCw } from 'lucide-react';
import { CurrencyModal } from '../modals/CurrencyModal';
import { AppUpdaterModal } from '../updater/AppUpdaterModal';
import { formatCurrency, formatDateStr } from '../../utils/financialEngine';

interface TopBarProps {
  onToggleDrawer: () => void;
  onOpenProfile: () => void;
  onExportPDF: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleDrawer,
  onOpenProfile,
  onExportPDF,
}) => {
  const { activeView, profile, currentProfileName, setActiveView, exchangeRates, state, updateState, updateProfileData, integrityReport, startInteractiveSync, importFullState, showToast } = useApp();
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [avatarViewerOpen, setAvatarViewerOpen] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUpdaterModal, setShowUpdaterModal] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  // Fast Cloud Backup & Restore States
  const [showSyncDropdown, setShowSyncDropdown] = useState(false);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isSavingBackup, setIsSavingBackup] = useState(false);
  const [availableBackups, setAvailableBackups] = useState<any[]>([]);

  const loadBackups = async () => {
    if (!state.authUser?.email) return;
    setIsLoadingBackups(true);
    try {
      const list = await getManualBackups(state.authUser.email);
      setAvailableBackups(list || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleDirectBackup = async () => {
    if (!state.authUser?.email) return;
    setIsSavingBackup(true);
    try {
      const label = `Copia de seguridad - ${new Date().toLocaleString()}`;
      await saveManualBackup(state.authUser.email, state, label);
      showToast('¡Respaldo guardado al instante! ⚡', '🔥');
      loadBackups(); // Refresh list
    } catch (e) {
      console.error(e);
      showToast('Error al respaldar en la nube', '❌');
    } finally {
      setIsSavingBackup(false);
    }
  };

  const handleDirectRestore = (payload: any) => {
    if (!payload) return;
    importFullState(payload);
    setShowSyncDropdown(false);
    showToast('¡Copia de seguridad restaurada con éxito! 🎉', '📂');
  };

  const toggleSyncDropdown = () => {
    const nextState = !showSyncDropdown;
    setShowSyncDropdown(nextState);
    if (nextState) {
      loadBackups();
    }
  };

  const titleMap: Record<string, string> = {
    dashboard: 'Dashboard',
    calendar: 'Cronograma',
    income: 'Ingresos',
    expenses: 'Gastos',
    debts: 'Deudas',
    savings: 'Ahorros y Divisas',
    transactions: 'Únicas',
    shared: 'MonyShared',
    settings: 'Ajustes',
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const bsRate = exchangeRates['BS'] || 0.02325;
  const bsPerUsd = (1 / bsRate).toFixed(2);

  // Notifications calculation
  const p2pLoans = profile.p2p || [];
  const pendingP2P = p2pLoans.filter(l => l.status === 'requested' || l.status === 'sent');
  const contacts = profile.settings.contacts || [];
  const pendingContacts = contacts.filter(c => c.status === 'pending');
  const sharedGroups = profile.sharedAccounts || [];
  const activeDebts = profile.debts || [];
  const upcomingDebts = activeDebts.filter(d => (d.balance ?? 0) > 0);
  const savingsRescues = (integrityReport?.preventiveWarnings || []).filter(w => w.type === 'SAVINGS_RESCUE_INFO');

  const isUpdateAvailable = !!updateState?.hasUpdate && !updateState?.isCompleted && !dismissedAlerts.includes('update');
  const showP2PNotif = pendingP2P.length > 0 && !dismissedAlerts.includes('p2p');
  const showContactsNotif = pendingContacts.length > 0 && !dismissedAlerts.includes('contacts');
  const showSharedNotif = sharedGroups.length > 0 && !dismissedAlerts.includes('shared');
  const showDebtsNotif = upcomingDebts.length > 0 && !dismissedAlerts.includes('debts');
  const showRescueNotif = savingsRescues.length > 0 && !dismissedAlerts.includes('rescues');

  const totalNotifsCount = (isUpdateAvailable ? 1 : 0) + (showP2PNotif ? 1 : 0) + (showContactsNotif ? 1 : 0) + (showSharedNotif ? 1 : 0) + (showDebtsNotif ? 1 : 0) + (showRescueNotif ? 1 : 0);

  const handleDismissAlert = (alertType: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedAlerts(prev => [...prev, alertType]);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800 px-4 pt-safe pb-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleDrawer}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Menú Principal"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {titleMap[activeView] || 'Monywissen'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {currentProfileName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Notifications Bell with Popover Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title="Notificaciones"
            >
              <Bell className="w-4 h-4" />
              {totalNotifsCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
              )}
            </button>

            {/* Notification Popover Dropdown */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 z-50 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-blue-600" /> Notificaciones y Solicitudes
                  </span>
                  <button
                    onClick={() => setShowNotifMenu(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 text-xs">
                  {/* System Update Notification */}
                  {isUpdateAvailable && (
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-1 relative group">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-900 dark:text-indigo-200 text-[11px] flex items-center gap-1">
                          <Download className="w-3.5 h-3.5 text-indigo-600" /> Actualización Disponible
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setShowUpdaterModal(true);
                              setShowNotifMenu(false);
                            }}
                            className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-0.5"
                          >
                            Ver <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                          <button onClick={(e) => handleDismissAlert('update', e)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" title="Descartar">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-indigo-700 dark:text-indigo-300 pr-4">
                        Monywissen {updateState.latestVersion} está disponible con nuevas funcionalidades y mejoras.
                      </p>
                    </div>
                  )}

                  {/* Friend / Contact Requests */}
                  {showContactsNotif && (
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/40 space-y-1 relative group">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-900 dark:text-blue-200 text-[11px] flex items-center gap-1">
                          👤 Solicitudes de Amigos ({pendingContacts.length})
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setActiveView('shared');
                              setShowNotifMenu(false);
                            }}
                            className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-0.5"
                          >
                            Ver <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                          <button onClick={(e) => handleDismissAlert('contacts', e)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" title="Descartar">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      {pendingContacts.map((c, i) => (
                        <p key={i} className="text-[10px] text-blue-800 dark:text-blue-300 pr-4">
                          • {c.alias} ({c.email}) desea conectar contigo en MonyShared.
                        </p>
                      ))}
                    </div>
                  )}

                  {/* P2P Loans Requests */}
                  {showP2PNotif && (
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-1 relative group">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-900 dark:text-indigo-200 text-[11px] flex items-center gap-1">
                          <Handshake className="w-3.5 h-3.5 text-indigo-600" /> Solicitudes P2P ({pendingP2P.length})
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setActiveView('shared');
                              setShowNotifMenu(false);
                            }}
                            className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-0.5"
                          >
                            Ver <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                          <button onClick={(e) => handleDismissAlert('p2p', e)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" title="Descartar">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      {pendingP2P.map(p => (
                        <p key={p.id} className="text-[10px] text-indigo-700 dark:text-indigo-300 pr-4">
                          • {p.lenderAlias || p.borrowerAlias}: {formatCurrency(p.amount)} ({p.status === 'requested' ? 'Solicitud Recibida' : 'Enviado'})
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Cuentas Compartidas Groups Overview */}
                  {showSharedNotif && (
                    <div className="p-2.5 bg-violet-50 dark:bg-violet-950/40 rounded-xl border border-violet-100 dark:border-violet-900/40 space-y-1 relative group">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-violet-900 dark:text-violet-200 text-[11px] flex items-center gap-1">
                          👥 Cuentas Compartidas ({sharedGroups.length})
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setActiveView('shared');
                              setShowNotifMenu(false);
                            }}
                            className="text-[10px] text-violet-600 dark:text-violet-400 font-bold hover:underline flex items-center gap-0.5"
                          >
                            Ver <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                          <button onClick={(e) => handleDismissAlert('shared', e)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" title="Descartar">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-violet-700 dark:text-violet-300 pr-4">
                        Tienes {sharedGroups.length} grupo(s) activos para división de gastos en partes iguales o por porcentaje.
                      </p>
                    </div>
                  )}

                  {/* Active Debts Alert */}
                  {showDebtsNotif && (
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-100 dark:border-amber-900/40 space-y-1 relative group">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 dark:text-amber-200 text-[11px] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" /> Deudas y Cuotas ({upcomingDebts.length})
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setActiveView('calendar');
                              setShowNotifMenu(false);
                            }}
                            className="text-[10px] text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-0.5"
                          >
                            Ver <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                          <button onClick={(e) => handleDismissAlert('debts', e)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" title="Descartar">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-amber-700 dark:text-amber-300 pr-4">
                        Tienes {upcomingDebts.length} compromiso(s) de pago vigentes.
                      </p>
                    </div>
                  )}

                  {/* Informative Savings Rescues Notification */}
                  {showRescueNotif && (
                    <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-100 dark:border-purple-900/40 space-y-1 relative group">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-900 dark:text-purple-200 text-[11px] flex items-center gap-1">
                          <PiggyBank className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Rescates de Ahorro Informativos ({savingsRescues.length})
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setActiveView('calendar');
                              setShowNotifMenu(false);
                            }}
                            className="text-[10px] text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center gap-0.5"
                          >
                            Ver <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                          <button onClick={(e) => handleDismissAlert('rescues', e)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" title="Descartar">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      {savingsRescues.map(r => (
                        <p key={r.id} className="text-[10px] text-purple-800 dark:text-purple-300 pr-4">
                          • {r.message}
                        </p>
                      ))}
                    </div>
                  )}

                  {totalNotifsCount === 0 && (
                    <div className="text-center py-6 text-slate-400 space-y-1">
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-300">¡Todo al día! ✨</p>
                      <p className="text-[10px]">No tienes solicitudes ni alertas pendientes.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Manual Sync to Firebase Popover Dropdown */}
          {state.authUser && (
            <div className="relative">
              <button
                onClick={toggleSyncDropdown}
                className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900/60 border border-blue-200/50 dark:border-blue-900/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                title="Respaldos Rápidos y Sincronización en la Nube"
              >
                <CloudUpload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Nube</span>
                <span className="text-[8px] text-blue-400">▼</span>
              </button>

              {showSyncDropdown && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowSyncDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-40 p-3 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <CloudUpload className="w-4 h-4 text-blue-600" />
                        Mony Cloud
                      </p>
                      <button
                        onClick={() => setShowSyncDropdown(false)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Direct Actions */}
                    <div className="space-y-1.5">
                      <button
                        onClick={handleDirectBackup}
                        disabled={isSavingBackup}
                        className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {isSavingBackup ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Guardando Respaldo...</span>
                          </>
                        ) : (
                          <>
                            <span>⚡</span>
                            <span>Respaldar Ahora (Subir)</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Restoring from cloud */}
                    <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Descargar Respaldo</span>
                        {isLoadingBackups && <RefreshCw className="w-2.5 h-2.5 animate-spin text-slate-500" />}
                      </p>

                      {isLoadingBackups ? (
                        <p className="text-[11px] text-slate-500 text-center py-2">Consultando copias en la nube...</p>
                      ) : availableBackups.length === 0 ? (
                        <p className="text-[11px] text-slate-500 text-center py-2">No tienes copias guardadas.</p>
                      ) : (
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {availableBackups.slice(0, 3).map((backup, index) => (
                            <button
                              key={index}
                              onClick={() => handleDirectRestore(backup.payload)}
                              className="w-full text-left p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 flex items-center justify-between gap-2"
                            >
                              <div className="truncate flex-1">
                                <p className="truncate text-slate-900 dark:text-slate-100">{backup.label || `Copia #${index + 1}`}</p>
                                <p className="text-[9px] text-slate-400 font-medium">{backup.time ? new Date(backup.time).toLocaleString() : 'Fecha desconocida'}</p>
                              </div>
                              <CloudDownload className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer / Advanced */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-center">
                      <button
                        onClick={() => {
                          setShowSyncDropdown(false);
                          startInteractiveSync();
                        }}
                        className="text-[10px] font-extrabold text-slate-500 hover:text-blue-600 hover:underline transition-colors flex items-center gap-1"
                      >
                        🔄 Sincronización Avanzada (Dos Vías)
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* User Profile Avatar */}
          <div className="relative">
            <button
              onClick={onOpenProfile}
              className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 border border-blue-300 font-bold text-xs flex items-center justify-center overflow-hidden hover:scale-105 transition-transform"
              title={state.authUser ? `Perfil (${state.authUser.email})` : 'Gestionar Perfil'}
            >
              {profile.avatar ? (
                <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                getInitials(currentProfileName)
              )}
            </button>
            {state.authUser && (
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"
                title={`Sesión activa: ${state.authUser.email}`}
              />
            )}
          </div>
        </div>
    <AvatarViewerModal 
        isOpen={avatarViewerOpen}
        onClose={() => setAvatarViewerOpen(false)}
        imageUrl={profile.avatar || null}
        title={currentProfileName}
        canEdit={true}
        onImageUpload={(b64) => {
          updateProfileData(draft => { draft.avatar = b64; });
          if (state.authUser?.email) {
            updateUserAvatar(state.authUser.email, b64);
            saveUserProfileToFirestore(
              state.authUser.email,
              profile.settings.myAlias || state.authUser.alias,
              profile.settings.myPhone || state.authUser.phone || '',
              b64,
              profile.settings.paymentMethods || []
            );
          }
        }}
        onImageDelete={() => {
          updateProfileData(draft => { delete draft.avatar; });
          if (state.authUser?.email) {
            updateUserAvatar(state.authUser.email, null);
            saveUserProfileToFirestore(
              state.authUser.email,
              profile.settings.myAlias || state.authUser.alias,
              profile.settings.myPhone || state.authUser.phone || '',
              null,
              profile.settings.paymentMethods || []
            );
          }
        }}
      />
    </header>

      {/* Currency & Exchange Rates Modal */}
      <CurrencyModal
        isOpen={showCurrencyModal}
        onClose={() => setShowCurrencyModal(false)}
      />

      {/* APK Updater Modal */}
      <AppUpdaterModal
        isOpen={showUpdaterModal}
        onClose={() => setShowUpdaterModal(false)}
      />
    </>
  );
};

