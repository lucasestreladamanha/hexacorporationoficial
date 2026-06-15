import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Users,
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  X,
  Shield,
  Copy,
  ExternalLink,
} from "lucide-react";
import {
  useAdminStore,
  adminSetDeposit,
  adminSetWithdraw,
  adminSetKyc,
  fmtBRL,
  fmtBTC,
  WALLET_ADDRESS,
  type User,
  type DepositRequest,
  type WithdrawRequest,
} from "@/lib/hexa-store";

const ADMIN_PWD = "Sucesso666";

export const Route = createFileRoute("/evilevilevil")({
  head: () => ({
    meta: [
      { title: "Hexa Corp · Painel Administrativo" },
      { name: "description", content: "Painel interno de aprovações Hexa Corp." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

type Tab = "kyc" | "deposits" | "withdrawals" | "users";

function AdminPage() {
  const db = useAdminStore(authed ? ADMIN_PWD : null);
  const [tab, setTab] = useState<Tab>("kyc");
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl glass p-6 space-y-4">
          <div className="flex items-center gap-2 text-lime">
            <Shield className="h-5 w-5" />
            <span className="font-semibold">Hexa Corp · Admin</span>
          </div>
          <p className="text-sm text-white/60">Acesso restrito. Insira a senha administrativa.</p>
          <input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="Senha"
            onKeyDown={(e) => e.key === "Enter" && pwd === "Sucesso666" && setAuthed(true)}
            className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm outline-none focus:border-lime focus:ring-2 focus:ring-lime/30"
          />
          <button
            onClick={() => pwd === "Sucesso666" && setAuthed(true)}
            className="w-full rounded-full bg-lime text-black font-bold py-3 text-sm"
          >
            Entrar
          </button>
          <Link to="/" className="block text-center text-xs text-white/50 hover:text-lime">← Voltar para o site</Link>
        </div>
      </div>
    );
  }

  const pendingKyc = db.users.filter((u) => u.kycStatus === "pending");
  const pendingDeposits = db.deposits.filter((d) => d.status === "pending");
  const pendingWithdrawals = db.withdrawals.filter((w) => w.status === "pending");

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: "kyc", label: "Cadastros", icon: <Users className="h-4 w-4" />, count: pendingKyc.length },
    { id: "deposits", label: "Depósitos", icon: <ArrowDownToLine className="h-4 w-4" />, count: pendingDeposits.length },
    { id: "withdrawals", label: "Saques", icon: <ArrowUpFromLine className="h-4 w-4" />, count: pendingWithdrawals.length },
    { id: "users", label: "Todos clientes", icon: <Users className="h-4 w-4" />, count: db.users.length },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-lime/15 text-lime flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">Hexa Corp · Painel Admin</div>
              <div className="font-mono-tag text-white/40">APROVAÇÕES MANUAIS</div>
            </div>
          </div>
          <Link to="/" className="font-mono-tag text-white/50 hover:text-lime">← VOLTAR AO SITE</Link>
        </header>

        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border transition ${
                tab === t.id
                  ? "bg-lime text-black border-lime"
                  : "bg-white/[0.03] border-white/10 text-white/70 hover:border-lime/40"
              }`}
            >
              {t.icon}
              {t.label}
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] tabular-nums ${
                  tab === t.id ? "bg-black/20" : "bg-lime/15 text-lime"
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {tab === "kyc" && <KycTab users={pendingKyc} />}
        {tab === "deposits" && <DepositsTab deposits={pendingDeposits} allUsers={db.users} />}
        {tab === "withdrawals" && <WithdrawalsTab withdrawals={pendingWithdrawals} />}
        {tab === "users" && <UsersTab users={db.users} />}
      </div>
    </div>
  );
}

function KycTab({ users }: { users: User[] }) {
  if (users.length === 0) return <Empty text="Nenhum cadastro pendente de aprovação." />;
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {users.map((u) => (
        <div key={u.id} className="rounded-2xl glass p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold">{u.name}</div>
              <div className="font-mono-tag text-white/50">{u.email}</div>
            </div>
            <span className="rounded-full bg-warning/15 text-warning px-2 py-0.5 text-[11px] font-semibold">PENDENTE</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <KV label="CPF" v={u.cpf} />
            <KV label="Nascimento" v={u.birthDate} />
            <KV label="Telefone" v={u.phone} />
            <KV label="CEP" v={u.zip} />
            <KV label="Endereço" v={u.address} full />
            <KV label="Cidade/UF" v={`${u.city ?? ""}${u.state ? " / " + u.state : ""}`} />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setKycStatus(u.id, "approved")}
              className="flex-1 rounded-full bg-lime text-black font-bold py-2 text-sm flex items-center justify-center gap-1"
            >
              <Check className="h-4 w-4" /> Aprovar cadastro
            </button>
            <button
              onClick={() => setKycStatus(u.id, "rejected")}
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold hover:border-warning/60 hover:text-warning transition flex items-center gap-1"
            >
              <X className="h-4 w-4" /> Rejeitar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function DepositsTab({ deposits, allUsers }: { deposits: DepositRequest[]; allUsers: User[] }) {
  if (deposits.length === 0) return <Empty text="Nenhum depósito pendente." />;
  return (
    <div className="space-y-3">
      {deposits.map((d) => {
        const user = allUsers.find((u) => u.id === d.userId);
        return (
          <div key={d.id} className="rounded-2xl glass p-5 grid md:grid-cols-[1fr_auto] gap-4 items-center">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{d.userName}</span>
                <span className="font-mono-tag text-white/50">{d.userEmail}</span>
                {d.isFirstDeposit && (
                  <span className="rounded-full bg-lime/15 text-lime px-2 py-0.5 text-[11px] font-bold">
                    1º DEPÓSITO · BÔNUS +30%
                  </span>
                )}
                {user && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      user.kycStatus === "approved"
                        ? "bg-lime/15 text-lime"
                        : "bg-warning/15 text-warning"
                    }`}
                  >
                    KYC: {user.kycStatus.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <KV label="Valor BRL" v={fmtBRL(d.amountBRL)} />
                <KV label="Valor BTC" v={fmtBTC(d.amountBTC)} />
                <KV label="Cotação" v={fmtBRL(d.btcRateBRL)} />
                <KV label="Solicitado em" v={new Date(d.createdAt).toLocaleString("pt-BR")} />
              </div>
              <div className="rounded-xl bg-black/40 border border-white/10 p-2 font-mono text-[11px] break-all text-white/80">
                {d.walletAddress}
              </div>
            </div>
            <div className="flex md:flex-col gap-2 md:w-44">
              <button
                onClick={() => setDepositStatus(d.id, "approved")}
                className="flex-1 rounded-full bg-lime text-black font-bold py-2 text-sm flex items-center justify-center gap-1"
              >
                <Check className="h-4 w-4" /> Aprovar
              </button>
              <button
                onClick={() => setDepositStatus(d.id, "rejected")}
                className="flex-1 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold hover:border-warning/60 hover:text-warning transition flex items-center justify-center gap-1"
              >
                <X className="h-4 w-4" /> Rejeitar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WithdrawalsTab({ withdrawals }: { withdrawals: WithdrawRequest[] }) {
  if (withdrawals.length === 0) return <Empty text="Nenhum saque pendente." />;
  return (
    <div className="space-y-3">
      {withdrawals.map((w) => (
        <div key={w.id} className="rounded-2xl glass p-5 grid md:grid-cols-[1fr_auto] gap-4 items-center">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{w.userName}</span>
              <span className="font-mono-tag text-white/50">{w.userEmail}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <KV label="Valor BTC" v={fmtBTC(w.amountBTC)} />
              <KV label="≈ BRL" v={fmtBRL(w.amountBRL)} />
              <KV label="Solicitado em" v={new Date(w.createdAt).toLocaleString("pt-BR")} />
            </div>
            <div>
              <div className="font-mono-tag text-white/40 mb-1">CARTEIRA DE DESTINO</div>
              <div className="rounded-xl bg-black/40 border border-white/10 p-2 font-mono text-[11px] break-all text-white/85">
                {w.destinationWallet}
              </div>
            </div>
          </div>
          <div className="flex md:flex-col gap-2 md:w-44">
            <button
              onClick={() => setWithdrawStatus(w.id, "approved")}
              className="flex-1 rounded-full bg-lime text-black font-bold py-2 text-sm flex items-center justify-center gap-1"
            >
              <Check className="h-4 w-4" /> Aprovar
            </button>
            <button
              onClick={() => setWithdrawStatus(w.id, "rejected")}
              className="flex-1 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold hover:border-warning/60 hover:text-warning transition flex items-center justify-center gap-1"
            >
              <X className="h-4 w-4" /> Rejeitar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function UsersTab({ users }: { users: User[] }) {
  if (users.length === 0) return <Empty text="Nenhum cliente cadastrado ainda." />;
  return (
    <div className="rounded-2xl glass overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-white/50 font-mono-tag text-[11px]">
            <tr>
              <th className="text-left p-3">NOME</th>
              <th className="text-left p-3">E-MAIL</th>
              <th className="text-left p-3">KYC</th>
              <th className="text-right p-3">SALDO BTC</th>
              <th className="text-right p-3">DEPÓSITOS</th>
              <th className="text-left p-3">CADASTRO</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-white/[0.02]">
                <td className="p-3 font-semibold">{u.name}</td>
                <td className="p-3 font-mono-tag text-white/70">{u.email}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      u.kycStatus === "approved"
                        ? "bg-lime/15 text-lime"
                        : u.kycStatus === "pending"
                          ? "bg-warning/15 text-warning"
                          : u.kycStatus === "rejected"
                            ? "bg-red-500/15 text-red-400"
                            : "bg-white/10 text-white/50"
                    }`}
                  >
                    {u.kycStatus.toUpperCase()}
                  </span>
                </td>
                <td className="p-3 text-right tabular-nums">{u.balanceBTC.toFixed(8)}</td>
                <td className="p-3 text-right tabular-nums">{u.totalDepositBTC.toFixed(8)}</td>
                <td className="p-3 text-white/60">{new Date(u.createdAt).toLocaleDateString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-3 text-xs text-white/40 flex items-center gap-2 border-t border-white/5">
        <Copy className="h-3 w-3" /> Carteira oficial Hexa Corp:{" "}
        <code className="text-white/70">{WALLET_ADDRESS}</code>
        <a
          href={`https://mempool.space/address/${WALLET_ADDRESS}`}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-1 text-lime hover:underline"
        >
          Ver no explorer <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

function KV({ label, v, full }: { label: string; v?: string; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <div className="font-mono-tag text-white/40">{label}</div>
      <div className="text-white/90 truncate">{v || "—"}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl glass p-10 text-center text-sm text-white/50">{text}</div>
  );
}
