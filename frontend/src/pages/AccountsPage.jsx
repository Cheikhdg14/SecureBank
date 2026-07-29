import { useState, useEffect } from "react";
import { api } from "../services/api";

const fmt = n => new Intl.NumberFormat("fr-FR", {
  style: "currency", currency: "XOF", maximumFractionDigits: 0
}).format(n || 0);

export default function AccountsPage({ navigate }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ type: "CHECKING", initialDeposit: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState("");

  const load = () => {
    setLoading(true);
    api.getAccounts()
      .then(r => setAccounts(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault(); setError(""); setCreating(true);
    try {
      await api.createAccount(form.type, parseFloat(form.initialDeposit));
      setSuccess("Compte créé avec succès !");
      setShowCreate(false);
      setForm({ type: "CHECKING", initialDeposit: "" });
      load();
    } catch (err) { setError(err.message); }
    finally { setCreating(false); }
  };

  const requestDelete = async (accountNumber) => {
    setDeleteLoading(true); setDeleteSuccess(""); setError("");
    try {
      await api.requestDeletion(accountNumber);
      setDeleteSuccess("Demande envoyée à l'administrateur !");
      setDeleteTarget(null);
    } catch (err) { setError(err.message); }
    finally { setDeleteLoading(false); }
  };

  const statusLabel = { ACTIVE: "Actif", PENDING: "En attente",
    SUSPENDED: "Suspendu", CLOSED: "Fermé" };
  const statusColor = { ACTIVE: "var(--color-text-success)",
    PENDING: "var(--color-text-warning)", SUSPENDED: "var(--color-text-danger)",
    CLOSED: "var(--color-text-secondary)" };

  return (
    <div>
      <div className="page-title" style={{ display: "flex",
        justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h1>Mes Comptes <span style={{ fontSize: 14, color: "var(--text3)",
          fontWeight: 400 }}>{accounts.length} compte{accounts.length !== 1 ? "s" : ""}</span>
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" onClick={() => navigate("deposit")}>
            + Déposer
          </button>
          <button className="btn btn-outline" onClick={() => setShowCreate(v => !v)}>
            + Ouvrir un compte
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      {deleteSuccess && <div className="alert alert-success">{deleteSuccess}</div>}

      {showCreate && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h3 style={{ marginBottom: "0.9rem", fontSize: "1rem" }}>Nouveau compte</h3>
          <form onSubmit={create}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: "0.9rem" }}>
              <div className="form-group">
                <label>Type</label>
                <select value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="CHECKING">Compte courant</option>
                  <option value="SAVINGS">Compte épargne</option>
                </select>
              </div>
              <div className="form-group">
                <label>Dépôt initial (FCFA)</label>
                <input type="number" min="0" step="100"
                  value={form.initialDeposit}
                  onChange={e => setForm(f => ({ ...f, initialDeposit: e.target.value }))}
                  placeholder="0" required />
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? "Création..." : "Créer"}
              </button>
              <button type="button" className="btn btn-outline"
                onClick={() => setShowCreate(false)}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      {loading
        ? <p style={{ color: "var(--text3)" }}>Chargement...</p>
        : accounts.length === 0
          ? <div className="card" style={{ textAlign: "center", color: "var(--text2)" }}>
              Aucun compte. Cliquez sur "Ouvrir un compte".
            </div>
          : accounts.map(acc => (
            <div key={acc.id} className="card" style={{ marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8,
                    marginBottom: 4 }}>
                    <span style={{ fontWeight: 500, fontSize: 15 }}>
                      {acc.accountNumber}
                    </span>
                    <span style={{ fontSize: 11, padding: "2px 8px",
                      borderRadius: 20, border: "0.5px solid var(--color-border-tertiary)",
                      color: statusColor[acc.status] }}>
                      {statusLabel[acc.status] || acc.status}
                    </span>
                    <span style={{ fontSize: 11, padding: "2px 8px",
                      borderRadius: 20, background: "var(--color-background-secondary)",
                      color: "var(--text2)" }}>
                      {acc.type === "CHECKING" ? "Courant" : "Épargne"}
                    </span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 500 }}>
                    {fmt(acc.balance)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="btn btn-outline" style={{ fontSize: 12 }}
                    onClick={() => navigate("history", { accountNumber: acc.accountNumber })}>
                    Historique
                  </button>
                  {acc.status === "ACTIVE" && (
                    <button className="btn btn-outline" style={{ fontSize: 12 }}
                      onClick={() => navigate("deposit")}>
                      Déposer
                    </button>
                  )}
                  <button className="btn btn-outline"
                    style={{ fontSize: 12, color: "var(--color-text-danger)",
                      borderColor: "var(--color-border-danger)" }}
                    onClick={() => setDeleteTarget(acc.accountNumber)}>
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))
      }

      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: 380, width: "90%", margin: "1rem" }}>
            <h3 style={{ marginBottom: 8 }}>Demander la suppression</h3>
            <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: "1rem" }}>
              Vous demandez la suppression du compte <strong>{deleteTarget}</strong>.
              L'administrateur sera notifié et traitera votre demande.
              Si votre solde est positif, l'admin ne pourra pas approuver tant que
              le compte n'est pas vidé.
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="btn btn-primary"
                style={{ background: "var(--color-background-danger)",
                  borderColor: "var(--color-border-danger)",
                  color: "var(--color-text-danger)" }}
                disabled={deleteLoading}
                onClick={() => requestDelete(deleteTarget)}>
                {deleteLoading ? "Envoi..." : "Confirmer la demande"}
              </button>
              <button className="btn btn-outline"
                onClick={() => { setDeleteTarget(null); setError(""); }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}