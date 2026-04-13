import { C_NETHER, C_STRONGHOLD, C_END } from "./helpers/utils.js";

let paceChart = null;

export function buildAvgEntryChart(runs) {
    const ctx = document.querySelector('.avg-entry-chart').getContext('2d');
    if (paceChart) paceChart.destroy();

    const uniqueDates = [...new Set(runs.map(r => r.date).filter(d => d && d !== "LIVE"))];
    
    // Sort dates properly
    uniqueDates.sort((a, b) => new Date(`${a} 2024`).getTime() - new Date(`${b} 2024`).getTime());

    // Initialize arrays for all 5 splits
    const dailyData = {};
    uniqueDates.forEach(date => {
        dailyData[date] = { nethers: [], struct1s: [], struct2s: [], strongholds: [], ends: [] };
    });

    // Populate data
    runs.forEach(run => {
        if (!run.date || run.date === "LIVE" || !dailyData[run.date]) return;
        
        if (run.nether) dailyData[run.date].nethers.push(run.nether);
        
        // Updated to match your JSON keys!
        if (run.s1) dailyData[run.date].struct1s.push(run.s1); 
        if (run.s2) dailyData[run.date].struct2s.push(run.s2); 
        
        if (run.stronghold) dailyData[run.date].strongholds.push(run.stronghold);
        if (run.end) dailyData[run.date].ends.push(run.end);
    });

    // Helper to average arrays safely
    const getAvg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

    // Calculate averages for all 5 points
    const netherPoints = uniqueDates.map(date => getAvg(dailyData[date].nethers));
    const struct1Points = uniqueDates.map(date => getAvg(dailyData[date].struct1s));
    const struct2Points = uniqueDates.map(date => getAvg(dailyData[date].struct2s));
    const strongPoints = uniqueDates.map(date => getAvg(dailyData[date].strongholds));
    const endPoints = uniqueDates.map(date => getAvg(dailyData[date].ends));

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
                    pointRadius: 3,
                    spanGaps: true // Connects the line even if he missed a day
                },
                {
                    label: 'Struct 1',
                    data: struct1Points,
                    borderColor: '#8b949e', // Grey
                    backgroundColor: '#8b949e',
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 3,
                    spanGaps: true
                },
                {
                    label: 'Struct 2',
                    data: struct2Points,
                    borderColor: '#79c0ff', // Light Blue to distinguish from Struct 1
                    backgroundColor: '#79c0ff',
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 3,
                    spanGaps: true
                },
                {
                    label: 'Stronghold',
                    data: strongPoints,
                    borderColor: C_STRONGHOLD,
                    backgroundColor: C_STRONGHOLD,
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 3,
                    showLine: false 
                },
                {
                    label: 'End',
                    data: endPoints,
                    borderColor: C_END,
                    backgroundColor: C_END,
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 4,
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
                            // Format Y-axis left labels as MM:SS
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
                    labels: { color: '#c9d1d9', usePointStyle: true, boxWidth: 8 }
                },
                tooltip: {
                    callbacks: {
                        // Title is now just the exact category label (e.g. "Apr 01")
                        title: function(tooltipItems) {
                            return tooltipItems[0].label; 
                        },
                        // Keep the exact MM:SS formatting for the hover data
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