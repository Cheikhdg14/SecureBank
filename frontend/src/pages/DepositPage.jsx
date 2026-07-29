import { useState, useEffect } from "react";
import { api } from "../services/api";

const fmt = n => new Intl.NumberFormat("fr-FR", {
  style: "currency", currency: "XOF", maximumFractionDigits: 0
}).format(n || 0);

export default function DepositPage({ navigate }) {
  const [accounts, setAccounts] = useState([]);
  const [selected, setSelected] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAcc, setLoadingAcc] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api.getAccounts().then(r => {
      const active = (r.data || []).filter(a => a.status === "ACTIVE");
      setAccounts(active);
      if (active.length > 0) setSelected(active[0].accountNumber);
    }).catch(() => {}).finally(() => setLoadingAcc(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault(); setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await api.deposit(selected, parseFloat(amount));
      setSuccess("Dépôt effectué ! Nouveau solde : " + fmt(res.data));
      setAmount("");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const selectedAcc = accounts.find(a => a.accountNumber === selected);

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <div className="page-title"><h1>Déposer de l'argent</h1></div>
      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Compte destinataire</label>
            {loadingAcc
              ? <p style={{ color: "var(--text3)", fontSize: 14 }}>Chargement...</p>
              : accounts.length === 0
                ? <div className="alert alert-info">Aucun compte actif.</div>
                : <select value={selected} onChange={e => setSelected(e.target.value)}>
                    {accounts.map(a => (
                      <option key={a.id} value={a.accountNumber}>
                        {a.accountNumber} — {a.type === "CHECKING" ? "Courant" : "Épargne"} — {fmt(a.balance)}
                      </option>
                    ))}
                  </select>
            }
          </div>

          {selectedAcc && (
            <div style={{ background: "var(--color-background-secondary)",
              borderRadius: "var(--border-radius-md)", padding: "9px 13px",
              marginBottom: "1rem", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "var(--text2)" }}>Solde actuel</span>
              <span style={{ fontWeight: 500 }}>{fmt(selectedAcc.balance)}</span>
            </div>
          )}

          <div className="form-group">
            <label>Montant à déposer (FCFA)</label>
            <input type="number" min="100" step="100" value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Ex : 50 000" required />
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button type="submit" className="btn btn-primary"
              disabled={loading || accounts.length === 0}>
              {loading ? "Traitement..." : "Déposer"}
            </button>
            <button type="button" className="btn btn-outline"
              onClick={() => navigate("dashboard")}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}