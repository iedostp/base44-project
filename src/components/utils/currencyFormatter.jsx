const currencyConfig = {
  he: {
    code: 'ILS',
    symbol: '₪',
    locale: 'he-IL'
  },
  en: {
    code: 'USD',
    symbol: '$',
    locale: 'en-US'
  },
  ar: {
    code: 'AED',
    symbol: 'د.إ',
    locale: 'ar-AE'
  },
  ru: {
    code: 'RUB',
    symbol: '₽',
    locale: 'ru-RU'
  }
};

export const formatCurrency = (amount, language = 'he') => {
  const config = currencyConfig[language] || currencyConfig['he'];
  
  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    return `${config.symbol} ${Number(amount).toFixed(2)}`;
  }
};

export const getCurrencySymbol = (language = 'he') => {
  return currencyConfig[language]?.symbol || '₪';
};

export const getCurrencyCode = (language = 'he') => {
  return currencyConfig[language]?.code || 'ILS';
};