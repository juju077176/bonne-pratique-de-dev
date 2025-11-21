const fs = require('fs').promises;
const path = require('path');
const Reservation = require('../models/Reservation');

class ReservationManager {
    constructor() {
        this.dataPath = path.join(__dirname, '../../data/reservations.json');
    }

    async getAllReservations() {
        try {
            const data = await fs.readFile(this.dataPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }

    async getReservationsByUser(userEmail) {
        const reservations = await this.getAllReservations();
        return reservations.filter(r => r.userEmail === userEmail);
    }

    async addReservation(reservationData) {
        const reservation = new Reservation(
            null,
            reservationData.slotId,
            reservationData.userEmail
        );
        reservation.validate();
        
        // Vérifier les doublons
        const existingReservations = await this.getAllReservations();
        const isDuplicate = existingReservations.some(
            r => r.slotId === reservation.slotId && r.userEmail === reservation.userEmail
        );
        
        if (isDuplicate) {
            throw new Error('Vous avez déjà réservé ce créneau');
        }
        
        existingReservations.push(reservation);
        await fs.writeFile(this.dataPath, JSON.stringify(existingReservations, null, 2));
        return reservation;
    }
}

module.exports = ReservationManager;
