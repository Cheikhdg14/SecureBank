<p align="center">
  <img src="https://img.shields.io/badge/UCAD-École%20Supérieure%20Polytechnique-blue?style=for-the-badge" alt="ESP UCAD">
  <img src="https://img.shields.io/badge/Master%201-SSI%20%7C%20DevSecOps-red?style=for-the-badge" alt="M1 SSI">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Sprint-Alpha-emerald?style=flat-square" alt="Sprint Alpha">
  <img src="https://img.shields.io/badge/Backend-Spring%20Boot%203.2-brightgreen?style=flat-square&logo=springboot" alt="Spring Boot">
  <img src="https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite-blue?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/BDD-MySQL%208-orange?style=flat-square&logo=mysql" alt="MySQL">
</p>

---

# 🛡️ SecureBank - Plateforme Bancaire Sécurisée

**SecureBank** est une application bancaire distribuée à succursales multiples, conçue selon une approche stricte de *Security by Design* au sein du cycle DevSecOps. Le système repose sur un backend robuste en **Spring Boot 3.2** exposant une API REST stateless et une interface utilisateur moderne développée en **React 18 / Vite**. 

L'application garantit une traçabilité cryptographique absolue via un chaînage de blocs d'audit, une authentification forte à double facteur (2FA) par e-mail, et le chiffrement de bout en bout des données financières sensibles au repos et en transit.

---

## 👥 Équipe de Développement (DIC2-SSI | ESP Dakar)
Ce projet est réalisé dans le cadre du module de **DevSecOps** sous la direction du **Professeur Doudou FALL** à l'École Supérieure Polytechnique de Dakar (Année Académique 2025-2026).

| Nom & Prénom | Adresse e-mail | Rôle |
| :--- | :--- | :--- |
| **Khadidiatou FAYE** | faye50938@gmail.com | Chef de projet |
| **Cheikh Ahmed Tidiane DIENG** | cheikhahmedtidianedieng1@esp.sn | Développeur Backend |
| **Mamadou Koné NDOUR** | mamadounndour@gmail.com | Développeur Front-end |
| **Fatou NDOUR** | fatoundour@esp.sn | Sécurité & Tests |

---

## ⚙️ Spécifications de la Stack Technique

