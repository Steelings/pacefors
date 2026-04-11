import { C_NETHER, C_BASTION, C_BLIND, C_END, C_FORT, C_STRONGHOLD } from "./helpers/utils.js";
import { fitLogNormal, getSplits, logNormalCdfSeconds } from "./helpers/runhelper.js";

function reduceSum(obj) { return Object.values(obj).reduce((a, b) => a + b, 0); }
function reduceLen(obj) { return Object.values(obj).reduce((a, b) => a + b.length, 0); }

export function buildOdds(runs) {
    const [counts, ...splits] = getSplits(runs);
    const total = reduceSum(counts);
    const row = document.getElementById("odds-chance");
    if (!row || total === 0) return;

    const colors = [C_NETHER, C_BASTION, C_FORT, C_BLIND, C_STRONGHOLD, C_END];
    const labels = ["Nether", "S1", "S2", "Blind", "Strong", "End"];
    
    row.innerHTML = `<th>Split</th><th>%</th>` + splits.map((s, i) => {
        const p = ((reduceLen(s) / total) * 100).toFixed(1);
        return `<tr><td style="color:${colors[i]}">${labels[i]}</td><td>${p}%</td></tr>`;
    }).join("");
}

export function buildPredictions(runs) {
    const [counts, , , , blinds] = getSplits(runs);
    const total = reduceSum(counts);
    const blindTimes = Object.values(blinds).flat();
    const fit = fitLogNormal(blindTimes);
    if (!fit || total === 0) return;

    const avgRuns = total / Object.keys(counts).length;
    const pRec = (blindTimes.length / total) * 0.0125; // Combined speedrun probability constant

    let d10 = 0, d50 = 0, d99 = 0, cum = 0;
    while (cum < 0.99 && d99 < 5000) {
        d99++;
        cum = 1 - Math.pow(1 - pRec, avgRuns * d99);
        if (cum < 0.1) d10++;
        if (cum < 0.5) d50++;
    }

    const format = (d) => {
        const date = new Date(); date.setDate(date.getDate() + d);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    document.getElementById("hero-date").textContent = format(d50);
    document.getElementById("date-after").textContent = format(d10);
    document.getElementById("date-before").textContent = format(d99);
    document.getElementById("hero-prob").textContent = `99% confidence threshold reached in ${d99} days`;
}