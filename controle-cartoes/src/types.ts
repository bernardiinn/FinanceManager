/**
 * Enhanced Type definitions for Controle de Cartões application
 */

// Card provider/bank information
export interface CardProvider {
  id: string;
  name: string;
  color?: string;
  logo?: string;
}

// Individual installment tracking
export interface Installment {
  id: string;
  number: number; // 1, 2, 3, etc.
  amount: number;
  dueDate: string; // ISO date string
  paidDate?: string; // ISO date string when paid
  isPaid: boolean;
  notes?: string;
}

// Enhanced card/loan information
export interface Cartao {
  id: string;
  descricao: string; // Description of what was purchased/borrowed
  valor_total: number; // Total amount
  numero_de_parcelas: number; // Number of installments
  parcelas_pagas: number; // Installments paid (calculated from installments array)
  data_compra?: string; // Purchase/loan date
  observacoes?: string;
  categoria?: string;
  pessoa_id: string;
  
  // Enhanced fields
  cardProvider?: CardProvider; // Which card/bank (Vanquis, etc.)
  cardNumber?: string; // Last 4 digits or masked number
  installments: Installment[]; // Detailed installment tracking
  dueDay: number; // Day of month when payments are due (e.g., 3rd)
  interestRate?: number; // If applicable
  currency: string; // GBP, USD, BRL, etc.
  status: 'active' | 'completed' | 'overdue' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Pessoa {
  id: string;
  nome: string;
  cartoes: Cartao[];
  email?: string;
  telefone?: string;
  data_criacao?: string;
  observacoes?: string;
  
  // Enhanced fields
  createdAt: string;
  updatedAt: string;
}

// Navigation and routing types
export type RouteParams = {
  id?: string;
  cartaoId?: string;
};

// Enhanced form types
export interface PessoaFormData {
  nome: string;
  email?: string;
  telefone?: string;
  observacoes?: string;
}

export interface CartaoFormData {
  descricao: string;
  valor_total: number | string;
  numero_de_parcelas: number | string;
  data_compra?: string;
  observacoes?: string;
  categoria?: string;
  pessoa_id: string;
  
  // Enhanced fields
  cardProvider?: string; // Card provider ID or name
  cardNumber?: string; // Masked card number (last 4 digits)
  dueDay: number | string; // Day of month for payments
  interestRate?: number | string;
  currency: string;
  firstPaymentDate?: string; // When first installment is due
}

// Payment record for tracking individual payments
export interface PaymentRecord {
  id: string;
  cartaoId: string;
  installmentId: string;
  amount: number;
  paidDate: string;
  method?: 'cash' | 'transfer' | 'card' | 'other';
  notes?: string;
  createdAt: string;
}

// User management types
export interface User {
  id: string;
  name: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  lastActive: string;
}

// Summary types for calculations
export interface CartaoSummary {
  id: string;
  descricao: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  installmentsPaid: number;
  totalInstallments: number;
  nextDueDate?: string;
  status: 'active' | 'completed' | 'overdue' | 'cancelled';
  daysOverdue?: number;
}

export interface PessoaSummary {
  id: string;
  nome: string;
  totalDebt: number;
  totalPaid: number;
  remainingBalance: number;
  activeCards: number;
  overdueCards: number;
  nextPaymentDue?: string;
  lastPaymentDate?: string;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Modal and dialog types
export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'info' | 'warning' | 'danger';
}

// Notification types
export interface NotificationProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

// Chart and analytics types
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface AnalyticsData {
  monthlyTrends: ChartDataPoint[];
  categoryBreakdown: ChartDataPoint[];
  personComparison: ChartDataPoint[];
  paymentProgress: ChartDataPoint[];
}

// Export/Import types
export interface ExportData {
  pessoas: Pessoa[];
  settings: Record<string, unknown>;
  theme: Record<string, unknown>;
  exportDate: string;
  version: string;
}

// Risk assessment types
export type RiskLevel = 'low' | 'medium' | 'high';

export interface RiskAssessment {
  level: RiskLevel;
  score: number;
  factors: string[];
  recommendations: string[];
}

// Search and filter types
export interface SearchFilters {
  query: string;
  status: 'all' | 'active' | 'completed' | 'overdue';
  category: string;
  dateRange: {
    start?: string;
    end?: string;
  };
  amountRange: {
    min?: number;
    max?: number;
  };
}

// Validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidation {
  isValid: boolean;
  errors: ValidationError[];
}

// Theme and settings types (re-exported from services)
export type ThemeMode = 'light' | 'dark';

// API response types (for future backend integration)
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationError[];
}

// Pagination types
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
  progress?: number;
}

// Table and list types
export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, item: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

// Event types
export interface AppEvent {
  type: string;
  payload?: unknown;
  timestamp: number;
}

// Feature flags (for future use)
export interface FeatureFlags {
  enableNotifications: boolean;
  enableAnalytics: boolean;
  enableExport: boolean;
  enableBackup: boolean;
  enableDarkMode: boolean;
  enableMultiCurrency: boolean;
}

// Performance monitoring
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  errors: string[];
}

// Accessibility types
export interface A11yProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  role?: string;
  tabIndex?: number;
}

// Expense tracking types
export interface Gasto {
  id: string;
  descricao: string;
  valor: number;
  data: string; // ISO date string
  categoria: string;
  metodoPagamento: string;
  observacoes?: string;
  recorrenteId?: string; // if from recurring transaction
  createdAt: string;
  updatedAt: string;
}

// Recurring transactions types
export interface Recorrencia {
  id: string;
  descricao: string;
  valor: number;
  categoria: string;
  metodoPagamento: string;
  frequencia: 'Mensal' | 'Semanal' | 'Anual';
  dataInicio: string; // ISO date string
  dataFim?: string; // ISO date string
  ultimaExecucao?: string; // ISO date string
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

// Form data types for expenses and recurring transactions
export interface GastoFormData {
  descricao: string;
  valor: number | string;
  data: string;
  categoria: string;
  metodoPagamento: string;
  observacoes?: string;
}

export interface RecorrenciaFormData {
  descricao: string;
  valor: number | string;
  categoria: string;
  metodoPagamento: string;
  frequencia: 'Mensal' | 'Semanal' | 'Anual';
  dataInicio: string;
  dataFim?: string;
  ativo: boolean;
}

// Categories and payment methods
export const EXPENSE_CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Compras',
  'Moradia',
  'Saúde',
  'Entretenimento',
  'Educação',
  'Serviços',
  'Outros'
] as const;

export const PAYMENT_METHODS = [
  'Cartão de Crédito',
  'Cartão de Débito',
  'Pix',
  'Dinheiro',
  'Transferência',
  'Outros'
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
export type PaymentMethod = typeof PAYMENT_METHODS[number];

// Summary types for expenses
export interface GastoSummary {
  totalGastos: number;
  gastosPorCategoria: Record<string, number>;
  gastosPorMetodo: Record<string, number>;
  gastosMes: number;
  gastosAno: number;
  mediaGastosDiario: number;
}

export interface MonthlyExpenseSummary {
  month: string; // YYYY-MM format
  total: number;
  categorias: Record<string, number>;
  count: number;
}

// Summary interfaces for dashboard
export interface ExpenseSummary {
  totalExpenses?: number;
  monthlyExpenses?: number;
  averageExpense?: number;
  expensesByCategory?: Record<string, number>;
  recentExpenses?: Gasto[];
}

export interface RecurringSummary {
  total: number;
  active: number;
  monthlyEstimate: number;
}
