
import React, { useState, useMemo } from 'react';
import { Plus, RefreshCcw, LayoutGrid, List } from 'lucide-react';
import { Position, PortfolioStats, HistoryData } from './types';
import Dashboard from './components/Dashboard';
import PositionCard from './components/PositionCard';
import AddPositionForm from './components/AddPositionForm';
import QuickStats from './components/QuickStats';
import Analytics from './components/Analytics';
import HistoryChart from './components/HistoryChart';
import { formatCurrency } from './utils';

const INITIAL_POSITIONS: Position[] = [
  { id: '1', ticker: 'AI.PA', name: 'Air Liquide', quantity: 15, pru: 145.50, currentPrice: 172.40 },
  { id: '2', ticker: 'MC.PA', name: 'LVMH', quantity: 2, pru: 680.00, currentPrice: 795.20 },
  { id: '3', ticker: 'AIR.PA', name: 'Airbus', quantity: 10, pru: 125.00, currentPrice: 148.60 },
  { id: '4', ticker: 'RMS.PA', name: 'Hermès', quantity: 1, pru: 1950.00, currentPrice: 2240.00 },
];

const App: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>(INITIAL_POSITIONS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const stats: PortfolioStats = useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;

    positions.forEach((pos) => {
      totalValue += pos.quantity * pos.currentPrice;
      totalCost += pos.quantity * pos.pru;
    });

    const totalPL = totalValue - totalCost;
    const totalPLPercentage = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

    return { totalValue, totalCost, totalPL, totalPLPercentage };
  }, [positions]);

  // Simulated historical data based on current value
  const historyData: HistoryData[] = useMemo(() => {
    const months = ['Sept', 'Oct', 'Nov', 'Déc', 'Jan', 'Fév'];
    const baseValue = stats.totalValue;
    return months.map((month, idx) => ({
      month,
      // Create a growth trend with some randomness
      value: baseValue * (0.85 + (idx * 0.03) + (Math.random() * 0.05))
    }));
  }, [stats.totalValue]);

  const handleAddPosition = (ticker: string, quantity: number, pru: number) => {
    const newPos: Position = {
      id: Math.random().toString(36).substr(2, 9),
      ticker,
      name: ticker,
      quantity,
      pru,
      currentPrice: pru * (0.95 + Math.random() * 0.15),
    };
    setPositions([...positions, newPos]);
  };

  const handleDeletePosition = (id: string) => {
    if (window.confirm('Supprimer cette ligne ?')) {
      setPositions(positions.filter((p) => p.id !== id));
    }
  };

  const simulatePriceUpdate = () => {
    setPositions((prev) => 
      prev.map((p) => ({
        ...p,
        currentPrice: p.currentPrice * (0.98 + Math.random() * 0.04)
      }))
    );
    setLastUpdate(new Date());
  };

  return (
    <div className="min-h-screen pb-40">
      <div className="fixed top-0 inset-x-0 h-24 bg-gradient-to-b from-[#F8FAFC] to-transparent z-40 pointer-events-none" />

      <header className="relative z-50 px-6 pt-12 pb-6 flex justify-between items-center max-w-2xl mx-auto">
        <div>
          <h2 className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Portfolio Manager</h2>
          <div className="flex items-center gap-3">
            <span className="text-slate-900 font-extrabold text-2xl tracking-tight">Tableau de Bord</span>
            <div className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
          </div>
        </div>
        <button 
          onClick={simulatePriceUpdate}
          className="group p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm hover:shadow-md active:scale-95"
          title="Actualiser les cours"
        >
          <RefreshCcw size={20} className="group-active:rotate-180 transition-transform duration-500" />
        </button>
      </header>

      <main className="px-6 max-w-2xl mx-auto space-y-8">
        <section>
          <Dashboard stats={stats} />
          <HistoryChart data={historyData} />
          <QuickStats positions={positions} />
          <Analytics positions={positions} />
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-slate-900 font-bold text-xl">Mes Actifs</h3>
              <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {positions.length}
              </span>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
              >
                <LayoutGrid size={16} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
              >
                <List size={16} />
              </button>
            </div>
          </div>

          <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            {positions.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="text-slate-300" size={32} />
                </div>
                <p className="text-slate-400 font-semibold">Commencez à bâtir votre fortune</p>
                <button 
                  onClick={() => setIsFormOpen(true)}
                  className="mt-4 text-indigo-600 font-bold hover:text-indigo-700"
                >
                  Ajouter ma première action
                </button>
              </div>
            ) : (
              positions.map((pos) => (
                <PositionCard 
                  key={pos.id} 
                  position={pos} 
                  onDelete={handleDeletePosition} 
                />
              ))
            )}
          </div>
        </section>

        <footer className="text-center pb-8 pt-4">
          <p className="text-slate-400 text-xs font-medium">
            Dernière mise à jour : {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </footer>
      </main>

      <div className="fixed bottom-10 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none">
        <div className="bg-slate-900/95 backdrop-blur-lg px-2 py-2 rounded-full shadow-2xl shadow-slate-900/40 flex items-center gap-2 pointer-events-auto border border-white/10">
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-white text-slate-900 px-8 py-3.5 rounded-full flex items-center gap-3 font-extrabold hover:bg-slate-50 transition-all active:scale-95 text-sm"
          >
            <Plus size={18} />
            <span>Ajouter une ligne</span>
          </button>
          <div className="w-px h-8 bg-white/20 mx-2" />
          <div className="pr-6 pl-2 py-2">
            <span className="block text-[10px] text-slate-400 uppercase font-bold leading-none mb-1">Total</span>
            <span className="text-white font-bold text-sm tracking-tight">{formatCurrency(stats.totalValue)}</span>
          </div>
        </div>
      </div>

      <AddPositionForm 
        isOpen={isFormOpen} 
        setIsOpen={setIsFormOpen} 
        onAdd={handleAddPosition} 
      />
    </div>
  );
};

export default App;
