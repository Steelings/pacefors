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
import {fitLogNormal, getSplits, logNormalCdfSeconds, logNormalInvCdfSeconds} from "./helpers/runhelper.js";

// HELPER FUNCTIONS 
function reduceToSum(obj) {
    return Object.values(obj).reduce((a, b) => a + b, 0);
}

function reduceToLength(obj) {
    return Object.values(obj).reduce((a, b) => a + b.length, 0);
}

export function buildOdds(runs) {
    const [totalRunCount, ...splits] = getSplits(runs);
    const totalCount = reduceToSum(totalRunCount);
    if (totalCount === 0) return;

    const colors = [ C_NETHER, C_BASTION, C_FORT, C_BLIND, C_STRONGHOLD, C_END ];
    const totals = splits.map(reduceToLength);
    const chances = totals.map(c => c / totalCount);

    const chanceRow = document.getElementById("odds-chance");
    if (chanceRow) {
        chanceRow.innerHTML = `<th>Chance of Enter</th>` + chances.map((c, i) =>
            `<td style="color: ${colors[i]}">${(c * 100).toFixed(2)}%<br>(${totals[i]})</td>`
        ).join("");
    }
}

export function buildPredictions(runs) {
    const [totalRunCount, , , , blinds] = getSplits(runs);
    const totalCount = reduceToSum(totalRunCount);
    if (totalCount === 0) return;

    const avgDayRuns = totalCount / Object.keys(totalRunCount).length;
    const blindCount = reduceToLength(blinds);
    const chanceBlindPerRun = blindCount / totalCount;
    const blindFit = fitLogNormal(Object.values(blinds).flat());

    if (!blindFit) return;

    const RECORD_TIME = 14 * 60 + 27;
    const BLIND_TO_STRONGHOLD_TIME = 120;
    const BLIND_TO_STRONGHOLD_P = 0.25;
    const STRONGHOLD_TO_END_TIME = 60;
    const STRONGHOLD_TO_END_P = 0.70;
    const END_TO_FINISH_TIME = 120;
    const END_TO_FINISH_P = 0.25;

    const requiredBlindTime = RECORD_TIME - (BLIND_TO_STRONGHOLD_TIME + STRONGHOLD_TO_END_TIME + END_TO_FINISH_TIME);
    const pBlindFastEnough = logNormalCdfSeconds(requiredBlindTime, blindFit.mu, blindFit.sigma);
    const pRecordPerBlind = pBlindFastEnough * BLIND_TO_STRONGHOLD_P * STRONGHOLD_TO_END_P * END_TO_FINISH_P;
    const pRecordPerRun = chanceBlindPerRun * pRecordPerBlind;

    let daysCumulative10 = 0, daysCumulative50 = 0, daysCumulative90 = 0, cumulative = 0;
    while (cumulative < 0.9 && daysCumulative90 < 10000) {
        if (cumulative < 0.1) daysCumulative10++;
        if (cumulative < 0.5) daysCumulative50++;
        daysCumulative90++;
        cumulative = 1 - Math.pow(1 - pRecordPerRun, avgDayRuns * daysCumulative90);
    }

    const date10 = new Date(); date10.setDate(date10.getDate() + daysCumulative10);
    const date50 = new Date(); date50.setDate(date50.getDate() + daysCumulative50);
    const date90 = new Date(); date90.setDate(date90.getDate() + daysCumulative90);

    const hDate = document.getElementById("hero-date");
    const hProb = document.getElementById("hero-prob");
    if (hDate) hDate.textContent = date50.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});
    if (hProb) hProb.textContent = `50% Probability based on ${totalCount} recorded runs`;
    
    if (document.getElementById("date-after")) document.getElementById("date-after").textContent = date10.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
    if (document.getElementById("date-before")) document.getElementById("date-before").textContent = date90.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
}