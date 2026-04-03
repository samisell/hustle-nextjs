'use client';

import { useSyncExternalStore } from 'react';
import { useCurrencyStore, CURRENCIES, type Currency } from '@/store/currency';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';

const emptySubscribe = () => () => {};

const currencyKeys = Object.keys(CURRENCIES) as Currency[];

export default function CurrencySelector() {
  const activeCurrency = useCurrencyStore((s) => s.activeCurrency);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-xs font-medium">
        <span className="h-4 w-4" />
      </Button>
    );
  }

  const config = CURRENCIES[activeCurrency];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-xs font-medium hover:bg-muted">
          <span>{config.flag}</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={activeCurrency}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
            >
              {config.symbol}
            </motion.span>
          </AnimatePresence>
          <span className="hidden sm:inline text-muted-foreground">{config.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {currencyKeys.map((key) => {
          const curr = CURRENCIES[key];
          const isActive = key === activeCurrency;
          return (
            <DropdownMenuItem
              key={key}
              onClick={() => setCurrency(key)}
              className={`flex items-center gap-3 ${isActive ? 'bg-gold/5 text-gold' : ''}`}
            >
              <span className="text-base">{curr.flag}</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{curr.name}</p>
                <p className="text-xs text-muted-foreground">{curr.code} {curr.isCrypto ? '(Crypto)' : `(1 USD = ${curr.rate === 1 ? '1' : curr.rate.toLocaleString()} ${curr.code})`}</p>
              </div>
              {curr.symbol}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
