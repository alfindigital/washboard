import { createClient, fetchToken } from '../src/lib/dex';
const c = createClient({ apiKey: process.env.CMC_API_KEY! });
const { data } = await fetchToken(c, { address: '0x822419392804df483fa504dcf79606857f2eded4', platform: 'Base' });
const raw: any = data?.data ?? data;
console.log('pc', raw.pc, '| ut24h', raw.ut24h, '| volUsd24h', raw.volUsd24h, '| liq', raw.liq);
console.log('sts type', typeof raw.sts, 'len', raw.sts?.length);
console.log(JSON.stringify(raw.sts?.slice(0,3)));
