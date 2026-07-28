import { useState, useEffect } from "react";
import { api } from "../services/api";

export default function AdminPage() {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [audit, setAudit] = useState([]);
  const [integrity, setIntegrity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toggling, setToggling] = useState({});
  const [suspending, setSuspending] = useState({});

  useEffect(() => { loadTab(tab); }, [tab]);

  async function loadTab(t) {
    setLoading(true); setError("");
    try {
      if (t === "users") { const r = await api.adminGetUsers(); setUsers(r.data || []); }
      else {
        const [aRes, iRes] = await Promise.all([api.adminGetAudit(), api.adminCheckIntegrity()]);
        setAudit(aRes.data || []);
        setIntegrity(iRes.data);
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function toggleUser(id, enabled) {
    setToggling(t => ({ ...t, [id]:true }));
    try { await api.adminToggleUser(id, enabled); setUsers(u => u.map(x => x.id === id ? { ...x, enabled } : x)); }
    catch (err) { setError(err.message); }
    finally { setToggling(t => ({ ...t, [id]:false })); }
  }

  async function suspendAcc(number) {
    setSuspending(s => ({ ...s, [number]:true }));
    try { await api.adminSuspendAccount(number); await loadTab("users"); }
    catch (err) { setError(err.message); }
    finally { setSuspending(s => ({ ...s, [number]:false })); }
  }

  const tabs = [
    { key:"users", label:"Utilisateurs", d:"M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
    { key:"audit", label:"Audit & Intégrité", d:"M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  ];

  return (
    <div>
      <div className="page-title"><h1>Administration</h1><span className="badge badge-danger" style={{ fontSize:10 }}>ADMIN</span></div>
      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display:"flex", gap:3, marginBottom:"1.25rem", borderBottom:"1px solid var(--border)" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            display:"flex", alignItems:"center", gap:7, padding:"9px 14px",
            background:"none", border:"none", cursor:"pointer",
            borderBottom:`2px solid ${tab === t.key ? "var(--accent2)" : "transparent"}`,
            color: tab === t.key ? "var(--accent2)" : "var(--text2)",
            fontFamily:"inherit", fontSize:13, fontWeight: tab === t.key ? 500 : 400,
            marginBottom:-1, transition:"all 0.12s",
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d={t.d} />
            </svg>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <div style={{ display:"flex", justifyContent:"center", padding:"3rem" }}><span className="spinner" style={{ width:32, height:32 }} /></div> : (
        <>
          {tab === "users" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.9rem", alignItems:"center", flexWrap:"wrap", gap:8 }}>
                <span style={{ color:"var(--text2)", fontSize:13 }}>{users.length} utilisateur{users.length !== 1 ? "s" : ""}</span>
                <button onClick={() => loadTab("users")} className="btn btn-outline btn-sm">↻ Actualiser</button>
              </div>
              <div className="card" style={{ padding:0, overflow:"hidden" }}>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>#</th><th>Nom</th><th className="hide-mobile">Email</th><th>Rôle</th><th>Statut</th><th>Comptes</th><th>Action</th></tr></thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id}>
                          <td style={{ fontSize:12, color:"var(--text3)" }}>{u.id}</td>
                          <td style={{ fontWeight:500, fontSize:13 }}>{u.fullName}</td>
                          <td className="hide-mobile" style={{ fontSize:12, color:"var(--text2)" }}>{u.email}</td>
                          <td><span className={`badge ${u.role === "ROLE_ADMIN" ? "badge-danger" : "badge-info"}`} style={{ fontSize:10 }}>{u.role === "ROLE_ADMIN" ? "Admin" : "Client"}</span></td>
                          <td><span className={`badge ${u.enabled ? "badge-success" : "badge-warning"}`} style={{ fontSize:10 }}>{u.enabled ? "Actif" : "Inactif"}</span></td>
                          <td>
                            {(u.accounts || []).length > 0 ? (
                              <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                                {u.accounts.map(a => (
                                  <div key={a.id} style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
                                    <code style={{ fontSize:10, color:"var(--text2)" }}>{a.accountNumber?.substring(0,8)}…</code>
                                    <span className={`badge ${a.status === "ACTIVE" ? "badge-success" : "badge-danger"}`} style={{ fontSize:9 }}>{a.status}</span>
                                    {a.status !== "SUSPENDED" && (
                                      <button onClick={() => suspendAcc(a.accountNumber)} disabled={suspending[a.accountNumber]}
                                        style={{ background:"none", border:"none", color:"var(--danger)", cursor:"pointer", fontSize:11, padding:0 }}>
                                        {suspending[a.accountNumber] ? "…" : "Suspendre"}
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : <span style={{ color:"var(--text3)", fontSize:12 }}>—</span>}
                          </td>
                          <td>
                            <button onClick={() => toggleUser(u.id, !u.enabled)} disabled={toggling[u.id]}
                              className={`btn btn-sm ${u.enabled ? "btn-outline" : "btn-primary"}`}>
                              {toggling[u.id] ? "…" : u.enabled ? "Désactiver" : "Activer"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === "audit" && (
            <div>
              <div style={{ marginBottom:"1.25rem" }}>
                <div className={`alert ${integrity === true ? "alert-success" : integrity === false ? "alert-error" : "alert-info"}`}
                  style={{ display:"flex", alignItems:"center", gap:9 }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink:0 }}>
                    {integrity === true
                      ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      : <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    }
                  </svg>
                  <div style={{ flex:1 }}>
                    <strong>{integrity === true ? "✓ Intégrité vérifiée" : integrity === false ? "⚠ Falsification détectée !" : "Vérification…"}</strong>
                    <div style={{ fontSize:12, marginTop:2, opacity:0.85 }}>HMAC-SHA256 · Chaîne de hachages</div>
                  </div>
                  <button onClick={() => loadTab("audit")} className="btn btn-sm btn-outline">↻</button>
                </div>
              </div>
              <div className="card" style={{ padding:0, overflow:"hidden" }}>
                <div style={{ padding:"0.9rem 1rem", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
                  <span style={{ fontWeight:500, fontSize:14 }}>Journal d'audit</span>
                  <span style={{ fontSize:13, color:"var(--text2)" }}>{audit.length} entrée{audit.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>#</th><th>Action</th><th>Acteur</th><th className="hide-mobile">Ressource</th><th className="hide-mobile">IP</th><th>HMAC</th><th className="hide-mobile">Date</th></tr></thead>
                    <tbody>
                      {audit.map(log => (
                        <tr key={log.id}>
                          <td style={{ fontSize:12, color:"var(--text3)" }}>{log.id}</td>
                          <td><span className="badge badge-info" style={{ fontSize:10 }}>{log.action}</span></td>
                          <td style={{ fontSize:12 }}>{log.actorEmail}</td>
                          <td className="hide-mobile" style={{ fontSize:12, color:"var(--text2)", maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{log.targetResource || "—"}</td>
                          <td className="hide-mobile" style={{ fontSize:11, fontFamily:"monospace", color:"var(--text2)" }}>{log.ipAddress}</td>
                          <td><code style={{ fontSize:11, color:"var(--accent2)" }}>{log.hmacHash?.substring(0,8)}…</code></td>
                          <td className="hide-mobile" style={{ fontSize:12, color:"var(--text2)", whiteSpace:"nowrap" }}>
                            {log.timestamp ? new Date(log.timestamp).toLocaleString("fr-FR", { dateStyle:"short", timeStyle:"short" }) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
