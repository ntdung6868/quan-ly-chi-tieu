-- ============================================
-- Chi Tiêu - Full Database Schema
-- An toàn khi chạy lại (IF NOT EXISTS / CREATE OR REPLACE)
-- Không xoá data hiện có
-- ============================================

-- ============================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  currency TEXT DEFAULT 'VND',
  month_start_day INTEGER DEFAULT 1 CHECK (month_start_day >= 1 AND month_start_day <= 28),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
    CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Add month_start_day if missing (for existing DBs)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS month_start_day INTEGER DEFAULT 1 CHECK (month_start_day >= 1 AND month_start_day <= 28);

-- ============================================
-- WALLETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'ewallet', 'credit')),
  balance BIGINT DEFAULT 0,
  icon TEXT DEFAULT 'Wallet',
  color TEXT DEFAULT '#3b82f6',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wallets' AND policyname = 'Users can view own wallets') THEN
    CREATE POLICY "Users can view own wallets" ON wallets FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wallets' AND policyname = 'Users can insert own wallets') THEN
    CREATE POLICY "Users can insert own wallets" ON wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wallets' AND policyname = 'Users can update own wallets') THEN
    CREATE POLICY "Users can update own wallets" ON wallets FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wallets' AND policyname = 'Users can delete own wallets') THEN
    CREATE POLICY "Users can delete own wallets" ON wallets FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT DEFAULT 'Tag',
  color TEXT DEFAULT '#6b7280',
  sort_order INTEGER DEFAULT 0,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Users can view own categories') THEN
    CREATE POLICY "Users can view own categories" ON categories FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Users can insert own categories') THEN
    CREATE POLICY "Users can insert own categories" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Users can update own categories') THEN
    CREATE POLICY "Users can update own categories" ON categories FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Users can delete own categories') THEN
    CREATE POLICY "Users can delete own categories" ON categories FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  note TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can view own transactions') THEN
    CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can insert own transactions') THEN
    CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can update own transactions') THEN
    CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can delete own transactions') THEN
    CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- BUDGETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL CHECK (amount > 0),
  period TEXT NOT NULL CHECK (period IN ('monthly', 'weekly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budgets' AND policyname = 'Users can view own budgets') THEN
    CREATE POLICY "Users can view own budgets" ON budgets FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budgets' AND policyname = 'Users can insert own budgets') THEN
    CREATE POLICY "Users can insert own budgets" ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budgets' AND policyname = 'Users can update own budgets') THEN
    CREATE POLICY "Users can update own budgets" ON budgets FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budgets' AND policyname = 'Users can delete own budgets') THEN
    CREATE POLICY "Users can delete own budgets" ON budgets FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-create default wallet + categories for new profile
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (user_id, name, type, balance, icon, color, is_default)
  VALUES (NEW.id, 'Tiền mặt', 'cash', 0, 'Wallet', '#22c55e', TRUE);

  INSERT INTO public.categories (user_id, name, type, icon, color, sort_order, is_system) VALUES
    (NEW.id, 'Ăn uống', 'expense', 'UtensilsCrossed', '#ef4444', 1, TRUE),
    (NEW.id, 'Di chuyển', 'expense', 'Car', '#f97316', 2, TRUE),
    (NEW.id, 'Mua sắm', 'expense', 'ShoppingBag', '#eab308', 3, TRUE),
    (NEW.id, 'Giải trí', 'expense', 'Gamepad2', '#a855f7', 4, TRUE),
    (NEW.id, 'Học tập', 'expense', 'GraduationCap', '#3b82f6', 5, TRUE),
    (NEW.id, 'Sức khỏe', 'expense', 'Heart', '#ec4899', 6, TRUE),
    (NEW.id, 'Nhà ở', 'expense', 'Home', '#14b8a6', 7, TRUE),
    (NEW.id, 'Hóa đơn', 'expense', 'Receipt', '#64748b', 8, TRUE),
    (NEW.id, 'Quần áo', 'expense', 'Shirt', '#8b5cf6', 9, TRUE),
    (NEW.id, 'Khác', 'expense', 'MoreHorizontal', '#6b7280', 10, TRUE);

  INSERT INTO public.categories (user_id, name, type, icon, color, sort_order, is_system) VALUES
    (NEW.id, 'Lương', 'income', 'Banknote', '#22c55e', 1, TRUE),
    (NEW.id, 'Thưởng', 'income', 'Gift', '#10b981', 2, TRUE),
    (NEW.id, 'Đầu tư', 'income', 'TrendingUp', '#06b6d4', 3, TRUE),
    (NEW.id, 'Thu nhập phụ', 'income', 'Briefcase', '#8b5cf6', 4, TRUE),
    (NEW.id, 'Khác', 'income', 'MoreHorizontal', '#6b7280', 5, TRUE);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();

-- Auto-update updated_at on transactions
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-update wallet balance on transaction change
CREATE OR REPLACE FUNCTION public.update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'expense' THEN
      UPDATE wallets SET balance = balance - NEW.amount WHERE id = NEW.wallet_id;
    ELSE
      UPDATE wallets SET balance = balance + NEW.amount WHERE id = NEW.wallet_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'expense' THEN
      UPDATE wallets SET balance = balance + OLD.amount WHERE id = OLD.wallet_id;
    ELSE
      UPDATE wallets SET balance = balance - OLD.amount WHERE id = OLD.wallet_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.type = 'expense' THEN
      UPDATE wallets SET balance = balance + OLD.amount WHERE id = OLD.wallet_id;
    ELSE
      UPDATE wallets SET balance = balance - OLD.amount WHERE id = OLD.wallet_id;
    END IF;
    IF NEW.type = 'expense' THEN
      UPDATE wallets SET balance = balance - NEW.amount WHERE id = NEW.wallet_id;
    ELSE
      UPDATE wallets SET balance = balance + NEW.amount WHERE id = NEW.wallet_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_transaction_change ON transactions;
CREATE TRIGGER on_transaction_change
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_wallet_balance();

-- Delete own account (called via RPC)
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = auth.uid();
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INDEXES (IF NOT EXISTS)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id, type);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id);
