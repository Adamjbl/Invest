
import React from 'react';
import { Trash2 } from 'lucide-react';
import { Position } from '../types';
import { formatCurrency, formatPercent, calculateLineValue, calculateLinePL } from '../utils';

interface PositionCardProps {
  position: Position;
  onDelete: (id: string) => void;
}

const PositionCard: React.FC<PositionCardProps> = ({ position, onDelete }) => {
  const value = calculateLineValue(position.quantity, position.currentPrice);
  const { plEuro, plPercent } = calculateLinePL(position.quantity, position.pru, position.currentPrice);
  const isPositive = plEuro >= 0;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-slate-200 transition-all flex flex-col gap-3 group">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-slate-900 text-lg uppercase">{position.ticker}</h3>
          <p className="text-slate-500 text-xs font-medium">{position.name}</p>
        </div>
        <button 
          onClick={() => onDelete(position.id)}
          className="text-slate-300 hover:text-rose-500 transition-colors p-1"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Valeur</p>
          <p className="text-base font-semibold text-slate-900">{formatCurrency(value)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">P/L</p>
          <p className={`text-base font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isPositive ? '+' : ''}{formatPercent(plPercent)}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-slate-50">
        <div className="text-xs text-slate-500">
          <span className="font-medium">{position.quantity}</span> titres à <span className="font-medium">{formatCurrency(position.pru)}</span>
        </div>
        <div className={`text-xs font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isPositive ? '+' : ''}{formatCurrency(plEuro)}
        </div>
      </div>
    </div>
  );
};

export default PositionCard;
