import { readFileSync } from "fs";
const d = JSON.parse(readFileSync("C:/Users/Chintan/Documents/project_india/india-data-dashboard/public/data/mospi/plfs-state.json","utf8"));
const s = d.states[0];
console.log("Keys:", Object.keys(s));
console.log("lfpr_male isArray:", Array.isArray(s.lfpr_male));
console.log("lfpr_male:", JSON.stringify(s.lfpr_male));
console.log("lfpr_person:", JSON.stringify(s.lfpr_person));
const broken = d.states.filter(st => !Array.isArray(st.lfpr_male) || !Array.isArray(st.lfpr_person));
console.log("States with broken/missing arrays:", broken.length > 0 ? broken.map(st=>st.stateName) : "none — all good");
