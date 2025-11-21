const fs = require('fs').promises;
const path = require('path');
const Service = require('../models/Service');

class ServiceManager {
    constructor() {
        this.dataPath = path.join(__dirname, '../../data/services.json');
    }

    async getAllServices() {
        try {
            const data = await fs.readFile(this.dataPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }

    async addService(serviceData) {
        const service = new Service(null, serviceData.name, serviceData.description, serviceData.duration);
        service.validate();
        
        const services = await this.getAllServices();
        services.push(service);
        
        await fs.writeFile(this.dataPath, JSON.stringify(services, null, 2));
        return service;
    }
}

module.exports = ServiceManager;
