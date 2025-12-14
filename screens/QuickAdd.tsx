import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import { FoodState, FoodItem } from '../types';
import { getCurrentTime } from '../utils';

const QuickAdd: React.FC = () => {
  const { addFood } = useAppContext();
  const navigate = useNavigate();

  const [method, setMethod] = useState<'Quantity' | 'Common' | 'Custom'>('Quantity');
  const [name, setName] = useState('');
  const [state, setState] = useState<FoodState>('Cooked');
  const [weight, setWeight] = useState<string>('');
  
  const handleSave = () => {
    if (!name || !weight) return;
    
    // Mock nutrition calculation based on generic "healthy" food per 100g
    // This makes the prototype feel responsive even without a real DB
    const w = parseInt(weight);
    const mockProteinPer100g = 20; 
    const mockCalsPer100g = 150;
    const mockFatPer100g = 5;
    const mockCarbsPer100g = 10;
    
    const factor = w / 100;

    const newItem: Omit<FoodItem, 'id'> = {
        name: name,
        weight: w,
        state: state,
        calories: Math.round(mockCalsPer100g * factor),
        protein: Math.round(mockProteinPer100g * factor),
        fat: Math.round(mockFatPer100g * factor),
        carbs: Math.round(mockCarbsPer100g * factor),
        mealType: 'Snack', // Defaulting to snack for quick add, normally would have a selector
        timestamp: getCurrentTime()
    };

    addFood(newItem);
    navigate('/timeline');
  };

  const handleRecentClick = (foodName: string, foodState: FoodState) => {
      setName(foodName);
      setState(foodState);
  };

  return (
    <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
        {/* Header */}
        <header className="flex items-center px-4 pt-4 pb-4 bg-background-light dark:bg-surface-darker justify-between shrink-0 z-10 border-b border-white/5">
            <button onClick={() => navigate(-1)} className="text-slate-500 dark:text-[#92c9a4] flex size-10 items-center justify-center rounded-full active:bg-slate-200 dark:active:bg-surface-dark transition-colors">
                <span className="material-symbols-outlined text-2xl">close</span>
            </button>
            <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] text-center">Quick Add</h2>
            <button onClick={handleSave} className="text-primary font-bold text-base flex w-10 items-center justify-center hover:opacity-80">
                Save
            </button>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar flex flex-col w-full relative pb-24">
            {/* Tabs */}
            <div className="px-4 py-4 sticky top-0 bg-background-light dark:bg-background-dark z-10 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
                <div className="flex h-12 w-full items-center justify-center rounded-lg bg-slate-200 dark:bg-surface-dark p-1">
                    {(['Quantity', 'Common', 'Custom'] as const).map(m => (
                        <label key={m} className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-md px-2 transition-all duration-200 group ${method === m ? 'bg-white dark:bg-primary shadow-sm' : ''}`}>
                            <span className={`truncate text-sm font-medium transition-colors ${method === m ? 'text-slate-900 dark:text-background-dark' : 'text-slate-500 dark:text-[#92c9a4]'}`}>{m}</span>
                            <input 
                                type="radio" 
                                className="invisible w-0 absolute" 
                                name="add-method" 
                                checked={method === m}
                                onChange={() => setMethod(m)}
                            />
                        </label>
                    ))}
                </div>
            </div>

            {/* Form */}
            <div className="flex flex-col gap-6 px-4 py-2">
                {/* Name */}
                <div className="flex flex-col gap-2">
                    <label className="text-slate-600 dark:text-[#92c9a4] text-sm font-medium ml-1">What did you eat?</label>
                    <div className="relative flex items-center">
                        <span className="absolute left-4 text-slate-400 dark:text-slate-500 material-symbols-outlined">search</span>
                        <input 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full h-14 pl-12 pr-4 bg-white dark:bg-surface-dark text-slate-900 dark:text-white rounded-xl border-none focus:ring-2 focus:ring-primary placeholder:text-slate-400 dark:placeholder:text-slate-600 text-lg" 
                            placeholder="e.g., Rice, Banana..." 
                            type="text"
                        />
                    </div>
                </div>

                {/* State */}
                <div className="flex flex-col gap-2">
                    <label className="text-slate-600 dark:text-[#92c9a4] text-sm font-medium ml-1">State</label>
                    <div className="flex h-12 w-full items-center rounded-xl bg-slate-200 dark:bg-surface-dark p-1">
                        {(['Raw', 'Cooked'] as const).map(s => (
                             <label key={s} className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 transition-all duration-200 group ${state === s ? 'bg-white dark:bg-primary shadow-sm' : ''}`}>
                                <span className={`truncate text-sm font-medium transition-colors ${state === s ? 'text-slate-900 dark:text-background-dark' : 'text-slate-500 dark:text-[#92c9a4]'}`}>{s}</span>
                                <input 
                                    type="radio" 
                                    className="invisible w-0 absolute" 
                                    checked={state === s}
                                    onChange={() => setState(s)}
                                />
                            </label>
                        ))}
                    </div>
                </div>

                {/* Weight */}
                <div className="flex flex-col gap-2">
                    <label className="text-slate-600 dark:text-[#92c9a4] text-sm font-medium ml-1">Weight (g)</label>
                    <div className="relative">
                        <input 
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            className="w-full h-16 px-4 bg-white dark:bg-surface-dark text-slate-900 dark:text-white rounded-xl border-2 border-transparent focus:border-primary focus:ring-0 placeholder:text-slate-400 dark:placeholder:text-slate-600 text-2xl font-semibold" 
                            inputMode="numeric" 
                            placeholder="0" 
                            type="number"
                        />
                        <div className="absolute right-4 top-0 h-full flex items-center pointer-events-none">
                            <span className="text-slate-400 dark:text-[#92c9a4] text-lg font-medium">grams</span>
                        </div>
                    </div>
                </div>

                {/* Recent Searches */}
                <div className="mt-4 pt-6 border-t border-slate-200 dark:border-surface-dark">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-600 mb-3 ml-1">Recent Searches</h3>
                    <div className="flex flex-col gap-2">
                        <button onClick={() => handleRecentClick('Basmati Rice', 'Cooked')} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-dark group transition-colors text-left">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-slate-200 dark:bg-surface-darker flex items-center justify-center text-lg">🍚</div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-primary transition-colors">Basmati Rice</p>
                                    <p className="text-xs text-slate-500 dark:text-[#92c9a4]">Cooked • 150g</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 group-hover:text-primary">add_circle</span>
                        </button>
                        <button onClick={() => handleRecentClick('Banana', 'Raw')} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-dark group transition-colors text-left">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-slate-200 dark:bg-surface-darker flex items-center justify-center text-lg">🍌</div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-primary transition-colors">Banana</p>
                                    <p className="text-xs text-slate-500 dark:text-[#92c9a4]">Raw • Large</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 group-hover:text-primary">add_circle</span>
                        </button>
                    </div>
                </div>
            </div>
        </main>

        <div className="shrink-0 p-4 w-full max-w-md mx-auto bg-background-light dark:bg-background-dark z-20">
            <button onClick={handleSave} className="w-full h-14 bg-primary hover:bg-primary-dark active:scale-[0.98] transition-all rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-background-dark font-bold text-lg">Add to Log</span>
            </button>
        </div>
    </div>
  );
};

export default QuickAdd;
