const currencyConfig = {
  he: { code: 'ILS', symbol: '₪', locale: 'he-IL', rateFromILS: 1      },
  en: { code: 'USD', symbol: '$', locale: 'en-US', rateFromILS: 0.27   },
  ar: { code: 'AED', symbol: 'د.إ', locale: 'ar-AE', rateFromILS: 0.99 },
  ru: { code: 'RUB', symbol: '₽', locale: 'ru-RU', rateFromILS: 25     },
};

/**
 * Convert an ILS amount to the target language currency.
 * All amounts in the DB are stored in ILS (Israeli Shekel).
 */
export const convertFromILS = (ilsAmount, language = 'he') => {
  const config = currencyConfig[language] || currencyConfig['he'];
  return (ilsAmount || 0) * config.rateFromILS;
};

export const formatCurrency = (amount, language = 'he') => {
  const config = currencyConfig[language] || currencyConfig['he'];
  const converted = (amount || 0) * config.rateFromILS;
  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(converted);
  } catch (error) {
    return `${config.symbol}${Number(converted).toLocaleString()}`;
  }
};

export const getCurrencySymbol = (language = 'he') => {
  return currencyConfig[language]?.symbol || '₪';
};

export const getCurrencyCode = (language = 'he') => {
  return currencyConfig[language]?.code || 'ILS';
};