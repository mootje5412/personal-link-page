export type CoinId = 'ethereum' | 'solana' | 'bitcoin';

export interface TokenDef {
  id: CoinId;
  name: string;
  symbol: string;
  logo: string;
  verified?: boolean;
}

export interface PerpDef {
  id: CoinId | 'skhx';
  symbol: string;
  leverage: string;
  logo: string;
}

export const TOKEN_DEFS: TokenDef[] = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', logo: '/logos/eth.png', verified: true },
  { id: 'solana', name: 'Solana', symbol: 'SOL', logo: '/logos/sol.png', verified: true },
];

export const PERP_DEFS: PerpDef[] = [
  { id: 'bitcoin', symbol: 'BTC', leverage: '40x', logo: '/logos/btc.png' },
  { id: 'skhx', symbol: 'SKHX', leverage: '10x', logo: '/logos/skhx.png' },
];

export interface WalletState {
  cash: number;
  holdings: Record<string, number>;
}

const STORAGE_KEY = 'phantom-wallet-v2';

export function defaultWallet(): WalletState {
  return {
    cash: 0,
    holdings: {
      ethereum: 0.00047,
      solana: 0.0074,
    },
  };
}

export function loadWallet(): WalletState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('phantom-wallet-v1');
    if (!raw) return defaultWallet();
    const parsed = JSON.parse(raw);
    return {
      cash: parsed.cash ?? 0,
      holdings: { ...defaultWallet().holdings, ...parsed.holdings },
    };
  } catch {
    return defaultWallet();
  }
}

export function saveWallet(state: WalletState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export interface PriceData {
  eur: number;
  change24h: number;
}

export type Prices = Record<string, PriceData>;

export async function fetchPrices(): Promise<Prices> {
  const res = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,solana,bitcoin&vs_currencies=eur&include_24hr_change=true'
  );
  if (!res.ok) throw new Error('Price fetch failed');
  const data = await res.json();
  return {
    ethereum: { eur: data.ethereum.eur, change24h: data.ethereum.eur_24h_change ?? 0 },
    solana: { eur: data.solana.eur, change24h: data.solana.eur_24h_change ?? 0 },
    bitcoin: { eur: data.bitcoin.eur, change24h: data.bitcoin.eur_24h_change ?? 0 },
    skhx: { eur: 0.42, change24h: -3.2 },
  };
}

export function formatEur(value: number): string {
  return `€${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPnlEur(value: number): string {
  const sign = value >= 0 ? '+' : '-';
  return `${sign}€${Math.abs(value).toFixed(8)}`;
}

export function formatChangePct(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

export function formatEurDelta(tokenValue: number, change24h: number): string {
  const delta = tokenValue * (change24h / 100);
  const sign = delta >= 0 ? '+' : '-';
  const abs = Math.abs(delta);
  if (abs < 0.01) return `${sign}<€0.01`;
  return `${sign}${formatEur(abs)}`;
}

export function formatTokenAmount(amount: number, symbol: string): string {
  if (amount >= 1) {
    return `${amount.toLocaleString('en-US', { maximumFractionDigits: 4 })} ${symbol}`;
  }
  const decimals = amount < 0.001 ? 5 : 4;
  return `${amount.toFixed(decimals)} ${symbol}`;
}

export function calcPortfolio(
  wallet: WalletState,
  prices: Prices
): { total: number; tokenValue: number; pnlEur: number; pnlPct: number } {
  let tokenValue = 0;
  let pnlEur = 0;
  for (const [id, amount] of Object.entries(wallet.holdings)) {
    const p = prices[id];
    if (!p) continue;
    const value = amount * p.eur;
    tokenValue += value;
    pnlEur += value * (p.change24h / 100);
  }
  const total = wallet.cash + tokenValue;
  const pnlPct = total > 0 ? (pnlEur / total) * 100 : 0;
  return { total, tokenValue, pnlEur, pnlPct };
}

export function tokenDayDelta(tokenValue: number, change24h: number): number {
  return tokenValue * (change24h / 100);
}
