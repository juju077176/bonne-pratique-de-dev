class Slot {
    constructor(id, serviceId, datetime, capacity) {
        this.id = id || `slt_${Date.now()}`;
        this.serviceId = serviceId;
        this.datetime = datetime;
        this.capacity = capacity || 1;
    }

    validate() {
        if (!this.serviceId) throw new Error('L\'ID du service est obligatoire');
        if (!this.datetime) throw new Error('La date et l\'heure sont obligatoires');
        if (this.capacity < 1) throw new Error('La capacité doit être d\'au moins 1');
        return true;
    }
}

module.exports = Slot;
