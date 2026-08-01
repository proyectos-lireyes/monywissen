import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Menu, Printer, Bell, ArrowRightLeft, X, ExternalLink, ShieldAlert, Clock, Handshake, Download } from 'lucide-react';
import { CurrencyModal } from '../modals/CurrencyModal';
import { AppUpdaterModal } from '../updater/AppUpdaterModal';
import { formatCurrency } from '../../utils/financialEngine';

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
  const { activeView, profile, currentProfileName, setActiveView, exchangeRates, state } = useApp();
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUpdaterModal, setShowUpdaterModal] = useState(false);

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

  const totalNotifsCount = pendingP2P.length + pendingContacts.length;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800 px-4 py-3 shadow-sm flex items-center justify-between">
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
          {/* Exchange Rate Badge Button */}
          <button
            onClick={() => setShowCurrencyModal(true)}
            className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 transition-colors border border-emerald-200/60 dark:border-emerald-800/50"
            title="Ver Equivalencias de Divisas y Tasas BCV"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px]">1$ = {bsPerUsd} Bs</span>
          </button>

          {/* APK Update Button */}
          <button
            onClick={() => setShowUpdaterModal(true)}
            className="px-2 py-1.5 text-xs font-bold rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center gap-1 transition-colors border border-indigo-200/60 dark:border-indigo-800/50"
            title="Actualización APK Disponible"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline text-[11px]">v1.5.0 APK</span>
          </button>

          {/* PDF Export Button for Dashboard/Calendar */}
          {(activeView === 'dashboard' || activeView === 'calendar') && (
            <button
              onClick={onExportPDF}
              className="p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title="Exportar Reporte PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
          )}

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
                  {/* Friend / Contact Requests */}
                  {pendingContacts.length > 0 && (
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/40 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-900 dark:text-blue-200 text-[11px] flex items-center gap-1">
                          👤 Solicitudes de Amigos ({pendingContacts.length})
                        </span>
                        <button
                          onClick={() => {
                            setActiveView('shared');
                            setShowNotifMenu(false);
                          }}
                          className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-0.5"
                        >
                          Ir a Agenda <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      </div>
                      {pendingContacts.map((c, i) => (
                        <p key={i} className="text-[10px] text-blue-800 dark:text-blue-300">
                          • {c.alias} ({c.email}) desea conectar contigo en MonyShared.
                        </p>
                      ))}
                    </div>
                  )}

                  {/* P2P Loans Requests */}
                  {pendingP2P.length > 0 && (
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-900 dark:text-indigo-200 text-[11px] flex items-center gap-1">
                          <Handshake className="w-3.5 h-3.5 text-indigo-600" /> Solicitudes P2P ({pendingP2P.length})
                        </span>
                        <button
                          onClick={() => {
                            setActiveView('shared');
                            setShowNotifMenu(false);
                          }}
                          className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-0.5"
                        >
                          MonyShared <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      </div>
                      {pendingP2P.map(p => (
                        <p key={p.id} className="text-[10px] text-indigo-700 dark:text-indigo-300">
                          • {p.lenderAlias || p.borrowerAlias}: {formatCurrency(p.amount)} ({p.status === 'requested' ? 'Solicitud Recibida' : 'Enviado'})
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Cuentas Compartidas Groups Overview */}
                  {sharedGroups.length > 0 && (
                    <div className="p-2.5 bg-violet-50 dark:bg-violet-950/40 rounded-xl border border-violet-100 dark:border-violet-900/40 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-violet-900 dark:text-violet-200 text-[11px] flex items-center gap-1">
                          👥 Cuentas Compartidas ({sharedGroups.length})
                        </span>
                        <button
                          onClick={() => {
                            setActiveView('shared');
                            setShowNotifMenu(false);
                          }}
                          className="text-[10px] text-violet-600 dark:text-violet-400 font-bold hover:underline flex items-center gap-0.5"
                        >
                          Ver Grupos <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      </div>
                      <p className="text-[10px] text-violet-700 dark:text-violet-300">
                        Tienes {sharedGroups.length} grupo(s) activos para división de gastos en partes iguales o por porcentaje.
                      </p>
                    </div>
                  )}

                  {/* Active Debts Alert */}
                  {upcomingDebts.length > 0 && (
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-100 dark:border-amber-900/40 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 dark:text-amber-200 text-[11px] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" /> Deudas y Cuotas ({upcomingDebts.length})
                        </span>
                        <button
                          onClick={() => {
                            setActiveView('calendar');
                            setShowNotifMenu(false);
                          }}
                          className="text-[10px] text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-0.5"
                        >
                          Cronograma <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      </div>
                      <p className="text-[10px] text-amber-700 dark:text-amber-300">
                        Tienes {upcomingDebts.length} compromiso(s) de pago vigentes.
                      </p>
                    </div>
                  )}

                  {totalNotifsCount === 0 && upcomingDebts.length === 0 && sharedGroups.length === 0 && (
                    <div className="text-center py-6 text-slate-400 space-y-1">
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-300">¡Todo al día! ✨</p>
                      <p className="text-[10px]">No tienes solicitudes ni alertas pendientes.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

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

