import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export const WALLET_ADDRESS = "bc1qt2mck74vx25tc383xc5482ze80jpkhfw0yxjrk";
export const SUPPORT_EMAIL = "suporte@hexacorp.com";
export const CG_API_KEY = "CG-QCxYgQUauHvBucNCJLgLE2gb";
export const ADMIN_PASSWORD_HEADER = "Sucesso666"; // Admin password also enforced server-side

/* ---------- Types ---------- */

export type KycStatus = "none" | "pending" | "approved" | "rejected";
export type RequestStatus = "pending" | "approved" | "rejected";

export type User = {
  id: string;
  name: string;
  email: string;
  password: string; // kept for type compatibility; not used (auth lives in Supabase)
  cpf?: string;
  birthDate?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  kycStatus: KycStatus;
  firstDepositDone: boolean;
  balanceBTC: number;
  totalDepositBTC: number;
  createdAt: number;
};

export type DepositRequest = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amountBRL: number;
  amountBTC: number;
  btcRateBRL: number;
  walletAddress: string;
  status: RequestStatus;
  isFirstDeposit: boolean;
  createdAt: number;
};

export type WithdrawRequest = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amountBTC: number;
  amountBRL: number;
  destinationWallet: string;
  status: RequestStatus;
  createdAt: number;
};

type DB = {
  users: User[];
  deposits: DepositRequest[];
  withdrawals: WithdrawRequest[];
  sessionUserId: string | null;
};

const EVT = "hexa:store-change";

/* ---------- Row → app mappers ---------- */

function mapProfile(p: any, emailFallback?: string): User {
  return {
    id: p.id,
    name: p.name ?? "",
    email: p.email ?? emailFallback ?? "",
    password: "",
    cpf: p.cpf ?? undefined,
    birthDate: p.birth_date ?? undefined,
    phone: p.phone ?? undefined,
    address: p.address ?? undefined,
    city: p.city ?? undefined,
    state: p.state ?? undefined,
    zip: p.zip ?? undefined,
    kycStatus: (p.kyc_status ?? "none") as KycStatus,
    firstDepositDone: !!p.first_deposit_done,
    balanceBTC: Number(p.balance_btc ?? 0),
    totalDepositBTC: Number(p.total_deposit_btc ?? 0),
    createdAt: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
  };
}

function mapDeposit(d: any, user?: { name: string; email: string }): DepositRequest {
  return {
    id: d.id,
    userId: d.user_id,
    userEmail: user?.email ?? "",
    userName: user?.name ?? "",
    amountBRL: Number(d.amount_brl),
    amountBTC: Number(d.amount_btc),
    btcRateBRL: Number(d.btc_rate_brl),
    walletAddress: d.wallet_address,
    status: d.status as RequestStatus,
    isFirstDeposit: !!d.is_first_deposit,
    createdAt: d.created_at ? new Date(d.created_at).getTime() : Date.now(),
  };
}

function mapWithdraw(w: any, user?: { name: string; email: string }): WithdrawRequest {
  return {
    id: w.id,
    userId: w.user_id,
    userEmail: user?.email ?? "",
    userName: user?.name ?? "",
    amountBTC: Number(w.amount_btc),
    amountBRL: Number(w.amount_brl),
    destinationWallet: w.destination_wallet,
    status: w.status as RequestStatus,
    createdAt: w.created_at ? new Date(w.created_at).getTime() : Date.now(),
  };
}

function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVT));
}

/* ---------- Reactive client store (current user only) ---------- */

