import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TopBar } from './components/layout/TopBar';
import { DrawerNav } from './components/layout/DrawerNav';
import { BottomNav } from './components/layout/BottomNav';
import { Toast } from './components/layout/Toast';
import { DashboardView } from './components/dashboard/DashboardView';
import { CalendarView } from './components/calendar/CalendarView';
import { IncomeView } from './components/income/IncomeView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { DebtsView } from './components/debts/DebtsView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { SavingsView } from './components/savings/SavingsView';
import { MonySharedView } from './components/shared/MonySharedView';
import { SettingsView } from './components/settings/SettingsView';
import { ItemFormModal } from './components/modals/ItemFormModal';
import { OccurrenceDetailModal } from './components/modals/OccurrenceDetailModal';
import { ProfileModal } from './components/modals/ProfileModal';
import { AuthModal } from './components/auth/AuthModal';
import { OnboardingModal } from './components/modals/OnboardingModal';
import { LoginScreen } from './components/auth/LoginScreen';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, calculateProjections, getRemainingDebtAmount } from './utils/financialEngine';

const AppContent: React.FC = () => {
  const { activeView, profile, showToast, state, exchangeRates, importFullState } = useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  React.useEffect(() => {
    if ('launchQueue' in window) {
      (window as any).launchQueue.setConsumer(async (launchParams: any) => {
        if (!launchParams.files || launchParams.files.length === 0) {
          return;
        }
        for (const fileHandle of launchParams.files) {
          try {
            const file = await fileHandle.getFile();
            const text = await file.text();
            const parsed = JSON.parse(text);
            if (parsed && parsed.profiles) {
              importFullState(parsed);
              showToast(`Respaldo ${file.name} cargado correctamente`, '🎉');
            } else {
              showToast('El archivo de respaldo no es válido', '❌');
            }
          } catch (e) {
            console.error('Error reading launched file:', e);
            showToast('Error al leer el archivo importado', '❌');
          }
        }
      });
    }
  }, []);

  // Form Modal state
  const [formType, setFormType] = useState<'income' | 'expense' | 'debt' | 'saving' | null>(null);
  const [formEditIndex, setEditIndex] = useState<number | null>(null);
  const [formForceOneTime, setForceOneTime] = useState(false);

  // Occurrence Detail Modal state
  const [occurrenceDetail, setOccurrenceDetail] = useState<{
    type: string;
    refId: string;
    originalDate: string;
    planDate: string;
  } | null>(null);

  // If user is logged out, present the Login Screen
  if (!state.authUser) {
    return (
      <>
        <LoginScreen />
        <Toast />
      </>
    );
  }

  const handleOpenCreate = (type: 'income' | 'expense' | 'debt' | 'saving', forceOneTime: boolean = false) => {
    setFormType(type);
    setEditIndex(null);
    setForceOneTime(forceOneTime);
  };

  const handleOpenEdit = (type: 'income' | 'expense' | 'debt' | 'saving', index: number) => {
    setFormType(type);
    setEditIndex(index);
    setForceOneTime(false);
  };

  const handleOpenOccurrenceDetails = (
    type: string,
    refId: string,
    originalDate: string,
    planDate: string
  ) => {
    setOccurrenceDetail({ type, refId, originalDate, planDate });
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('Reporte Financiero', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`Proyección: ${profile.settings.planStart} a ${profile.settings.planEnd}`, 14, 30);
      
      // Resumen de Saldo
      const plan = calculateProjections(profile, exchangeRates);
      const minBalance = plan.reduce((min, p) => p.balance < min ? p.balance : min, profile.settings.openingBalance || 0);
      const lastBalance = plan.length > 0 ? plan[plan.length - 1].balance : profile.settings.openingBalance || 0;
      
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text('Resumen de Cuenta', 14, 45);
      
      autoTable(doc, {
        startY: 50,
        head: [['Saldo Inicial', 'Saldo Final Proyectado', 'Saldo Mínimo Proyectado']],
        body: [
          [
            formatCurrency(profile.settings.openingBalance || 0),
            formatCurrency(lastBalance),
            formatCurrency(minBalance)
          ]
        ],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });
      
      // Deudas
      doc.setFontSize(14);
      doc.text('Estado de Deudas', 14, (doc as any).lastAutoTable.finalY + 15);
      
      const debtsData = profile.debts.map(d => [
        d.name,
        d.type === 'card' ? 'TDC' : (d.type === 'loan_interest' ? 'Préstamo' : 'Sin Interés'),
        formatCurrency(d.balance || 0),
        formatCurrency(getRemainingDebtAmount(d, profile.overrides))
      ]);
      
      if (debtsData.length > 0) {
        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 20,
          head: [['Nombre', 'Tipo', 'Deuda Original', 'Monto Restante']],
          body: debtsData,
          theme: 'striped',
          headStyles: { fillColor: [245, 158, 11] }, // amber
        });
      } else {
        doc.setFontSize(10);
        doc.text('Sin deudas activas.', 14, (doc as any).lastAutoTable.finalY + 25);
      }
      
      // Flujo de Caja (Top 20 Movimientos)
      doc.setFontSize(14);
      doc.text('Flujo de Caja (Proyección)', 14, (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : 100);
      
      const flowsData = plan.slice(0, 30).map(p => [
        p.date,
        p.label,
        p.amt > 0 ? 'Ingreso' : 'Egreso',
        formatCurrency(p.amt),
        formatCurrency(p.balance)
      ]);
      
      if (flowsData.length > 0) {
        autoTable(doc, {
          startY: (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 20 : 105,
          head: [['Fecha', 'Concepto', 'Tipo', 'Monto', 'Saldo']],
          body: flowsData,
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129] }, // emerald
        });
      }

      doc.save(`Reporte_Financiero_${profile.settings.planStart}.pdf`);
      showToast('PDF Exportado Exitosamente', '📄');
    } catch (e: any) {
      showToast('Error exportando PDF: ' + e.message, '❌');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      {/* Top Header */}
      <TopBar
        onToggleDrawer={() => setDrawerOpen(prev => !prev)}
        onOpenProfile={() => setProfileOpen(true)}
        onExportPDF={handleExportPDF}
      />

      {/* Slide-out Drawer */}
      <DrawerNav isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} onExportPDF={handleExportPDF} />

      {/* Main View Area */}
      <main className={`flex-1 max-w-7xl w-full mx-auto pb-24 transition-all ${
        activeView === 'calendar' || activeView === 'debts' ? 'px-1 py-2 sm:p-6' : 'p-4 sm:p-6'
      }`}>
        {activeView === 'dashboard' && (
          <DashboardView
            onOpenCreate={handleOpenCreate}
            onOpenDetails={handleOpenOccurrenceDetails}
          />
        )}

        {activeView === 'calendar' && (
          <CalendarView onOpenDetails={handleOpenOccurrenceDetails} />
        )}

        {activeView === 'income' && (
          <IncomeView onOpenCreate={handleOpenCreate} onOpenEdit={handleOpenEdit} />
        )}

        {activeView === 'expenses' && (
          <ExpensesView onOpenCreate={handleOpenCreate} onOpenEdit={handleOpenEdit} />
        )}

        {activeView === 'debts' && (
          <DebtsView onOpenCreate={handleOpenCreate} onOpenEdit={handleOpenEdit} />
        )}

        {activeView === 'transactions' && (
          <TransactionsView onOpenCreate={handleOpenCreate} onOpenEdit={handleOpenEdit} />
        )}

        {activeView === 'savings' && (
          <SavingsView onOpenCreate={handleOpenCreate} onOpenEdit={handleOpenEdit} />
        )}

        {activeView === 'shared' && <MonySharedView />}

        {activeView === 'settings' && (
          <SettingsView onOpenAuth={() => setAuthOpen(true)} />
        )}
      </main>

      {/* Bottom Navigation for Mobile */}
      <BottomNav />

      {/* Floating Feedback Toasts */}
      <Toast />

      {/* Item Form Modal */}
      <ItemFormModal
        isOpen={formType !== null}
        type={formType}
        editIndex={formEditIndex}
        forceOneTime={formForceOneTime}
        onClose={() => setFormType(null)}
      />

      {/* Occurrence Detail Modal */}
      <OccurrenceDetailModal
        isOpen={occurrenceDetail !== null}
        type={occurrenceDetail?.type || null}
        refId={occurrenceDetail?.refId || null}
        originalDate={occurrenceDetail?.originalDate || null}
        planDate={occurrenceDetail?.planDate || null}
        onClose={() => setOccurrenceDetail(null)}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        onOpenAuth={() => setAuthOpen(true)}
      />

      {/* Auth Modal */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      {/* Onboarding Modal */}
      <OnboardingModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
