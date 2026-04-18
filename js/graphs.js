import { C_NETHER, C_BASTION, C_FORT, C_BLIND, C_STRONGHOLD, C_END } from "./helpers/utils.js";

let paceChart = null;

export function buildAvgEntryChart(runs) {
    const ctx = document.querySelector('.avg-entry-chart').getContext('2d');
    if (paceChart) paceChart.destroy();

    const uniqueDates = [...new Set(runs.map(r => r.date).filter(d => d && d !== "LIVE"))];
    
    // Sort dates properly
    uniqueDates.sort((a, b) => new Date(`${a} 2024`).getTime() - new Date(`${b} 2024`).getTime());

    // Initialize arrays for 6 splits
    const dailyData = {};
    uniqueDates.forEach(date => {
        dailyData[date] = { nethers: [], bastions: [], fortresses: [], blinds: [], strongholds: [], ends: [] };
    });

    // Populate data using the correct exact keys from your JSON
    runs.forEach(run => {
        if (!run.date || run.date === "LIVE" || !dailyData[run.date]) return;
        
        if (run.nether) dailyData[run.date].nethers.push(run.nether);
        if (run.bastion) dailyData[run.date].bastions.push(run.bastion);
        if (run.fort) dailyData[run.date].fortresses.push(run.fort);
        if (run.blind) dailyData[run.date].blinds.push(run.blind);
        if (run.stronghold) dailyData[run.date].strongholds.push(run.stronghold);
        if (run.end) dailyData[run.date].ends.push(run.end);
    });

    // Helper to average arrays safely
    const getAvg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

    // Calculate averages
    const netherPoints = uniqueDates.map(date => getAvg(dailyData[date].nethers));
    const bastionPoints = uniqueDates.map(date => getAvg(dailyData[date].bastions));
    const fortPoints = uniqueDates.map(date => getAvg(dailyData[date].fortresses));
    const blindPoints = uniqueDates.map(date => getAvg(dailyData[date].blinds));
    const strongPoints = uniqueDates.map(date => getAvg(dailyData[date].strongholds));
    const endPoints = uniqueDates.map(date => getAvg(dailyData[date].ends));

    // Pre-load images with an onload event to prevent invisible points
    const loadImage = (src) => {
        const img = new Image(16, 16); 
        img.src = src;
        img.onload = () => { 
            if (paceChart) paceChart.update(); 
        };
        return img;
    };

    const imgNether = loadImage('static/nether.jpeg');
    const imgBastion = loadImage('static/bastion.png');
    const imgFortress = loadImage('static/fortress.png');
    const imgBlind = loadImage('static/first_portal.png');
    const imgStronghold = loadImage('static/stronghold.png');
    const imgEnd = loadImage('static/end.png');

    paceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: uniqueDates, 
            datasets: [
                {
                    label: 'Nether',
                    data: netherPoints,
                    borderColor: C_NETHER,
                    backgroundColor: C_NETHER,
                    borderWidth: 2,
                    tension: 0.3,
                    pointStyle: imgNether, 
                    spanGaps: true 
                },
                {
                    label: 'Bastion',
                    data: bastionPoints,
                    borderColor: C_BASTION || '#f6d32d', // Fallback to yellow if missing
                    backgroundColor: C_BASTION || '#f6d32d',
                    borderWidth: 2,
                    tension: 0.3,
                    pointStyle: imgBastion, 
                    spanGaps: true 
                },
                {
                    label: 'Fortress',
                    data: fortPoints,
                    borderColor: C_FORT || '#800000', // Fallback to bordeaux if missing
                    backgroundColor: C_FORT || '#800000',
                    borderWidth: 2,
                    tension: 0.3,
                    pointStyle: imgFortress, 
                    spanGaps: true
                },
                {
                    label: 'Blind',
                    data: blindPoints,
                    borderColor: C_BLIND || '#2edb54', // Fallback to green if missing
                    backgroundColor: C_BLIND || '#2edb54',
                    borderWidth: 2,
                    tension: 0.3,
                    pointStyle: imgBlind, 
                    spanGaps: true
                },
                {
                    label: 'Stronghold',
                    data: strongPoints,
                    borderColor: C_STRONGHOLD,
                    backgroundColor: C_STRONGHOLD,
                    borderWidth: 2,
                    tension: 0.3,
                    pointStyle: imgStronghold, 
                    showLine: false // Kept false so late-game throws don't draw chaotic lines
                },
                {
                    label: 'End',
                    data: endPoints,
                    borderColor: C_END,
                    backgroundColor: C_END,
                    borderWidth: 2,
                    tension: 0.3,
                    pointStyle: imgEnd, 
                    showLine: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'category', 
                    ticks: { color: '#8b949e' },
                    grid: { color: '#30363d' }
                },
                y: {
                    reverse: true, // Faster times at the top
                    ticks: {
                        color: '#8b949e',
                        callback: function(value) {
                            const m = Math.floor(value / 60);
                            const s = Math.floor(value % 60).toString().padStart(2, '0');
                            return `${m}:${s}`;
                        }
                    },
                    grid: { color: '#30363d' }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#c9d1d9', usePointStyle: true }
                },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].label; 
                        },
                        label: function(context) {
                            const val = context.parsed.y;
                            if (val === null) return null;
                            const m = Math.floor(val / 60);
                            const s = Math.floor(val % 60).toString().padStart(2, '0');
                            return `${context.dataset.label}: ${m}:${s}`;
                        }
                    }
                }
            }
        }
    });
}