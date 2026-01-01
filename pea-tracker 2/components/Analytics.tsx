
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Position } from '../types';
import { calculateLineValue } from '../utils';

interface AnalyticsProps {
  positions: Position[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

const Analytics: React.FC<AnalyticsProps> = ({ positions }) => {
  if (positions.length === 0) return null;

  const data = positions.map((p, idx) => ({
    name: p.ticker,
    value: calculateLineValue(p.quantity, p.currentPrice),
    color: COLORS[idx % COLORS.length]
  })).sort((a, b) => b.value - a.value);

  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 mb-8">
      <h3 className="text-slate-900 font-bold text-lg mb-6 flex items-center gap-2">
        Allocation des Actifs
      </h3>
      
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="h-[200px] w-full md:w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`${value.toFixed(2)}€`, 'Valeur']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full md:w-1/2 space-y-3">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="font-semibold text-slate-700 uppercase">{item.name}</span>
              </div>
              <span className="text-slate-400 font-medium">
                {((item.value / data.reduce((acc, curr) => acc + curr.value, 0)) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
