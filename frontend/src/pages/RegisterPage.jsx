import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export default function RegisterPage() {
  const { navigate } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", fullName: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault(); setError("");
    if (form.password !== form.confirmPassword) { setError("Les mots de passe ne correspondent pas"); return; }
    setLoading(true);
    try { await api.register(form.email, form.password, form.fullName, form.phone); setSuccess(true); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  if (success) return (
    <div className="auth-wrap">
      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <div style={{ width: 60, height: 60, background: "var(--accent-light)", borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent2)" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 style={{ marginBottom: 8 }}>Inscription réussie</h2>
        <p style={{ color: "var(--text2)", marginBottom: "1.25rem", fontSize: 14 }}>
          Votre compte est en attente de validation par un administrateur.
        </p>
        <button onClick={() => navigate("login")} className="btn btn-primary">Aller à la connexion</button>
      </div>
    </div>
  );

  return (
    <div className="auth-wrap">
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div className="auth-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 style={{ marginBottom: 4 }}>Créer un compte</h1>
          <p style={{ color: "var(--text2)", fontSize: 14 }}>Rejoignez SecureBank dès aujourd'hui</p>
        </div>
        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={submit}>
            <div className="form-group"><label>Nom complet</label>
              <input value={form.fullName} onChange={e => set("fullName", e.target.value)} placeholder="Prénom Nom" required autoFocus />
            </div>
            <div className="form-group"><label>Adresse e-mail</label>
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="vous@exemple.com" required />
            </div>
            <div className="form-group"><label>Téléphone</label>
              <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+221 77 000 00 00" required />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem" }} className="grid-form-2">
              <div className="form-group"><label>Mot de passe</label>
                <input type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="••••••••" required minLength={8} />
              </div>
              <div className="form-group"><label>Confirmer</label>
                <input type="password" value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} placeholder="••••••••" required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? "Création..." : "Créer mon compte"}
            </button>
          </form>
          <hr className="divider" />
          <div style={{ textAlign: "center", fontSize: 14, color: "var(--text2)" }}>
            Déjà un compte ?{" "}
            <button onClick={() => navigate("login")} style={{ background: "none", border: "none", color: "var(--accent2)", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 500 }}>
              Se connecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
