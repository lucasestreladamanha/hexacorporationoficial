import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  Lock,
  AlertTriangle,
  Loader2,
  Mail,
  TrendingUp,
  Layers,
  Building2,
  LineChart,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  LogOut,
  Zap,
  Scale,
  Activity,
  Store,
  User as UserIcon,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { HexaCoin } from "@/components/HexaCoin";
import { Stepper } from "@/components/Stepper";
import {
  WALLET_ADDRESS,
  SUPPORT_EMAIL,
  useBtcPrice,
  useMarket,
  useStore,
  signUp,
  logIn,
  logOut,
  submitKyc,
  createDeposit,
  createWithdraw,
  fmtBRL,
  fmtBTC,
  type User,
} from "@/lib/hexa-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hexa Corp — Arbitragem de Funding Rate em Bitcoin" },
      {
        name: "description",
        content:
          "Hexa Corp · Plataforma institucional de arbitragem delta-neutra em BTC. Bônus de 30% no primeiro aporte.",
      },
      { property: "og:title", content: "Hexa Corp — Yield em BTC delta-neutro" },
      {
        property: "og:description",
        content: "Capture o diferencial de funding rate entre exchanges com posições delta-neutras.",
      },
    ],
  }),
  component: Funnel,
});

type Step =
  | "landing"
  | "auth"
  | "kyc"
  | "kyc-pending"
  | "claim"
  | "deposit"
  | "payment"
  | "confirmed"
  | "dashboard";

const SIGNUP_STEPS: Step[] = ["auth", "kyc", "claim", "deposit", "payment", "confirmed"];

