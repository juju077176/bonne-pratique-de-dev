# Système de Réservation de Services

## 📋 Présentation

Application web de gestion de réservations permettant aux utilisateurs de réserver des créneaux horaires pour différents services (massage, coiffure, manucure). Authentification simplifiée par email uniquement (sans mot de passe), avec panel d'administration complet.

**Fonctionnalités** : Catalogue de services • Réservation intelligente avec gestion des créneaux • Consultation et annulation des réservations • Panel admin pour gérer utilisateurs et réservations

---

## 🛠️ Stack Technique

**Backend** : Node.js 20.x + Express.js 4.x + MySQL 8.x + mysql2  
**Frontend** : HTML5 / CSS3 / Vanilla JavaScript  
**Architecture** : Pattern MVC adapté avec séparation Backend/Frontend/Data

**Justifications** :
- Node.js/Express : performance, simplicité, écosystème riche
- MySQL : fiabilité, intégrité référentielle, transactions
- Vanilla JS : légèreté, pas de dépendances lourdes, apprentissage des fondamentaux

---

## 📦 Installation

### Prérequis
Node.js 16+, MySQL 8+, npm 7+

### Étapes

```bash"

# 1. Installer les dépendances
npm install

# 2. Créer la base de données (voir script SQL ci-dessous)

# 3. Configurer la connexion dans config/db.config.js
```

### Script SQL
```sql
CREATE DATABASE IF NOT EXISTS site;
USE site;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE services (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    duration INT DEFAULT 30
);

CREATE TABLE reservations (
    id VARCHAR(50) PRIMARY KEY,
    serviceId VARCHAR(50),
    userEmail VARCHAR(100) NOT NULL,
    datetime DATETIME NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (serviceId) REFERENCES services(id) ON DELETE CASCADE
);

INSERT INTO services VALUES
('svc_1', 'Massage relaxant', 'Un massage apaisant', 60),
('svc_2', 'Coupe de cheveux', 'Coupe professionnelle', 45),
('svc_3', 'Manucure', 'Soin complet des mains', 30);

INSERT INTO users (email) VALUES ('ju.riviere77@gmail.com');
```

---

## 🚀 Exécution

**Local** : `npm start` → http://localhost:3000  
**Production (VPS)** : `pm2 start index.js --name reservation-app && pm2 save`

---

## 📁 Structure

```
backend/          # Routes API (api.js, auth.js) + Models
config/           # Configuration MySQL
frontend/         # HTML, CSS, JS (auth, services, admin)
index.js          # Point d'entrée serveur
```

---

## 🏗️ Architecture

```
NAVIGATEUR → Express.js (Routes + Middlewares) → MySQL
   ↓              ↓                                 ↓
HTML/CSS/JS   API REST (JSON)              Tables: users, services, reservations
```

**Flux réservation** : Utilisateur sélectionne date → GET /api/slots → Affiche créneaux → POST /api/reservations → Confirmation

---

## 📝 Utilisation

**Admin** : Connectez-vous avec `ju.riviere77@gmail.com` → Bouton "Admin" visible  
**Utilisateur** : Inscription → Connexion → Réservation → Gestion

---

## 🔒 Sécurité

✅ Validation entrées • Header `user-email` • Vérification admin serveur • Anti-doublon  
⚠️ Limites (projet éducatif) : Pas de JWT, pas de HTTPS, pas de rate limiting

---

## 🐛 Dépannage

**Pas de connexion** : Vérifier que l'email existe dans `users`  
**Pas de créneaux** : Vérifier les données dans `services`  
**Erreur MySQL** : Vérifier credentials dans `config/db.config.js`  
**Port occupé** : Changer le port dans `index.js`

---

## 📞 Contact

**Auteur** : Julien (Rayith)  
**Date** : Novembre 2025  
**Contexte** : TP Bonnes Pratiques de Développement
