const mysql = require('mysql2');

// Utiliser un pool de connexions au lieu d'une connexion unique
// Le pool gère automatiquement les reconnexions et les timeouts
const pool = mysql.createPool({
    host: '93.127.158.95',
    user: 'site',
    password: 'rayith',
    database: 'site',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    // Reconnexion automatique en cas de déconnexion
    connectTimeout: 10000,
    // Éviter les timeouts MySQL (wait_timeout par défaut 8h)
    // Ping la connexion avant de l'utiliser si inactive depuis 2h
    acquireTimeout: 10000
});

// Test de connexion au démarrage
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Erreur de connexion à la base de données:', err.message);
        return;
    }
    console.log('✅ Pool de connexions MySQL créé avec succès!');
    connection.release();
});

// Gestion des erreurs du pool
pool.on('error', (err) => {
    console.error('❌ Erreur du pool MySQL:', err.message);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('🔄 Reconnexion automatique en cours...');
    }
});

module.exports = pool;