function Funnel() {
  const db = useStore();
  const currentUser = db.sessionUserId
    ? db.users.find((u) => u.id === db.sessionUserId) ?? null
    : null;

  const [step, setStep] = useState<Step>("landing");
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");

  // If logged in but at landing, send to dashboard.
  useEffect(() => {
    if (currentUser && step === "landing") setStep("dashboard");
  }, [currentUser, step]);

  const go = (s: Step) => {
    setStep(s);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const isWide = step === "landing" || step === "dashboard";
  const showStepper =
    authMode === "signup" && SIGNUP_STEPS.includes(step) && step !== "auth";
  const stepIdx = SIGNUP_STEPS.indexOf(step);

  return (
    <div className="min-h-screen flex flex-col p-2 sm:p-4">
      <div className="relative mx-auto w-full max-w-[1600px] flex-1 flex flex-col rounded-[2rem] sm:rounded-[2.5rem] ring-1 ring-white/10 shadow-2xl bg-[#0c0c0c] overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-40 h-[420px] w-[420px] rounded-full"
          style={{ background: "radial-gradient(circle, oklch(0.83 0.17 84 / 22%) 0%, transparent 70%)", filter: "blur(120px)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-40 h-[420px] w-[420px] rounded-full"
          style={{ background: "radial-gradient(circle, oklch(0.72 0.16 78 / 22%) 0%, transparent 70%)", filter: "blur(120px)" }}
        />

        <Header
          onHome={() => {
            if (currentUser) go("dashboard");
            else go("landing");
          }}
          showDashboardLink={step === "dashboard"}
        />

        <main className={`relative flex-1 mx-auto w-full ${isWide ? "max-w-6xl" : "max-w-md"} px-4 sm:px-5 pb-24 pt-4 sm:pt-6`}>
          {showStepper && (
            <div className="mb-6 max-w-md mx-auto hidden sm:block">
              <Stepper current={stepIdx} total={SIGNUP_STEPS.length} />
            </div>
          )}

          <div key={step} className="animate-count-up">
            {step === "landing" && (
              <Landing
                onStart={() => { setAuthMode("signup"); go("auth"); }}
                onLogin={() => { setAuthMode("login"); go("auth"); }}
              />
            )}
            {step === "auth" && (
              <Auth
                mode={authMode}
                onModeChange={setAuthMode}
                onSignupDone={() => go("kyc")}
                onLoginDone={() => go("dashboard")}
              />
            )}
            {step === "kyc" && currentUser && (
              <KycForm user={currentUser} onSubmitted={() => go("kyc-pending")} />
            )}
            {step === "kyc-pending" && currentUser && (
              <KycPending user={currentUser} onContinue={() => go("claim")} />
            )}
            {step === "claim" && <Claim onNext={() => go("deposit")} />}
            {step === "deposit" && currentUser && (
              <DepositFlow
                user={currentUser}
                onPayment={() => go("payment")}
                onConfirmed={() => go("dashboard")}
                renderStep="deposit"
              />
            )}
            {step === "payment" && currentUser && (
              <DepositFlow
                user={currentUser}
                onPayment={() => go("payment")}
                onConfirmed={() => go("dashboard")}
                renderStep="payment"
              />
            )}
            {step === "dashboard" && currentUser && (
              <Dashboard user={currentUser} onLogout={() => { logOut(); go("landing"); }} />
            )}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}

function Header({ onHome, showDashboardLink }: { onHome: () => void; showDashboardLink: boolean }) {
  return (
    <header className="relative z-30 px-4 sm:px-5 pt-4 sm:pt-5">
      <div className="mx-auto max-w-6xl flex items-center justify-between">
        <button onClick={onHome} className="leading-tight text-left">
          <div className="text-sm font-semibold tracking-tight flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-lime" />
            Hexa Corp
          </div>
          <div className="font-mono-tag text-white/50 -mt-0.5">Funding Rate Arbitrage</div>
        </button>
        {!showDashboardLink && (
          <nav className="hidden sm:flex items-center gap-6 font-mono-tag text-white/60">
            <a href="#tese" className="hover:text-lime transition">TESE</a>
            <a href="#como" className="hover:text-lime transition">COMO FUNCIONA</a>
            <a href="#performance" className="hover:text-lime transition">PERFORMANCE</a>
            <a href="#bonus" className="hover:text-lime transition">BÔNUS</a>
          </nav>
        )}
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="relative mx-auto max-w-6xl w-full px-4 sm:px-5 py-8">
      <div className="border-t border-white/10 pt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="font-mono-tag text-white/30">© 2026 HEXA CORP · TODOS OS DIREITOS RESERVADOS</div>
      </div>
    </footer>
  );
}

/* ---------- LANDING ---------- */

function Landing({ onStart, onLogin }: { onStart: () => void; onLogin: () => void }) {
  return (
    <div className="space-y-20 sm:space-y-24">
      <section className="grid md:grid-cols-2 gap-10 items-center pt-4">
        <div className="space-y-6">
          <div className="font-mono-tag text-lime">// FUNDING RATE ARBITRAGE</div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold leading-[0.95] tracking-[-0.05em]">
            Rendimento em BTC,{" "}
            <span
              className="italic font-light"
              style={{
                backgroundImage: "linear-gradient(135deg, #f7c948 0%, #ffffff 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              sem exposição ao preço
            </span>
          </h1>
          <p className="text-white/70 leading-relaxed max-w-xl">
            A <b>Hexa Corp</b> opera arbitragem de <span className="text-lime">funding rate</span> entre exchanges
            de derivativos. Posições <b className="text-white">delta-neutras</b> capturam o diferencial pago
            entre traders alavancados — gerando yield em Bitcoin independentemente da direção do mercado.
          </p>

          <div className="grid grid-cols-3 gap-3 max-w-xl">
            <StatChip label="APY MÉDIO" value="18,4%" />
            <StatChip label="DELTA" value="≈ 0" />
            <StatChip label="LIQUIDEZ" value="24/7" />
          </div>

          <div className="rounded-2xl glass p-4 flex items-start gap-3 max-w-xl">
            <div className="h-9 w-9 rounded-full bg-lime/15 text-lime flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-sm">
              <div className="font-semibold text-lime">Bônus de 30% imediato</div>
              <div className="text-white/60 text-xs mt-0.5">
                Aplicado no primeiro aporte como crédito de yield acelerado.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={onStart}
              className="group inline-flex items-center gap-2 rounded-full bg-lime text-black font-bold tracking-tight px-7 py-4 text-sm transition-all duration-300 hover:scale-[1.02]"
              style={{ boxShadow: "0 0 30px oklch(0.83 0.17 84 / 35%)" }}
            >
              Começar agora <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={onLogin}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-4 text-sm font-semibold hover:border-lime/50 transition"
            >
              Já tenho conta
            </button>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="animate-float"><HexaCoin size={300} /></div>
        </div>
      </section>

      <section id="tese" className="space-y-8">
        <SectionHeading tag="A TESE" title="Funding rate é o motor invisível dos derivativos cripto" />
        <div className="grid md:grid-cols-2 gap-6">
          <p className="text-white/70 leading-relaxed">
            Em contratos perpétuos, o <span className="text-lime">funding rate</span> é o pagamento periódico
            entre quem está comprado e quem está vendido. Em mercados otimistas, longs pagam shorts.
          </p>
          <p className="text-white/70 leading-relaxed">
            A Hexa Corp fica neutra: <b className="text-white">comprada no spot</b> e <b className="text-white">vendida
            no perpétuo</b>, sempre na mesma quantidade. O que sobra é o funding — pago a cada 8h, em BTC, 24/7.
          </p>
        </div>
      </section>

      <section id="como" className="space-y-8">
        <SectionHeading tag="COMO FUNCIONA" title="Quatro passos, posição delta-neutra" />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StepCard n={1} icon={<Wallet className="h-5 w-5" />} title="Você aporta em BTC" text="Capital em custódia institucional segregada." />
          <StepCard n={2} icon={<Scale className="h-5 w-5" />} title="Posição equilibrada" text="Long spot + short perpétuo. Exposição líquida ≈ 0." />
          <StepCard n={3} icon={<Activity className="h-5 w-5" />} title="Captura de funding" text="A cada 8h o funding rate é creditado." />
          <StepCard n={4} icon={<Zap className="h-5 w-5" />} title="Yield em BTC" text="Saldo e histórico transparentes no painel." />
        </div>
      </section>

      <section id="performance" className="grid md:grid-cols-2 gap-10 items-center">
        <div className="space-y-5">
          <SectionHeading tag="PERFORMANCE" title="Yield consistente, descorrelacionado" inline />
          <p className="text-white/70 leading-relaxed">
            Nosso retorno depende do <span className="text-lime">spread de funding</span> entre venues — não do preço do BTC.
          </p>
          <div className="grid grid-cols-3 gap-3">
            <StatChip label="APY 12M" value="18,4%" />
            <StatChip label="MELHOR MÊS" value="+3,1%" />
            <StatChip label="MESES POSITIVOS" value="11/12" />
          </div>
        </div>
        <div className="rounded-[2rem] glass p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-mono-tag text-white/50">YIELD ACUMULADO (BTC)</div>
              <div className="text-2xl font-semibold tracking-tight mt-1">+18,4% / 12M</div>
            </div>
            <div className="font-mono-tag text-lime flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-lime animate-pulse" /> AO VIVO
            </div>
          </div>
          <YieldChart height={180} />
        </div>
      </section>

      <section id="bonus" className="space-y-8">
        <SectionHeading tag="BÔNUS" title="Yield acelerado de boas-vindas" />
        <div className="rounded-[2rem] p-8 sm:p-10 text-center relative overflow-hidden border border-lime/30"
          style={{ background: "linear-gradient(180deg, oklch(0.83 0.17 84 / 8%) 0%, oklch(0.13 0 0) 100%)" }}
        >
          <div className="absolute -top-10 -right-10 opacity-30"><HexaCoin size={180} /></div>
          <div className="relative space-y-5">
            <div className="font-mono-tag text-lime">RECOMPENSA DE BOAS-VINDAS</div>
            <div className="text-6xl sm:text-7xl font-semibold tracking-[-0.06em] shimmer-text">+30%</div>
            <p className="text-white/70 max-w-xl mx-auto">
              Receba <b className="text-white">+30% em BTC</b> creditados no primeiro aporte, após aprovação.
            </p>
            <button
              onClick={onStart}
              className="inline-flex items-center gap-2 rounded-full bg-lime text-black font-bold tracking-tight px-7 py-4 text-sm transition-all duration-300 hover:scale-[1.02]"
              style={{ boxShadow: "0 0 30px oklch(0.83 0.17 84 / 35%)" }}
            >
              Garantir meu bônus de 30% <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeading({ tag, title, inline }: { tag: string; title: string; inline?: boolean }) {
  return (
    <div className={inline ? "space-y-3" : "space-y-3 text-center max-w-3xl mx-auto"}>
      <div className="font-mono-tag text-lime">// {tag}</div>
      <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.05em] leading-tight">{title}</h2>
    </div>
  );
}

function StepCard({ n, icon, title, text }: { n: number; icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl glass p-5 space-y-3 hover:border-lime/40 transition">
      <div className="flex items-center justify-between">
        <div className="h-10 w-10 rounded-xl bg-lime/15 text-lime flex items-center justify-center">{icon}</div>
        <div className="font-mono-tag text-white/40">0{n}</div>
      </div>
      <div className="font-semibold tracking-tight">{title}</div>
      <p className="text-sm text-white/65 leading-relaxed">{text}</p>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl glass p-3 text-center">
      <div className="font-mono-tag text-white/50">{label}</div>
      <div className="text-lg font-semibold text-lime tabular-nums mt-0.5">{value}</div>
    </div>
  );
}

/* ---------- YIELD CHART ---------- */

function YieldChart({ height = 160 }: { height?: number }) {
  const points = useMemo(() => {
    const n = 60;
    const seed = 7;
    const arr: number[] = [];
    let v = 0;
    for (let i = 0; i < n; i++) {
      const noise = Math.sin(i * 0.7 + seed) * 0.4 + Math.cos(i * 0.31) * 0.2;
      v += 0.3 + noise * 0.35;
      arr.push(Math.max(0, v));
    }
    const last = arr[arr.length - 1];
    const scale = 18 / last;
    return arr.map((x) => x * scale);
  }, []);

  const W = 600;
  const H = height;
  const pad = 8;
  const max = Math.max(...points);
  const xStep = (W - pad * 2) / (points.length - 1);
  const yFor = (v: number) => H - pad - (v / max) * (H - pad * 2);
  const path = points.map((v, i) => `${i === 0 ? "M" : "L"} ${pad + i * xStep} ${yFor(v)}`).join(" ");
  const area = `${path} L ${pad + (points.length - 1) * xStep} ${H - pad} L ${pad} ${H - pad} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="none">
      <defs>
        <linearGradient id="yieldFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.83 0.17 84)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="oklch(0.83 0.17 84)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1={pad} x2={W - pad} y1={pad + g * (H - pad * 2)} y2={pad + g * (H - pad * 2)} stroke="oklch(1 0 0 / 6%)" strokeDasharray="3 4" />
      ))}
      <path d={area} fill="url(#yieldFill)" />
      <path d={path} fill="none" stroke="oklch(0.83 0.17 84)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pad + (points.length - 1) * xStep} cy={yFor(points[points.length - 1])} r="4" fill="oklch(0.83 0.17 84)" />
    </svg>
  );
}

/* ---------- AUTH ---------- */

function Auth({
  mode, onModeChange, onSignupDone, onLoginDone,
}: {
  mode: "signup" | "login";
  onModeChange: (m: "signup" | "login") => void;
  onSignupDone: () => void;
  onLoginDone: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const valid = email.includes("@") && password.length >= 6 && (mode === "login" || name.trim().length >= 2);

  const submit = () => {
    setError(null);
    setLoading(true);
    setTimeout(() => {
      if (mode === "signup") {
        const r = signUp({ name, email, password });
        setLoading(false);
        if ("error" in r) return setError(r.error);
        onSignupDone();
      } else {
        const r = logIn(email, password);
        setLoading(false);
        if ("error" in r) return setError(r.error);
        onLoginDone();
      }
    }, 500);
  };

  return (
    <div className="space-y-5">
      <SectionTitle
        title={mode === "signup" ? "Crie sua conta Hexa Corp" : "Acesse sua conta"}
        subtitle={
          mode === "signup"
            ? "Cadastre-se em 1 minuto e ative o bônus de 30% no primeiro aporte."
            : "Entre com seu e-mail e senha para acessar o painel."
        }
      />

      <div className="grid grid-cols-2 gap-1 rounded-full glass p-1">
        {(["signup", "login"] as const).map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className={`rounded-full py-2 text-xs font-semibold tracking-wide transition ${
              mode === m ? "bg-lime text-black" : "text-white/60 hover:text-white"
            }`}
          >
            {m === "signup" ? "CADASTRO" : "LOGIN"}
          </button>
        ))}
      </div>

      <div className="rounded-[2rem] glass p-5 space-y-3">
        {mode === "signup" && (
          <Field label="NOME COMPLETO">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className={inputCls} />
          </Field>
        )}

        <Field label="E-MAIL">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="voce@email.com" className={inputCls + " pl-10"} />
          </div>
        </Field>

        <Field label="SENHA">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" className={inputCls + " pl-10"} />
          </div>
        </Field>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300">{error}</div>
        )}
      </div>

      <PrimaryButton onClick={submit} disabled={!valid || loading}>
        {loading ? (
          <><Loader2 className="h-5 w-5 animate-spin" /> {mode === "signup" ? "Criando conta…" : "Entrando…"}</>
        ) : (
          <>{mode === "signup" ? "Criar conta" : "Entrar"} <ArrowRight className="h-5 w-5" /></>
        )}
      </PrimaryButton>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3.5 text-sm outline-none focus:border-lime focus:ring-2 focus:ring-lime/30 transition placeholder:text-white/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="font-mono-tag text-white/50">{label}</label>
      {children}
    </div>
  );
}

/* ---------- KYC (Identificação) ---------- */

function KycForm({ user, onSubmitted }: { user: User; onSubmitted: () => void }) {
  const [cpf, setCpf] = useState(user.cpf ?? "");
  const [birthDate, setBirthDate] = useState(user.birthDate ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [address, setAddress] = useState(user.address ?? "");
  const [city, setCity] = useState(user.city ?? "");
  const [state, setState] = useState(user.state ?? "");
  const [zip, setZip] = useState(user.zip ?? "");
  const [loading, setLoading] = useState(false);

  const valid =
    cpf.replace(/\D/g, "").length === 11 &&
    birthDate.length === 10 &&
    phone.replace(/\D/g, "").length >= 10 &&
    address.trim().length >= 5 &&
    city.trim().length >= 2 &&
    state.trim().length === 2 &&
    zip.replace(/\D/g, "").length === 8;

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Identificação"
        subtitle="Conforme exigência regulatória (KYC), precisamos confirmar seus dados antes de liberar o painel."
      />

      <div className="rounded-[2rem] glass p-5 space-y-3">
        <Field label="CPF"><input value={cpf} onChange={(e) => setCpf(maskCPF(e.target.value))} placeholder="000.000.000-00" className={inputCls} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="DATA DE NASCIMENTO"><input value={birthDate} onChange={(e) => setBirthDate(maskDate(e.target.value))} placeholder="DD/MM/AAAA" className={inputCls} /></Field>
          <Field label="TELEFONE"><input value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} placeholder="(11) 99999-0000" className={inputCls} /></Field>
        </div>
        <Field label="ENDEREÇO"><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número e complemento" className={inputCls} /></Field>
        <div className="grid grid-cols-[1fr_80px_120px] gap-3">
          <Field label="CIDADE"><input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} /></Field>
          <Field label="UF"><input value={state} onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))} className={inputCls} /></Field>
          <Field label="CEP"><input value={zip} onChange={(e) => setZip(maskCep(e.target.value))} placeholder="00000-000" className={inputCls} /></Field>
        </div>

        <div className="rounded-xl bg-lime/10 border border-lime/30 p-3 text-xs text-white/80 flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 text-lime shrink-0 mt-0.5" />
          <span>Seus dados serão analisados manualmente pelo nosso time. A aprovação leva poucos minutos.</span>
        </div>
      </div>

      <PrimaryButton
        onClick={() => {
          setLoading(true);
          setTimeout(() => {
            submitKyc(user.id, { cpf, birthDate, phone, address, city, state, zip });
            setLoading(false);
            onSubmitted();
          }, 700);
        }}
        disabled={!valid || loading}
      >
        {loading ? (
          <><Loader2 className="h-5 w-5 animate-spin" /> Enviando…</>
        ) : (
          <>Enviar para análise <ArrowRight className="h-5 w-5" /></>
        )}
      </PrimaryButton>
    </div>
  );
}

function KycPending({ user, onContinue }: { user: User; onContinue: () => void }) {
  const approved = user.kycStatus === "approved";
  return (
    <div className="space-y-5 text-center">
      <div className="flex justify-center pt-2">
        <div className={`h-20 w-20 rounded-full flex items-center justify-center ${approved ? "bg-lime/20 animate-pulse-gold" : "bg-warning/15"}`}>
          {approved ? <Check className="h-10 w-10 text-lime" /> : <Clock className="h-10 w-10 text-warning" />}
        </div>
      </div>
      <SectionTitle
        title={approved ? "Cadastro aprovado" : "Cadastro em análise"}
        subtitle={
          approved
            ? "Seus dados foram aprovados. Você pode avançar para o aporte."
            : "Nosso time está revisando seus dados. Assim que aprovado você poderá depositar e receber o bônus."
        }
      />
      <div className="rounded-[2rem] glass p-5 space-y-2 text-left">
        <Row label="Nome" value={user.name} />
        <Row label="CPF" value={user.cpf ?? "—"} />
        <Row label="Status" value={user.kycStatus.toUpperCase()} highlight={approved} />
      </div>
      <PrimaryButton onClick={onContinue} disabled={!approved}>
        {approved ? <>Continuar para o aporte <ArrowRight className="h-5 w-5" /></> : "Aguardando aprovação…"}
      </PrimaryButton>
    </div>
  );
}

/* ---------- CLAIM ---------- */

function Claim({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-5">
      <SectionTitle
        title="Ative seu bônus de boas-vindas"
        subtitle="Como novo cliente, você tem direito a +30% em BTC creditados após a aprovação do primeiro aporte."
      />
      <div className="rounded-[2rem] glass p-6 space-y-4">
        <div className="flex justify-center"><HexaCoin size={104} /></div>
        <div className="text-center space-y-1">
          <div className="font-mono-tag text-white/50">YIELD ACELERADO DE BOAS-VINDAS</div>
          <div className="text-5xl font-semibold tracking-[-0.06em] shimmer-text">+30%</div>
          <div className="text-xs text-white/60">Creditado em BTC após confirmação manual do depósito</div>
        </div>
        <BenefitRow text="Crédito em BTC após aprovação do depósito" />
        <BenefitRow text="Estratégia delta-neutra ativa 24/7" />
        <BenefitRow text="Painel transparente de funding capturado" />
      </div>
      <PrimaryButton onClick={onNext}>Continuar para o aporte <ArrowRight className="h-5 w-5" /></PrimaryButton>
    </div>
  );
}

function BenefitRow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/10 p-3">
      <span className="h-1.5 w-1.5 rounded-full bg-lime shrink-0" />
      <span className="text-sm text-white/90">{text}</span>
    </div>
  );
}

/* ---------- DEPOSIT FLOW (BRL → BTC) ---------- */

function DepositFlow({
  user, onPayment, onConfirmed, renderStep,
}: {
  user: User;
  onPayment: () => void;
  onConfirmed: () => void;
  renderStep: "deposit" | "payment";
}) {
  const { brl: btcRate, loading: priceLoading } = useBtcPrice();
  const [brl, setBrl] = useState<string>("1000");
  const [submitting, setSubmitting] = useState(false);

  const brlNum = Math.max(0, Number(brl.replace(/\./g, "").replace(",", ".")) || 0);
  const btcNum = btcRate > 0 ? brlNum / btcRate : 0;
  const minBRL = 100;
  const valid = brlNum >= minBRL && btcRate > 0;

  if (renderStep === "deposit") {
    const quickBRL = [500, 1000, 5000, 10000, 25000, 50000];
    return (
      <div className="space-y-5">
        <SectionTitle
          title="Defina o valor do aporte"
          subtitle="Informe o valor em reais (BRL). Calculamos o equivalente em BTC com a cotação ao vivo da CoinGecko."
        />
        <div className="rounded-[2rem] glass p-5 space-y-4">
          <div className="rounded-xl bg-black/40 border border-white/10 p-3 flex items-center justify-between">
            <div>
              <div className="font-mono-tag text-white/50">COTAÇÃO BTC/BRL</div>
              <div className="text-sm font-semibold tabular-nums mt-0.5">
                {priceLoading ? "Carregando…" : fmtBRL(btcRate)}
              </div>
            </div>
            <div className="font-mono-tag text-lime flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-lime animate-pulse" /> AO VIVO
            </div>
          </div>

          <Field label="VALOR DO APORTE (BRL)">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono-tag text-lime">R$</span>
              <input
                value={brl}
                onChange={(e) => setBrl(e.target.value.replace(/[^0-9.,]/g, ""))}
                inputMode="decimal"
                placeholder="1000"
                className="w-full rounded-xl bg-white/[0.04] border border-white/10 pl-12 pr-4 py-4 text-3xl font-semibold tabular-nums outline-none focus:border-lime focus:ring-2 focus:ring-lime/30 transition"
              />
            </div>
          </Field>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {quickBRL.map((q) => (
              <button
                key={q}
                onClick={() => setBrl(String(q))}
                className={`rounded-lg py-2 text-xs font-semibold border transition tabular-nums ${
                  brlNum === q ? "bg-lime text-black border-lime" : "bg-white/[0.03] border-white/10 text-white/60 hover:text-white"
                }`}
              >
                R$ {q.toLocaleString("pt-BR")}
              </button>
            ))}
          </div>

          <div className="rounded-xl bg-black/40 border border-white/10 p-4 space-y-1">
            <div className="font-mono-tag text-white/50">EQUIVALENTE EM BTC</div>
            <div className="text-3xl font-semibold tabular-nums tracking-tight">{fmtBTC(btcNum)}</div>
            <div className="text-xs text-white/40 tabular-nums">≈ {fmtBRL(brlNum)} · 1 BTC ≈ {fmtBRL(btcRate)}</div>
          </div>

          {!user.firstDepositDone && (
            <div className="rounded-xl bg-lime/10 border border-lime/30 p-3 flex items-center justify-between">
              <div>
                <div className="font-mono-tag text-lime/80">BÔNUS DE BOAS-VINDAS</div>
                <div className="text-sm font-semibold text-lime tabular-nums">
                  +{(btcNum * 0.3).toLocaleString("pt-BR", { minimumFractionDigits: 6, maximumFractionDigits: 8 })} BTC após aprovação
                </div>
              </div>
              <div className="rounded-full bg-lime/20 px-3 py-1 text-xs font-bold text-lime">+30%</div>
            </div>
          )}

          {brlNum > 0 && brlNum < minBRL && (
            <p className="text-xs text-warning">Aporte mínimo: {fmtBRL(minBRL)}</p>
          )}
        </div>

        <PrimaryButton onClick={onPayment} disabled={!valid}>
          Gerar endereço de depósito <ArrowRight className="h-5 w-5" />
        </PrimaryButton>

        {/* keep value for payment step via sessionStorage */}
        <HiddenPersist value={brl} />
      </div>
    );
  }

  // PAYMENT step — read value from sessionStorage if needed
  const persisted = typeof window !== "undefined" ? window.sessionStorage.getItem("hexa_deposit_brl") : null;
  const usedBRL = persisted ? Number(persisted) : brlNum;
  const usedBTC = btcRate > 0 ? usedBRL / btcRate : 0;

  const submit = () => {
    setSubmitting(true);
    setTimeout(() => {
      createDeposit({ userId: user.id, amountBRL: usedBRL, amountBTC: usedBTC, btcRateBRL: btcRate });
      window.sessionStorage.removeItem("hexa_deposit_brl");
      setSubmitting(false);
      onConfirmed();
    }, 800);
  };

  return <PaymentScreen amountBRL={usedBRL} amountBTC={usedBTC} btcRate={btcRate} onSubmit={submit} submitting={submitting} />;
}

function HiddenPersist({ value }: { value: string }) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const num = Number(value.replace(/\./g, "").replace(",", ".")) || 0;
      window.sessionStorage.setItem("hexa_deposit_brl", String(num));
    }
  }, [value]);
  return null;
}

function PaymentScreen({
  amountBRL, amountBTC, btcRate, onSubmit, submitting,
}: {
  amountBRL: number; amountBTC: number; btcRate: number; onSubmit: () => void; submitting: boolean;
}) {
  const [copied, setCopied] = useState<"addr" | "btc" | "email" | null>(null);
  const copy = async (text: string, key: "addr" | "btc" | "email") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };
  const btcStr = amountBTC.toFixed(8);

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Envie seu depósito em BTC"
        subtitle={`Envie exatamente ${fmtBTC(amountBTC)} para o endereço abaixo. Após o pagamento, encaminhe o comprovante para ${SUPPORT_EMAIL}.`}
      />

      <div className="rounded-[2rem] glass p-5 space-y-4">
        <div className="rounded-xl bg-black/40 border border-white/10 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono-tag text-white/50">VALOR EM REAIS</span>
            <span className="font-mono-tag text-white/40 tabular-nums">1 BTC ≈ {fmtBRL(btcRate)}</span>
          </div>
          <div className="text-2xl font-semibold tabular-nums">{fmtBRL(amountBRL)}</div>
          <div className="h-px bg-white/10 my-1" />
          <div className="flex items-center justify-between">
            <span className="font-mono-tag text-lime">VALOR EXATO A ENVIAR</span>
            <button onClick={() => copy(btcStr, "btc")} className="font-mono-tag text-lime hover:underline flex items-center gap-1">
              {copied === "btc" ? <><Check className="h-3 w-3" /> COPIADO</> : <><Copy className="h-3 w-3" /> COPIAR</>}
            </button>
          </div>
          <div className="text-3xl font-semibold tabular-nums tracking-tight text-lime">{btcStr} BTC</div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono-tag text-white/50">ENDEREÇO BITCOIN (REDE BTC)</span>
            <button onClick={() => copy(WALLET_ADDRESS, "addr")} className="font-mono-tag text-lime hover:underline flex items-center gap-1">
              {copied === "addr" ? <><Check className="h-3 w-3" /> COPIADO</> : <><Copy className="h-3 w-3" /> COPIAR</>}
            </button>
          </div>
          <div className="rounded-xl bg-black/50 border border-white/10 p-3 font-mono text-[12px] leading-relaxed break-all text-white/85 select-all">
            {WALLET_ADDRESS}
          </div>
        </div>

        <div className="rounded-xl bg-lime/10 border border-lime/30 p-4 text-sm text-white/90 space-y-2">
          <div className="flex items-start gap-2">
            <Mail className="h-4 w-4 text-lime mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-lime">Envie o comprovante para:</div>
              <div className="flex items-center gap-2 mt-1">
                <a href={`mailto:${SUPPORT_EMAIL}`} className="font-mono text-white hover:text-lime transition">
                  {SUPPORT_EMAIL}
                </a>
                <button onClick={() => copy(SUPPORT_EMAIL, "email")} className="text-white/50 hover:text-lime">
                  {copied === "email" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-white/60 pl-6">
            Assim que finalizar o pagamento, envie o comprovante junto com seu e-mail de cadastro.
            A liberação do saldo (com o bônus de 30%, se for o primeiro aporte) acontece após a aprovação manual.
          </p>
        </div>

        <div className="rounded-xl bg-warning/10 border border-warning/30 p-3 text-xs text-white/80 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <span>
            Envie <b>exatamente</b> o valor em BTC indicado acima. Valores diferentes podem atrasar a confirmação.
          </span>
        </div>
      </div>

      <PrimaryButton onClick={onSubmit} disabled={submitting}>
        {submitting ? (
          <><Loader2 className="h-5 w-5 animate-spin" /> Registrando solicitação…</>
        ) : (
          <>Já realizei o pagamento <ArrowRight className="h-5 w-5" /></>
        )}
      </PrimaryButton>
    </div>
  );
}

/* ---------- DASHBOARD ---------- */

type DashTab = "overview" | "deposit" | "withdraw" | "market" | "profile";

const TABS: { id: DashTab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Visão", icon: <LineChart className="h-4 w-4" /> },
  { id: "deposit", label: "Depositar", icon: <ArrowDownToLine className="h-4 w-4" /> },
  { id: "withdraw", label: "Sacar", icon: <ArrowUpFromLine className="h-4 w-4" /> },
  { id: "market", label: "Mercado", icon: <Store className="h-4 w-4" /> },
  { id: "profile", label: "Perfil", icon: <UserIcon className="h-4 w-4" /> },
];

function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [tab, setTab] = useState<DashTab>("overview");

  return (
    <div className="md:grid md:grid-cols-[220px_1fr] md:gap-6">
      <aside className="hidden md:block rounded-[2rem] glass p-3 h-fit">
        <div className="space-y-1">
          {TABS.map((t) => (
            <SideItem key={t.id} icon={t.icon} active={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label === "Visão" ? "Visão geral" : t.label}
            </SideItem>
          ))}
          <div className="h-px bg-white/10 my-2" />
          <SideItem icon={<LogOut className="h-4 w-4" />} onClick={onLogout}>Sair</SideItem>
        </div>
      </aside>

      <section className="space-y-4 sm:space-y-5 pb-24 md:pb-0">
        {tab === "overview" && <Overview user={user} onDeposit={() => setTab("deposit")} onWithdraw={() => setTab("withdraw")} />}
        {tab === "deposit" && <DepositTab user={user} onDone={() => setTab("overview")} />}
        {tab === "withdraw" && <WithdrawTab user={user} onDone={() => setTab("overview")} />}
        {tab === "market" && <MarketTab />}
        {tab === "profile" && <ProfileTab user={user} />}
      </section>

      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-40 rounded-2xl glass px-2 py-2 flex items-center justify-around shadow-2xl">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-[10px] font-semibold tracking-wide transition ${
              tab === t.id ? "text-lime" : "text-white/55"
            }`}
          >
            <span className={`${tab === t.id ? "bg-lime/15 rounded-lg p-1.5" : "p-1.5"}`}>{t.icon}</span>
            {t.label.toUpperCase()}
          </button>
        ))}
      </nav>
    </div>
  );
}

function SideItem({ icon, children, active, onClick }: { icon: React.ReactNode; children: React.ReactNode; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active ? "bg-lime/15 text-lime border border-lime/30" : "text-white/70 hover:bg-white/[0.04] border border-transparent"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function Overview({ user, onDeposit, onWithdraw }: { user: User; onDeposit: () => void; onWithdraw: () => void }) {
  const db = useStore();
  const { brl: btcRate } = useBtcPrice();
  const balanceBTC = user.balanceBTC;
  const balanceBRL = balanceBTC * btcRate;

  const myPendingDeposits = db.deposits.filter((d) => d.userId === user.id && d.status === "pending");
  const myPendingWithdrawals = db.withdrawals.filter((w) => w.userId === user.id && w.status === "pending");

  return (
    <>
      <div className="relative overflow-hidden rounded-[2rem] glass p-6">
        <div className="absolute -top-6 -right-6 opacity-40"><HexaCoin size={140} /></div>
        <div className="relative space-y-3">
          <div className="flex items-center gap-2 font-mono-tag text-white/50">
            <Wallet className="h-3 w-3" /> SALDO TOTAL
          </div>
          <div>
            <div className="text-4xl sm:text-5xl font-semibold tracking-[-0.05em] shimmer-text tabular-nums leading-none">
              {balanceBTC.toLocaleString("pt-BR", { minimumFractionDigits: 6, maximumFractionDigits: 8 })}
            </div>
            <div className="font-mono-tag text-lime mt-1.5">BTC</div>
            <div className="text-xs text-white/40 mt-2 tabular-nums">≈ {fmtBRL(balanceBRL)} · 1 BTC ≈ {fmtBRL(btcRate)}</div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              user.kycStatus === "approved" ? "bg-lime/15 border border-lime/30 text-lime" : "bg-warning/15 border border-warning/30 text-warning"
            }`}>
              <ShieldCheck className="h-3 w-3" /> KYC: {user.kycStatus.toUpperCase()}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/10 px-3 py-1 text-xs font-semibold text-white/70">
              <Activity className="h-3 w-3 text-lime" /> Estratégia ativa
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button onClick={onDeposit} className="inline-flex items-center gap-2 rounded-full bg-lime text-black font-bold px-5 py-3 text-sm hover:scale-[1.01] transition">
              <ArrowDownToLine className="h-4 w-4" /> Depositar
            </button>
            <button onClick={onWithdraw} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold hover:border-lime/50 transition">
              <ArrowUpFromLine className="h-4 w-4" /> Sacar
            </button>
          </div>
        </div>
      </div>

      {(myPendingDeposits.length > 0 || myPendingWithdrawals.length > 0) && (
        <div className="rounded-[2rem] glass p-5 space-y-3">
          <div className="font-mono-tag text-white/50">SOLICITAÇÕES EM ANÁLISE</div>
          {myPendingDeposits.map((d) => (
            <div key={d.id} className="rounded-xl bg-warning/5 border border-warning/30 p-3 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-semibold flex items-center gap-2">
                  <ArrowDownToLine className="h-4 w-4 text-warning" /> Depósito · {fmtBTC(d.amountBTC)}
                </div>
                <div className="text-xs text-white/50 tabular-nums">≈ {fmtBRL(d.amountBRL)} · {new Date(d.createdAt).toLocaleString("pt-BR")}</div>
              </div>
              <span className="rounded-full bg-warning/15 text-warning px-2 py-0.5 text-[11px] font-bold">AGUARDANDO</span>
            </div>
          ))}
          {myPendingWithdrawals.map((w) => (
            <div key={w.id} className="rounded-xl bg-warning/5 border border-warning/30 p-3 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-semibold flex items-center gap-2">
                  <ArrowUpFromLine className="h-4 w-4 text-warning" /> Saque · {fmtBTC(w.amountBTC)}
                </div>
                <div className="text-xs text-white/50 tabular-nums">≈ {fmtBRL(w.amountBRL)} · {new Date(w.createdAt).toLocaleString("pt-BR")}</div>
              </div>
              <span className="rounded-full bg-warning/15 text-warning px-2 py-0.5 text-[11px] font-bold">AGUARDANDO</span>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-[2rem] glass p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-mono-tag text-white/50">RENDIMENTO ACUMULADO</div>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight mt-1 tabular-nums">
              +{fmtBTC(user.totalDepositBTC * 0.184)}
            </div>
            <div className="text-xs text-white/40 mt-0.5 tabular-nums">
              ≈ {fmtBRL(user.totalDepositBTC * 0.184 * btcRate)} · APY 18,4%
            </div>
          </div>
          <div className="font-mono-tag text-lime flex items-center gap-1.5 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-lime animate-pulse" /> AO VIVO
          </div>
        </div>
        <YieldChart height={150} />
      </div>
    </>
  );
}

/* ---------- DEPOSIT TAB (inside dashboard) ---------- */

function DepositTab({ user, onDone }: { user: User; onDone: () => void }) {
  const [phase, setPhase] = useState<"amount" | "payment">("amount");
  return (
    <DepositFlow
      user={user}
      onPayment={() => setPhase("payment")}
      onConfirmed={onDone}
      renderStep={phase === "amount" ? "deposit" : "payment"}
    />
  );
}

/* ---------- WITHDRAW TAB ---------- */

function WithdrawTab({ user, onDone }: { user: User; onDone: () => void }) {
  const { brl: btcRate } = useBtcPrice();
  const [val, setVal] = useState<string>("");
  const [wallet, setWallet] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const num = Math.max(0, Number(val) || 0);
  const valid = num > 0 && num <= user.balanceBTC && wallet.trim().length >= 20;

  const submit = () => {
    setError(null);
    setSubmitting(true);
    setTimeout(() => {
      const r = createWithdraw({ userId: user.id, amountBTC: num, amountBRL: num * btcRate, destinationWallet: wallet.trim() });
      setSubmitting(false);
      if ("error" in r) return setError(r.error);
      setDone(true);
      setTimeout(onDone, 1800);
    }, 700);
  };

  if (done) {
    return (
      <div className="rounded-[2rem] glass p-8 text-center space-y-3">
        <div className="mx-auto h-16 w-16 rounded-full bg-warning/15 flex items-center justify-center">
          <Clock className="h-8 w-8 text-warning" />
        </div>
        <div className="text-xl font-semibold">Solicitação enviada</div>
        <div className="text-sm text-white/60">Seu saque foi encaminhado para aprovação manual pela equipe Hexa Corp.</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] glass p-5 sm:p-6 space-y-4">
        <SectionTitle title="Solicitação de saque" subtitle="Informe o valor em BTC e a carteira de destino. Saques passam por aprovação manual." />

        <Field label="VALOR DO SAQUE (BTC)">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono-tag text-lime">BTC</span>
            <input
              value={val}
              onChange={(e) => setVal(e.target.value.replace(/[^0-9.]/g, ""))}
              inputMode="decimal"
              placeholder="0.00000000"
              className="w-full rounded-xl bg-white/[0.04] border border-white/10 pl-16 pr-4 py-4 text-2xl font-semibold tabular-nums outline-none focus:border-lime focus:ring-2 focus:ring-lime/30 transition"
            />
          </div>
        </Field>

        <div className="flex items-center justify-between text-xs">
          <button onClick={() => setVal(user.balanceBTC.toFixed(8))} className="font-semibold text-lime hover:underline">
            Sacar tudo · {fmtBTC(user.balanceBTC)}
          </button>
          <span className="text-white/40 tabular-nums">≈ {fmtBRL(num * btcRate)}</span>
        </div>

        <Field label="CARTEIRA DE DESTINO (BTC)">
          <input
            value={wallet}
            onChange={(e) => setWallet(e.target.value.trim())}
            placeholder="bc1q..."
            className={inputCls + " font-mono text-xs"}
          />
        </Field>

        {error && <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300">{error}</div>}

        <div className="rounded-xl bg-warning/10 border border-warning/30 p-3 text-xs text-white/80 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <span>O saldo é reservado no momento da solicitação. Saques aprovados são enviados à carteira informada.</span>
        </div>
      </div>

      <PrimaryButton onClick={submit} disabled={!valid || submitting}>
        {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Enviando…</> : <>Solicitar saque <ArrowRight className="h-5 w-5" /></>}
      </PrimaryButton>
    </div>
  );
}

/* ---------- MARKET (CoinGecko live) ---------- */

function MarketTab() {
  const { coins, loading } = useMarket();
  const [query, setQuery] = useState("");
  const filtered = coins.filter(
    (a) =>
      a.symbol.toLowerCase().includes(query.toLowerCase()) ||
      a.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="rounded-[2rem] glass p-5 sm:p-6 space-y-4">
      <SectionTitle title="Mercado" subtitle="Cotações em tempo real via CoinGecko." />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar ativo…"
        className={inputCls}
      />
      <div className="divide-y divide-white/10">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 py-2 font-mono-tag text-white/40 text-[10px]">
          <span>ATIVO</span>
          <span className="text-right">PREÇO</span>
          <span className="text-right w-16">24H</span>
        </div>
        {loading && <div className="py-6 text-center text-sm text-white/40">Carregando mercado…</div>}
        {!loading && filtered.map((a) => (
          <div key={a.id} className="grid grid-cols-[1fr_auto_auto] gap-3 py-3 items-center">
            <div className="min-w-0 flex items-center gap-3">
              {a.image && <img src={a.image} alt="" className="h-7 w-7 rounded-full" />}
              <div>
                <div className="font-semibold text-sm uppercase">{a.symbol}</div>
                <div className="font-mono-tag text-white/40">{a.name}</div>
              </div>
            </div>
            <div className="text-right text-sm font-semibold tabular-nums">{fmtBRL(a.current_price)}</div>
            <div className={`text-right text-xs font-semibold tabular-nums w-16 ${(a.price_change_percentage_24h ?? 0) >= 0 ? "text-lime" : "text-warning"}`}>
              {(a.price_change_percentage_24h ?? 0) >= 0 ? "+" : ""}{(a.price_change_percentage_24h ?? 0).toFixed(2)}%
            </div>
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="py-6 text-center text-sm text-white/40">Nenhum ativo encontrado</div>
        )}
      </div>
    </div>
  );
}

/* ---------- PROFILE ---------- */

function ProfileTab({ user }: { user: User }) {
  return (
    <div className="space-y-4">
      <div className="rounded-[2rem] glass p-5 sm:p-6 space-y-4">
        <SectionTitle title="Perfil" subtitle="Suas informações de identificação." />

        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-lime/15 border border-lime/30 flex items-center justify-center text-lime text-xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold truncate">{user.name}</div>
            <div className="font-mono-tag text-white/40 truncate">{user.email}</div>
          </div>
          <span className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold ${
            user.kycStatus === "approved" ? "bg-lime/15 text-lime" : "bg-warning/15 text-warning"
          }`}>
            {user.kycStatus.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Row label="CPF" value={user.cpf ?? "—"} />
          <Row label="Nascimento" value={user.birthDate ?? "—"} />
          <Row label="Telefone" value={user.phone ?? "—"} />
          <Row label="CEP" value={user.zip ?? "—"} />
          <Row label="Cidade/UF" value={`${user.city ?? "—"}${user.state ? " / " + user.state : ""}`} />
          <Row label="Endereço" value={user.address ?? "—"} />
        </div>
      </div>

      <div className="rounded-[2rem] glass p-5 space-y-2 text-sm">
        <div className="font-mono-tag text-white/50">SUPORTE</div>
        <div className="text-white/80">
          Dúvidas ou comprovantes:{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-lime hover:underline font-mono">
            {SUPPORT_EMAIL}
          </a>
        </div>
      </div>
    </div>
  );
}

/* ---------- PRIMITIVES ---------- */

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm gap-3">
      <span className="text-white/60">{label}</span>
      <span className={`${highlight ? "font-bold text-lime" : "font-semibold"} tabular-nums truncate text-right`}>{value}</span>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-2.5">
      <h2 className="text-2xl font-semibold tracking-[-0.05em] leading-tight">{title}</h2>
      {subtitle && <p className="text-sm text-white/60 leading-relaxed">{subtitle}</p>}
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group relative w-full flex items-center justify-center gap-2 rounded-full bg-lime text-black font-bold tracking-tight py-4 text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
      style={{ boxShadow: "0 0 30px oklch(0.83 0.17 84 / 35%)" }}
    >
      {children}
    </button>
  );
}

/* ---------- INPUT MASKS ---------- */

function maskCPF(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
function maskDate(v: string) {
  return v.replace(/\D/g, "").slice(0, 8)
    .replace(/(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})(\d)/, "$1/$2");
}
function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
}
function maskCep(v: string) {
  return v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
}
