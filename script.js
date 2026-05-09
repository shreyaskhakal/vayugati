/**
 * Vayu-Gati | Kinetic Infrastructure Interface
 * Core Logic & Interactions
 */

// ========== CONFIGURATION ==========
// Replace this with your actual API endpoint (e.g., Firebase Functions, REST API)
const API_CONFIG = {
    TELEMETRY_ENDPOINT: 'https://api.example.com/vayu-gati/v1/telemetry',
    POLL_INTERVAL_MS: 800 // <800ms requirement from PRD
};

// ========== DOM ELEMENTS ==========
const dom = {
    systemTime: document.getElementById('systemTime'),
    statusText: document.getElementById('statusText'),
    
    // Digital Twin
    digitalTwinContainer: document.getElementById('digitalTwinContainer'),
    predictedPane: document.getElementById('predictedPane'),
    twinSlider: document.getElementById('twinSlider'),
    
    // Green Sweep
    greenSweepBtn: document.getElementById('greenSweepBtn'),
    rippleOverlay: document.getElementById('rippleOverlay'),
    
    // Junction Card
    junctionCard: document.getElementById('junctionCard'),
    closeCardBtn: document.getElementById('closeCardBtn'),
    cardTitle: document.getElementById('cardTitle'),
    cardStateBadge: document.getElementById('cardStateBadge'),
    statThroughput: document.getElementById('statThroughput'),
    statWaitTime: document.getElementById('statWaitTime'),
    statDensity: document.getElementById('statDensity'),
    
    nodes: document.querySelectorAll('.junction-node.pulse-node')
};

// ========== SYSTEM CLOCK ==========
function updateSystemTime() {
    const now = new Date();
    dom.systemTime.textContent = now.toLocaleTimeString('en-US', { hour12: false });
}
setInterval(updateSystemTime, 1000);
updateSystemTime();

// ========== DIGITAL TWIN SLIDER ==========
let isDraggingSlider = false;

dom.twinSlider.addEventListener('mousedown', () => { isDraggingSlider = true; });
window.addEventListener('mouseup', () => { isDraggingSlider = false; });
window.addEventListener('mousemove', (e) => {
    if (!isDraggingSlider) return;
    
    const containerRect = dom.digitalTwinContainer.getBoundingClientRect();
    // Calculate percentage (0 to 100)
    let percentage = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Clamp between 0 and 100
    percentage = Math.max(0, Math.min(100, percentage));
    
    // Update visual positions
    dom.twinSlider.style.left = `${percentage}%`;
    dom.predictedPane.style.clipPath = `polygon(${percentage}% 0, 100% 0, 100% 100%, ${percentage}% 100%)`;
});

// ========== GREEN SWEEP ACTION ==========
dom.greenSweepBtn.addEventListener('click', () => {
    // Reset animation if already playing
    dom.rippleOverlay.classList.remove('ripple-active');
    void dom.rippleOverlay.offsetWidth; // Trigger reflow
    
    dom.rippleOverlay.classList.add('ripple-active');
    
    // Optional: Send API request to trigger bypass
    /*
    fetch('https://api.example.com/vayu-gati/v1/sweep', { method: 'POST' })
        .then(res => res.json())
        .then(data => console.log('Green Sweep Activated', data));
    */
});

// ========== JUNCTION CARD INTERACTIONS ==========
let activeNodeId = null;

dom.nodes.forEach(node => {
    node.addEventListener('click', (e) => {
        const nodeId = node.getAttribute('data-id');
        openJunctionCard(nodeId, e.clientX, e.clientY);
    });
});

dom.closeCardBtn.addEventListener('click', () => {
    dom.junctionCard.classList.remove('active');
    activeNodeId = null;
});

function openJunctionCard(nodeId, x, y) {
    activeNodeId = nodeId;
    
    // Update Title
    dom.cardTitle.textContent = `Junction ${nodeId}`;
    
    // Position the card near the click, keeping it in bounds
    // (Simplistic positioning for blueprint)
    dom.junctionCard.classList.add('active');
    
    // Set to processing while waiting for data
    setCardState('processing');
    
    // Trigger an immediate fetch for this node
    fetchTelemetryData();
}

function setCardState(state) {
    dom.junctionCard.className = 'junction-card active'; // Reset classes
    dom.junctionCard.classList.add(`state-${state}`);
    
    dom.cardStateBadge.textContent = state;
    
    if(state === 'emergency') {
        dom.cardStateBadge.style.color = '#3B82F6';
    } else if (state === 'processing') {
        dom.cardStateBadge.style.color = '#F59E0B';
    } else {
        dom.cardStateBadge.style.color = 'var(--text-secondary)';
    }
}

// ========== API INTEGRATION (TELEMETRY) ==========
/**
 * Fetches real-time JSON from the configured API endpoint.
 * Note: Since we are avoiding "trash/mock data", this will gracefully 
 * fail and log to the console if the API is not yet live, keeping the UI intact.
 */
async function fetchTelemetryData() {
    try {
        const response = await fetch(API_CONFIG.TELEMETRY_ENDPOINT, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            // Add auth tokens if necessary
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        updateUIWithData(data);
        
    } catch (error) {
        // Silently catch errors if the endpoint is just a placeholder, 
        // to prevent UI freezing. In production, show an error state.
        console.debug('Telemetry fetch failed (Expected if API is placeholder):', error.message);
    }
}

function updateUIWithData(data) {
    // Example Expected Data Shape:
    // {
    //   "globalStatus": "Stable",
    //   "nodes": {
    //      "J1": { "throughput": "1,200/h", "waitTime": "14s", "density": "Low", "state": "idle" },
    //      "J2": { "throughput": "3,400/h", "waitTime": "45s", "density": "High", "state": "emergency" }
    //   }
    // }
    
    if (data.globalStatus) {
        dom.statusText.textContent = data.globalStatus;
    }
    
    // If a junction card is open, update its stats
    if (activeNodeId && data.nodes && data.nodes[activeNodeId]) {
        const nodeData = data.nodes[activeNodeId];
        
        dom.statThroughput.textContent = nodeData.throughput || '--';
        dom.statWaitTime.textContent = nodeData.waitTime || '--';
        dom.statDensity.textContent = nodeData.density || '--';
        
        setCardState(nodeData.state || 'idle');
    }
    
    // Update map nodes based on state/density
    if (data.nodes) {
        dom.nodes.forEach(node => {
            const id = node.getAttribute('data-id');
            const nData = data.nodes[id];
            
            if (nData) {
                // Adjust pulse frequency based on density
                if (nData.density === 'High') {
                    node.style.animationDuration = '0.5s';
                } else if (nData.density === 'Medium') {
                    node.style.animationDuration = '1.2s';
                } else {
                    node.style.animationDuration = '2s';
                }
            }
        });
    }
}

// Start polling API
setInterval(fetchTelemetryData, API_CONFIG.POLL_INTERVAL_MS);
