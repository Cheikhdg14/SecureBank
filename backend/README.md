# SecureBank – Système Bancaire Sécurisé

Projet DevSecOps – DIC2-SSI | ESP Dakar | 2025-2026

## Stack technique

| Couche | Technologie |
|---|---|
| Backend | Spring Boot 3.2 / Java 21 |
| Sécurité | Spring Security 6, JWT (JJWT), BCrypt, OTP |
| Cryptographie | AES-256-GCM, HMAC-SHA256 |
| BDD | MySQL 8 + Spring Data JPA |
| Build | Maven |
| Tests | JUnit 5 + Mockito |
| Doc API | Swagger / OpenAPI 3 |

## Prérequis

- Java 21+
- Maven 3.9+
- MySQL 8+
- IntelliJ IDEA ou VS Code (Extension Pack for Java)

## Configuration

1. Créer la base de données MySQL :
```sql
CREATE DATABASE securebank_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Modifier `src/main/resources/application.yml` :
```yaml
spring.datasource.password: VOTRE_MOT_DE_PASSE_MYSQL
spring.mail.username: votre.email@gmail.com
spring.mail.password: votre_app_password_gmail
```

## Lancer le projet

```bash
mvn spring-boot:run
```

Swagger UI disponible sur : http://localhost:8080/swagger-ui.html

## Endpoints principaux

| Méthode | URL | Description | Rôle |
|---|---|---|---|
| POST | /api/auth/register | Inscription | Public |
| POST | /api/auth/login | Connexion (étape 1) | Public |
| POST | /api/auth/verify-otp | Validation OTP (étape 2) | Public |
| GET | /api/accounts | Mes comptes | CLIENT |
| GET | /api/accounts/{num}/balance | Solde | CLIENT |
| POST | /api/transactions/transfer/initiate | Initier virement | CLIENT |
| POST | /api/transactions/transfer/confirm | Confirmer avec OTP | CLIENT |
| GET | /api/transactions/history/{num} | Historique | CLIENT |
| GET | /api/admin/audit | Journal d'audit | ADMIN |
| GET | /api/admin/audit/integrity | Vérif intégrité | ADMIN |

## Équipe

| Nom | Rôle |
|---|---|
| Cheikh Ahmed T DIENG | Chef de projet / Backend |
| Fatou NDOUR | Sécurité / Cryptographie |
| Khadidiatou FAYE | Base de données / Backend |
| Mamadou Kone NDOUR | Tests / Intégration |
