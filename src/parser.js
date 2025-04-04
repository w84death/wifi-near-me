class LogParser {
    constructor() {
        this.data = {
            accessPoints: [],
            devices: []
        };
    }

    async parseFile(file) {
        if (!file) return { accessPoints: [], devices: [] };
        
        const text = await this.readFile(file);
        return this.parseText(text);
    }
    
    // New method to parse text directly (for sample data)
    async parseText(text) {
        if (!text) return { accessPoints: [], devices: [] };
        
        const lines = text.split('\n');
        
        // Reset data
        this.data = {
            accessPoints: [],
            devices: []
        };
        
        let currentAP = null;
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            const trimmedLine = line.trim();
            
            if (!trimmedLine || trimmedLine.startsWith('#') || trimmedLine === '> #stopscan') continue;
            
            // Check if this line represents an AP
            const apMatch = trimmedLine.match(/^\[(\d+)\]\s+(.+?)\s*[�:]$/);
            if (apMatch) {
                const apID = apMatch[1];
                const apName = apMatch[2].trim();
                
                currentAP = {
                    id: `AP:${apID}`,
                    displayId: apID,
                    name: apName,
                    type: 'ap',
                    connectedDevices: []
                };
                
                this.data.accessPoints.push(currentAP);
                continue;
            }
            
            // Check if this line represents a connected device
            // Look for indented lines with device info
            if (currentAP && line.startsWith('  [')) {
                const deviceMatch = trimmedLine.match(/^\[(\d+)\]\s+([0-9A-Fa-f:]+)/);
                if (deviceMatch) {
                    const deviceID = deviceMatch[1];
                    const deviceMac = deviceMatch[2];
                    
                    const device = {
                        id: `Device:${deviceMac}`, // Unique ID for the device
                        displayId: deviceID,
                        name: `Device ${deviceID}`,
                        mac: deviceMac,
                        connectedToAP: currentAP.id,
                        type: 'device'
                    };
                    
                    this.data.devices.push(device);
                    currentAP.connectedDevices.push(device.id);
                }
            }
        }
        
        console.log(`Parsed ${this.data.accessPoints.length} APs and ${this.data.devices.length} devices`);
        return this.data;
    }
    
    async readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }
}
