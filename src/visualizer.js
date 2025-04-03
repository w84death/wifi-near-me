class NetworkVisualizer {
    constructor(containerId) {
        this.containerId = containerId;
        this.width = 0;
        this.height = 0;
        this.svg = null;
        this.simulation = null;
        this.nodes = [];
        this.links = [];
    }
    
    init() {
        const container = document.getElementById(this.containerId);
        this.width = container.clientWidth;
        this.height = container.clientHeight;
        
        // Clear any existing SVG
        d3.select(`#${this.containerId} svg`).remove();
        
        this.svg = d3.select(`#${this.containerId}`)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .call(d3.zoom().on('zoom', (event) => {
                this.svg.select('g').attr('transform', event.transform);
            }))
            .append('g');
        
        // Add grid background
        this.svg.append('rect')
            .attr('width', this.width * 2)
            .attr('height', this.height * 2)
            .attr('x', -this.width / 2)
            .attr('y', -this.height / 2)
            .attr('fill', 'none')
            .attr('stroke', '#00ff4130')
            .attr('stroke-width', 0.5)
            .attr('stroke-dasharray', '10,10')
            .attr('class', 'grid-background');
            
        // Add a glow filter for cyberpunk effect
        const defs = this.svg.append('defs');
        
        const glowFilter = defs.append('filter')
            .attr('id', 'glow');
        
        glowFilter.append('feGaussianBlur')
            .attr('stdDeviation', '2.5')
            .attr('result', 'coloredBlur');
        
        const feMerge = glowFilter.append('feMerge');
        feMerge.append('feMergeNode')
            .attr('in', 'coloredBlur');
        feMerge.append('feMergeNode')
            .attr('in', 'SourceGraphic');
            
        // Add arrow markers for links with cyberpunk style
        defs.append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '-0 -5 10 10')
            .attr('refX', 13)
            .attr('refY', 0)
            .attr('orient', 'auto')
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('xoverflow', 'visible')
            .append('svg:path')
            .attr('d', 'M 0,-5 L 10,0 L 0,5')
            .attr('fill', '#00ff41')
            .style('stroke', 'none');
    }
    
    visualize(data) {
        this.init();
        this.networkData = data;
        
        // Create nodes array
        this.nodes = [
            // Center node representing the user
            { id: 'you', name: '[YOU]', type: 'you', radius: 20 },
            
            // AP nodes
            ...data.accessPoints.map(ap => ({
                id: ap.id,
                displayId: ap.displayId,
                name: ap.name,
                type: 'ap',
                radius: 12,
                connectedDevices: ap.connectedDevices
            })),
            
            // Device nodes for connected devices
            ...data.devices.map(device => ({
                id: device.id,
                displayId: device.displayId,
                name: device.name,
                type: 'device',
                connectedToAP: device.connectedToAP,
                radius: 8
            }))
        ];
        
        // Create links array
        this.links = [
            // Links from user to APs
            ...data.accessPoints.map((ap, index) => ({
                source: 'you',
                target: ap.id,
                // Arrange APs in a circle around user
                angle: (2 * Math.PI * index) / data.accessPoints.length
            })),
            
            // Links from APs to devices
            ...data.devices.map(device => ({
                source: device.connectedToAP,
                target: device.id
            }))
        ];
        
        // Create the force simulation
        this.simulation = d3.forceSimulation(this.nodes)
            .force('link', d3.forceLink(this.links)
                .id(d => d.id)
                .distance(d => {
                    if (d.source.id === 'you') {
                        // All APs at same distance from user
                        return 150;
                    }
                    return 60; // Fixed distance for AP to device
                })
            )
            .force('charge', d3.forceManyBody().strength(-100))
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))
            .force('collision', d3.forceCollide().radius(d => d.radius * 2));
            
        // Position APs in a circle around the user
        data.accessPoints.forEach((ap, i) => {
            const angle = (2 * Math.PI * i) / data.accessPoints.length;
            const node = this.nodes.find(n => n.id === ap.id);
            if (node) {
                const distance = 150;
                node.fx = this.width / 2 + Math.cos(angle) * distance;
                node.fy = this.height / 2 + Math.sin(angle) * distance;
                // Release after initial positioning
                setTimeout(() => {
                    node.fx = null;
                    node.fy = null;
                }, 1500);
            }
        });
        
        // Draw the links with cyberpunk style
        const link = this.svg.selectAll('.link')
            .data(this.links)
            .enter()
            .append('line')
            .attr('class', 'link')
            .style('stroke-width', d => d.source.id === 'you' ? 1.5 : 1)
            .style('stroke', d => d.source.id === 'you' ? '#00ff41' : '#00b3ff')
            .style('opacity', d => d.source.id === 'you' ? 0.7 : 0.5)
            .each(function(d) {
                // Add pulse animation elements for links
                if (d.source.id === 'you') {
                    const pulseFreq = 2000 + Math.random() * 3000; // Random time between pulses
                    
                    d3.select(this.parentNode).append('circle')
                        .attr('class', 'pulse')
                        .attr('r', 4)
                        .style('fill', '#00ff41')
                        .style('opacity', 0.8)
                        .style('animation', `pulseAnimation ${pulseFreq}ms infinite linear`);
                }
            });
            
        // Create node groups
        const nodeGroup = this.svg.selectAll('.node')
            .data(this.nodes)
            .enter()
            .append('g')
            .attr('class', 'node')
            .call(d3.drag()
                .on('start', this.dragstarted.bind(this))
                .on('drag', this.dragged.bind(this))
                .on('end', this.dragended.bind(this))
            );
            
        // Add circles to nodes with cyberpunk styling
        nodeGroup.append('circle')
            .attr('r', d => d.radius)
            .attr('class', d => `node-${d.type}`)
            .style('opacity', d => d.type === 'you' ? 1 : 0.8)
            .style('filter', 'url(#glow)');
            
        // Add a halo effect for nodes
        nodeGroup.append('circle')
            .attr('r', d => d.radius * 1.5)
            .attr('class', d => `halo-${d.type}`)
            .style('fill', 'none')
            .style('stroke', d => {
                switch(d.type) {
                    case 'you': return '#ff3b78';
                    case 'ap': return '#00ff41';
                    case 'device': return '#00b3ff';
                }
            })
            .style('stroke-width', 0.5)
            .style('stroke-opacity', 0.5)
            .style('filter', 'url(#glow)');
        
        // Add ID number inside nodes (except for the 'you' node)
        nodeGroup.filter(d => d.type !== 'you')
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .text(d => d.displayId)
            .style('font-size', '10px')
            .style('font-weight', 'bold')
            .style('fill', '#000')
            .style('pointer-events', 'none');
            
        // Add labels with cyberpunk style
        nodeGroup.append('text')
            .attr('dx', d => d.radius + 5)
            .attr('dy', '.35em')
            .text(d => d.name)
            .style('font-size', d => d.type === 'you' ? '14px' : '12px')
            .style('opacity', d => d.type === 'device' ? 0.8 : 1)
            .style('fill', d => {
                switch(d.type) {
                    case 'you': return '#ff3b78';
                    case 'ap': return '#00ff41';
                    case 'device': return '#00b3ff';
                }
            })
            .style('font-family', "'Share Tech Mono', monospace")
            .style('text-shadow', d => {
                switch(d.type) {
                    case 'you': return '0 0 5px rgba(255, 59, 120, 0.7)';
                    case 'ap': return '0 0 5px rgba(0, 255, 65, 0.7)';
                    case 'device': return '0 0 5px rgba(0, 179, 255, 0.7)';
                }
            })
            .attr('text-anchor', 'start');
            
        // Configure simulation tick
        this.simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
                
            // Update pulse positions
            this.svg.selectAll('.pulse')
                .attr('cx', function() {
                    const parentLine = d3.select(this.parentNode).select('line').node().__data__;
                    // Calculate position along line
                    const lineLength = Math.sqrt(
                        Math.pow(parentLine.target.x - parentLine.source.x, 2) +
                        Math.pow(parentLine.target.y - parentLine.source.y, 2)
                    );
                    const progress = (Date.now() % 5000) / 5000; // 0 to 1 based on time
                    return parentLine.source.x + (parentLine.target.x - parentLine.source.x) * progress;
                })
                .attr('cy', function() {
                    const parentLine = d3.select(this.parentNode).select('line').node().__data__;
                    const progress = (Date.now() % 5000) / 5000;
                    return parentLine.source.y + (parentLine.target.y - parentLine.source.y) * progress;
                });
                
            nodeGroup
                .attr('transform', d => `translate(${d.x}, ${d.y})`);
        });
        
        // Keep the pulse animation going
        setInterval(() => {
            this.svg.selectAll('.pulse')
                .attr('cx', function() {
                    const parentLine = d3.select(this.parentNode).select('line').node().__data__;
                    const progress = (Date.now() % 5000) / 5000;
                    return parentLine.source.x + (parentLine.target.x - parentLine.source.x) * progress;
                })
                .attr('cy', function() {
                    const parentLine = d3.select(this.parentNode).select('line').node().__data__;
                    const progress = (Date.now() % 5000) / 5000;
                    return parentLine.source.y + (parentLine.target.y - parentLine.source.y) * progress;
                });
        }, 30);
    }
    
    // Drag handlers
    dragstarted(event, d) {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    
    dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    
    dragended(event, d) {
        if (!event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}
