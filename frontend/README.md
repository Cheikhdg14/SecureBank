# SecureBank — Frontend React

Interface web pour le backend SecureBank (Spring Boot).  
Projet DevSecOps – DIC2-SSI | ESP Dakar | 2025-2026

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | React 18 (Vite) |
| Routing | État local (sans react-router) |
| Auth | JWT stocké dans localStorage |
| API | fetch natif — calé sur les endpoints Spring Boot |
| Style | CSS custom properties (pas de framework CSS) |
| Polices | DM Sans + DM Serif Display (Google Fonts) |

---

## Installation et lancement

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer en développement (port 3000)
#    Le proxy Vite redirige /api/* → http://localhost:8080
npm run dev

# 3. Build de production
npm run build
```

> ⚠️ Le backend Spring Boot doit tourner sur `http://localhost:8080` avant de lancer le frontend.

---

## Pages & fonctionnalités

### Espace CLIENT

| Page | Route interne | Endpoints utilisés |
|------|--------------|-------------------|
| Connexion | `login` | `POST /api/auth/login` |
| Inscription | `register` | `POST /api/auth/register` |
| Vérification OTP | `otp` | `POST /api/auth/verify-otp` |
| Tableau de bord | `dashboard` | `GET /api/accounts` + `GET /api/transactions/history/{num}` |
| Mes comptes | `accounts` | `GET /api/accounts` · `POST /api/accounts` · `GET /api/accounts/{num}/balance` |
| Virement (étape 1) | `transfer` | `POST /api/transactions/transfer/initiate` |
| Virement (étape 2) | `otp-transfer` | `POST /api/auth/verify-otp` + `POST /api/transactions/transfer/confirm` |
| Historique | `history` | `GET /api/transactions/history/{accountNumber}` |

### Espace ADMIN

| Page | Endpoints utilisés |
|------|--------------------|
| Utilisateurs | `GET /api/admin/users` · `PATCH /api/admin/users/{id}/enable` |
| Comptes | `PATCH /api/admin/accounts/{number}/suspend` |
| Journal d'audit | `GET /api/admin/audit` |
| Vérification intégrité | `GET /api/admin/audit/integrity` |

---

## Flux d'authentification (2FA)

```
1. POST /api/auth/login        → succès + OTP envoyé par mail
2. POST /api/auth/verify-otp   → { token, role }  ← JWT stocké
3. Toutes les requêtes suivantes : Authorization: Bearer <token>
```

## Flux virement sécurisé

```
1. POST /api/transactions/transfer/initiate  → { reference }
2. OTP envoyé par mail
3. POST /api/auth/verify-otp  (purpose: TRANSFER)
4. POST /api/transactions/transfer/confirm  { reference, otpCode }
```

---

## Structure du projet

```
src/
├── main.jsx                  # Point d'entrée React
├── App.jsx                   # Routeur (état local)
├── index.css                 # Design system global
├── context/
│   └── AuthContext.js        # Contexte auth JWT
├── services/
│   └── api.js                # Toutes les fonctions fetch → API
├── components/
│   └── Navbar.jsx            # Navigation latérale
└── pages/
    ├── LoginPage.jsx
    ├── RegisterPage.jsx
    ├── OtpPage.jsx           # OTP login + OTP virement
    ├── DashboardPage.jsx
    ├── AccountsPage.jsx
    ├── TransferPage.jsx      # Formulaire + confirmation OTP intégrée
    ├── HistoryPage.jsx
    └── AdminPage.jsx         # Gestion users, audit, intégrité
```
## Équipe

| Nom | Rôle |
|---|---|
| Cheikh Ahmed T DIENG | Chef de projet / Backend |
| Fatou NDOUR | Sécurité / Cryptographie |
| Khadidiatou FAYE | Base de données / Backend |
| Mamadou Kone NDOUR | Tests / Front-end |
