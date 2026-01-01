
import React from 'react';
import { Trophy, AlertCircle, Target, Layers } from 'lucide-react';
import { Position } from '../types';
import { formatPercent, calculateLinePL } from '../utils';

interface QuickStatsProps {
  positions: Position[];
}

const QuickStats: React.FC<QuickStatsProps> = ({ positions }) => {
  if (positions.length === 0) return null;

  const analyzed = positions.map(p => ({
    ...p,
    ...calculateLinePL(p.quantity, p.pru, p.currentPrice)
  })).sort((a, b) => b.plPercent - a.plPercent);

  const top = analyzed[0];
  const bottom = analyzed[analyzed.length - 1];
  const diversification = Math.min(positions.length * 10, 100);

  return (
    <div className="grid grid-cols-2 gap-4 mb-8">
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={16} className="text-amber-500" />
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Top Ligne</span>
        </div>
        <p className="font-bold text-slate-900 truncate">{top.ticker}</p>
        <p className="text-emerald-500 text-sm font-bold">+{formatPercent(top.plPercent)}</p>
      </div>

      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle size={16} className="text-slate-400" />
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Flop Ligne</span>
        </div>
        <p className="font-bold text-slate-900 truncate">{bottom.ticker}</p>
        <p className="text-rose-500 text-sm font-bold">{formatPercent(bottom.plPercent)}</p>
      </div>

      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm col-span-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-xl">
            <Target size={18} className="text-indigo-600" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Score Diversification</span>
            <p className="font-bold text-slate-900">{diversification}/100</p>
          </div>
        </div>
        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
            style={{ width: `${diversification}%` }} 
          />
        </div>
      </div>
    </div>
  );
};

export default QuickStats;
