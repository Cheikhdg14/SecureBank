export default function Navbar({ page, navigate, isAdmin, logout, open }) {
  const clientLinks = [
    { id: "dashboard", label: "Tableau de bord", icon: "🏠" },
    { id: "accounts",  label: "Mes comptes",     icon: "💳" },
    { id: "deposit",   label: "Déposer",          icon: "⬇️" },
    { id: "transfer",  label: "Virement",         icon: "↗️" },
    { id: "history",   label: "Historique",       icon: "📋" },
    { id: "change-password", label: "Changer mot de passe", icon: "🔑" },
  ];

  const adminLinks = [
    { id: "admin", label: "Administration", icon: "⚙️" },
    { id: "change-password", label: "Changer mot de passe", icon: "🔑" },
  ];

  const links = isAdmin ? adminLinks : clientLinks;

  return (
    <nav className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-header">
        <span className="sidebar-logo">SecureBank</span>
      </div>
      <ul className="sidebar-links">
        {links.map(l => (
          <li key={l.id}>
            <button
              className={`sidebar-link ${page === l.id ? "active" : ""}`}
              onClick={() => navigate(l.id)}>
              <span className="sidebar-icon">{l.icon}</span>
              <span>{l.label}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="sidebar-footer">
        <button className="sidebar-link logout" onClick={logout}>
          <span className="sidebar-icon">🚪</span>
          <span>Déconnexion</span>
        </button>
      </div>
    </nav>
  );
}