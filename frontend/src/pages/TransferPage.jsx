import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

const fmt = n => new Intl.NumberFormat("fr-FR", {
  style: "currency", currency: "XOF", maximumFractionDigits: 0
}).format(n || 0);

export default function TransferPage({ navigate }) {
  const { auth } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({
    sourceAccount: "", destinationAccount: "", amount: "", description: ""
  });
  const [loading, setLoading] = useState(false);
  const [loadingAcc, setLoadingAcc] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [reference, setReference] = useState("");
  const [otp, setOtp] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmErr, setConfirmErr] = useState("");
  const [done, setDone] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    api.getAccounts().then(r => {
      const active = (r.data || []).filter(a => a.status === "ACTIVE");
      setAccounts(active);
      if (active.length > 0) set("sourceAccount", active[0].accountNumber);
    }).catch(() => {}).finally(() => setLoadingAcc(false));
  }, []);

  const selected = accounts.find(a => a.accountNumber === form.sourceAccount);

  // Étape 1 — Initier le virement → reçoit la référence + envoie OTP
  const initiate = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await api.initiateTransfer(
        form.sourceAccount,
        form.destinationAccount,
        parseFloat(form.amount),
        form.description
      );
      // ✅ La référence est dans res.data (string UUID ou objet)
      setReference(res.data?.reference || res.data);
      setStep(2);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // Étape 2 — Confirmer avec OTP → un seul appel confirmTransfer
  const confirm = async (e) => {
    e.preventDefault(); setConfirmErr(""); setConfirming(true);
    try {
      // ✅ confirmTransfer vérifie l'OTP lui-même côté backend
      // Plus besoin de appeler verifyOtp séparément
      await api.confirmTransfer(reference, otp.trim());
      setDone(true);
    } catch (err) { setConfirmErr(err.message); }
    finally { setConfirming(false); }
  };

  const reset = () => {
    setStep(1);
    setDone(false);
    setOtp("");
    setReference("");
    setError("");
    setConfirmErr("");
    setForm({
      sourceAccount: accounts[0]?.accountNumber || "",
      destinationAccount: "",
      amount: "",
      description: ""
    });
  };

  // ── Écran de succès ──────────────────────────────────────────────────────
  if (done) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
      <div style={{ textAlign: "center", maxWidth: 320, padding: "1rem" }}>
        <div style={{
          width: 64, height: 64, background: "var(--accent-light)", borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem"
        }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--accent2)" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 style={{ marginBottom: 8 }}>Virement effectué !</h2>
        <p style={{ color: "var(--text2)", marginBottom: "1.25rem", fontSize: 14 }}>
          {fmt(parseFloat(form.amount))} vers <strong>{form.destinationAccount}</strong>
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => navigate("history")} className="btn btn-primary">
            Voir l'historique
          </button>
          <button onClick={reset} className="btn btn-outline">
            Nouveau virement
          </button>
        </div>
      </div>
    </div>
  );

  // ── Formulaire principal ─────────────────────────────────────────────────
  return (
    <div>
      <div className="page-title"><h1>Virement bancaire</h1></div>

      {/* Indicateur d'étapes */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
        {["Détails", "Confirmation OTP"].map((label, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%", border: "2px solid",
              borderColor: step > i ? "var(--accent2)" : step === i + 1 ? "var(--accent2)" : "var(--border2)",
              background: step > i ? "var(--accent2)" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 600,
              color: step > i ? "white" : step === i + 1 ? "var(--accent2)" : "var(--text3)"
            }}>
              {step > i ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: 13, color: step === i + 1 ? "var(--text)" : "var(--text3)" }}>
              {label}
            </span>
            {i === 0 && <span style={{ color: "var(--border2)", margin: "0 4px" }}>—</span>}
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 540 }}>

        {/* ── Étape 1 : Formulaire de virement ── */}
        {step === 1 && (
          <div className="card">
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={initiate}>

              {/* Compte source */}
              <div className="form-group">
                <label>Compte source</label>
                {loadingAcc
                  ? <div style={{ color: "var(--text3)", fontSize: 14 }}>Chargement…</div>
                  : accounts.length === 0
                    ? <div className="alert alert-info">Aucun compte actif trouvé.</div>
                    : <select value={form.sourceAccount} onChange={e => set("sourceAccount", e.target.value)}>
                        {accounts.map(a => (
                          <option key={a.id} value={a.accountNumber}>
                            {a.accountNumber} — {fmt(a.balance)}
                          </option>
                        ))}
                      </select>
                }
              </div>

              {/* Solde disponible */}
              {selected && (
                <div style={{
                  background: "var(--surface2)", borderRadius: 8, padding: "9px 13px",
                  marginBottom: "1rem", display: "flex", justifyContent: "space-between"
                }}>
                  <span style={{ fontSize: 13, color: "var(--text2)" }}>Solde disponible</span>
                  <span style={{ fontFamily: "'DM Serif Display', serif" }}>{fmt(selected.balance)}</span>
                </div>
              )}

              {/* Compte destinataire */}
              <div className="form-group">
                <label>Compte destinataire</label>
                <input
                  value={form.destinationAccount}
                  onChange={e => set("destinationAccount", e.target.value.toUpperCase())}
                  placeholder="SB1234567890"
                  required
                />
              </div>

              {/* Montant + Description */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem" }} className="grid-form-2">
                <div className="form-group">
                  <label>Montant (FCFA)</label>
                  <input
                    type="number" min="100" step="100"
                    value={form.amount}
                    onChange={e => set("amount", e.target.value)}
                    placeholder="50000" required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input
                    value={form.description}
                    onChange={e => set("description", e.target.value)}
                    placeholder="Optionnel"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading || accounts.length === 0}
              >
                {loading ? "Traitement…" : "Continuer →"}
              </button>
            </form>
          </div>
        )}

        {/* ── Étape 2 : Confirmation OTP ── */}
        {step === 2 && (
          <div>
            {/* Récapitulatif */}
            <div className="card" style={{ marginBottom: "1rem" }}>
              <h3 style={{ marginBottom: "0.9rem", fontSize: "1rem" }}>Récapitulatif du virement</h3>
              {[
                ["De",        form.sourceAccount],
                ["Vers",      form.destinationAccount],
                ["Montant",   fmt(parseFloat(form.amount))],
                ["Référence", reference?.substring(0, 16) + "…"],
              ].map(([label, value]) => (
                <div key={label} style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "7px 0", borderBottom: "1px solid var(--border)",
                  fontSize: 13, flexWrap: "wrap", gap: 8
                }}>
                  <span style={{ color: "var(--text2)" }}>{label}</span>
                  <span style={{ fontWeight: label === "Montant" ? 500 : 400, wordBreak: "break-all" }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Saisie OTP */}
            <div className="card">
              <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: "1rem" }}>
                Un code OTP a été envoyé à <strong>{auth?.email}</strong>. Saisissez-le pour confirmer le virement.
              </p>
              {confirmErr && <div className="alert alert-error">{confirmErr}</div>}
              <form onSubmit={confirm}>
                <div className="form-group">
                  <label>Code OTP (6 chiffres)</label>
                  <input
                    className="otp-input"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    required
                    autoFocus
                  />
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 5, textAlign: "center" }}>
                    Valide 5 minutes · Ne pas partager
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={confirming || otp.length !== 6}
                  >
                    {confirming ? "Confirmation…" : "Valider le virement"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setOtp(""); setConfirmErr(""); }}
                    className="btn btn-outline"
                  >
                    ← Modifier
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}