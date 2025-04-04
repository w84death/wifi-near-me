class NetworkVisualizer {
    constructor(containerId) {
        this.containerId = containerId;
        this.svg = null;
        this.width = 0;
        this.height = 0;
        this.simulation = null;
        this.nodes = [];
        this.links = [];
        this.networkData = null;
        this.zoomContainer = null; // Container for zoomable content
        this.zoom = null; // D3 zoom behavior
    }
    
    init() {
        // Get the container dimensions
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        this.width = container.clientWidth;
        this.height = container.clientHeight;
        
        // Remove any existing SVG
        d3.select(`#${this.containerId} svg`).remove();
        
        // Create the SVG container
        this.svg = d3.select(`#${this.containerId}`)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height);
        
        // Create a group for zoomable content
        this.zoomContainer = this.svg.append('g')
            .attr('class', 'zoom-container');
        
        // Initialize zoom behavior
        this.zoom = d3.zoom()
            .scaleExtent([0.1, 5]) // Min/max zoom scale
            .on('zoom', (event) => {
                // Apply zoom transformation
                this.zoomContainer.attr('transform', event.transform);
                
                // Display zoom level
                this.showZoomLevel(event.transform.k);
            });
        
        // Apply zoom behavior to SVG
        this.svg.call(this.zoom);
        
        console.log(`// SYSTEM: Visualization area initialized (${this.width}x${this.height})`);
    }
    
    showZoomLevel(scale) {
        // Remove previous zoom indicator
        this.svg.select('.zoom-level').remove();
        
        // Add zoom level indicator
        this.svg.append('text')
            .attr('class', 'zoom-level')
            .attr('x', 10)
            .attr('y', 20)
            .text(`Zoom: ${Math.round(scale * 100)}%`)
            .style('opacity', 1)
            .transition()
            .duration(1500)
            .style('opacity', 0);
    }
    
    resetZoom() {
        this.svg.transition().duration(500).call(
            this.zoom.transform, d3.zoomIdentity
        );
    }
    
    visualize(data) {
        if (!this.svg) this.init();
        if (!data) return;
        
        this.networkData = data;
        
        // Clear previous visualization
        this.zoomContainer.selectAll('*').remove();
        
        // Create a "FLIPPER ZERO" node at the center (replacing "YOU")
        const centerNode = {
            id: 'CENTER',
            name: 'FLIPPER ZERO',
            type: 'center',
            x: this.width / 2,
            y: this.height / 2,
            fx: this.width / 2,  // Fixed position
            fy: this.height / 2   // Fixed position
        };
        
        // Prepare nodes and links
        this.nodes = [centerNode, ...data.accessPoints];
        this.links = data.accessPoints.map(ap => ({
            source: 'CENTER',
            target: ap.id,
            strength: 0.7
        }));
        
        // Add devices as nodes
        if (data.devices && data.devices.length > 0) {
            data.devices.forEach(device => {
                this.nodes.push(device);
                this.links.push({
                    source: device.connectedToAP,
                    target: device.id,
                    strength: 0.9
                });
            });
            console.log(`Added ${data.devices.length} device nodes to visualization`);
        } else {
            console.log('No devices found to visualize');
        }
        
        // Create the force simulation
        this.simulation = d3.forceSimulation(this.nodes)
            .force('link', d3.forceLink(this.links)
                .id(d => d.id)
                .distance(d => {
                    if (d.source.id === 'CENTER') return 150; // Distance from CENTER to APs
                    return 50; // Distance from APs to devices (shorter for orbiting effect)
                })
                .strength(d => d.strength))
            .force('charge', d3.forceManyBody().strength(d => {
                if (d.type === 'center') return -500;
                if (d.type === 'ap') return -200;
                return -30; // Weaker repulsion for devices
            }))
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))
            .force('collision', d3.forceCollide().radius(d => {
                if (d.type === 'center') return 25;
                if (d.type === 'ap') return 15;
                return 5; // Smaller collision radius for devices
            }));
            
        // Create links
        const link = this.zoomContainer.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(this.links)
            .enter()
            .append('line')
            .attr('class', 'link');
            
        // Create nodes
        const node = this.zoomContainer.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(this.nodes)
            .enter()
            .append('g')
            .attr('class', d => `node node-type-${d.type}`)
            .call(d3.drag()
                .on('start', this.dragstarted.bind(this))
                .on('drag', this.dragged.bind(this))
                .on('end', this.dragended.bind(this)));
            
        // Add circles to nodes
        node.append('circle')
            .attr('r', d => {
                if (d.type === 'center') return 20;
                if (d.type === 'ap') return 10;
                return 4; // Smaller radius for devices
            })
            .attr('class', d => `node-${d.type}`);
            
        // Add AP ID badges
        node.filter(d => d.type === 'ap')
            .append('text')
            .attr('class', 'ap-id')
            .attr('text-anchor', 'middle')
            .attr('dy', -12)
            .text(d => d.displayId);
            
        // Add device ID badges
        node.filter(d => d.type === 'device')
            .append('text')
            .attr('class', 'device-id')
            .attr('text-anchor', 'middle')
            .attr('dy', -8)
            .text(d => d.displayId);
            
        // Add AP names as labels
        node.filter(d => d.type === 'ap')
            .append('text')
            .attr('class', 'ap-name')
            .attr('dx', 15)
            .attr('dy', 5)
            .text(d => d.name);
            
        // Add CENTER label
        node.filter(d => d.type === 'center')
            .append('text')
            .attr('dx', 15)
            .attr('dy', 5)
            .text('FLIPPER ZERO');
            
        // Count and log visible nodes
        console.log(`Visualization: ${this.nodes.length} total nodes (${data.accessPoints.length} APs, ${data.devices.length} devices, 1 FLIPPER ZERO)`);
            
        // Update function for simulation
        this.simulation.on('tick', () => {
            // Update link positions
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
            
            // Add orbital motion to devices around their APs
            this.nodes.forEach(d => {
                if (d.type === 'device' && d.connectedToAP) {
                    const ap = this.nodes.find(n => n.id === d.connectedToAP);
                    if (ap) {
                        // Calculate orbital position with time-based offset
                        const angle = (Date.now() / 2000 + this.nodes.indexOf(d)) % (2 * Math.PI);
                        const orbitRadius = 30;
                        
                        // Calculate new position around AP
                        d.x = ap.x + orbitRadius * Math.cos(angle);
                        d.y = ap.y + orbitRadius * Math.sin(angle);
                    }
                }
            });
            
            // Update node positions
            node.attr('transform', d => `translate(${d.x}, ${d.y})`);
        });
        
        // Reset zoom level when new data is visualized
        this.resetZoom();
    }
    
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
        if (d.type !== 'center') { // Keep 'CENTER' fixed
            d.fx = null;
            d.fy = null;
        }
    }
}
