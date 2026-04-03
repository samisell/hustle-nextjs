import { create } from 'zustand';

export type Currency = 'NGN' | 'USD' | 'USDT';

export interface CurrencyConfig {
  code: Currency;
  symbol: string;
  name: string;
  flag: string;
  rate: number; // rate relative to USD (NGN: 1500 means 1 USD = 1500 NGN)
  decimals: number;
  isCrypto: boolean;
}

export const CURRENCIES: Record<Currency, CurrencyConfig> = {
  NGN: {
    code: 'NGN',
    symbol: '₦',
    name: 'Nigerian Naira',
    flag: '🇳🇬',
    rate: 1500,
    decimals: 0,
    isCrypto: false,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    flag: '🇺🇸',
    rate: 1,
    decimals: 2,
    isCrypto: false,
  },
  USDT: {
    code: 'USDT',
    symbol: '₮',
    name: 'Tether USD',
    flag: '💲',
    rate: 1,
    decimals: 2,
    isCrypto: true,
  },
};

interface CurrencyState {
  activeCurrency: Currency;
  setCurrency: (currency: Currency) => void;
  formatAmount: (amountUsd: number, showSymbol?: boolean, compact?: boolean) => string;
  convertToActive: (amountUsd: number) => number;
  getCurrencyConfig: () => CurrencyConfig;
}

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  activeCurrency: 'NGN',

  setCurrency: (currency: Currency) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hu_currency', currency);
    }
    set({ activeCurrency: currency });
  },

  getCurrencyConfig: () => {
    const { activeCurrency } = get();
    return CURRENCIES[activeCurrency];
  },

  convertToActive: (amountUsd: number) => {
    const config = get().getCurrencyConfig();
    return amountUsd * config.rate;
  },

  formatAmount: (amountUsd: number, showSymbol = true, compact = false) => {
    const config = get().getCurrencyConfig();
    const converted = amountUsd * config.rate;

    if (compact) {
      const abs = Math.abs(converted);
      let formatted: string;
      if (abs >= 1_000_000_000) {
        formatted = `${(abs / 1_000_000_000).toFixed(1)}B`;
      } else if (abs >= 1_000_000) {
        formatted = `${(abs / 1_000_000).toFixed(1)}M`;
      } else if (abs >= 1_000) {
        formatted = `${(abs / 1_000).toFixed(1)}K`;
      } else {
        formatted = converted.toFixed(config.decimals);
      }
      return showSymbol ? `${config.symbol}${formatted}` : formatted;
    }

    const formatted = converted.toLocaleString('en-US', {
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    });
    return showSymbol ? `${config.symbol}${formatted}` : formatted;
  },
}));
