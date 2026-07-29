import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

const fmt = n => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(n || 0);

const statusBadge = s => {
  const m = { COMPLETED: ["badge-success","Effectué"], PENDING: ["badge-info","En attente"], FAILED: ["badge-danger","Échoué"], CANCELLED: ["badge-warning","Annulé"] };
  const [cls, label] = m[s] || ["badge-info", s];
  return <span className={`badge ${cls}`}>{label}</span>;
};

export default function DashboardPage({ navigate }) {
  const { auth } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setError("");
    try {
      const accRes = await api.getAccounts();
      const accs = accRes.data || [];
      setAccounts(accs);
      const active = accs.find(a => a.status === "ACTIVE");
      if (active) {
        const txRes = await api.getHistory(active.accountNumber);
        setRecentTx((txRes.data || []).slice(0, 5));
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance || 0), 0);
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir"; };

  if (loading) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:300 }}><span className="spinner" style={{ width:32, height:32 }} /></div>;

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ marginBottom: 3 }}>{greeting()}, <span style={{ color: "var(--accent2)" }}>{auth?.email?.split("@")[0]}</span></h1>
        <p style={{ color: "var(--text2)", fontSize: 13 }}>{new Date().toLocaleDateString("fr-FR", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid-3" style={{ marginBottom: "1.5rem" }}>
        <div className="stat-card"><div className="stat-label">Solde total</div><div className="stat-value">{fmt(totalBalance)}</div><div className="stat-sub">{accounts.length} compte{accounts.length !== 1 ? "s" : ""}</div></div>
        <div className="stat-card"><div className="stat-label">Comptes actifs</div><div className="stat-value">{accounts.filter(a => a.status === "ACTIVE").length}</div><div className="stat-sub">sur {accounts.length} total</div></div>
        <div className="stat-card"><div className="stat-label">Transactions récentes</div><div className="stat-value">{recentTx.length}</div><div className="stat-sub">dernier relevé</div></div>
      </div>

      {accounts.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.9rem" }}>
            <h2 style={{ fontSize:"1.1rem" }}>Mes comptes</h2>
            <button onClick={() => navigate("accounts")} className="btn btn-outline btn-sm">Gérer</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:"0.9rem" }}>
            {accounts.map(acc => (
              <div key={acc.id} className="account-card">
                <div className="ac-type">{acc.type === "CHECKING" ? "Compte courant" : "Compte épargne"}</div>
                <div className="ac-number">{acc.accountNumber}</div>
                <div className="ac-balance">{fmt(acc.balance)}</div>
                <div className="ac-status"><span className={`badge ${acc.status === "ACTIVE" ? "badge-success" : "badge-warning"}`}>{acc.status === "ACTIVE" ? "Actif" : acc.status}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {accounts.length === 0 && (
        <div className="card" style={{ textAlign:"center", padding:"2rem" }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.5" style={{ margin:"0 auto 0.9rem", display:"block" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <h3 style={{ marginBottom:8 }}>Aucun compte</h3>
          <p style={{ color:"var(--text2)", marginBottom:"1rem", fontSize:14 }}>Ouvrez votre premier compte bancaire</p>
          <button onClick={() => navigate("accounts")} className="btn btn-primary">Ouvrir un compte</button>
        </div>
      )}

      {recentTx.length > 0 && (
        <div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.9rem" }}>
            <h2 style={{ fontSize:"1.1rem" }}>Transactions récentes</h2>
            <button onClick={() => navigate("history")} className="btn btn-outline btn-sm">Voir tout</button>
          </div>
          <div className="card" style={{ padding:0, overflow:"hidden" }}>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Référence</th><th>Type</th><th>Montant</th><th>Statut</th><th className="hide-mobile">Date</th></tr></thead>
                <tbody>
                  {recentTx.map(tx => (
                    <tr key={tx.id}>
                      <td><code style={{ fontSize:11, color:"var(--text2)" }}>{tx.reference?.substring(0,8)}…</code></td>
                      <td><span className="badge badge-info" style={{ fontSize:10 }}>{tx.type}</span></td>
                      <td style={{ fontFamily:"'DM Serif Display', serif", fontSize:"0.95rem" }}>{fmt(tx.amount)}</td>
                      <td>{statusBadge(tx.status)}</td>
                      <td className="hide-mobile" style={{ color:"var(--text2)", fontSize:12 }}>{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("fr-FR") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop:"1.5rem", display:"flex", gap:"0.75rem", flexWrap:"wrap" }}>
        <button onClick={() => navigate("transfer")} className="btn btn-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
          Faire un virement
        </button>
        <button onClick={() => navigate("history")} className="btn btn-outline">Historique complet</button>
      </div>
    </div>
  );
}
