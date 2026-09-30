const CHAIN_ALIASES: Record<string, string> = {
  eth: "Ethereum",
  ethereum: "Ethereum",
  bsc: "BSC",
  binance: "BSC",
  sol: "Solana",
  solana: "Solana",
  arb: "Arbitrum",
  arbitrum: "Arbitrum",
  op: "Optimism",
  optimism: "Optimism",
  polygon: "Polygon",
  matic: "Polygon",
  gnosis: "Gnosis",
  base: "Base",
  avalanche: "Avalanche",
  avax: "Avalanche",
};

const EVM_CHAINS = new Set([
  "Ethereum",
  "BSC",
  "Arbitrum",
  "Optimism",
  "Polygon",
  "Gnosis",
  "Base",
  "Avalanche",
]);

export function canonicalChain(input: string): string | null {
  const key = String(input ?? "").trim().toLowerCase();
  return CHAIN_ALIASES[key] ?? null;
}

export function canonicalAddress(platform: string, input: string): string | null {
  const chain = canonicalChain(platform);
  const address = String(input ?? "").trim();
  if (!chain || !address) return null;
  if (EVM_CHAINS.has(chain)) return /^0x[0-9a-fA-F]{40}$/.test(address) ? address.toLowerCase() : null;
  if (chain === "Solana") return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address) ? address : null;
  return null;
}

export function tokenIdentity(platform: string, address: string): string | null {
  const chain = canonicalChain(platform);
  const canonical = canonicalAddress(platform, address);
  return chain && canonical ? `${chain}:${canonical}` : null;
}

export function walletIdentity(platform: string, address: string): string {
  const canonical = canonicalAddress(platform, address);
  if (canonical) return canonical;
  return canonicalChain(platform) === "Solana" ? String(address).trim() : String(address).trim().toLowerCase();
}

export function isEvmChain(platform: string): boolean {
  const chain = canonicalChain(platform);
  return chain ? EVM_CHAINS.has(chain) : false;
}
