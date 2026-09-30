import { jevFunding } from '../src/lib/jev-funding';
const r = await jevFunding({ pc24h: 1.7, ut24h: 31, usdPerTrader: 8000 });
console.log(JSON.stringify(r));
