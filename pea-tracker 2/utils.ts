
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
};

export const formatPercent = (value: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
};

export const calculateLineValue = (qty: number, currentPrice: number) => qty * currentPrice;

export const calculateLinePL = (qty: number, pru: number, currentPrice: number) => {
  const plEuro = (currentPrice - pru) * qty;
  const plPercent = pru > 0 ? ((currentPrice - pru) / pru) * 100 : 0;
  return { plEuro, plPercent };
};
