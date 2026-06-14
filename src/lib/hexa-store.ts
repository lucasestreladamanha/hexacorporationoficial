import { useEffect, useState, useCallback } from "react";

export const WALLET_ADDRESS = "bc1qt2mck74vx25tc383xc5482ze80jpkhfw0yxjrk";
export const SUPPORT_EMAIL = "suporte@hexacorp.com";
export const CG_API_KEY = "CG-QCxYgQUauHvBucNCJLgLE2gb";

/* ---------- Types ---------- */

export type KycStatus = "none" | "pending" | "approved" | "rejected";

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  // KYC / identification
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

export type RequestStatus = "pending" | "approved" | "rejected";

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

const KEY = "hexa_corp_db_v1";
const EVT = "hexa:store-change";

function emptyDB(): DB {
  return { users: [], deposits: [], withdrawals: [], sessionUserId: null };
}

function read(): DB {
  if (typeof window === "undefined") return emptyDB();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyDB();
    return { ...emptyDB(), ...JSON.parse(raw) };
  } catch {
    return emptyDB();
  }
}

function write(db: DB) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(db));
  window.dispatchEvent(new CustomEvent(EVT));
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/* ---------- Reactive hook ---------- */

export function useStore() {
  const [db, setDB] = useState<DB>(() => read());

  useEffect(() => {
    const refresh = () => setDB(read());
    window.addEventListener(EVT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return db;
}

/* ---------- User CRUD ---------- */

export function signUp(input: { name: string; email: string; password: string }): User | { error: string } {
  const db = read();
  if (db.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
    return { error: "E-mail já cadastrado" };
  }
  const user: User = {
    id: uid(),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    kycStatus: "none",
    firstDepositDone: false,
    balanceBTC: 0,
    totalDepositBTC: 0,
    createdAt: Date.now(),
  };
  db.users.push(user);
  db.sessionUserId = user.id;
  write(db);
  return user;
}

export function logIn(email: string, password: string): User | { error: string } {
  const db = read();
  const user = db.users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
  );
  if (!user) return { error: "E-mail ou senha incorretos" };
  db.sessionUserId = user.id;
  write(db);
  return user;
}

export function logOut() {
  const db = read();
  db.sessionUserId = null;
  write(db);
}

export function getCurrentUser(): User | null {
  const db = read();
  if (!db.sessionUserId) return null;
  return db.users.find((u) => u.id === db.sessionUserId) ?? null;
}

export function submitKyc(
  userId: string,
  data: { cpf: string; birthDate: string; phone: string; address: string; city: string; state: string; zip: string },
) {
  const db = read();
  const u = db.users.find((x) => x.id === userId);
  if (!u) return;
  Object.assign(u, data, { kycStatus: "pending" as KycStatus });
  write(db);
}

export function setKycStatus(userId: string, status: KycStatus) {
  const db = read();
  const u = db.users.find((x) => x.id === userId);
  if (!u) return;
  u.kycStatus = status;
  write(db);
}

/* ---------- Deposits ---------- */

export function createDeposit(input: {
  userId: string;
  amountBRL: number;
  amountBTC: number;
  btcRateBRL: number;
}): DepositRequest | { error: string } {
  const db = read();
  const u = db.users.find((x) => x.id === input.userId);
  if (!u) return { error: "Usuário não encontrado" };
  const dep: DepositRequest = {
    id: uid(),
    userId: u.id,
    userEmail: u.email,
    userName: u.name,
    amountBRL: input.amountBRL,
    amountBTC: input.amountBTC,
    btcRateBRL: input.btcRateBRL,
    walletAddress: WALLET_ADDRESS,
    status: "pending",
    isFirstDeposit: !u.firstDepositDone,
    createdAt: Date.now(),
  };
  db.deposits.unshift(dep);
  write(db);
  return dep;
}

export function setDepositStatus(depositId: string, status: RequestStatus) {
  const db = read();
  const dep = db.deposits.find((d) => d.id === depositId);
  if (!dep || dep.status !== "pending") return;
  dep.status = status;
  if (status === "approved") {
    const u = db.users.find((x) => x.id === dep.userId);
    if (u) {
      const bonus = dep.isFirstDeposit ? dep.amountBTC * 0.3 : 0;
      u.balanceBTC = +(u.balanceBTC + dep.amountBTC + bonus).toFixed(8);
      u.totalDepositBTC = +(u.totalDepositBTC + dep.amountBTC).toFixed(8);
      if (dep.isFirstDeposit) u.firstDepositDone = true;
    }
  }
  write(db);
}

/* ---------- Withdrawals ---------- */

export function createWithdraw(input: {
  userId: string;
  amountBTC: number;
  amountBRL: number;
  destinationWallet: string;
}): WithdrawRequest | { error: string } {
  const db = read();
  const u = db.users.find((x) => x.id === input.userId);
  if (!u) return { error: "Usuário não encontrado" };
  if (input.amountBTC <= 0 || input.amountBTC > u.balanceBTC) {
    return { error: "Saldo insuficiente" };
  }
  const w: WithdrawRequest = {
    id: uid(),
    userId: u.id,
    userEmail: u.email,
    userName: u.name,
    amountBTC: input.amountBTC,
    amountBRL: input.amountBRL,
    destinationWallet: input.destinationWallet,
    status: "pending",
    createdAt: Date.now(),
  };
  // Reserve balance immediately so it disappears from the panel.
  u.balanceBTC = +(u.balanceBTC - input.amountBTC).toFixed(8);
  db.withdrawals.unshift(w);
  write(db);
  return w;
}

export function setWithdrawStatus(withdrawId: string, status: RequestStatus) {
  const db = read();
  const w = db.withdrawals.find((x) => x.id === withdrawId);
  if (!w || w.status !== "pending") return;
  w.status = status;
  if (status === "rejected") {
    // Refund reserved balance
    const u = db.users.find((x) => x.id === w.userId);
    if (u) u.balanceBTC = +(u.balanceBTC + w.amountBTC).toFixed(8);
  }
  write(db);
}

/* ---------- BTC Price (CoinGecko) ---------- */

export function useBtcPrice(refreshMs = 30_000) {
  const [data, setData] = useState<{ brl: number; usd: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPrice = useCallback(async () => {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?vs_currencies=brl,usd&ids=bitcoin&x_cg_demo_api_key=${CG_API_KEY}`,
      );
      const json = await res.json();
      if (json?.bitcoin?.brl) {
        setData({ brl: json.bitcoin.brl, usd: json.bitcoin.usd });
      }
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

export function useMarket(refreshMs = 60_000) {
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
