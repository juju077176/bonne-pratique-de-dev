class Service {
    constructor(id, name, description, duration) {
        this.id = id || `svc_${Date.now()}`;
        this.name = name;
        this.description = description || '';
        this.duration = duration || 30;
    }

    validate() {
        if (!this.name) throw new Error('Le nom du service est obligatoire');
        if (this.duration && typeof this.duration !== 'number') {
            throw new Error('La durée doit être un nombre');
        }
        return true;
    }
}

module.exports = Service;
