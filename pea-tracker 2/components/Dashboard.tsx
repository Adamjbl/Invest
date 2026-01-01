
import React from 'react';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils';
import { PortfolioStats } from '../types';

interface DashboardProps {
  stats: PortfolioStats;
}

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  const isPositive = stats.totalPL >= 0;

  return (
    <div className="relative overflow-hidden bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mb-8">
      {/* Decorative Background Glow */}
      <div className={`absolute -right-16 -top-16 w-64 h-64 rounded-full blur-[100px] opacity-20 ${
        isPositive ? 'bg-emerald-400' : 'bg-rose-400'
      }`} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 rounded-xl">
              <Wallet className="text-slate-600" size={20} />
            </div>
            <span className="text-slate-500 text-sm font-semibold tracking-wide uppercase">Valeur du Portefeuille</span>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold ${
            isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {formatPercent(Math.abs(stats.totalPLPercentage))}
          </div>
        </div>
        
        <div className="flex flex-col gap-1">
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900">
            {formatCurrency(stats.totalValue)}
          </h1>
          <div className="flex items-center gap-2 mt-4">
            <div className={`flex items-center font-bold text-lg ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isPositive ? '+' : '-'}{formatCurrency(Math.abs(stats.totalPL))}
            </div>
            <span className="text-slate-400 text-sm font-medium">Profit Latent Total</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-50">
          <div>
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Capital Investi</p>
            <p className="text-slate-700 font-bold">{formatCurrency(stats.totalCost)}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Performance</p>
            <p className={`font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isPositive ? 'Optimiste' : 'Sous tension'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
