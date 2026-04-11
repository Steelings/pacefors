import {C_BASTION, C_FORT, C_NETHER, C_BLIND, C_STRONGHOLD, C_END, C_FINISH, formatMMSS} from "./helpers/utils.js";
import {Runlist} from "./runlist.js";
import {getSplits} from "./helpers/runhelper.js";

export function buildDailySummary(runs) {
    // 1. Process the raw data into splits
    const splits = getSplits(runs);
    // Index mapping: 1: Nether, 2: Structure, 5: Stronghold, 6: End

    const updateCard = (idQty, idAvg, splitObj) => {
        if (!splitObj) return;
        const allTimes = Object.values(splitObj).flat();
        const qtyEl = document.getElementById(idQty);
        const avgEl = document.getElementById(idAvg);

        if (qtyEl) qtyEl.textContent = allTimes.length;
        if (avgEl) {
            const avg = allTimes.length > 0 ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length : 0;
            avgEl.textContent = `Avg: ${formatMMSS(avg)}`;
        }
    };

    // 2. Update the Dashboard Cards
    updateCard('val-nether-qty', 'val-nether-avg', splits[1]);
    updateCard('val-struct-qty', 'val-struct-avg', splits[2]);
    updateCard('val-strong-qty', 'val-strong-avg', splits[5]);
    updateCard('val-end-qty', 'val-end-avg', splits[6]);

    // 3. Handle the "Recent Run History" dropdown
    const runlist = new Runlist(document.getElementById("summary-runs"), []);
    const runsByDay = {};
    runs.forEach(run => {
        if (!runsByDay[run.date]) runsByDay[run.date] = [];
        runsByDay[run.date].push(run);
    });

    const daySelect = document.getElementById("summary-day");
    if (daySelect) {
        daySelect.innerHTML = "";
        Object.keys(runsByDay).forEach(day => {
            const option = document.createElement("option");
            option.value = day;
            option.textContent = `${day} (${runsByDay[day].length} runs)`;
            daySelect.appendChild(option);
        });

        daySelect.onchange = () => {
            runlist.runs = runsByDay[daySelect.value];
            runlist.rebuildRuns();
        };

        // Select latest day
        if (daySelect.options.length > 0) {
            daySelect.value = daySelect.options[daySelect.options.length - 1].value;
            daySelect.onchange();
        }
    }
}

export function buildDeathPieChart(runs) {
    const deathCounts = {};
    runs.forEach(run => {
        if (run.death) {
            let cause = "Other";
            const d = run.death.toLowerCase();
            if (d.includes("lava")) cause = "Lava";
            else if (d.includes("fell") || d.includes("ground") || d.includes("high place")) cause = "Gravity";
            else if (d.includes("piglin")) cause = "Piglins";
            else if (d.includes("hoglin")) cause = "Hoglins";
            else if (d.includes("blaze")) cause = "Blazes";
            else if (d.includes("burned") || d.includes("fire")) cause = "Fire";
            else if (d.includes("skel")) cause = "Skeletons";
            else if (d.includes("wither")) cause = "Wither";
            deathCounts[cause] = (deathCounts[cause] || 0) + 1;
        }
    });

    const canvas = document.getElementById('death-pie-chart');
    if (!canvas) return;

    new Chart(canvas.getContext('2d'), {
        type: 'pie',
        data: {
            labels: Object.keys(deathCounts),
            datasets: [{
                data: Object.values(deathCounts),
                backgroundColor: ['#ee5555', '#558877', '#8855ee', '#eeaa55', '#aaaaff', '#635b55', '#30363d'],
                borderColor: '#161b22',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: '#8b949e', font: { family: 'JetBrains Mono' } } }
            }
        }
    });
}