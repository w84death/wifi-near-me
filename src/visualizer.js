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
            
        console.log(`// SYSTEM: Visualization area initialized (${this.width}x${this.height})`);
    }
    
    visualize(data) {
        if (!this.svg) this.init();
        if (!data) return;
        
        this.networkData = data;
        
        // Clear previous visualization
        this.svg.selectAll('*').remove();
        
        // Create a "YOU" node at the center
        const youNode = {
            id: 'YOU',
            name: 'YOU',
            type: 'you',
            x: this.width / 2,
            y: this.height / 2,
            fx: this.width / 2,  // Fixed position
            fy: this.height / 2   // Fixed position
        };
        
        // Prepare nodes and links
        this.nodes = [youNode, ...data.accessPoints];
        this.links = data.accessPoints.map(ap => ({
            source: 'YOU',
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
                    if (d.source.id === 'YOU') return 150; // Distance from YOU to APs
                    return 50; // Distance from APs to devices (shorter for orbiting effect)
                })
                .strength(d => d.strength))
            .force('charge', d3.forceManyBody().strength(d => {
                if (d.type === 'you') return -500;
                if (d.type === 'ap') return -200;
                return -30; // Weaker repulsion for devices
            }))
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))
            .force('collision', d3.forceCollide().radius(d => {
                if (d.type === 'you') return 25;
                if (d.type === 'ap') return 15;
                return 5; // Smaller collision radius for devices
            }));
            
        // Create links
        const link = this.svg.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(this.links)
            .enter()
            .append('line')
            .attr('class', 'link');
            
        // Create nodes
        const node = this.svg.append('g')
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
                if (d.type === 'you') return 20;
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
            
        // Add YOU label
        node.filter(d => d.type === 'you')
            .append('text')
            .attr('dx', 15)
            .attr('dy', 5)
            .text('YOU');
            
        // Count and log visible nodes
        console.log(`Visualization: ${this.nodes.length} total nodes (${data.accessPoints.length} APs, ${data.devices.length} devices, 1 YOU)`);
            
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
        if (d.type !== 'you') { // Keep 'YOU' fixed
            d.fx = null;
            d.fy = null;
        }
    }
}
