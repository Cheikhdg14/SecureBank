import { useState, useEffect } from "react";
import { api } from "../services/api";
const fmt = n => new Intl.NumberFormat("fr-FR", { style:"currency", currency:"XOF", maximumFractionDigits:0 }).format(n || 0);
const sCfg = { COMPLETED:{cls:"badge-success",label:"Effectué"}, PENDING:{cls:"badge-info",label:"En attente"}, FAILED:{cls:"badge-danger",label:"Échoué"}, CANCELLED:{cls:"badge-warning",label:"Annulé"} };
const tCfg = { TRANSFER:{label:"Virement",color:"var(--info)"}, DEPOSIT:{label:"Dépôt",color:"var(--accent2)"}, WITHDRAWAL:{label:"Retrait",color:"var(--warning)"} };

export default function HistoryPage() {
  const [accounts, setAccounts] = useState([]);
  const [selected, setSelected] = useState("");
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    api.getAccounts().then(r => {
      const accs = r.data || [];
      setAccounts(accs);
      if (accs.length > 0) setSelected(accs[0].accountNumber);
    }).catch(err => setError(err.message));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true); setError("");
    api.getHistory(selected).then(r => setTxs(r.data || [])).catch(err => setError(err.message)).finally(() => setLoading(false));
  }, [selected]);

  const filtered = filter === "ALL" ? txs : txs.filter(t => t.status === filter);

  return (
    <div>
      <div className="page-title"><h1>Historique</h1><span className="subtitle">{txs.length} opération{txs.length !== 1 ? "s" : ""}</span></div>
      {error && <div className="alert alert-error">{error}</div>}

      {accounts.length > 1 && (
        <div style={{ marginBottom:"1.25rem", maxWidth:320 }}>
          <label>Compte</label>
          <select value={selected} onChange={e => setSelected(e.target.value)}>
            {accounts.map(a => <option key={a.id} value={a.accountNumber}>{a.accountNumber} — {a.type === "CHECKING" ? "Courant" : "Épargne"}</option>)}
          </select>
        </div>
      )}

      <div className="grid-3" style={{ marginBottom:"1.25rem" }}>
        <div className="stat-card"><div className="stat-label">Opérations</div><div className="stat-value">{txs.length}</div></div>
        <div className="stat-card"><div className="stat-label">Complétées</div><div className="stat-value" style={{ color:"var(--accent2)" }}>{txs.filter(t => t.status === "COMPLETED").length}</div></div>
        <div className="stat-card"><div className="stat-label">En attente</div><div className="stat-value" style={{ color:"var(--gold)" }}>{txs.filter(t => t.status === "PENDING").length}</div></div>
      </div>

      <div style={{ display:"flex", gap:7, marginBottom:"1rem", flexWrap:"wrap" }}>
        {["ALL","COMPLETED","PENDING","FAILED","CANCELLED"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-outline"}`}>
            {f === "ALL" ? "Tous" : sCfg[f]?.label}
          </button>
        ))}
      </div>

      {loading ? <div style={{ display:"flex", justifyContent:"center", padding:"3rem" }}><span className="spinner" style={{ width:32, height:32 }} /></div> :
       filtered.length === 0 ? <div className="card"><div className="empty"><p>Aucune transaction trouvée</p></div></div> :
       <div className="card" style={{ padding:0, overflow:"hidden" }}>
         <div className="table-wrap">
           <table>
             <thead><tr>
               <th>Référence</th><th>Type</th>
               <th className="hide-mobile">De</th>
               <th className="hide-mobile">Vers</th>
               <th>Montant</th><th>Statut</th>
               <th className="hide-mobile">Date</th>
             </tr></thead>
             <tbody>
               {filtered.map(tx => {
                 const sc = sCfg[tx.status] || { cls:"badge-info", label:tx.status };
                 const tc = tCfg[tx.type] || { label:tx.type, color:"var(--text2)" };
                 return (
                   <tr key={tx.id}>
                     <td><code style={{ fontSize:11, color:"var(--text2)" }}>{tx.reference?.substring(0,8)}…</code></td>
                     <td><span style={{ fontSize:12, fontWeight:500, color:tc.color }}>{tc.label}</span></td>
                     <td className="hide-mobile" style={{ fontSize:11, fontFamily:"monospace", color:"var(--text2)" }}>{tx.sourceAccount || "—"}</td>
                     <td className="hide-mobile" style={{ fontSize:11, fontFamily:"monospace", color:"var(--text2)" }}>{tx.destinationAccount || "—"}</td>
                     <td style={{ fontFamily:"'DM Serif Display', serif", whiteSpace:"nowrap" }}>{fmt(tx.amount)}</td>
                     <td><span className={`badge ${sc.cls}`}>{sc.label}</span></td>
                     <td className="hide-mobile" style={{ fontSize:12, color:"var(--text2)", whiteSpace:"nowrap" }}>
                       {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("fr-FR", { day:"2-digit", month:"short" }) : "—"}
                     </td>
                   </tr>
                 );
               })}
             </tbody>
           </table>
         </div>
       </div>
      }
    </div>
  );
}
