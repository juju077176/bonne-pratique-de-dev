const express = require('express');
const path = require('path');
const pool = require('./config/db.config');
const apiRoutes = require('./backend/routes/api');
const authRoutes = require('./backend/routes/auth');

const app = express();
const port = process.env.PORT || 3000;
const host = '0.0.0.0'; // Mettre localhost pour l'executé en localhost


// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// Middleware pour les logs
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Admin check middleware - AVANT les routes
app.use((req, res, next) => {
    const ADMIN_EMAIL = 'ju.riviere77@gmail.com';
    const isAdmin = req.headers['user-email'] === ADMIN_EMAIL;
    req.isAdmin = isAdmin;
    next();
});

// Routes
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error('Erreur:', err);
    res.status(500).json({ message: 'Erreur serveur' });
});

// Démarrer le serveur
app.listen(port, host, () => {
    console.log(`Serveur en cours d'exécution sur http://${host}:${port}`);
});
