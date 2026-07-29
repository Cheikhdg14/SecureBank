import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export default function OtpPage({ ctx }) {
  const { setAuth, navigate } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isTransfer = ctx?.purpose === "TRANSFER";

  const submit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      if (isTransfer) {
        // ✅ Un seul appel : confirmTransfer vérifie l'OTP côté backend
        await api.confirmTransfer(ctx.reference, code.trim());
        navigate("history");
      } else {
        // Connexion : verifyOtp retourne le JWT
        const res = await api.verifyOtp(ctx.email, code.trim(), ctx.purpose);
        const { token } = res.data;
        // ✅ Décoder le JWT pour extraire role et email sans lib externe
        const payload = JSON.parse(atob(token.split(".")[1]));
        setAuth({ token, role: payload.role, email: payload.sub });
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-wrap">
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ width: 52, height: 52, background: "var(--info-light)", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.1rem" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--info)" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 style={{ marginBottom: 4 }}>{isTransfer ? "Confirmer le virement" : "Vérification en deux étapes"}</h2>
          <p style={{ color: "var(--text2)", fontSize: 13 }}>Code à 6 chiffres envoyé à <strong>{ctx?.email}</strong></p>
        </div>
        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={submit}>
            <div className="form-group">
              <label>Code OTP</label>
              <input className="otp-input" value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000" maxLength={6} required autoFocus />
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 5, textAlign: "center" }}>
                Valide 5 minutes · Ne pas partager
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading || code.length !== 6}>
              {loading
                ? <><span className="spinner" style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "white" }} /> Vérification...</>
                : isTransfer ? "Confirmer le virement" : "Valider"}
            </button>
          </form>
          <hr className="divider" />
          <div style={{ textAlign: "center" }}>
            <button onClick={() => navigate("login")} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
              ← Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}