document.addEventListener('DOMContentLoaded', () => {
    // Initialize the components
    const parser = new LogParser();
    const visualizer = new NetworkVisualizer('visualization');
    visualizer.init();
    
    // Set up file upload functionality
    const stationFileInput = document.getElementById('station-file');
    const parseBtn = document.getElementById('parse-btn');
    const scanStatus = document.getElementById('scan-status');
    
    // Helper function to update status
    function updateStatus(message, type = 'normal') {
        scanStatus.className = 'scan-status';
        if (type === 'error') scanStatus.classList.add('error-text');
        if (type === 'success') scanStatus.classList.add('success-text');
        if (type === 'warning') scanStatus.classList.add('warning-text');
        if (type === 'processing') scanStatus.classList.add('blink-fast');
        
        scanStatus.innerHTML = message;
    }
    
    parseBtn.addEventListener('click', async () => {
        if (!stationFileInput.files.length) {
            updateStatus('// ERROR: No log file selected. Please select a station list file to continue.', 'error');
            return;
        }
        
        try {
            updateStatus('// INITIATING SCAN: Processing network data...', 'processing');
            
            const stationFile = stationFileInput.files[0];
            console.log(`// PROCESSING: Station data from ${stationFile.name}`);
            
            const data = await parser.parseFile(stationFile);
            
            if (data.accessPoints.length === 0) {
                updateStatus('// WARNING: No access points found in the log file. Check file format.', 'warning');
                console.warn('No access points found in the log file. File content sample:', 
                    (await parser.readFile(stationFile)).substring(0, 200));
                return;
            }
            
            // Log analysis results
            console.log(`// ANALYSIS COMPLETE: Found ${data.accessPoints.length} access points and ${data.devices.length} devices`);
            
            // Visualize the data
            visualizer.visualize(data);
            
            // Count devices with connected clients
            const apsWithClients = data.accessPoints.filter(ap => ap.connectedDevices && ap.connectedDevices.length > 0).length;
            
            // Update status with results - changed YOU to FLIPPER ZERO
            updateStatus(`// SCAN COMPLETE: Mapped ${data.accessPoints.length} APs and ${data.devices.length} devices`, 'success');
            
            // Additional debug info
            console.log(`// DEBUG: ${apsWithClients} APs have connected clients`);
            data.accessPoints.forEach(ap => {
                if (ap.connectedDevices && ap.connectedDevices.length > 0) {
                    console.log(`// DEBUG: AP ${ap.displayId} (${ap.name}) has ${ap.connectedDevices.length} clients`);
                }
            });
        } catch (error) {
            console.error('// ERROR: Scan failed', error);
            updateStatus('// ERROR: Scan failed. Check console for details.', 'error');
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        visualizer.init();
        // Reapply visualization if data exists
        if (visualizer.nodes && visualizer.nodes.length > 0) {
            visualizer.visualize(visualizer.networkData);
        }
    });
    
    // Display initial message
    console.log('// SYSTEM INITIALIZED: Ready for log file analysis');
    updateStatus('// SYSTEM READY: Upload station list file to begin scan');
});
