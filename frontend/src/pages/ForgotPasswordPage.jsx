import { useState } from "react";
import { api } from "../services/api";

export default function ForgotPasswordPage({ navigate }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const sendCode = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      await api.forgotPassword(email);
      setStep(2);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const resetPwd = async (e) => {
    e.preventDefault(); setError("");
    if (newPassword !== confirm) { setError("Les mots de passe ne correspondent pas"); return; }
    setLoading(true);
    try {
      await api.resetPassword(email, token, newPassword);
      setSuccess("Mot de passe réinitialisé avec succès !");
      setTimeout(() => navigate("login"), 2000);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-wrap">
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <h2>Mot de passe oublié</h2>
          <p style={{ color: "var(--text2)", fontSize: 13 }}>
            {step === 1
              ? "Entrez votre email pour recevoir un code de réinitialisation"
              : "Entrez le code reçu par email et votre nouveau mot de passe"}
          </p>
        </div>
        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {step === 1 && (
            <form onSubmit={sendCode}>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com" required />
              </div>
              <button type="submit" className="btn btn-primary btn-full"
                disabled={loading}>
                {loading ? "Envoi..." : "Envoyer le code"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={resetPwd}>
              <div className="form-group">
                <label>Code reçu par email</label>
                <input value={token} onChange={e => setToken(e.target.value.toUpperCase())}
                  placeholder="XXXXXXXX" required maxLength={8} />
              </div>
              <div className="form-group">
                <label>Nouveau mot de passe</label>
                <input type="password" value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="8 car. min, 1 chiffre, 1 spécial" required />
              </div>
              <div className="form-group">
                <label>Confirmer le mot de passe</label>
                <input type="password" value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Répétez le mot de passe" required />
              </div>
              <button type="submit" className="btn btn-primary btn-full"
                disabled={loading}>
                {loading ? "Réinitialisation..." : "Réinitialiser"}
              </button>
            </form>
          )}

          <hr className="divider" />
          <div style={{ textAlign: "center" }}>
            <button onClick={() => navigate("login")}
              style={{ background: "none", border: "none", color: "var(--text3)",
                cursor: "pointer", fontSize: 13 }}>
              ← Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}