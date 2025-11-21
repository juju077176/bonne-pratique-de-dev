const fs = require('fs').promises;
const path = require('path');
const Slot = require('../models/Slot');

class SlotManager {
    constructor() {
        this.dataPath = path.join(__dirname, '../../data/slots.json');
    }

    async getAllSlots() {
        try {
            const data = await fs.readFile(this.dataPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }

    async addSlot(slotData) {
        const slot = new Slot(null, slotData.serviceId, slotData.datetime, slotData.capacity);
        slot.validate();
        
        const slots = await this.getAllSlots();
        slots.push(slot);
        
        await fs.writeFile(this.dataPath, JSON.stringify(slots, null, 2));
        return slot;
    }
}

module.exports = SlotManager;
