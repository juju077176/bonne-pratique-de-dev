class Reservation {
    constructor(id, slotId, userEmail) {
        this.id = id || `res_${Date.now()}`;
        this.slotId = slotId;
        this.userEmail = userEmail;
        this.createdAt = new Date().toISOString();
    }

    validate() {
        if (!this.slotId) throw new Error('L\'ID du créneau est obligatoire');
        if (!this.userEmail) throw new Error('L\'email de l\'utilisateur est obligatoire');
        if (!this.userEmail.includes('@')) throw new Error('Email invalide');
        return true;
    }
}

module.exports = Reservation;
