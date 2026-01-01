
export interface Position {
  id: string;
  ticker: string;
  name: string;
  quantity: number;
  pru: number; // Prix de revient unitaire
  currentPrice: number;
}

export interface PortfolioStats {
  totalValue: number;
  totalCost: number;
  totalPL: number;
  totalPLPercentage: number;
}

export interface HistoryData {
  month: string;
  value: number;
}
