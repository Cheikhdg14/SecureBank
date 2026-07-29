import { useState, useEffect } from "react";
import { AuthContext } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OtpPage from "./pages/OtpPage";
import DashboardPage from "./pages/DashboardPage";
import TransferPage from "./pages/TransferPage";
import HistoryPage from "./pages/HistoryPage";
import AccountsPage from "./pages/AccountsPage";
import AdminPage from "./pages/AdminPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import DepositPage from "./pages/DepositPage";
import Navbar from "./components/Navbar";

export default function App() {
  const [auth, setAuth] = useState(() => {
    try {
      const s = localStorage.getItem("sb_auth");
      if (!s) return null;
      const parsed = JSON.parse(s);
      const payload = JSON.parse(atob(parsed.token.split(".")[1]));
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("sb_auth");
        return null;
      }
      return parsed;
    } catch { return null; }
  });

  const [page, setPage] = useState("login");
  const [otpCtx, setOtpCtx] = useState(null);
  const [navOpen, setNavOpen] = useState(false);

  // Expiration automatique de session
  useEffect(() => {
    if (!auth) return;
    const check = setInterval(() => {
      try {
        const payload = JSON.parse(atob(auth.token.split(".")[1]));
        if (payload.exp * 1000 < Date.now()) {
          setAuth(null);
          alert("Votre session a expiré. Veuillez vous reconnecter.");
        }
      } catch { setAuth(null); }
    }, 30000);
    return () => clearInterval(check);
  }, [auth]);

  useEffect(() => {
    if (auth) {
      localStorage.setItem("sb_auth", JSON.stringify(auth));
      setPage(auth.role === "ROLE_ADMIN" ? "admin" : "dashboard");
    } else {
      localStorage.removeItem("sb_auth");
      setPage("login");
    }
  }, [auth]);

  const navigate = (p, ctx = null) => {
    setOtpCtx(ctx);
    setPage(p);
    setNavOpen(false);
  };

  const logout = () => {
    if (window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      setAuth(null);
      setNavOpen(false);
    }
  };

  // Pages publiques (non connecté)
  if (!auth) {
    const ctx = { auth, setAuth, navigate };
    if (page === "register")
      return <AuthContext.Provider value={ctx}><RegisterPage /></AuthContext.Provider>;
    if (page === "otp")
      return <AuthContext.Provider value={ctx}><OtpPage ctx={otpCtx} /></AuthContext.Provider>;
    if (page === "forgot-password")
      return <AuthContext.Provider value={ctx}><ForgotPasswordPage navigate={navigate} /></AuthContext.Provider>;
    return <AuthContext.Provider value={ctx}><LoginPage /></AuthContext.Provider>;
  }

  const isAdmin = auth.role === "ROLE_ADMIN";

  return (
    <AuthContext.Provider value={{ auth, setAuth, navigate, logout }}>
      <button className="nav-toggle" onClick={() => setNavOpen(o => !o)} aria-label="Menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2">
          {navOpen
            ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          }
        </svg>
      </button>
      <div className={`nav-overlay ${navOpen ? "open" : ""}`}
        onClick={() => setNavOpen(false)} />
      <div className="app-layout">
        <Navbar page={page} navigate={navigate} isAdmin={isAdmin}
          logout={logout} open={navOpen} />
        <main className="app-main">
          {page === "dashboard"      && <DashboardPage navigate={navigate} />}
          {page === "accounts"       && <AccountsPage navigate={navigate} />}
          {page === "transfer"       && <TransferPage navigate={navigate} />}
          {page === "history"        && <HistoryPage ctx={otpCtx} />}
          {page === "deposit"        && <DepositPage navigate={navigate} />}
          {page === "change-password" && <ChangePasswordPage navigate={navigate} />}
          {page === "admin"          && isAdmin && <AdminPage />}
          {page === "otp-transfer"   && <OtpPage ctx={otpCtx} navigate={navigate} />}
        </main>
      </div>
    </AuthContext.Provider>
  );
}