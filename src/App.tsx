import { FormEvent, useEffect, useMemo, useState } from "react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4e17834f`;
const AUTH = `https://${projectId}.supabase.co/auth/v1`;

type Session = { access_token: string; user: { email: string; user_metadata?: { name?: string } } };
type Household = {
  id: string; householdId: string; head: string; location: string; phone: string;
  male: number; female: number; children: number; elderly: number; disabled: number;
  electricity: boolean; water: boolean; monthlyIncome: number; demo?: boolean;
};
type Sand = {
  id: string; extractionId: string; date: string; stream: string; location: string;
  extractor: string; permitNo: string; permitExpiry: string; quantityPerTrip: number;
  trips: number; rate: number; permitFee: number; transportCost: number; laborCost: number;
  otherExpense: number; environmentalStatus: string; project: string; demo?: boolean;
};
type Dashboard = {
  households: number; population: number; male: number; female: number;
  children: number; elderly: number; sand: { quantity: number; revenue: number; expenses: number; trips: number; net: number };
};

const icons: Record<string, string> = {
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  home: "M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  folder: "M3 5h6l2 2h10v12H3z",
  temple: "M4 10h16M6 10l6-6 6 6M6 20v-7M10 20v-7M14 20v-7M18 20v-7M3 20h18",
  road: "M9 3 7 21M15 3l2 18M12 4v4M12 11v4M12 18v2",
  water: "M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13z",
  box: "M21 8 12 3 3 8l9 5zM3 8v9l9 5 9-5V8M12 13v9",
  sand: "M3 18h18M5 18l2-7 3 3 3-7 6 11",
  wallet: "M3 6h16a2 2 0 0 1 2 2v10H3zM3 6V4h14v2M16 12h5",
  report: "M6 2h9l5 5v15H6zM14 2v6h6M9 13h8M9 17h8",
  settings: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2 3.46-.08-.02a1.7 1.7 0 0 0-1.8.28l-.47.27a1.7 1.7 0 0 0-1.45 1.1V22h-4v-.08a1.7 1.7 0 0 0-1.45-1.1l-.47-.27a1.7 1.7 0 0 0-1.8-.28l-.08.02-2-3.46.06-.06A1.7 1.7 0 0 0 4.6 15v-.54a1.7 1.7 0 0 0-1.14-1.6H3v-4h.46A1.7 1.7 0 0 0 4.6 7.25v-.54a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2-3.46.08.02a1.7 1.7 0 0 0 1.8-.28l.47-.27A1.7 1.7 0 0 0 10 .08V0h4v.08a1.7 1.7 0 0 0 1.45 1.1l.47.27a1.7 1.7 0 0 0 1.8-.28l.08-.02 2 3.46-.06.06a1.7 1.7 0 0 0-.34 1.88v.54a1.7 1.7 0 0 0 1.14 1.6H21v4h-.46a1.7 1.7 0 0 0-1.14 1.6z",
  plus: "M12 5v14M5 12h14",
  search: "m21 21-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
  chevron: "m9 18 6-6-6-6",
  trash: "M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6",
  logout: "M10 17l5-5-5-5M15 12H3M15 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5",
  menu: "M4 6h16M4 12h16M4 18h16",
  x: "M6 6l12 12M18 6 6 18",
};

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={icons[name]} /></svg>;
}

const money = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
const initialHousehold = { householdId: "", head: "", location: "", phone: "", male: 0, female: 0, children: 0, elderly: 0, disabled: 0, electricity: true, water: true, monthlyIncome: 0 };
const initialSand = { extractionId: "", date: new Date().toISOString().slice(0, 10), stream: "", location: "", extractor: "", permitNo: "", permitExpiry: "", quantityPerTrip: 0, trips: 0, rate: 0, permitFee: 0, transportCost: 0, laborCost: 0, otherExpense: 0, environmentalStatus: "Normal", project: "" };

