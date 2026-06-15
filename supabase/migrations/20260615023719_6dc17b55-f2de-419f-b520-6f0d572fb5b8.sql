
-- Types
CREATE TYPE public.kyc_status AS ENUM ('none','pending','approved','rejected');
CREATE TYPE public.request_status AS ENUM ('pending','approved','rejected');

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  cpf text,
  birth_date text,
  phone text,
  address text,
  city text,
  state text,
  zip text,
  kyc_status public.kyc_status NOT NULL DEFAULT 'none',
  first_deposit_done boolean NOT NULL DEFAULT false,
  balance_btc numeric NOT NULL DEFAULT 0,
  total_deposit_btc numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles self select" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Deposits
CREATE TABLE public.deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_brl numeric NOT NULL,
  amount_btc numeric NOT NULL,
  btc_rate_brl numeric NOT NULL,
  wallet_address text NOT NULL,
  status public.request_status NOT NULL DEFAULT 'pending',
  is_first_deposit boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.deposits TO authenticated;
GRANT ALL ON public.deposits TO service_role;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deposits self select" ON public.deposits FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "deposits self insert" ON public.deposits FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Withdrawals
CREATE TABLE public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_btc numeric NOT NULL,
  amount_brl numeric NOT NULL,
  destination_wallet text NOT NULL,
  status public.request_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "withdrawals self select" ON public.withdrawals FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "withdrawals self insert" ON public.withdrawals FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Indexes
CREATE INDEX deposits_user_idx ON public.deposits(user_id, created_at DESC);
CREATE INDEX withdrawals_user_idx ON public.withdrawals(user_id, created_at DESC);

-- Create deposit (server-side: sets is_first_deposit atomically)
CREATE OR REPLACE FUNCTION public.create_deposit(p_amount_brl numeric, p_amount_btc numeric, p_rate numeric)
RETURNS public.deposits LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); is_first boolean; d public.deposits%ROWTYPE;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT NOT first_deposit_done INTO is_first FROM public.profiles WHERE id = uid;
  INSERT INTO public.deposits(user_id, amount_brl, amount_btc, btc_rate_brl, wallet_address, is_first_deposit)
  VALUES (uid, p_amount_brl, p_amount_btc, p_rate, 'bc1qt2mck74vx25tc383xc5482ze80jpkhfw0yxjrk', COALESCE(is_first, true))
  RETURNING * INTO d;
  RETURN d;
END $$;
GRANT EXECUTE ON FUNCTION public.create_deposit(numeric,numeric,numeric) TO authenticated;

-- Create withdraw (server-side: atomically reserves balance)
CREATE OR REPLACE FUNCTION public.create_withdraw(p_amount_btc numeric, p_amount_brl numeric, p_dest text)
RETURNS public.withdrawals LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); bal numeric; w public.withdrawals%ROWTYPE;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT balance_btc INTO bal FROM public.profiles WHERE id = uid FOR UPDATE;
  IF bal IS NULL OR p_amount_btc <= 0 OR p_amount_btc > bal THEN
    RAISE EXCEPTION 'Saldo insuficiente';
  END IF;
  UPDATE public.profiles SET balance_btc = balance_btc - p_amount_btc WHERE id = uid;
  INSERT INTO public.withdrawals(user_id, amount_btc, amount_brl, destination_wallet)
  VALUES (uid, p_amount_btc, p_amount_brl, p_dest)
  RETURNING * INTO w;
  RETURN w;
END $$;
GRANT EXECUTE ON FUNCTION public.create_withdraw(numeric,numeric,text) TO authenticated;

-- Admin: list everything
CREATE OR REPLACE FUNCTION public.admin_list(p_password text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_password <> 'Sucesso666' THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN jsonb_build_object(
    'users', COALESCE((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.created_at DESC) FROM public.profiles p), '[]'::jsonb),
    'deposits', COALESCE((SELECT jsonb_agg(to_jsonb(d) ORDER BY d.created_at DESC) FROM public.deposits d), '[]'::jsonb),
    'withdrawals', COALESCE((SELECT jsonb_agg(to_jsonb(w) ORDER BY w.created_at DESC) FROM public.withdrawals w), '[]'::jsonb)
  );
END $$;
GRANT EXECUTE ON FUNCTION public.admin_list(text) TO anon, authenticated;

-- Admin: KYC
CREATE OR REPLACE FUNCTION public.admin_set_kyc(p_password text, p_user uuid, p_status public.kyc_status)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_password <> 'Sucesso666' THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.profiles SET kyc_status = p_status WHERE id = p_user;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_set_kyc(text, uuid, public.kyc_status) TO anon, authenticated;

-- Admin: deposit approve/reject (credits balance + bonus on first deposit)
CREATE OR REPLACE FUNCTION public.admin_set_deposit(p_password text, p_deposit uuid, p_status public.request_status)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.deposits%ROWTYPE; bonus numeric;
BEGIN
  IF p_password <> 'Sucesso666' THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO d FROM public.deposits WHERE id = p_deposit;
  IF NOT FOUND OR d.status <> 'pending' THEN RETURN; END IF;
  UPDATE public.deposits SET status = p_status WHERE id = p_deposit;
  IF p_status = 'approved' THEN
    bonus := CASE WHEN d.is_first_deposit THEN d.amount_btc * 0.3 ELSE 0 END;
    UPDATE public.profiles SET
      balance_btc = balance_btc + d.amount_btc + bonus,
      total_deposit_btc = total_deposit_btc + d.amount_btc,
      first_deposit_done = first_deposit_done OR d.is_first_deposit
    WHERE id = d.user_id;
  END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_set_deposit(text, uuid, public.request_status) TO anon, authenticated;

-- Admin: withdraw approve/reject (refund on reject)
CREATE OR REPLACE FUNCTION public.admin_set_withdraw(p_password text, p_withdraw uuid, p_status public.request_status)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w public.withdrawals%ROWTYPE;
BEGIN
  IF p_password <> 'Sucesso666' THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO w FROM public.withdrawals WHERE id = p_withdraw;
  IF NOT FOUND OR w.status <> 'pending' THEN RETURN; END IF;
  UPDATE public.withdrawals SET status = p_status WHERE id = p_withdraw;
  IF p_status = 'rejected' THEN
    UPDATE public.profiles SET balance_btc = balance_btc + w.amount_btc WHERE id = w.user_id;
  END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_set_withdraw(text, uuid, public.request_status) TO anon, authenticated;
