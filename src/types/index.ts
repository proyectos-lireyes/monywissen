/**
 * Monywissen Core Type Definitions
 * Modern TypeScript interfaces for financial management, profiles, and shared accounts.
 */

export type FrequencyType = 'one-time' | 'weekly' | 'biweekly' | 'triweekly' | 'monthly';
export type CurrencyCode = 'USD_BCV' | 'EUR_BCV' | 'USDT' | 'BS';

export interface UserSettings {
  planStart: string; // YYYY-MM-DD
  planEnd: string;   // YYYY-MM-DD
  minBalance: number;
  delayDays: number;
  openingBalance?: number;
  freeSpend: number;
  autoSaveThreshold?: number;
  myEmail?: string;
  myAlias?: string;
  myPhone?: string;
  onboardingCompleted?: boolean;
  notificationsEnabled?: boolean;
  notifTime?: string;
  defaultChart?: number; // 0: Lines, 1: Bars, 2: Doughnut
  creditCards?: CreditCard[];
  customDebts?: CustomDebtType[];
  savingPlatforms?: SavingsPlatform[];
  paymentMethods?: PaymentMethod[];
  contacts?: Contact[];
  budgets?: Record<string, number>;
}

export interface CreditCard {
  id: string;
  name: string;
  cutDay: number;
  dueDay: number;
}

export interface CustomDebtType {
  id: string;
  name: string;
  freq: FrequencyType;
  dueDay?: string;
  cutDay?: number | string;
  creditLimit?: number | string;
  limitCurrency?: string;
  isCreditCard?: boolean;
  hasInterest: boolean;
  usePlan: boolean;
  color: string;
}

export interface PaymentMethod {
  id: string;
  bank: string;
  name: string;
  account: string;
  idCard: string;
  phone: string;
  email: string;
}

export interface Contact {
  alias: string;
  email: string;
  phone?: string;
  avatar?: string;
}

export interface IncomeItem {
  id: string;
  name: string;
  amount: number;
  freq: FrequencyType;
  day?: number | string; // Day number or biweekly pair '15-30'
  date?: string; // For 'one-time' (legacy) or start date
  start?: string; // Optional start date for recurring
  end?: string; // Optional end date for recurring
  receiptImg?: string;
  desc?: string;
  tags?: string[];
  currency?: CurrencyCode;
  strictDate?: boolean;
}

export interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
  freq: FrequencyType;
  day?: number | string;
  date?: string; // For one-time (legacy) or start date
  start?: string; // Optional start date for recurring
  end?: string; // Optional end date
  flex?: boolean;
  desc?: string;
  receiptImg?: string;
  deliveryImgs?: string[];
  category?: string;
  tags?: string[];
  currency?: CurrencyCode;
  strictDate?: boolean;
}

export interface DebtItem {
  id: string;
  name: string;
  type: 'card' | 'fixed' | 'noloan' | string; // 'card', 'fixed', 'noloan' or custom debt ID
  color?: string;
  balance: number;
  amortized?: number;
  cardId?: string;
  strictDate?: boolean;
  cutDay?: number;
  dueDay?: number | string;
  start?: string;
  end?: string;
  installments?: number;
  amount?: number;
  minPay?: number;
  hasInterest?: boolean;
  apr?: number;
  mora?: number;
  plan?: string;
  currency?: CurrencyCode;
  freq?: FrequencyType;
}

export interface SavingsPlatform {
  id: string;
  name: string;
  email?: string;
  account?: string;
}

export interface SavingsItem {
  id: string;
  person: string;
  amount: number;
  date: string;
  delivered: boolean;
  status: 'pending' | 'partial' | 'completed';
  savType: 'physical' | 'digital';
  platformId?: string | null;
  flex?: boolean;
  receiptImg?: string;
  deliveryImgs?: string[];
  currency?: CurrencyCode;
  strictDate?: boolean;
}

export interface SharedExpense {
  id: string;
  desc: string;
  amount: number;
  paidBy: string;
  date: string;
  linkedId?: string;
}

export interface TransferStatus {
  status: 'pending' | 'completed';
  linkedId?: string;
}

export interface SharedGroup {
  id: string;
  name: string;
  participants: string[];
  ownerAlias?: string;
  admins?: string[];
  splitType: 'equal' | 'percentage';
  percentages?: Record<string, number>;
  participantStatus?: Record<string, 'pending' | 'accepted' | 'rejected'>;
  phoneMap?: Record<string, string>;
  participantEmails?: string[];
  expenses: SharedExpense[];
  transfersData?: Record<string, TransferStatus>;
}

export interface P2PLoan {
  id: string;
  borrowerEmail?: string;
  borrowerAlias: string;
  borrowerPhone?: string;
  borrowerAccount?: string;
  borrowerAccountData?: PaymentMethod | null;
  lenderEmail?: string;
  lenderAlias: string;
  lenderPhone?: string;
  lenderAccount?: string;
  lenderAccountData?: PaymentMethod | null;
  participants?: string[];
  amount: number;
  rawAmount?: number;
  currency?: CurrencyCode;
  receiptImg?: string;
  desc?: string;
  status: 'requested' | 'sent' | 'received' | 'returned' | 'closed' | 'rejected' | 'offline_requested' | 'offline_active' | 'offline_closed';
  offline?: boolean;
  timestamp: number;
  referenceCode?: string;
  returnRef?: string;
  dueDate?: string;
  pendingBalance?: number;
}

export interface OverrideRecord {
  done?: boolean;
  discarded?: boolean;
  actualDate?: string;
  amt?: number;
  userPostponed?: boolean;
  partials?: Array<{
    date: string;
    amt: number;
    comment?: string;
  }>;
}

export interface UserProfile {
  avatar?: string;
  settings: UserSettings;
  incomes: IncomeItem[];
  expenses: ExpenseItem[];
  debts: DebtItem[];
  savingsList: SavingsItem[];
  sharedAccounts?: SharedGroup[];
  p2p?: P2PLoan[];
  overrides?: Record<string, OverrideRecord>;
  savings?: {
    current: number;
    digital: number;
  };
}

export interface AppStateData {
  currentProfile: string;
  profiles: Record<string, UserProfile>;
  authToken?: string | null;
  authUser?: AuthUser | null;
}

export interface AuthUser {
  email: string;
  alias: string;
  phone?: string;
  token?: string;
}

export interface PlanOccurrence {
  isGhost?: boolean;
  rescates?: number;
  date: string;
  label: string;
  type: string;
  amt: number; // positive for income, negative for expenses/debts
  ref: {
    id: string;
    name: string;
    effectiveColor?: string;
    type?: string;
  };
  originalDate: string;
  done: boolean;
  isPartial?: boolean;
  strictDate?: boolean;
  optimizedFrom?: string;
  userPostponed?: boolean;
  plannedAmt?: number;
  balance: number;
  isDelayed?: boolean;
  pulledEarly?: boolean;
  insufficientFunds?: boolean;
  criticalDelay?: boolean;
  savingsAccumulated?: number;
}

export interface ToastMessage {
  id: string;
  message: string;
  icon?: string;
}
