const pool = require('../../config/db.config');

class CleanupService {
    /**
     * Supprime automatiquement les réservations dont les créneaux sont passés
     */
    static async cleanupExpiredReservations() {
        try {
            console.log(`[CLEANUP] Démarrage du nettoyage des réservations expirées - ${new Date().toISOString()}`);
            
            const query = `
                DELETE r FROM reservations r
                INNER JOIN slots s ON r.slotId = s.id
                WHERE s.datetime < NOW()
            `;
            
            const [result] = await pool.promise().query(query);
            
            console.log(`[CLEANUP] ${result.affectedRows} réservation(s) expirée(s) supprimée(s)`);
            return result.affectedRows;
        } catch (error) {
            console.error('[CLEANUP] Erreur lors du nettoyage:', error);
            throw error;
        }
    }

    /**
     * Supprime automatiquement les créneaux passés qui n'ont pas de réservations
     */
    static async cleanupExpiredSlots() {
        try {
            console.log(`[CLEANUP] Démarrage du nettoyage des créneaux expirés - ${new Date().toISOString()}`);
            
            const query = `
                DELETE FROM slots
                WHERE datetime < NOW()
                AND id NOT IN (SELECT DISTINCT slotId FROM reservations)
            `;
            
            const [result] = await pool.promise().query(query);
            
            console.log(`[CLEANUP] ${result.affectedRows} créneau(x) expiré(s) supprimé(s)`);
            return result.affectedRows;
        } catch (error) {
            console.error('[CLEANUP] Erreur lors du nettoyage des créneaux:', error);
            throw error;
        }
    }

    /**
     * Effectue un nettoyage complet : réservations expirées puis créneaux expirés
     */
    static async performFullCleanup() {
        try {
            console.log('[CLEANUP] ========================================');
            console.log('[CLEANUP] Début du nettoyage complet');
            
            const reservationsDeleted = await this.cleanupExpiredReservations();
            const slotsDeleted = await this.cleanupExpiredSlots();
            
            console.log(`[CLEANUP] Nettoyage terminé : ${reservationsDeleted} réservation(s) et ${slotsDeleted} créneau(x) supprimé(s)`);
            console.log('[CLEANUP] ========================================');
            
            return { reservationsDeleted, slotsDeleted };
        } catch (error) {
            console.error('[CLEANUP] Erreur lors du nettoyage complet:', error);
            throw error;
        }
    }
}

module.exports = CleanupService;
