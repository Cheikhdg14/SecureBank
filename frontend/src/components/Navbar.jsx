import { useAuth } from "../context/AuthContext";

const clientItems = [
  { key: "dashboard", label: "Tableau de bord", d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { key: "accounts",  label: "Mes comptes",     d: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
  { key: "transfer",  label: "Virement",         d: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" },
  { key: "history",   label: "Historique",       d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
];
const adminItems = [
  { key: "admin", label: "Administration", d: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
];

export default function Navbar({ page, navigate, isAdmin, logout, open }) {
  const { auth } = useAuth();
  const items = isAdmin ? adminItems : clientItems;

  return (
    <nav className={`navbar ${open ? "open" : ""}`}>
      {/* Logo */}
      <div style={{ marginBottom: "1.5rem", paddingLeft: "0.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 30, height: 30, background: "var(--accent)", borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1rem", color: "var(--text)" }}>SecureBank</div>
            <div style={{ fontSize: 9, color: "var(--text3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {isAdmin ? "Admin" : "Client"}
            </div>
          </div>
        </div>
      </div>

      {/* User pill */}
      <div style={{ background: "var(--surface2)", borderRadius: 8, padding: "8px 10px",
        marginBottom: "1.25rem", fontSize: 12, color: "var(--text2)", overflow: "hidden",
        textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {auth?.email}
      </div>

      {/* Nav items */}
      <div style={{ flex: 1 }}>
        {items.map(item => {
          const active = page === item.key;
          return (
            <button key={item.key} onClick={() => navigate(item.key)} style={{
              display: "flex", alignItems: "center", gap: 9, width: "100%",
              padding: "9px 10px", border: "none", cursor: "pointer", borderRadius: 8,
              marginBottom: 3, background: active ? "var(--accent-light)" : "transparent",
              color: active ? "var(--accent2)" : "var(--text2)", fontFamily: "inherit",
              fontSize: 14, fontWeight: active ? 500 : 400, textAlign: "left",
              transition: "all 0.12s",
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.d} />
              </svg>
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Logout */}
      <button onClick={logout} style={{
        display: "flex", alignItems: "center", gap: 9, width: "100%",
        padding: "9px 10px", border: "none", cursor: "pointer", borderRadius: 8,
        background: "transparent", color: "var(--text3)", fontFamily: "inherit",
        fontSize: 14, textAlign: "left", transition: "all 0.12s",
        marginTop: "0.5rem",
      }}
        onMouseEnter={e => { e.currentTarget.style.background = "var(--danger-light)"; e.currentTarget.style.color = "var(--danger)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text3)"; }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Déconnexion
      </button>
    </nav>
  );
}
