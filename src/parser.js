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
        const lines = text.split('\n');
        
        // Reset data
        this.data = {
            accessPoints: [],
            devices: []
        };
        
        let currentAP = null;
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            
            if (!line || line.startsWith('#') || line === '> #stopscan') continue;
            
            // Check if this line represents an AP - improved regex to match various formats
            const apMatch = line.match(/^\[(\d+)\]\s+(.+?)\s*[�:]$/);
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
            
            // Check if this line represents a connected device - improved regex for indented lines
            if (currentAP && line.match(/^\s+\[\d+\]/)) {
                const deviceMatch = line.match(/^\s+\[(\d+)\]\s+([0-9A-Fa-f:]+)/);
                if (deviceMatch) {
                    const deviceID = deviceMatch[1];
                    const deviceMac = deviceMatch[2];
                    
                    const device = {
                        id: deviceMac,
                        displayId: deviceID,
                        name: `Device ${deviceID}`,
                        mac: deviceMac,
                        connectedToAP: currentAP.id,
                        type: 'device'
                    };
                    
                    this.data.devices.push(device);
                    currentAP.connectedDevices.push(deviceMac);
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
