export type CoinId = 'ethereum' | 'solana' | 'bitcoin';

export interface TokenDef {
  id: CoinId | 'hype';
  name: string;
  symbol: string;
  logo: string;
  coingeckoId?: CoinId;
}

export const TOKEN_DEFS: TokenDef[] = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', logo: '/logos/eth.png', coingeckoId: 'ethereum' },
  { id: 'solana', name: 'Solana', symbol: 'SOL', logo: '/logos/sol.png', coingeckoId: 'solana' },
];

export const PERP_DEFS = [
  { id: 'bitcoin' as CoinId, symbol: 'BTC', leverage: '40x', logo: '/logos/btc.png' },
  { id: 'ethereum' as CoinId, symbol: 'ETH', leverage: '25x', logo: '/logos/eth.png' },
  { id: 'solana' as CoinId, symbol: 'SOL', leverage: '20x', logo: '/logos/sol.png' },
  { id: 'hype' as const, symbol: 'HYPE', leverage: '10x', logo: '/logos/hype.png' },
];

export interface WalletState {
  cash: number;
  holdings: Record<string, number>;
}

const STORAGE_KEY = 'phantom-wallet-v1';

export function defaultWallet(): WalletState {
  return {
    cash: 0,
    holdings: {
      ethereum: 0.0001,
      solana: 0.0078,
    },
  };
}

export function loadWallet(): WalletState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultWallet();
    return { ...defaultWallet(), ...JSON.parse(raw) };
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
    hype: { eur: 28.5, change24h: 0.05 },
  };
}

export function formatEur(value: number, maxFrac = 2): string {
  if (value >= 1000) {
    return `€${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (value >= 1) {
    return `€${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `€${value.toFixed(Math.min(8, Math.max(2, maxFrac)))}`;
}

export function formatChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

export function formatAmount(amount: number, symbol: string): string {
  if (amount === 0) return `0 ${symbol}`;
  if (amount >= 1) return `${amount.toLocaleString('en-US', { maximumFractionDigits: 4 })} ${symbol}`;
  return `${amount.toFixed(amount < 0.0001 ? 8 : 4)} ${symbol}`;
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
