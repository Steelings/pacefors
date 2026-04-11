import {
    C_BASTION,
    C_BLIND,
    C_END,
    C_FORT,
    C_NETHER,
    C_OVERWORLD,
    C_STRONGHOLD,
    formatMMSS,
    pushOrCreate
} from "./helpers/utils.js";

Chart.defaults.borderColor = "#30363d";
Chart.defaults.color = "#8b949e";
Chart.defaults.font.family = "JetBrains Mono, monospace";

export function buildEntryChart(runs) {
    const netherPoints = [];
    const struct1Points = [];
    const strongholdPoints = [];
    const endPoints = [];

    for (let r = runs.length - 1; r > 0; r--) {
        const run = runs[r];
        if (run.nether) netherPoints.push({ x: r, y: run.nether });
        if (run.bastion || run.fort) struct1Points.push({ x: r, y: Math.min(run.bastion ?? Infinity, run.fort ?? Infinity) });
        if (run.stronghold) strongholdPoints.push({ x: r, y: run.stronghold });
        if (run.end) endPoints.push({ x: r, y: run.end });
    }

    const el = document.querySelector(".entry-chart");
    if (!el) return;

    new Chart(el.getContext("2d"), {
        type: "line",
        data: {
            datasets: [
                { label: "End", data: endPoints, borderColor: C_END, backgroundColor: C_END + "20", fill: true },
                { label: "Stronghold", data: strongholdPoints, borderColor: C_STRONGHOLD, backgroundColor: C_STRONGHOLD + "20", fill: true },
                { label: "Nether", data: netherPoints, borderColor: C_NETHER, backgroundColor: C_NETHER + "20", fill: true }
            ],
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

export function buildAvgEntryChart(runs) {
    const categories = [
        { key: 'nether', color: C_NETHER, label: 'Nether' },
        { key: 'struct1', color: C_BASTION, label: 'Structure' },
        { key: 'stronghold', color: C_STRONGHOLD, label: 'Stronghold' },
        { key: 'end', color: C_END, label: 'End' }
    ];

    const dailyStats = {};
    runs.forEach(run => {
        const ts = new Date(`${run.date} ${new Date().getFullYear()}`).getTime();
        if (!dailyStats[ts]) dailyStats[ts] = { counts: {}, sums: {} };
        
        categories.forEach(cat => {
            const val = cat.key === 'struct1' ? (run.bastion || run.fort) : run[cat.key];
            if (val) {
                dailyStats[ts].sums[cat.key] = (dailyStats[ts].sums[cat.key] || 0) + val;
                dailyStats[ts].counts[cat.key] = (dailyStats[ts].counts[cat.key] || 0) + 1;
            }
        });
    });

    const dates = Object.keys(dailyStats).sort();
    const datasets = categories.map(cat => ({
        label: cat.label,
        data: dates.map(d => ({
            x: Number(d),
            y: dailyStats[d].counts[cat.key] ? dailyStats[d].sums[cat.key] / dailyStats[d].counts[cat.key] : null
        })),
        borderColor: cat.color,
        backgroundColor: cat.color + "15",
        fill: true,
        tension: 0.3,
        pointRadius: 2
    }));

    const canvas = document.querySelector(".avg-entry-chart");
    if (!canvas) return;

    new Chart(canvas.getContext("2d"), {
        type: "line",
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { 
                    type: "linear", 
                    ticks: { callback: v => new Date(v).toLocaleDateString('en-US', {month:'short', day:'numeric'}) }
                },
                y: { beginAtZero: true, ticks: { callback: v => formatMMSS(v) } }
            },
            plugins: { legend: { labels: { color: '#8b949e' } } }
        }
    });
}