### Backend
* **Framework :** Spring Boot 3.2 / Java 25 (cible de compilation stable : Java 21)
* **Persistance :** Spring Data JPA / Hibernate (génération et synchronisation d'infrastructure `ddl-auto: update`)
* **Sécurité :** Spring Security 6 (Architecture sans état via JWT)
* **Zéro-Lombok :** Suite à des incompatibilités majeures de la librairie avec Java 25, le projet n'utilise **aucune** dépendance Lombok. L'intégralité des POJOs, DTOs et Patrons Builders a été réécrits manuellement pour assurer la transparence et la stabilité absolue du code source.
* **Documentation :** Swagger UI activé et disponible sur `http://localhost:8080/swagger-ui/index.html`.

### Frontend
* **Framework UI :** React 18.3.1 / Vite 5.4.2 (sans dépendances CSS externes : intégration via CSS Custom Properties).
* **Communication API :** Fetch API natif configuré avec le chemin relatif `/api`. Les appels passent par le proxy de développement Vite vers le port `8080` (mécanisme anti-CORS).
* **Gestion d'État :** Routage interne par gestion d'état (`useState`), Context API (`AuthContext`) pour la propagation globale de session, et persistance du jeton dans le `localStorage`.

---

## 🔐 Architecture de Sécurité et Cryptographie

| Pilier de Sécurité | Implémentation et Mécanismes dans SecureBank |
| :--- | :--- |
| **Authentification Forte (2FA)** | Processus de connexion obligatoire en 2 étapes : validation du mot de passe haché par `BCrypt` (Facteur de coût de 12) **+** validation d'un code OTP à 6 chiffres généré cryptographiquement (`SecureRandom`) envoyé par e-mail (Validité stricte de 5 min, protection anti-rejeu). |
| **Sessions Sans État (Stateless)** | Aucun cookie de session HTTP ou état stocké côté serveur. Émission d'un token **JWT** éphémère (validité 1 heure) signé numériquement via `HMAC-SHA256` incluant les privilèges utilisateurs (`ROLE_CLIENT`, `ROLE_ADMIN`). |
| **Contrôle d'Accès Strict (RBAC)** | Protection double barrière : filtrage des requêtes HTTP via les filtres Spring Security et sécurisation des méthodes métier par annotations `@PreAuthorize` au niveau de l'API. Une vérification d'identité stricte est opérée côté serveur pour empêcher toute escalade de privilèges. |
| **Chiffrement au Repos** | Chiffrement avancé **AES-256-GCM** des montants, soldes et données financières sensibles en base de données. Chaque chiffrement génère un vecteur d'initialisation (IV) de 12 octets unique. |
| **Journal d'Audit Immuable** | Implémentation d'une chaîne d'audit inspirée du principe de la Blockchain. Chaque entrée génère un hash `HMAC-SHA256` lié cryptographiquement au hash de la ligne précédente (`previous_hash`). Toute tentative de falsification ou de suppression en BDD brise la chaîne et lève instantanément une alerte d'intégrité. |

---

## 🛡️ Analyse SAST & Vigilance Sécurité (Semgrep)

Conformément à nos exigences de pipeline **DevSecOps**, des scans d'analyse statique de sécurité (**SAST**) sont menés de manière continue via **Semgrep** sur le dépôt du projet afin de déceler les vulnérabilités de code au plus tôt.

### Rapport d'audit de vulnérabilité détectée (Sprint Alpha)
* **Identifiant de la règle :** `java.lang.security.audit.crypto.weak-random.weak-random`
* **Fichier ciblé :** `/src/secureBank/securebank_Backend/src/main/java/com/securebank/service/AccountService.java` (Ligne 75)
* **Gravité :** Élevée (Alerte Cryptographique)

> ⚠️ **Message d'alerte Semgrep :**
> *"Détection de l'utilisation des fonctions `Math.random()` ou `java.util.Random()`. Ces générateurs de nombres aléatoires ne sont pas cryptographiquement forts. Si vous utilisez ces générateurs (RNG) pour créer des mots de passe, des identifiants ou des jetons secrets, utilisez plutôt `java.security.SecureRandom`."*

### Mesure de remédiation appliquée
Afin de bloquer les attaques par prédiction de séquences d'identifiants (indispensable pour une plateforme bancaire), l'intégralité des fonctionnalités critiques de SecureBank (génération des numéros de compte uniques `SBxxxxxxxxxx` et des codes OTP à 6 chiffres) a été migrée de manière stricte vers la classe **`java.security.SecureRandom`**, garantissant un niveau d'aléa de force cryptographique industrielle conforme aux exigences de l'audit.

---

## 📊 Schéma de la Base de Données (MySQL)

Le schéma relationnel `securebank_db` est structuré autour de 5 tables clés :
* **`users`** : Stockage des comptes (mots de passe hachés BCrypt, statut d'activation, rôles RBAC).
* **`accounts`** : Comptes bancaires associés aux clients (`CHECKING` ou `SAVINGS`) dotés de numéros uniques au format `SBxxxxxxxxxx`.
* **`transactions`** : Historique atomique (`@Transactional` ACID) avec référence unique UUID.
* **`audit_logs`** : Journal sécurisé contenant les actions, e-mails des acteurs, adresses IP, hashs et empreintes HMAC chaînées.
* **`otp_tokens`** : Codes OTP temporaires hashés en BDD pour l'authentification et les virements.

---

## 🚀 Catalogue Exhaustif des Endpoints API

Toutes les requêtes retournent un format JSON standardisé : 
`{"success": true/false, "message": "...", "data": {...} ou null, "timestamp": "..."}`

### 1. Module Authentification (Public)
* `POST /api/auth/register` : Inscription d'un nouveau client. Le compte est créé désactivé (`enabled=false`) par défaut pour des raisons de sécurité de flux.
* `POST /api/auth/login` : Étape 1 de la connexion. Vérifie les identifiants et déclenche l'envoi de l'OTP par e-mail.
* `POST /api/auth/verify-otp` : Étape 2 de la connexion. Valide le jeton OTP et retourne le JWT ainsi que le rôle et l'e-mail de l'utilisateur.

### 2. Espace Client (ROLE_CLIENT) - *Header Authorization Obligatoire*
* `POST /api/accounts` : Ouverture d'un nouveau compte bancaire (Courant ou Épargne).
* `GET /api/accounts` : Liste tous les comptes dont l'utilisateur connecté est le propriétaire exclusif.
* `GET /api/accounts/{num}/balance` : Consultation sécurisée du solde actualisé.
* `POST /api/transactions/transfer/initiate` : Étape 1 du virement. Vérifie la provision, génère une référence de transaction UUID et envoie un code OTP de confirmation par e-mail.
* `POST /api/transactions/transfer/confirm` : Étape 2 du virement. Valide l'OTP et exécute le transfert financier de manière atomique en base de données.
* `GET /api/transactions/history/{num}` : Récupère l'historique complet des transactions du compte ciblé.

### 3. Espace Administration (ROLE_ADMIN uniquement)
* `GET /api/admin/users` : Liste exhaustive de tous les utilisateurs et de leurs comptes respectifs (via DTO sécurisés).
* `PATCH /api/admin/users/{id}/enable?enabled=true` : Activation administrative ou blocage immédiat d'un compte utilisateur.
* `PATCH /api/admin/accounts/{num}/suspend` : Suspension conservatoire d'un compte bancaire en cas de suspicion de fraude.
* `GET /api/admin/audit` : Extraction complète du journal d'audit de l'infrastructure.
* `GET /api/admin/audit/integrity` : Exécute l'algorithme de vérification de l'intégrité de la chaîne de hachage HMAC.

---

## 🛠️ Guide d'Installation et Lancement Local

### 1. Initialisation de la Base de Données
1. Lancez votre serveur MySQL (via XAMPP ou conteneur natif).
2. Créez la base de données via votre CLI ou phpMyAdmin :
   ```sql
   CREATE DATABASE securebank_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'votre_mot_de_passe_mysql';
   FLUSH PRIVILEGES;
