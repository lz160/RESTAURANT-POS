import { CurrencyCode, CurrencyInfo } from '../types';

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  CZK: {
    code: 'CZK',
    symbol: 'Kč',
    name: '捷克克朗 (CZK)',
    nativeName: 'Česká koruna',
    flag: '🇨🇿',
    locale: 'cs-CZ',
    symbolPosition: 'after',
    exchangeRateToEur: 25.2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: '欧元 (EUR)',
    nativeName: 'Euro',
    flag: '🇪🇺',
    locale: 'de-AT',
    symbolPosition: 'before',
    exchangeRateToEur: 1.0,
  },
};

/**
 * 格式化货币金额显示
 * 支持 CZK (Kč) 与 EUR (€)
 */
export function formatCurrency(amount: number, currencyCodeOrSymbol: CurrencyCode | string = 'CZK'): string {
  const code = (currencyCodeOrSymbol in SUPPORTED_CURRENCIES) 
    ? (currencyCodeOrSymbol as CurrencyCode) 
    : 'CZK';
  
  const curr = SUPPORTED_CURRENCIES[code] || SUPPORTED_CURRENCIES.CZK;
  
  const formattedNum = (amount || 0).toLocaleString(curr.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (curr.symbolPosition === 'before') {
    return `${curr.symbol} ${formattedNum}`;
  } else {
    return `${formattedNum} ${curr.symbol}`;
  }
}
