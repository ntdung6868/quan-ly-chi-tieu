export type TransactionType = "income" | "expense";
export type WalletType = "cash" | "bank" | "ewallet" | "credit";
export type BudgetPeriod = "monthly" | "weekly" | "yearly";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
  month_start_day: number;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  type: WalletType;
  balance: number;
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  sort_order: number;
  is_system: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  category_id: string;
  amount: number;
  type: TransactionType;
  note: string | null;
  transaction_date: string;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  category?: Category;
  wallet?: Wallet;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  period: BudgetPeriod;
  start_date: string;
  end_date: string;
  created_at: string;
  // Joined fields
  category?: Category;
  spent?: number;
}

export interface TransactionGroup {
  date: string;
  transactions: Transaction[];
  total_income: number;
  total_expense: number;
}
