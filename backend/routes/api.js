const express = require('express');
const router = express.Router();
const connection = require('../../config/db.config');

// Route pour obtenir tous les services
router.get('/services', (req, res) => {
    console.log('[API] GET /api/services');
    const query = 'SELECT * FROM services';
    connection.query(query, (error, results) => {
        if (error) {
            console.error('Erreur services:', error);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        res.json(results);
    });
});

// Route ADMIN pour lister les utilisateurs - CORRECTION COMPLETE
router.get('/admin/users', (req, res) => {
    console.log('[API] GET /api/admin/users');
    console.log('[API] Headers:', req.headers);
    
    const ADMIN_EMAIL = 'ju.riviere77@gmail.com';
    const userEmail = req.headers['user-email'];
    
    console.log('[API] user-email header:', userEmail);
    console.log('[API] Expected:', ADMIN_EMAIL);
    console.log('[API] Match:', userEmail === ADMIN_EMAIL);
    
    if (userEmail !== ADMIN_EMAIL) {
        console.log('[API] Access DENIED');
        return res.status(403).json({ message: 'Accès admin requis' });
    }

    console.log('[API] Access GRANTED - Querying database');
    const sql = 'SELECT id, email FROM users ORDER BY email';
    
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('[API] Database error:', err);
            return res.status(500).json({ message: 'Erreur serveur: ' + err.message });
        }
        
        console.log('[API] Query successful - Found', results ? results.length : 0, 'users');
        console.log('[API] Results:', results);
        res.json(results || []);
    });
});

// Route pour obtenir les réservations d'un utilisateur
router.get('/reservations', (req, res) => {
    const userEmail = req.query.email;
    
    const query = `
        SELECT 
            r.id,
            r.datetime,
            s.name AS serviceName,
            s.duration,
            s.description
        FROM reservations r
        INNER JOIN services s ON r.serviceId = s.id
        WHERE r.userEmail = ?
        ORDER BY r.datetime DESC
    `;
    
    connection.query(query, [userEmail], (error, results) => {
        if (error) {
            console.error('Erreur réservations:', error);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        res.json(results);
    });
});

// Route pour créer une réservation
router.post('/reservations', (req, res) => {
    const { serviceId, dateTime } = req.body;
    const userEmail = req.headers['user-email'];

    if (!userEmail) {
        return res.status(401).json({ message: 'Utilisateur non connecté' });
    }

    const reservationId = 'res_' + Date.now();
    const query = 'INSERT INTO reservations (id, serviceId, userEmail, datetime) VALUES (?, ?, ?, ?)';
    
    connection.query(query, [reservationId, serviceId, userEmail, dateTime], (error) => {
        if (error) {
            console.error('Erreur réservation:', error);
            return res.status(500).json({ message: 'Erreur lors de la réservation' });
        }
        res.status(201).json({ 
            message: 'Réservation confirmée',
            id: reservationId 
        });
    });
});

// Route pour supprimer une réservation
router.delete('/reservations/:id', (req, res) => {
    const reservationId = req.params.id;
    const userEmail = req.headers['user-email'];

    const checkQuery = `SELECT * FROM reservations WHERE id = ? AND userEmail = ? AND datetime > NOW()`;
    
    connection.query(checkQuery, [reservationId, userEmail], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        
        if (results.length === 0) {
            return res.status(400).json({ message: 'Réservation introuvable ou déjà passée' });
        }

        const deleteQuery = 'DELETE FROM reservations WHERE id = ?';
        connection.query(deleteQuery, [reservationId], (error) => {
            if (error) {
                return res.status(500).json({ message: 'Erreur lors de l\'annulation' });
            }
            res.json({ message: 'Réservation annulée avec succès' });
        });
    });
});

