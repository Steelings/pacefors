import {
    C_NETHER,
    C_BASTION,
    C_BLIND,
    C_END,
    C_FORT,
    C_STRONGHOLD,
    C_FINISH,
    formatMMSS,
    toSeconds
} from "./helpers/utils.js";
import { fitLogNormal, getSplits, logNormalCdfSeconds } from "./helpers/runhelper.js";

/**
 * HELPER FUNCTIONS
 */
function reduceToSum(obj) {
    return Object.values(obj).reduce((a, b) => a + b, 0);
}

function reduceToLength(obj) {
    return Object.values(obj).reduce((a, b) => a + b.length, 0);
}

/**
 * BUILD ODDS TABLE
 * Fills the Analytics tab with percentage chances
 */
export function buildOdds(runs) {
    const [totalRunCount, netherEntries, s1Entries, s2Entries, blinds, strongholds, ends] = getSplits(runs);
    const totalCount = reduceToSum(totalRunCount);
    
    if (totalCount === 0) return;

    const splits = [netherEntries, s1Entries, s2Entries, blinds, strongholds, ends];
    const colors = [C_NETHER, C_BASTION, C_FORT, C_BLIND, C_STRONGHOLD, C_END];
    const labels = ["Nether", "Struct 1", "Struct 2", "Blind", "Stronghold", "End"];

    const chanceRow = document.getElementById("odds-chance");
    if (chanceRow) {
        let html = `<th>Split</th><th>Total Count</th><th>Enter %</th>`;
        splits.forEach((split, i) => {
            const count = reduceToLength(split);
            const perc = ((count / totalCount) * 100).toFixed(2);
            html += `
                <tr>
                    <td style="color: ${colors[i]}">${labels[i]}</td>
                    <td>${count}</td>
                    <td style="font-weight: bold">${perc}%</td>
                </tr>`;
        });
        chanceRow.closest('table').innerHTML = html;
    }
}

/**
 * BUILD PREDICTIONS
 * Calculates the 50%, 90%, and 99% probability dates for the Hero Card
 */
export function buildPredictions(runs) {
    const [totalRunCount, , , , blinds] = getSplits(runs);
    const totalCount = reduceToSum(totalRunCount);
    
    if (totalCount === 0) return;

    // Calculate baseline stats
    const avgDayRuns = totalCount / Object.keys(totalRunCount).length;
    const blindCount = reduceToLength(blinds);
    const chanceBlindPerRun = blindCount / totalCount;
    const blindFit = fitLogNormal(Object.values(blinds).flat());

    if (!blindFit) {
        document.getElementById("hero-date").textContent = "Need More Data";
        return;
    }

    // SPEEDRUN MATH CONSTANTS
    const RECORD_TIME = 14 * 60 + 27; // 14:27
    const BLIND_TO_STRONGHOLD_TIME = 120;
    const BLIND_TO_STRONGHOLD_P = 0.25;
    const STRONGHOLD_TO_END_TIME = 60;
    const STRONGHOLD_TO_END_P = 0.70;
    const END_TO_FINISH_TIME = 120;
    const END_TO_FINISH_P = 0.25;

    const requiredBlindTime = RECORD_TIME - (BLIND_TO_STRONGHOLD_TIME + STRONGHOLD_TO_END_TIME + END_TO_FINISH_TIME);
    
    // Probability logic
    const pBlindFastEnough = logNormalCdfSeconds(requiredBlindTime, blindFit.mu, blindFit.sigma);
    const pRecordPerBlind = pBlindFastEnough * BLIND_TO_STRONGHOLD_P * STRONGHOLD_TO_END_P * END_TO_FINISH_P;
    const pRecordPerRun = chanceBlindPerRun * pRecordPerBlind;

    // Iterative probability calculation
    let days10 = 0, days50 = 0, days99 = 0, cumulative = 0;
    
    // We loop until we hit the 99% threshold
    while (cumulative < 0.99 && days99 < 10000) {
        days99++;
        cumulative = 1 - Math.pow(1 - pRecordPerRun, avgDayRuns * days99);
        
        if (cumulative < 0.10) days10++;
        if (cumulative < 0.50) days50++;
    }

    // Convert days to actual dates
    const d50 = new Date(); d50.setDate(d50.getDate() + days50);
    const d10 = new Date(); d10.setDate(d10.getDate() + days10);
    const d99 = new Date(); d99.setDate(d99.getDate() + days99);

    // Update the UI
    const heroDate = document.getElementById("hero-date");
    if (heroDate) heroDate.textContent = d50.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    const heroProb = document.getElementById("hero-prob");
    if (heroProb) heroProb.textContent = `Based on ${totalCount} recorded runs`;

    const afterEl = document.getElementById("date-after");
    if (afterEl) afterEl.textContent = d10.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const beforeEl = document.getElementById("date-before");
    if (beforeEl) beforeEl.textContent = d99.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}