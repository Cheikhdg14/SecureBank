import { useState, useEffect } from "react";
import { api } from "../services/api";

const fmt = n => new Intl.NumberFormat("fr-FR", {
  style: "currency", currency: "XOF", maximumFractionDigits: 0
}).format(n || 0);

export default function AdminPage() {
  const [tab, setTab] = useState("stats");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deletionReqs, setDeletionReqs] = useState([]);
  const [filters, setFilters] = useState({ status: "", minAmount: "", maxAmount: "", from: "", to: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [depositTarget, setDepositTarget] = useState(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);

  useEffect(() => { loadStats(); loadUsers(); loadDeletionReqs(); }, []);

  const loadStats = () => api.adminGetStats().then(r => setStats(r.data)).catch(() => {});
  const loadUsers = () => api.adminGetUsers().then(r => setUsers(r.data || [])).catch(() => {});
  const loadDeletionReqs = () => api.adminGetDeletionRequests()
    .then(r => setDeletionReqs(r.data || [])).catch(() => {});

  const loadTransactions = async () => {
    setLoading(true);
    const f = {};
    if (filters.status) f.status = filters.status;
    if (filters.minAmount) f.minAmount = filters.minAmount;
    if (filters.maxAmount) f.maxAmount = filters.maxAmount;
    if (filters.from) f.from = filters.from;
    if (filters.to) f.to = filters.to;
    try {
      const r = await api.adminGetTransactions(f);
      setTransactions(r.data || []);
    } catch (err) { setMsg(err.message); }
    finally { setLoading(false); }
  };

  const toggleUser = async (id, enabled) => {
    try { await api.adminToggleUser(id, enabled); loadUsers(); setMsg("Statut mis à jour"); }
    catch (err) { setMsg(err.message); }
  };

  const approveDeletion = async (id) => {
    try { await api.adminApproveDeletion(id); loadDeletionReqs(); setMsg("Compte supprimé"); }
    catch (err) { setMsg(err.message); }
  };

  const rejectDeletion = async (id) => {
    try { await api.adminRejectDeletion(id, "Refusé par l'administrateur"); loadDeletionReqs(); setMsg("Demande refusée"); }
    catch (err) { setMsg(err.message); }
  };

  const doDeposit = async () => {
    if (!depositTarget || !depositAmount) return;
    setDepositLoading(true);
    try {
      await api.adminDeposit(depositTarget, parseFloat(depositAmount));
      setMsg("Dépôt effectué sur " + depositTarget);
      setDepositTarget(null); setDepositAmount("");
    } catch (err) { setMsg(err.message); }
    finally { setDepositLoading(false); }
  };

  const tabs = [
    { id: "stats", label: "Statistiques" },
    { id: "users", label: "Utilisateurs" },
    { id: "transactions", label: "Transactions" },
    { id: "deletions", label: `Suppressions ${deletionReqs.length > 0 ? "("+deletionReqs.length+")" : ""}` },
    { id: "deposit", label: "Dépôt admin" },
  ];

  return (
    <div>
      <div className="page-title"><h1>Administration</h1></div>
      {msg && <div className="alert alert-info" style={{ marginBottom: "1rem" }}
        onClick={() => setMsg("")}>{msg} <span style={{ cursor: "pointer" }}>×</span></div>}

      <div style={{ display: "flex", gap: 6, marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={tab === t.id ? "btn btn-primary" : "btn btn-outline"}
            style={{ fontSize: 13 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Statistiques ── */}
      {tab === "stats" && (
        <div>
          {stats ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
              {[
                { label: "Total transactions", value: stats.totalTransactions },
                { label: "Total viré", value: fmt(stats.totalVire) },
                { label: "Clients actifs", value: stats.clientsActifs },
                { label: "Volume du jour", value: fmt(stats.volumeJour) },
                { label: "Transactions aujourd'hui", value: stats.transactionsAujourdHui },
              ].map(s => (
                <div key={s.label} style={{ background: "var(--color-background-secondary)",
                  borderRadius: "var(--border-radius-md)", padding: "1rem" }}>
                  <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 500 }}>{s.value}</div>
                </div>
              ))}
            </div>
          ) : <p style={{ color: "var(--text3)" }}>Chargement...</p>}
        </div>
      )}

      {/* ── Utilisateurs ── */}
      {tab === "users" && (
        <div>
          {users.map(u => (
            <div key={u.id} className="card" style={{ marginBottom: 8,
              display: "flex", justifyContent: "space-between",
              alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{u.fullName}</div>
                <div style={{ fontSize: 12, color: "var(--text2)" }}>{u.email}</div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>{u.role}</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, padding: "2px 10px", borderRadius: 20,
                  background: u.enabled ? "var(--color-background-success)" : "var(--color-background-danger)",
                  color: u.enabled ? "var(--color-text-success)" : "var(--color-text-danger)" }}>
                  {u.enabled ? "Actif" : "Suspendu"}
                </span>
                <button className="btn btn-outline" style={{ fontSize: 12 }}
                  onClick={() => toggleUser(u.id, !u.enabled)}>
                  {u.enabled ? "Suspendre" : "Activer"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Transactions ── */}
      {tab === "transactions" && (
        <div>
          <div className="card" style={{ marginBottom: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 12 }}>Statut</label>
                <select value={filters.status}
                  onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
                  <option value="">Tous</option>
                  <option value="COMPLETED">Effectué</option>
                  <option value="PENDING">En attente</option>
                  <option value="FAILED">Échoué</option>
                  <option value="CANCELLED">Annulé</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 12 }}>Montant min</label>
                <input type="number" value={filters.minAmount}
                  onChange={e => setFilters(f => ({ ...f, minAmount: e.target.value }))}
                  placeholder="0" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 12 }}>Montant max</label>
                <input type="number" value={filters.maxAmount}
                  onChange={e => setFilters(f => ({ ...f, maxAmount: e.target.value }))}
                  placeholder="999999999" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 12 }}>Du</label>
                <input type="date" value={filters.from}
                  onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 12 }}>Au</label>
                <input type="date" value={filters.to}
                  onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="btn btn-primary" style={{ fontSize: 13 }}
                onClick={loadTransactions} disabled={loading}>
                {loading ? "Chargement..." : "Filtrer"}
              </button>
              <button className="btn btn-outline" style={{ fontSize: 13 }}
                onClick={() => api.adminExportCsv(filters)}>
                Exporter CSV
              </button>
            </div>
          </div>

          {transactions.length === 0
            ? <p style={{ color: "var(--text3)" }}>Cliquez sur Filtrer pour afficher les transactions.</p>
            : transactions.map((t, i) => (
              <div key={i} className="card" style={{ marginBottom: 8,
                display: "flex", justifyContent: "space-between",
                alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text3)", fontFamily: "monospace" }}>
                    {t.reference?.substring(0, 16)}...
                  </div>
                  <div style={{ fontWeight: 500 }}>{fmt(t.amount)}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)" }}>
                    {t.type} · {new Date(t.createdAt).toLocaleDateString("fr-FR")}
                  </div>
                </div>
                <span style={{ fontSize: 12, padding: "2px 10px", borderRadius: 20,
                  background: t.status === "COMPLETED" ? "var(--color-background-success)"
                    : t.status === "PENDING" ? "var(--color-background-warning)"
                    : "var(--color-background-danger)",
                  color: t.status === "COMPLETED" ? "var(--color-text-success)"
                    : t.status === "PENDING" ? "var(--color-text-warning)"
                    : "var(--color-text-danger)" }}>
                  {t.status}
                </span>
              </div>
            ))
          }
        </div>
      )}

      {/* ── Demandes de suppression ── */}
      {tab === "deletions" && (
        <div>
          {deletionReqs.length === 0
            ? <div className="card" style={{ textAlign: "center", color: "var(--text2)" }}>
                Aucune demande de suppression en attente.
              </div>
            : deletionReqs.map(req => (
              <div key={req.id} className="card" style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between",
                  alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>
                      Compte : {req.accountNumber}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text2)" }}>
                      Demandé par : {req.requesterEmail}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>
                      Le {new Date(req.createdAt).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-primary"
                      style={{ fontSize: 12, background: "var(--color-background-success)",
                        borderColor: "var(--color-border-success)",
                        color: "var(--color-text-success)" }}
                      onClick={() => approveDeletion(req.id)}>
                      Approuver
                    </button>
                    <button className="btn btn-outline"
                      style={{ fontSize: 12, color: "var(--color-text-danger)",
                        borderColor: "var(--color-border-danger)" }}
                      onClick={() => rejectDeletion(req.id)}>
                      Refuser
                    </button>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* ── Dépôt admin ── */}
      {tab === "deposit" && (
        <div style={{ maxWidth: 440 }}>
          <div className="card">
            <h3 style={{ marginBottom: "1rem", fontSize: "1rem" }}>
              Déposer sur un compte client
            </h3>
            <div className="form-group">
              <label>Numéro de compte</label>
              <input value={depositTarget || ""}
                onChange={e => setDepositTarget(e.target.value.toUpperCase())}
                placeholder="SBxxxxxxxxxx" />
            </div>
            <div className="form-group">
              <label>Montant (FCFA)</label>
              <input type="number" min="100" step="100"
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
                placeholder="50 000" />
            </div>
            <button className="btn btn-primary" disabled={depositLoading ||
              !depositTarget || !depositAmount}
              onClick={doDeposit}>
              {depositLoading ? "Traitement..." : "Effectuer le dépôt"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}