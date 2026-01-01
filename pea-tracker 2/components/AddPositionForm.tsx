
import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface AddPositionFormProps {
  onAdd: (ticker: string, quantity: number, pru: number) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const AddPositionForm: React.FC<AddPositionFormProps> = ({ onAdd, isOpen, setIsOpen }) => {
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pru, setPru] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || !quantity || !pru) return;
    onAdd(ticker.toUpperCase(), parseFloat(quantity), parseFloat(pru));
    setTicker('');
    setQuantity('');
    setPru('');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">Nouvelle Position</h2>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Ticker / Symbole</label>
            <input
              type="text"
              required
              placeholder="Ex: AIR.PA, AI.PA..."
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Quantité</label>
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">PRU (€)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                value={pru}
                onChange={(e) => setPru(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-[0.98]"
          >
            Ajouter au portefeuille
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddPositionForm;