export function useStore(): DB {
  const [db, setDB] = useState<DB>({ users: [], deposits: [], withdrawals: [], sessionUserId: null });
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id ?? null;
    if (!uid) {
      if (mounted.current) setDB({ users: [], deposits: [], withdrawals: [], sessionUserId: null });
      return;
    }
    const [profileRes, depRes, wdRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase.from("deposits").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
      supabase.from("withdrawals").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
    ]);
    const profile = profileRes.data
      ? mapProfile(profileRes.data, sess.session?.user.email ?? undefined)
      : null;
    const userInfo = profile ? { name: profile.name, email: profile.email } : undefined;
    if (!mounted.current) return;
    setDB({
      users: profile ? [profile] : [],
      deposits: (depRes.data ?? []).map((d) => mapDeposit(d, userInfo)),
      withdrawals: (wdRes.data ?? []).map((w) => mapWithdraw(w, userInfo)),
      sessionUserId: uid,
    });
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });

    const onCustom = () => refresh();
    window.addEventListener(EVT, onCustom);

    // Realtime: refresh on any change to this user's rows
    let channel: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id;
      if (!uid) return;
      channel = supabase
        .channel(`user-${uid}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter: `id=eq.${uid}` }, refresh)
        .on("postgres_changes", { event: "*", schema: "public", table: "deposits", filter: `user_id=eq.${uid}` }, refresh)
        .on("postgres_changes", { event: "*", schema: "public", table: "withdrawals", filter: `user_id=eq.${uid}` }, refresh)
        .subscribe();
    });

    // Fallback polling every 15s in case realtime is not enabled
    const poll = setInterval(refresh, 15_000);

    return () => {
      mounted.current = false;
      sub.subscription.unsubscribe();
      window.removeEventListener(EVT, onCustom);
      if (channel) supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [refresh]);

  return db;
}

/* ---------- Auth actions ---------- */

export async function signUp(input: { name: string; email: string; password: string }): Promise<User | { error: string }> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: { name },
      emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
    },
  });
  if (error) {
    const msg = /already|registered|exists/i.test(error.message) ? "E-mail já cadastrado" : error.message;
    return { error: msg };
  }
  const uid = data.user?.id;
  if (!uid) return { error: "Falha ao criar conta" };

  // Ensure session is active so the insert below passes RLS (auto_confirm_email=true → session returned).
  if (!data.session) {
    await supabase.auth.signInWithPassword({ email, password: input.password });
  }

  // Create profile row
  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .insert({ id: uid, name, email })
    .select("*")
    .single();

  if (pErr || !profile) {
    // Try to fetch existing (in case retry)
    const { data: existing } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    if (!existing) return { error: pErr?.message ?? "Falha ao salvar perfil" };
    emit();
    return mapProfile(existing, email);
  }

  emit();
  return mapProfile(profile, email);
}

export async function logIn(email: string, password: string): Promise<User | { error: string }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error || !data.user) return { error: "E-mail ou senha incorretos" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .maybeSingle();

  // If profile missing (legacy account), create on the fly
  if (!profile) {
    const name = (data.user.user_metadata?.name as string) ?? data.user.email?.split("@")[0] ?? "Cliente";
    const { data: created } = await supabase
      .from("profiles")
      .insert({ id: data.user.id, name, email: data.user.email ?? email })
      .select("*")
      .single();
    emit();
    return created ? mapProfile(created, data.user.email ?? email) : { error: "Falha ao carregar perfil" };
  }

  emit();
  return mapProfile(profile, data.user.email ?? email);
}

export async function logOut() {
  await supabase.auth.signOut();
  emit();
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess.session?.user.id;
  if (!uid) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
  return profile ? mapProfile(profile, sess.session?.user.email ?? undefined) : null;
}

export async function submitKyc(
  userId: string,
  data: { cpf: string; birthDate: string; phone: string; address: string; city: string; state: string; zip: string },
) {
  await supabase
    .from("profiles")
    .update({
      cpf: data.cpf,
      birth_date: data.birthDate,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      kyc_status: "pending",
    })
    .eq("id", userId);
  emit();
}

/* ---------- Deposits ---------- */

export async function createDeposit(input: {
  userId: string;
  amountBRL: number;
  amountBTC: number;
  btcRateBRL: number;
}): Promise<DepositRequest | { error: string }> {
  const { data, error } = await supabase.rpc("create_deposit", {
    p_amount_brl: input.amountBRL,
    p_amount_btc: input.amountBTC,
    p_rate: input.btcRateBRL,
  });
  if (error || !data) return { error: error?.message ?? "Falha ao registrar depósito" };
  emit();
  return mapDeposit(data);
}

/* ---------- Withdrawals ---------- */

export async function createWithdraw(input: {
  userId: string;
  amountBTC: number;
  amountBRL: number;
  destinationWallet: string;
}): Promise<WithdrawRequest | { error: string }> {
  const { data, error } = await supabase.rpc("create_withdraw", {
    p_amount_btc: input.amountBTC,
    p_amount_brl: input.amountBRL,
    p_dest: input.destinationWallet,
  });
  if (error || !data) {
    const msg = /Saldo insuficiente/i.test(error?.message ?? "") ? "Saldo insuficiente" : error?.message ?? "Falha ao registrar saque";
    return { error: msg };
  }
  emit();
  return mapWithdraw(data);
}

/* ---------- Admin actions (password enforced server-side) ---------- */

export async function adminFetchAll(password: string): Promise<DB | { error: string }> {
  const { data, error } = await supabase.rpc("admin_list", { p_password: password });
  if (error || !data) return { error: error?.message ?? "Falha" };
  const payload = data as { users: any[]; deposits: any[]; withdrawals: any[] };
  const usersMap = new Map<string, { name: string; email: string }>();
  const users = (payload.users ?? []).map((p) => {
    const u = mapProfile(p);
    usersMap.set(u.id, { name: u.name, email: u.email });
    return u;
  });
  const deposits = (payload.deposits ?? []).map((d) => mapDeposit(d, usersMap.get(d.user_id)));
  const withdrawals = (payload.withdrawals ?? []).map((w) => mapWithdraw(w, usersMap.get(w.user_id)));
  return { users, deposits, withdrawals, sessionUserId: null };
}

export async function adminSetKyc(password: string, userId: string, status: KycStatus) {
  const { error } = await supabase.rpc("admin_set_kyc", { p_password: password, p_user: userId, p_status: status });
  if (error) throw new Error(error.message);
  emit();
}

export async function setKycStatus(userId: string, status: KycStatus) {
  await adminSetKyc(ADMIN_PASSWORD_HEADER, userId, status);
}

export async function adminSetDeposit(password: string, depositId: string, status: RequestStatus) {
  const { error } = await supabase.rpc("admin_set_deposit", { p_password: password, p_deposit: depositId, p_status: status });
  if (error) throw new Error(error.message);
  emit();
}

export async function setDepositStatus(depositId: string, status: RequestStatus) {
  await adminSetDeposit(ADMIN_PASSWORD_HEADER, depositId, status);
}

export async function adminSetWithdraw(password: string, withdrawId: string, status: RequestStatus) {
  const { error } = await supabase.rpc("admin_set_withdraw", { p_password: password, p_withdraw: withdrawId, p_status: status });
  if (error) throw new Error(error.message);
  emit();
}

export async function setWithdrawStatus(withdrawId: string, status: RequestStatus) {
  await adminSetWithdraw(ADMIN_PASSWORD_HEADER, withdrawId, status);
}

/* ---------- Admin reactive hook ---------- */

export function useAdminStore(password: string | null): DB & { loading: boolean; error: string | null; reload: () => void } {
  const [state, setState] = useState<DB>({ users: [], deposits: [], withdrawals: [], sessionUserId: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!password) return;
    setLoading(true);
    const res = await adminFetchAll(password);
    if ("error" in res) {
      setError(res.error);
    } else {
      setError(null);
      setState(res);
    }
    setLoading(false);
  }, [password]);

  useEffect(() => {
    if (!password) return;
    reload();
    const onCustom = () => reload();
    window.addEventListener(EVT, onCustom);
    const poll = setInterval(reload, 5_000);
    return () => {
      window.removeEventListener(EVT, onCustom);
      clearInterval(poll);
    };
  }, [password, reload]);

  return { ...state, loading, error, reload };
}

/* ---------- BTC Price (CoinGecko) ---------- */

export function useBtcPrice(refreshMs = 10_000) {
  const [data, setData] = useState<{ brl: number; usd: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPrice = useCallback(async () => {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?vs_currencies=brl,usd&ids=bitcoin&x_cg_demo_api_key=${CG_API_KEY}`,
      );
      const json = await res.json();
      if (json?.bitcoin?.brl) setData({ brl: json.bitcoin.brl, usd: json.bitcoin.usd });
    } catch (e) {
      console.error("BTC price fetch failed", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrice();
    const t = setInterval(fetchPrice, refreshMs);
    return () => clearInterval(t);
  }, [fetchPrice, refreshMs]);

  return { ...(data ?? { brl: 0, usd: 0 }), loading, refresh: fetchPrice };
}

/* ---------- Market (CoinGecko top coins in BRL) ---------- */

export type MarketCoin = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
};

export function useMarket(refreshMs = 15_000) {
  const [coins, setCoins] = useState<MarketCoin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const fetchCoins = async () => {
      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=brl&order=market_cap_desc&per_page=25&page=1&x_cg_demo_api_key=${CG_API_KEY}`,
        );
        const json = await res.json();
        if (alive && Array.isArray(json)) setCoins(json);
      } catch (e) {
        console.error("Market fetch failed", e);
      } finally {
        if (alive) setLoading(false);
      }
    };
    fetchCoins();
    const t = setInterval(fetchCoins, refreshMs);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [refreshMs]);

  return { coins, loading };
}

/* ---------- Formatting ---------- */

export const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const fmtBTC = (v: number) =>
  `${v.toLocaleString("pt-BR", { minimumFractionDigits: 6, maximumFractionDigits: 8 })} BTC`;

export const fmtUSD = (v: number) =>
  v.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
