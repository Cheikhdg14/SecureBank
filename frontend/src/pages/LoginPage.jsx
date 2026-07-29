import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export default function LoginPage() {
  const { navigate, setAuth } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      await api.login(form.email, form.password);
      navigate("otp", { email: form.email, purpose: "LOGIN" });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div className="auth-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 style={{ marginBottom: 4 }}>SecureBank</h1>
          <p style={{ color: "var(--text2)", fontSize: 14 }}>Connectez-vous à votre espace bancaire</p>
        </div>
        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={submit}>
            <div className="form-group">
              <label>Adresse e-mail</label>
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                placeholder="vous@exemple.com" required autoFocus />
            </div>
            <div className="form-group">
              <label>Mot de passe</label>
              <input type="password" value={form.password} onChange={e => set("password", e.target.value)}
                placeholder="••••••••" required />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "white" }} /> Connexion...</> : "Se connecter"}
            </button>
          </form>
          <hr className="divider" />
          <div style={{ textAlign: "center", fontSize: 14, color: "var(--text2)" }}>
            Pas encore de compte ?{" "}
            <button onClick={() => navigate("register")} style={{ background: "none", border: "none", color: "var(--accent2)", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 500 }}>
              S'inscrire
            </button>
          </div>
        </div>
        <p style={{ textAlign: "center", fontSize: 11, color: "var(--text3)", marginTop: "1rem" }}>
          Sécurisé par JWT · AES-256 · HMAC-SHA256
        </p>
      </div>
    </div>
  );
}