// Route pour obtenir les créneaux disponibles
router.get('/slots', (req, res) => {
    const { serviceId, date } = req.query;
    if (!serviceId || !date) {
        return res.status(400).json({ message: 'serviceId et date requis' });
    }

    const serviceQuery = 'SELECT duration FROM services WHERE id = ? LIMIT 1';
    connection.query(serviceQuery, [serviceId], (err, services) => {
        if (err) return res.status(500).json({ message: 'Erreur serveur' });
        if (!services || services.length === 0) return res.status(404).json({ message: 'Service introuvable' });

        const duration = services[0].duration || 30;
        const startHour = 9;
        const endHour = 18;

        const takenQuery = 'SELECT datetime FROM reservations WHERE serviceId = ? AND DATE(datetime) = ?';
        connection.query(takenQuery, [serviceId, date], (err2, results) => {
            if (err2) return res.status(500).json({ message: 'Erreur serveur' });

            const takenSet = new Set((results || []).map(r => {
                const dt = new Date(r.datetime);
                const pad = n => String(n).padStart(2,'0');
                return `${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
            }));

            const slots = [];
            const pad = n => String(n).padStart(2,'0');
            let currentMinutes = startHour * 60;
            const endMinutes = endHour * 60;
            
            while (currentMinutes + duration <= endMinutes) {
                const hh = pad(Math.floor(currentMinutes / 60));
                const mm = pad(currentMinutes % 60);
                const timeStr = `${hh}:${mm}:00`;
                const datetimeSQL = `${date} ${hh}:${mm}:00`;
                const available = !takenSet.has(timeStr);
                slots.push({ time: `${hh}:${mm}`, datetime: datetimeSQL, available });
                currentMinutes += duration;
            }

            return res.json(slots);
        });
    });
});

// Routes admin
router.post('/admin/reservations', (req, res) => {
    const ADMIN_EMAIL = 'ju.riviere77@gmail.com';
    if (req.headers['user-email'] !== ADMIN_EMAIL) {
        return res.status(403).json({ message: 'Accès admin requis' });
    }
    
    const { userEmail, serviceId, dateTime } = req.body;
    if (!userEmail || !serviceId || !dateTime) {
        return res.status(400).json({ message: 'Données manquantes' });
    }

    connection.query('SELECT id FROM users WHERE email = ? LIMIT 1', [userEmail], (err, users) => {
        if (err) return res.status(500).json({ message: 'Erreur serveur' });
        if (!users || users.length === 0) return res.status(400).json({ message: 'Utilisateur introuvable' });

        const reservationId = 'res_' + Date.now();
        const insert = 'INSERT INTO reservations (id, serviceId, userEmail, datetime) VALUES (?, ?, ?, ?)';
        connection.query(insert, [reservationId, serviceId, userEmail, dateTime], (err2) => {
            if (err2) return res.status(500).json({ message: 'Erreur lors de la création' });
            res.status(201).json({ message: 'Réservation créée', id: reservationId });
        });
    });
});

router.patch('/admin/reservations/:id', (req, res) => {
    const ADMIN_EMAIL = 'ju.riviere77@gmail.com';
    if (req.headers['user-email'] !== ADMIN_EMAIL) {
        return res.status(403).json({ message: 'Accès admin requis' });
    }
    
    const id = req.params.id;
    const { dateTime } = req.body;
    if (!dateTime) return res.status(400).json({ message: 'dateTime requis' });

    const update = 'UPDATE reservations SET datetime = ? WHERE id = ?';
    connection.query(update, [dateTime, id], (err) => {
        if (err) return res.status(500).json({ message: 'Erreur serveur' });
        res.json({ message: 'Réservation mise à jour' });
    });
});

router.delete('/admin/reservations/:id', (req, res) => {
    const ADMIN_EMAIL = 'ju.riviere77@gmail.com';
    if (req.headers['user-email'] !== ADMIN_EMAIL) {
        return res.status(403).json({ message: 'Accès admin requis' });
    }
    
    const id = req.params.id;
    const deleteQuery = 'DELETE FROM reservations WHERE id = ?';
    
    connection.query(deleteQuery, [id], (err, result) => {
        if (err) {
            console.error('[API] Delete error:', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Réservation introuvable' });
        }
        res.json({ message: 'Réservation supprimée avec succès' });
    });
});

module.exports = router;
