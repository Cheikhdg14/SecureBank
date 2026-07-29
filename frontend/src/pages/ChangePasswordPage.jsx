import { useState } from "react";
import { api } from "../services/api";

export default function ChangePasswordPage({ navigate }) {
  const [form, setForm] = useState({ oldPassword: "", newPassword: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const strength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/\d/.test(pwd)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) score++;
    if (pwd.length >= 12) score++;
    return score;
  };

  const strengthLabel = ["", "Faible", "Moyen", "Fort", "Très fort"];
  const strengthColor = ["", "var(--color-text-danger)", "orange",
    "var(--color-text-success)", "var(--color-text-success)"];
  const s = strength(form.newPassword);

  const submit = async (e) => {
    e.preventDefault(); setError(""); setSuccess("");
    if (form.newPassword !== form.confirm) {
      setError("Les mots de passe ne correspondent pas"); return;
    }
    setLoading(true);
    try {
      await api.changePassword(form.oldPassword, form.newPassword);
      setSuccess("Mot de passe modifié avec succès !");
      setForm({ oldPassword: "", newPassword: "", confirm: "" });
      setTimeout(() => navigate("dashboard"), 2000);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 440, margin: "0 auto" }}>
      <div className="page-title"><h1>Changer le mot de passe</h1></div>
      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Ancien mot de passe</label>
            <input type="password" value={form.oldPassword}
              onChange={e => set("oldPassword", e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Nouveau mot de passe</label>
            <input type="password" value={form.newPassword}
              onChange={e => set("newPassword", e.target.value)}
              placeholder="8 car. min, 1 chiffre, 1 spécial" required />
            {form.newPassword && (
              <div style={{ marginTop: 6 }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 4, borderRadius: 2,
                      background: i <= s ? strengthColor[s] : "var(--color-border-tertiary)"
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: strengthColor[s] }}>
                  {strengthLabel[s]}
                </span>
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Confirmer le nouveau mot de passe</label>
            <input type="password" value={form.confirm}
              onChange={e => set("confirm", e.target.value)} required />
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Modification..." : "Modifier"}
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