function Login({ onSession }: { onSession: (session: Session) => void }) {
  const [signup, setSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const endpoint = signup ? `${AUTH}/signup` : `${AUTH}/token?grant_type=password`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { apikey: publicAnonKey, "Content-Type": "application/json" },
        body: JSON.stringify(signup ? { email, password, data: { name } } : { email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || data.error_description || "Unable to continue");
      if (!data.access_token) throw new Error("Check your email to confirm your account, then sign in.");
      sessionStorage.setItem("mn-session", JSON.stringify(data));
      onSession(data);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to continue"); }
    finally { setLoading(false); }
  }

  return <div className="login-page">
    <div className="login-brand">
      <div className="brand-mark large"><Icon name="temple" size={29} /></div>
      <div><strong>မန့်နောင်ရွာ</strong><span>Community Development System</span></div>
    </div>
    <div className="login-card">
      <div className="eyebrow">SECURE COMMUNITY PORTAL</div>
      <h1>{signup ? "Create your account" : "Welcome back"}</h1>
      <p>{signup ? "Set up a verified account for authorized village records." : "Sign in to manage village development records."}</p>
      <form onSubmit={submit}>
        {signup && <label>Full name<input required value={name} onChange={e => setName(e.target.value)} placeholder="Your name" /></label>}
        <label>Email address<input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" /></label>
        <label>Password<input required minLength={8} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" /></label>
        {error && <div className="form-error">{error}</div>}
        <button className="primary full" disabled={loading}>{loading ? "Please wait…" : signup ? "Create account" : "Sign in securely"}</button>
      </form>
      <button className="text-button" onClick={() => { setSignup(!signup); setError(""); }}>{signup ? "Already registered? Sign in" : "New authorized user? Create account"}</button>
      <div className="security-note">Protected by Supabase authentication. Never share your password.</div>
    </div>
  </div>;
}

function App() {
  const [session, setSession] = useState<Session | null>(() => {
    try { return JSON.parse(sessionStorage.getItem("mn-session") || "null"); } catch { return null; }
  });
  if (!session) return <Login onSession={setSession} />;
  return <Workspace session={session} logout={() => { sessionStorage.removeItem("mn-session"); setSession(null); }} />;
}

function Workspace({ session, logout }: { session: Session; logout: () => void }) {
  const [page, setPage] = useState("Dashboard");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [sand, setSand] = useState<Sand[]>([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"household" | "sand" | null>(null);
  const [hhForm, setHhForm] = useState(initialHousehold);
  const [sandForm, setSandForm] = useState(initialSand);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [mobileNav, setMobileNav] = useState(false);

  const call = async (path: string, options?: RequestInit) => {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json", ...options?.headers },
    });
    const data = await response.json();
    if (response.status === 401) { logout(); throw new Error("Your session expired"); }
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
  };

  async function refresh() {
    setLoading(true); setError("");
    try {
      const [dashData, householdData, sandData] = await Promise.all([call("/dashboard"), call("/households"), call("/sand")]);
      setDashboard(dashData); setHouseholds(householdData); setSand(sandData);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load records"); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);

  const filteredHouseholds = useMemo(() => households.filter(h => `${h.householdId} ${h.head} ${h.location}`.toLowerCase().includes(search.toLowerCase())), [households, search]);
  const filteredSand = useMemo(() => sand.filter(s => `${s.extractionId} ${s.stream} ${s.extractor} ${s.project}`.toLowerCase().includes(search.toLowerCase())), [sand, search]);

  async function saveHousehold(e: FormEvent) {
    e.preventDefault(); setError("");
    try {
      await call("/households", { method: "POST", body: JSON.stringify(hhForm) });
      setModal(null); setHhForm(initialHousehold); setNotice("Household record saved securely."); await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save"); }
  }
  async function saveSand(e: FormEvent) {
    e.preventDefault(); setError("");
    try {
      await call("/sand", { method: "POST", body: JSON.stringify(sandForm) });
      setModal(null); setSandForm(initialSand); setNotice("Extraction record saved and totals verified."); await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save"); }
  }
  async function remove(path: string, label: string) {
    if (!confirm(`Delete ${label}? This action is recorded in the audit log.`)) return;
    try { await call(path, { method: "DELETE" }); setNotice("Record deleted and audit log updated."); await refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to delete"); }
  }

  const nav = [
    ["Dashboard", "grid"], ["Households", "home"], ["Population", "users"], ["Projects", "folder"],
    ["Temple Construction", "temple"], ["Roads & Infrastructure", "road"], ["Water & Electricity", "water"],
    ["Stock & Inventory", "box"], ["Sand Extraction", "sand"], ["Finance", "wallet"], ["Reports", "report"], ["Settings", "settings"],
  ];
  const enabled = ["Dashboard", "Households", "Sand Extraction"];
  const displayName = session.user.user_metadata?.name || session.user.email.split("@")[0];

  return <div className="app-shell">
    <aside className={mobileNav ? "sidebar open" : "sidebar"}>
      <div className="sidebar-head"><div className="brand-mark"><Icon name="temple" size={22} /></div><div><strong>မန့်နောင်ရွာ</strong><span>Village Management</span></div></div>
      <nav>{nav.map(([label, icon]) => <button key={label} className={page === label ? "active" : ""} onClick={() => { if (enabled.includes(label)) setPage(label); setMobileNav(false); }}>
        <Icon name={icon} size={19} /><span>{label}</span>{!enabled.includes(label) && <i>soon</i>}
      </button>)}</nav>
      <div className="sidebar-foot"><span className="online-dot" /> Secure sync online</div>
    </aside>
    <main>
      <header className="topbar">
        <button className="icon-button mobile-menu" onClick={() => setMobileNav(!mobileNav)}><Icon name="menu" /></button>
        <div className="top-search"><Icon name="search" size={18} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search records…" /><kbd>⌘ K</kbd></div>
        <div className="top-actions"><button className="language">မြန်မာ <span>|</span> EN</button><button className="icon-button notification"><Icon name="bell" size={19} /><i /></button><div className="profile"><div>{displayName.slice(0, 2).toUpperCase()}</div><span><strong>{displayName}</strong><small>Administrator</small></span></div><button className="icon-button" title="Sign out" onClick={logout}><Icon name="logout" size={18} /></button></div>
      </header>
      <div className="content">
        {notice && <div className="toast" onAnimationEnd={() => setTimeout(() => setNotice(""), 2500)}>{notice}</div>}
        {error && <div className="page-error">{error}<button onClick={() => setError("")}><Icon name="x" size={16} /></button></div>}
        {loading && !dashboard ? <div className="loading">Loading secure records…</div> :
          page === "Dashboard" ? <DashboardPage dashboard={dashboard!} households={households} sand={sand} onNew={() => setModal("household")} /> :
          page === "Households" ? <HouseholdsPage records={filteredHouseholds} onNew={() => setModal("household")} onDelete={id => remove(`/households/${id}`, "this household")} /> :
          page === "Sand Extraction" ? <SandPage records={filteredSand} onNew={() => setModal("sand")} onDelete={id => remove(`/sand/${id}`, "this extraction record")} /> : null}
      </div>
    </main>
    {modal === "household" && <HouseholdModal value={hhForm} setValue={setHhForm} onClose={() => { setModal(null); setError(""); }} onSubmit={saveHousehold} error={error} />}
    {modal === "sand" && <SandModal value={sandForm} setValue={setSandForm} onClose={() => { setModal(null); setError(""); }} onSubmit={saveSand} error={error} />}
  </div>;
}

function PageHead({ eyebrow, title, subtitle, button, onNew }: { eyebrow: string; title: string; subtitle: string; button: string; onNew: () => void }) {
  return <div className="page-head"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div><button className="primary" onClick={onNew}><Icon name="plus" size={18} />{button}</button></div>;
}

function DashboardPage({ dashboard: d, households, sand, onNew }: { dashboard: Dashboard; households: Household[]; sand: Sand[]; onNew: () => void }) {
  const maxPopulation = Math.max(d.male, d.female, d.children, d.elderly, 1);
  const recent = [...sand].slice(0, 4);
  return <>
    <PageHead eyebrow="COMMUNITY OVERVIEW" title="မင်္ဂလာပါ — Good morning" subtitle="Here’s what’s happening across Mant Naung Village." button="New household" onNew={onNew} />
    <div className="kpi-grid">
      <Kpi icon="home" label="Total households" value={d.households} detail="+3 this month" tone="green" />
      <Kpi icon="users" label="Total population" value={d.population} detail={`${d.male} male · ${d.female} female`} tone="blue" />
      <Kpi icon="folder" label="Active projects" value="8" detail="3 nearing completion" tone="amber" />
      <Kpi icon="wallet" label="Available balance" value={`${money(d.sand.net)} K`} detail="Verified extraction net" tone="purple" />
    </div>
    <div className="dashboard-grid">
      <section className="panel population-panel">
        <div className="panel-head"><div><h2>Population overview</h2><p>Registered household members by group</p></div><span className="live-pill">Live data</span></div>
        <div className="population-total"><strong>{d.population}</strong><span>total residents<br/><b>{households.length ? (d.population / households.length).toFixed(1) : 0}</b> avg. per household</span></div>
        <div className="bars">{[["Male", d.male, "#2c7a5a"], ["Female", d.female, "#cf6d5a"], ["Children", d.children, "#e2a944"], ["Elderly", d.elderly, "#8066a8"]].map(([label, value, color]) => <div className="bar-row" key={label as string}><span>{label}</span><div><i style={{ width: `${(Number(value) / maxPopulation) * 100}%`, background: color as string }} /></div><strong>{value}</strong></div>)}</div>
      </section>
      <section className="panel finance-panel">
        <div className="panel-head"><div><h2>Sand resource summary</h2><p>Authorized extraction performance</p></div></div>
        <div className="finance-main"><span>Net revenue</span><strong>{money(d.sand.net)} <small>MMK</small></strong><em>{d.sand.quantity.toFixed(1)} m³ extracted</em></div>
        <div className="finance-split"><div><span>Total revenue</span><strong>{money(d.sand.revenue)} K</strong></div><div><span>Expenses</span><strong>{money(d.sand.expenses)} K</strong></div><div><span>Trips</span><strong>{d.sand.trips}</strong></div></div>
      </section>
    </div>
    <section className="panel activity-panel">
      <div className="panel-head"><div><h2>Recent extraction activity</h2><p>Latest permitted stream resource records</p></div><span className="text-link">All figures calculated automatically</span></div>
      <div className="table-wrap"><table><thead><tr><th>Record</th><th>Stream / Project</th><th>Quantity</th><th>Revenue</th><th>Environment</th></tr></thead><tbody>{recent.map(row => {
        const quantity = row.quantityPerTrip * row.trips; return <tr key={row.id}><td><strong>{row.extractionId}</strong><small>{row.date}{row.demo && " · DEMO DATA"}</small></td><td><strong>{row.stream}</strong><small>{row.project}</small></td><td>{quantity.toFixed(1)} m³</td><td>{money(quantity * row.rate)} K</td><td><Status value={row.environmentalStatus} /></td></tr>;
      })}</tbody></table></div>
    </section>
  </>;
}

function Kpi({ icon, label, value, detail, tone }: { icon: string; label: string; value: string | number; detail: string; tone: string }) {
  return <div className="kpi"><div className={`kpi-icon ${tone}`}><Icon name={icon} size={21} /></div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>;
}

function HouseholdsPage({ records, onNew, onDelete }: { records: Household[]; onNew: () => void; onDelete: (id: string) => void }) {
  return <>
    <PageHead eyebrow="PEOPLE & HOUSEHOLDS" title="အိမ်ထောင်စုစာရင်း" subtitle="Household Register · Verified village residency records" button="Add household" onNew={onNew} />
    <div className="summary-strip"><div><span>Showing</span><strong>{records.length} households</strong></div><div><span>Residents</span><strong>{records.reduce((s, h) => s + h.male + h.female, 0)}</strong></div><div><span>With electricity</span><strong>{records.filter(h => h.electricity).length}</strong></div><div><span>Water access</span><strong>{records.filter(h => h.water).length}</strong></div></div>
    <section className="panel"><div className="table-wrap"><table><thead><tr><th>Household</th><th>Head of household</th><th>Location</th><th>Members</th><th>Utilities</th><th>Monthly income</th><th></th></tr></thead><tbody>{records.map(h => <tr key={h.id}><td><strong>{h.householdId}</strong><small>{h.demo ? "DEMO DATA" : "Verified record"}</small></td><td><strong>{h.head}</strong><small>{h.phone}</small></td><td>{h.location}</td><td><strong>{h.male + h.female}</strong><small>{h.male} M · {h.female} F</small></td><td><div className="utility-tags"><span className={h.electricity ? "yes" : ""}>Power</span><span className={h.water ? "yes" : ""}>Water</span></div></td><td>{money(h.monthlyIncome)} K</td><td><button className="delete-button" onClick={() => onDelete(h.id)} title="Delete record"><Icon name="trash" size={17} /></button></td></tr>)}</tbody></table>{!records.length && <Empty />}</div></section>
  </>;
}

function SandPage({ records, onNew, onDelete }: { records: Sand[]; onNew: () => void; onDelete: (id: string) => void }) {
  const totals = records.reduce((a, r) => { const q = r.quantityPerTrip * r.trips; const revenue = q * r.rate; const expenses = r.permitFee + r.transportCost + r.laborCost + r.otherExpense; return { q: a.q + q, revenue: a.revenue + revenue, expenses: a.expenses + expenses }; }, { q: 0, revenue: 0, expenses: 0 });
  return <>
    <PageHead eyebrow="NATURAL RESOURCE MANAGEMENT" title="ချောင်းသဲထုတ်ယူမှုစာရင်း" subtitle="Stream Sand Extraction Register · Permits, revenue and environmental monitoring" button="New extraction" onNew={onNew} />
    <div className="kpi-grid sand-kpis"><Kpi icon="sand" label="Total quantity" value={`${totals.q.toFixed(1)} m³`} detail={`${records.reduce((s, r) => s + r.trips, 0)} authorized trips`} tone="amber" /><Kpi icon="wallet" label="Gross revenue" value={`${money(totals.revenue)} K`} detail="Quantity × verified rate" tone="green" /><Kpi icon="report" label="Total expenses" value={`${money(totals.expenses)} K`} detail="Fees + transport + labor" tone="blue" /><Kpi icon="wallet" label="Net revenue" value={`${money(totals.revenue - totals.expenses)} K`} detail="Revenue − all expenses" tone="purple" /></div>
    <section className="panel"><div className="table-wrap"><table><thead><tr><th>Extraction</th><th>Site & extractor</th><th>Permit</th><th>Quantity</th><th>Revenue / Net</th><th>Environment</th><th></th></tr></thead><tbody>{records.map(r => { const q = r.quantityPerTrip * r.trips; const revenue = q * r.rate; const expenses = r.permitFee + r.transportCost + r.laborCost + r.otherExpense; return <tr key={r.id}><td><strong>{r.extractionId}</strong><small>{r.date}{r.demo && " · DEMO DATA"}</small></td><td><strong>{r.stream}</strong><small>{r.location} · {r.extractor}</small></td><td><strong>{r.permitNo}</strong><small>Expires {r.permitExpiry}</small></td><td><strong>{q.toFixed(1)} m³</strong><small>{r.quantityPerTrip} × {r.trips} trips</small></td><td><strong>{money(revenue)} K</strong><small>Net {money(revenue - expenses)} K</small></td><td><Status value={r.environmentalStatus} /></td><td><button className="delete-button" onClick={() => onDelete(r.id)}><Icon name="trash" size={17} /></button></td></tr>; })}</tbody></table>{!records.length && <Empty />}</div></section>
  </>;
}

function Status({ value }: { value: string }) { return <span className={`status ${value.toLowerCase().replaceAll(" ", "-")}`}>{value}</span>; }
function Empty() { return <div className="empty">No matching records found.</div>; }
const Field = ({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) => <label className={wide ? "wide" : ""}><span>{label}</span>{children}</label>;

function ModalShell({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="modal-backdrop"><div className="modal"><div className="modal-head"><div><div className="eyebrow">SECURE RECORD ENTRY</div><h2>{title}</h2><p>{subtitle}</p></div><button className="icon-button" onClick={onClose}><Icon name="x" /></button></div>{children}</div></div>;
}

function HouseholdModal({ value, setValue, onClose, onSubmit, error }: { value: typeof initialHousehold; setValue: (v: typeof initialHousehold) => void; onClose: () => void; onSubmit: (e: FormEvent) => void; error: string }) {
  const set = (key: string, val: string | number | boolean) => setValue({ ...value, [key]: val });
  return <ModalShell title="Add household" subtitle="အိမ်ထောင်စုအသစ် မှတ်ပုံတင်ရန်" onClose={onClose}><form onSubmit={onSubmit}><div className="form-grid">
    <Field label="Household ID"><input required value={value.householdId} onChange={e => set("householdId", e.target.value)} placeholder="MN-HH-0004" /></Field>
    <Field label="Head of household"><input required value={value.head} onChange={e => set("head", e.target.value)} /></Field>
    <Field label="Location"><input required value={value.location} onChange={e => set("location", e.target.value)} /></Field>
    <Field label="Phone"><input value={value.phone} onChange={e => set("phone", e.target.value)} /></Field>
    {["male", "female", "children", "elderly", "disabled"].map(key => <Field key={key} label={key[0].toUpperCase() + key.slice(1)}><input type="number" min="0" required value={value[key as keyof typeof value] as number} onChange={e => set(key, Number(e.target.value))} /></Field>)}
    <Field label="Monthly income (MMK)"><input type="number" min="0" required value={value.monthlyIncome} onChange={e => set("monthlyIncome", Number(e.target.value))} /></Field>
    <Field label="Utilities" wide><div className="checks"><label><input type="checkbox" checked={value.electricity} onChange={e => set("electricity", e.target.checked)} /> Electricity</label><label><input type="checkbox" checked={value.water} onChange={e => set("water", e.target.checked)} /> Water supply</label></div></Field>
  </div>{error && <div className="form-error">{error}</div>}<div className="calc-preview"><span>Calculated household total</span><strong>{value.male + value.female} members</strong></div><div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary">Save household</button></div></form></ModalShell>;
}

function SandModal({ value, setValue, onClose, onSubmit, error }: { value: typeof initialSand; setValue: (v: typeof initialSand) => void; onClose: () => void; onSubmit: (e: FormEvent) => void; error: string }) {
  const set = (key: string, val: string | number) => setValue({ ...value, [key]: val });
  const quantity = value.quantityPerTrip * value.trips, revenue = quantity * value.rate, expenses = value.permitFee + value.transportCost + value.laborCost + value.otherExpense;
  return <ModalShell title="New extraction record" subtitle="Quantity, revenue and net value are calculated automatically." onClose={onClose}><form onSubmit={onSubmit}><div className="form-grid">
    <Field label="Extraction ID"><input required value={value.extractionId} onChange={e => set("extractionId", e.target.value)} placeholder="SE-2026-003" /></Field>
    <Field label="Extraction date"><input required type="date" value={value.date} onChange={e => set("date", e.target.value)} /></Field>
    <Field label="Stream name"><input required value={value.stream} onChange={e => set("stream", e.target.value)} /></Field>
    <Field label="Location"><input required value={value.location} onChange={e => set("location", e.target.value)} /></Field>
    <Field label="Extractor"><input required value={value.extractor} onChange={e => set("extractor", e.target.value)} /></Field>
    <Field label="Community project"><input value={value.project} onChange={e => set("project", e.target.value)} placeholder="Temple Construction" /></Field>
    <Field label="Permit no."><input required value={value.permitNo} onChange={e => set("permitNo", e.target.value)} /></Field>
    <Field label="Permit expiry"><input required type="date" min={value.date} value={value.permitExpiry} onChange={e => set("permitExpiry", e.target.value)} /></Field>
    <Field label="Quantity per trip (m³)"><input required type="number" min="0.01" step="0.01" value={value.quantityPerTrip} onChange={e => set("quantityPerTrip", Number(e.target.value))} /></Field>
    <Field label="Number of trips"><input required type="number" min="1" value={value.trips} onChange={e => set("trips", Number(e.target.value))} /></Field>
    <Field label="Rate per m³ (MMK)"><input required type="number" min="0" value={value.rate} onChange={e => set("rate", Number(e.target.value))} /></Field>
    <Field label="Environmental status"><select value={value.environmentalStatus} onChange={e => set("environmentalStatus", e.target.value)}><option>Normal</option><option>Monitoring Required</option><option>Restoration Required</option><option>Closed</option></select></Field>
    {([["permitFee", "Permit fee"], ["transportCost", "Transport cost"], ["laborCost", "Labor cost"], ["otherExpense", "Other expense"]] as const).map(([key, label]) => <Field key={key} label={`${label} (MMK)`}><input type="number" min="0" value={value[key]} onChange={e => set(key, Number(e.target.value))} /></Field>)}
  </div>{error && <div className="form-error">{error}</div>}<div className="sand-calc"><div><span>Total quantity</span><strong>{quantity.toFixed(2)} m³</strong></div><div><span>Gross revenue</span><strong>{money(revenue)} K</strong></div><div><span>Total expenses</span><strong>{money(expenses)} K</strong></div><div className="net"><span>Net revenue</span><strong>{money(revenue - expenses)} K</strong></div></div><div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary">Save verified record</button></div></form></ModalShell>;
}

export default App;
