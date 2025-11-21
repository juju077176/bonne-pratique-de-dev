const express = require('express');
const router = express.Router();
const connection = require('../../config/db.config');

// Connexion simplifiée (email uniquement)
router.post('/login', (req, res) => {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
        return res.status(400).json({ message: 'Email invalide' });
    }

    // Vérifier si l'utilisateur existe
    const query = 'SELECT id, email FROM users WHERE email = ? LIMIT 1';
    connection.query(query, [email], (error, results) => {
        if (error) {
            console.error('Erreur lors de la requête login:', error);
            return res.status(500).json({ message: 'Erreur serveur' });
        }

        if (!results || results.length === 0) {
            return res.status(401).json({ message: 'Aucun compte lié à cet email' });
        }

        const user = results[0];
        const isAdmin = email === 'ju.riviere77@gmail.com';
        return res.json({ 
            message: 'Connexion réussie', 
            user: { id: user.id, email: user.email, isAdmin } 
        });
    });
});

// Inscription simplifiée
router.post('/register', (req, res) => {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
        return res.status(400).json({ message: 'Email invalide' });
    }

    const checkQuery = 'SELECT id FROM users WHERE email = ?';
    connection.query(checkQuery, [email], (error, results) => {
        if (error) {
            console.error('Erreur lors de la vérification:', error);
            return res.status(500).json({ message: 'Erreur serveur' });
        }

        if (results && results.length > 0) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }

        const insertQuery = 'INSERT INTO users (email) VALUES (?)';
        connection.query(insertQuery, [email], (err) => {
            if (err) {
                console.error('Erreur lors de l\'insertion:', err);
                return res.status(500).json({ message: 'Erreur lors de l\'inscription' });
            }
            const isAdmin = email === 'ju.riviere77@gmail.com';
            return res.status(201).json({ 
                message: 'Inscription réussie', 
                user: { email, isAdmin } 
            });
        });
    });
});

module.exports = router;
