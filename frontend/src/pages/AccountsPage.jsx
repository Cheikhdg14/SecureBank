import { useState, useEffect } from "react";
import { api } from "../services/api";
const fmt = n => new Intl.NumberFormat("fr-FR", { style:"currency", currency:"XOF", maximumFractionDigits:0 }).format(n || 0);

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ type:"CHECKING", initialDeposit:"" });
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState("");

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    try { const r = await api.getAccounts(); setAccounts(r.data || []); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function createAccount(e) {
    e.preventDefault(); setCreateErr(""); setCreating(true);
    try {
      await api.createAccount(form.type, parseFloat(form.initialDeposit));
      setShow(false); setForm({ type:"CHECKING", initialDeposit:"" }); await load();
    } catch (err) { setCreateErr(err.message); }
    finally { setCreating(false); }
  }

  const sLabel = { ACTIVE:"Actif", PENDING:"En attente", SUSPENDED:"Suspendu", CLOSED:"Fermé" };
  const sCls   = { ACTIVE:"badge-success", PENDING:"badge-warning", SUSPENDED:"badge-danger", CLOSED:"" };

  return (
    <div>
      <div className="page-title"><h1>Mes Comptes</h1><span className="subtitle">{accounts.length} compte{accounts.length !== 1 ? "s" : ""}</span></div>
      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ marginBottom:"1.25rem" }}>
        <button onClick={() => setShow(v => !v)} className="btn btn-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Ouvrir un compte
        </button>
      </div>

      {show && (
        <div className="card" style={{ marginBottom:"1.25rem", borderColor:"var(--accent2)" }}>
          <h3 style={{ marginBottom:"1rem", fontSize:"1rem" }}>Nouveau compte</h3>
          {createErr && <div className="alert alert-error">{createErr}</div>}
          <form onSubmit={createAccount}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.9rem" }} className="grid-form-2">
              <div className="form-group"><label>Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type:e.target.value }))}>
                  <option value="CHECKING">Compte courant</option>
                  <option value="SAVINGS">Compte épargne</option>
                </select>
              </div>
              <div className="form-group"><label>Dépôt initial (FCFA)</label>
                <input type="number" min="0" step="100" value={form.initialDeposit}
                  onChange={e => setForm(f => ({ ...f, initialDeposit:e.target.value }))}
                  placeholder="10000" required />
              </div>
            </div>
            <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap" }}>
              <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? "Création..." : "Créer"}</button>
              <button type="button" onClick={() => setShow(false)} className="btn btn-outline">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div style={{ display:"flex", justifyContent:"center", padding:"3rem" }}><span className="spinner" style={{ width:32, height:32 }} /></div> :
       accounts.length === 0 ? <div className="card"><div className="empty"><p>Aucun compte. Ouvrez-en un ci-dessus.</p></div></div> :
       <div style={{ display:"grid", gap:"0.9rem" }}>
         {accounts.map(acc => (
           <div key={acc.id} className="card" style={{ display:"flex", alignItems:"center", gap:"1.25rem", flexWrap:"wrap" }}>
             <div style={{ width:44, height:44, borderRadius:10, flexShrink:0,
               background: acc.type === "SAVINGS" ? "var(--gold-light)" : "var(--accent-light)",
               display:"flex", alignItems:"center", justifyContent:"center" }}>
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke={acc.type === "SAVINGS" ? "var(--gold)" : "var(--accent2)"} strokeWidth="1.8">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
               </svg>
             </div>
             <div style={{ flex:1, minWidth:0 }}>
               <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap" }}>
                 <span style={{ fontWeight:500, fontSize:14 }}>{acc.type === "CHECKING" ? "Compte courant" : "Compte épargne"}</span>
                 <span className={`badge ${sCls[acc.status] || ""}`}>{sLabel[acc.status]}</span>
               </div>
               <div style={{ fontFamily:"monospace", fontSize:12, color:"var(--text2)" }}>{acc.accountNumber}</div>
             </div>
             <div style={{ textAlign:"right", flexShrink:0 }}>
               <div style={{ fontFamily:"'DM Serif Display', serif", fontSize:"1.3rem" }}>{fmt(acc.balance)}</div>
             </div>
           </div>
         ))}
       </div>
      }
    </div>
  );
}
