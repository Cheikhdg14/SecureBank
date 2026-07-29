import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export default function LoginPage() {
  const { setAuth, navigate } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await api.login(email, password);
      if (res.data?.passwordExpired) {
        navigate("forgot-password");
        return;
      }
      if (res.data?.otpRequired) {
        navigate("otp", { email, purpose: "LOGIN" });
        return;
      }
      const { token } = res.data;
      const payload = JSON.parse(atob(token.split(".")[1]));
      setAuth({ token, role: payload.role, email: payload.sub });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-wrap">
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <h2>Connexion</h2>
          <p style={{ color: "var(--text2)", fontSize: 13 }}>
            Bienvenue sur SecureBank
          </p>
        </div>
        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={submit}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com" required autoFocus />
            </div>
            <div className="form-group">
              <label>Mot de passe</label>
              <input type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Votre mot de passe" required />
            </div>
            <button type="submit" className="btn btn-primary btn-full"
              disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
          <hr className="divider" />
          <div style={{ display: "flex", justifyContent: "space-between",
            flexWrap: "wrap", gap: 8 }}>
            <button onClick={() => navigate("forgot-password")}
              style={{ background: "none", border: "none",
                color: "var(--text3)", cursor: "pointer", fontSize: 13 }}>
              Mot de passe oublié ?
            </button>
            <button onClick={() => navigate("register")}
              style={{ background: "none", border: "none",
                color: "var(--text3)", cursor: "pointer", fontSize: 13 }}>
              Créer un compte →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}