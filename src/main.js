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

    // Function to load and parse log data
    async function loadData(logData) {
        try {
            updateStatus('// INITIATING SCAN: Processing network data...', 'processing');
            
            const data = await parser.parseText(logData);
            
            if (data.accessPoints.length === 0) {
                updateStatus('// WARNING: No access points found in the log file. Check file format.', 'warning');
                return;
            }
            
            // Log analysis results
            console.log(`// ANALYSIS COMPLETE: Found ${data.accessPoints.length} access points and ${data.devices.length} devices`);
            
            // Visualize the data
            visualizer.visualize(data);
            
            // Count devices with connected clients
            const apsWithClients = data.accessPoints.filter(ap => ap.connectedDevices && ap.connectedDevices.length > 0).length;
            
            // Update status with results
            updateStatus(`// SCAN COMPLETE: Mapped ${data.accessPoints.length} APs and ${data.devices.length} devices`, 'success');
            
            // Additional debug info
            console.log(`// DEBUG: ${apsWithClients} APs have connected clients`);
            data.accessPoints.forEach(ap => {
                if (ap.connectedDevices && ap.connectedDevices.length > 0) {
                    console.log(`// DEBUG: AP ${ap.displayId} (${ap.name}) has ${ap.connectedDevices.length} clients`);
                }
            });

            return data;
        } catch (error) {
            console.error('// ERROR: Scan failed', error);
            updateStatus('// ERROR: Scan failed. Check console for details.', 'error');
            return null;
        }
    }

    // Handle file upload button
    parseBtn.addEventListener('click', async () => {
        if (!stationFileInput.files.length) {
            updateStatus('// ERROR: No log file selected. Please select a station list file to continue.', 'error');
            return;
        }
        
        const stationFile = stationFileInput.files[0];
        console.log(`// PROCESSING: Station data from ${stationFile.name}`);
        
        const fileContent = await parser.readFile(stationFile);
        await loadData(fileContent);

        // Remove demo badge when user loads their own data
        document.getElementById('demo-badge')?.remove();
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        visualizer.init();
        // Reapply visualization if data exists
        if (visualizer.nodes && visualizer.nodes.length > 0) {
            visualizer.visualize(visualizer.networkData);
        }
    });
    
    // Load sample data on startup to demonstrate capabilities
    setTimeout(async () => {
        // Display initial message
        console.log('// SYSTEM INITIALIZED: Loading sample data for demonstration');
        updateStatus('// DEMO MODE: Loading sample network data...', 'processing');
        
        // Show demo badge
        const vizContainer = document.querySelector('.visualization-container .terminal-box');
        const demoBadge = document.createElement('div');
        demoBadge.id = 'demo-badge';
        demoBadge.textContent = 'DEMO DATA';
        vizContainer.appendChild(demoBadge);
        
        // Load the sample data
        await loadData(SAMPLE_WIFI_SCAN);
        
        // Update status to indicate demo mode
        updateStatus('// DEMO MODE: Sample data loaded. Upload your own file for custom analysis.', 'success');
    }, 500);
});
