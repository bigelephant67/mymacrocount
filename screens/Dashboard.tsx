import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import { FoodItem, UserProfile, Macros, Gender, Goal, ActivityLevel } from '../types';
import LiveVoice from './LiveVoice';

const Dashboard: React.FC = () => {
  const { log, targets, profile, addFood } = useAppContext();
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  const [showLiveVoice, setShowLiveVoice] = useState(false);

  // Calculate totals
  const totals = useMemo(() => {
    return log.reduce((acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      fat: acc.fat + item.fat,
      carbs: acc.carbs + item.carbs,
    }), { calories: 0, protein: 0, fat: 0, carbs: 0 });
  }, [log]);

  const caloriesRemaining = targets.calories - totals.calories;
  const progressPercent = Math.min(100, Math.max(0, (totals.calories / targets.calories) * 100));
  
  // Group meals
  const meals: Record<string, FoodItem[]> = {
    Breakfast: log.filter(i => i.mealType === 'Breakfast'),
    Lunch: log.filter(i => i.mealType === 'Lunch'),
    Dinner: log.filter(i => i.mealType === 'Dinner'),
  };

  const handleVoiceAdd = (macros: { calories: number, protein: number, carbs: number, fat: number, foodName: string }) => {
    const now = new Date();
    const hour = now.getHours();
    
    let mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
    
    if (hour >= 5 && hour < 12) {
        mealType = 'Breakfast';
    } else if (hour >= 12 && hour < 17) {
        mealType = 'Lunch';
    } else if (hour >= 17 && hour < 23) {
        mealType = 'Dinner';
    } else {
        mealType = 'Snack'; 
    }

    const newItem: Omit<FoodItem, 'id'> = {
        name: macros.foodName,
        weight: 0, // Not provided by voice usually
        calories: Math.round(macros.calories),
        protein: Math.round(macros.protein),
        fat: Math.round(macros.fat),
        carbs: Math.round(macros.carbs),
        mealType: mealType,
        timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        state: 'Cooked'
    };

    addFood(newItem);
  };

  return (
    <div className="flex flex-col min-h-screen relative pb-24">
      {/* Header */}
      <header className="flex items-center p-5 justify-between sticky top-0 z-30 bg-background-dark/95 backdrop-blur-md">
        <h2 className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">Today, Oct 24</h2>
        <div className="flex items-center gap-2">
            <button 
                onClick={() => setShowLiveVoice(true)} 
                className="flex items-center justify-center rounded-lg h-10 w-10 text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
            >
                <span className="material-symbols-outlined text-2xl">mic</span>
            </button>
            <button onClick={() => setShowDetails(true)} className="flex items-center justify-center rounded-lg h-10 w-10 text-white hover:bg-surface-dark transition-colors">
                <span className="material-symbols-outlined text-2xl">info</span>
            </button>
            <button onClick={() => navigate('/timeline')} className="flex items-center justify-center rounded-lg h-10 w-10 text-white hover:bg-surface-dark transition-colors">
                <span className="material-symbols-outlined text-2xl">calendar_month</span>
            </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col gap-6 px-5">
        {/* Hero Circular Progress */}
        <section className="flex flex-col items-center justify-center pt-2 pb-6">
          <div className="relative w-72 h-72">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path className="text-surface-dark stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="2.5"></path>
              <path 
                className="text-primary stroke-current drop-shadow-[0_0_15px_rgba(19,236,91,0.25)] transition-all duration-1000 ease-out" 
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                fill="none" 
                strokeDasharray={`${progressPercent}, 100`} 
                strokeLinecap="round" 
                strokeWidth="2.5"
              ></path>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-primary text-[48px] font-black tracking-tight leading-none">{caloriesRemaining.toLocaleString()}</span>
              <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider mt-2">Calories Remaining</span>
            </div>
          </div>
          
          <div className="flex justify-between w-full max-w-xs mt-2 px-2">
            <div className="text-center">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Eaten</p>
              <p className="text-white font-bold text-xl">{totals.calories.toLocaleString()}</p>
            </div>
            <div className="h-10 w-px bg-surface-dark"></div>
            <div className="text-center">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Goal</p>
              <p className="text-white font-bold text-xl">{targets.calories.toLocaleString()}</p>
            </div>
          </div>
        </section>

        {/* Macro Bars */}
        <section className="flex flex-col gap-6">
          <MacroBar label="Protein" current={totals.protein} target={targets.protein} color="bg-primary" statusColor="text-primary" />
          <MacroBar label="Carbs" current={totals.carbs} target={targets.carbs} color="bg-yellow-400" statusColor="text-yellow-400" />
          <MacroBar label="Fat" current={totals.fat} target={targets.fat} color="bg-red-500" statusColor="text-red-500" />
        </section>

        {/* Meals Summary */}
        <section className="mt-4 pb-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">Today's Meals</h3>
            </div>
            <div className="flex flex-col gap-3">
                <MealCard title="Breakfast" items={meals.Breakfast} icon="bakery_dining" onClick={() => navigate('/timeline')} />
                <MealCard title="Lunch" items={meals.Lunch} icon="rice_bowl" onClick={() => navigate('/timeline')} />
                <MealCard title="Dinner" items={meals.Dinner} icon="dinner_dining" onClick={() => navigate('/timeline')} />
            </div>
        </section>
      </main>

      {/* FAB */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center z-40 pointer-events-none px-4 max-w-md mx-auto">
        <button 
          onClick={() => navigate('/quick-add')}
          className="pointer-events-auto bg-primary hover:bg-[#0fd650] active:scale-95 transition-all text-background-dark rounded-full h-14 pl-6 pr-8 flex items-center gap-3 shadow-[0_8px_30px_rgba(19,236,91,0.4)] font-bold text-lg"
        >
          <span className="material-symbols-outlined text-3xl">add</span>
            Log Food
        </button>
      </div>

      {/* Details Modal */}
      {showDetails && (
          <DetailsModal onClose={() => setShowDetails(false)} />
      )}

      {/* Live Voice Overlay */}
      {showLiveVoice && (
          <LiveVoice onClose={() => setShowLiveVoice(false)} onAddFood={handleVoiceAdd} />
      )}
    </div>
  );
};

const DetailsModal = ({ onClose }: { onClose: () => void }) => {
    const { profile, setProfile, targets } = useAppContext();
    const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs');
    const [heightUnit, setHeightUnit] = useState<'ft' | 'cm'>('ft');

    // Helper to update profile safely
    const update = (field: keyof UserProfile, value: any) => {
        setProfile({ ...profile, [field]: value });
    };

    // Calculate display values
    const weightDisplay = weightUnit === 'lbs' ? profile.weight : Math.round(profile.weight * 0.453592);
    const heightDisplayCm = Math.round(((profile.heightFt * 12) + profile.heightIn) * 2.54);

    // Handlers
    const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value) || 0;
        if (weightUnit === 'lbs') {
            update('weight', val);
        } else {
            update('weight', Math.round(val * 2.20462));
        }
    };

    const handleHeightCmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const cm = parseInt(e.target.value) || 0;
        const totalInches = cm / 2.54;
        const ft = Math.floor(totalInches / 12);
        const inches = Math.round(totalInches % 12);
        setProfile({ ...profile, heightFt: ft, heightIn: inches });
    };

    // Replicate calculation for breakdown display
    const weightKg = profile.weight * 0.453592;
    const heightCm = (profile.heightFt * 12 + profile.heightIn) * 2.54;
    
    let bmr = 10 * weightKg + 6.25 * heightCm - 5 * profile.age;
    bmr += profile.gender === 'Male' ? 5 : -161;
    bmr = Math.round(bmr);

    const multipliers = [1.2, 1.375, 1.55, 1.725, 1.9];
    const multiplier = multipliers[profile.activityLevel - 1] || 1.2;

    const goals: Goal[] = ['Cut', 'Maintain', 'Bulk'];
    const genders: Gender[] = ['Male', 'Female'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface-darker border border-white/10 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                
                {/* Modal Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-surface-dark/50">
                    <h3 className="text-lg font-bold text-white">Settings & Targets</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-5 overflow-y-auto no-scrollbar space-y-6">
                    
                    {/* Units & Basic Stats */}
                    <div className="space-y-4">
                        <div className="flex justify-between gap-4">
                            <UnitToggle label="Weight" options={['lbs', 'kg']} current={weightUnit} onChange={(v: any) => setWeightUnit(v)} />
                            <UnitToggle label="Height" options={['ft', 'cm']} current={heightUnit} onChange={(v: any) => setHeightUnit(v)} />
                        </div>

                        {/* Gender */}
                        <div className="flex bg-surface-dark rounded-xl p-1">
                            {genders.map(g => (
                                <button
                                    key={g}
                                    onClick={() => update('gender', g)}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${profile.gender === g ? 'bg-primary text-background-dark shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>

                        {/* Inputs Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <InputCard label={`Weight (${weightUnit})`} value={weightDisplay} onChange={handleWeightChange} />
                            <div className="bg-surface-dark border border-white/5 rounded-xl p-3 flex flex-col justify-center">
                                <span className="text-[10px] text-slate-500 uppercase font-bold mb-1">Age</span>
                                <div className="flex items-center gap-1">
                                    <input 
                                        type="number" 
                                        value={profile.age} 
                                        onChange={(e) => update('age', parseInt(e.target.value) || 0)}
                                        className="w-full bg-transparent border-none text-white font-bold text-xl p-0 focus:ring-0" 
                                    />
                                    <span className="text-xs text-slate-500">yrs</span>
                                </div>
                            </div>
                            
                            {/* Height Input (Conditional) */}
                            <div className="col-span-2 bg-surface-dark border border-white/5 rounded-xl p-3">
                                <span className="text-[10px] text-slate-500 uppercase font-bold mb-1">Height</span>
                                {heightUnit === 'ft' ? (
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-baseline gap-1">
                                            <input 
                                                type="number" 
                                                value={profile.heightFt} 
                                                onChange={(e) => update('heightFt', parseInt(e.target.value) || 0)}
                                                className="w-12 bg-transparent border-none text-white font-bold text-xl p-0 focus:ring-0 text-center" 
                                            />
                                            <span className="text-xs text-slate-500">ft</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <input 
                                                type="number" 
                                                value={profile.heightIn} 
                                                onChange={(e) => update('heightIn', parseInt(e.target.value) || 0)}
                                                className="w-12 bg-transparent border-none text-white font-bold text-xl p-0 focus:ring-0 text-center" 
                                            />
                                            <span className="text-xs text-slate-500">in</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-baseline gap-1">
                                        <input 
                                            type="number" 
                                            value={heightDisplayCm} 
                                            onChange={handleHeightCmChange}
                                            className="w-full bg-transparent border-none text-white font-bold text-xl p-0 focus:ring-0" 
                                        />
                                        <span className="text-xs text-slate-500">cm</span>
                                    </div>
                                )}
                            </div>
                        </div>

                         {/* Activity */}
                         <div className="bg-surface-dark border border-white/5 rounded-xl p-3">
                            <div className="flex justify-between mb-2">
                                <span className="text-[10px] text-slate-500 uppercase font-bold">Activity Level</span>
                                <span className="text-xs text-white font-bold">x{multiplier}</span>
                            </div>
                            <input 
                                type="range" 
                                min="1" 
                                max="5" 
                                step="1" 
                                value={profile.activityLevel} 
                                onChange={(e) => update('activityLevel', parseInt(e.target.value))}
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Goal Selection */}
                    <div className="space-y-2">
                        <span className="text-[10px] text-slate-500 uppercase font-bold ml-1">Current Goal</span>
                        <div className="grid grid-cols-3 gap-2">
                            {goals.map(g => {
                                const offset = g === 'Cut' ? '-500' : g === 'Bulk' ? '+500' : '0';
                                return (
                                    <button
                                        key={g}
                                        onClick={() => update('goal', g)}
                                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${profile.goal === g ? 'bg-primary/10 border-primary text-white' : 'bg-surface-dark border-transparent text-slate-400 hover:bg-white/5'}`}
                                    >
                                        <span className={`text-sm font-bold ${profile.goal === g ? 'text-primary' : ''}`}>{g}</span>
                                        <span className="text-[10px] opacity-60">{offset}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Results / Breakdown */}
                    <div className="bg-black/20 rounded-xl p-4 space-y-3">
                         <div className="flex justify-between items-center text-sm">
                             <span className="text-slate-500">BMR</span>
                             <span className="text-white font-mono">{bmr}</span>
                         </div>
                         <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3">
                             <span className="text-slate-500">TDEE (Maint.)</span>
                             <span className="text-white font-mono">{Math.round(bmr * multiplier)}</span>
                         </div>
                         <div className="flex justify-between items-center pt-1">
                             <span className="text-white font-bold">Daily Target</span>
                             <span className="text-xl text-primary font-bold font-mono">{targets.calories} <span className="text-xs text-slate-500 font-normal">kcal</span></span>
                         </div>
                    </div>

                    {/* Macro Breakdown Bubbles */}
                    <div className="grid grid-cols-3 gap-2">
                        <MacroBox label="Protein" value={targets.protein} color="bg-primary" />
                        <MacroBox label="Fats" value={targets.fat} color="bg-red-500" />
                        <MacroBox label="Carbs" value={targets.carbs} color="bg-yellow-400" />
                    </div>
                </div>
            </div>
            
            {/* Backdrop Click */}
            <div className="absolute inset-0 -z-10" onClick={onClose}></div>
        </div>
    );
};

const UnitToggle = ({ label, options, current, onChange }: any) => (
    <div className="flex flex-col gap-1.5 flex-1">
        <span className="text-[10px] text-slate-500 uppercase font-bold ml-1">{label}</span>
        <div className="flex bg-surface-dark rounded-lg p-1">
            {options.map((opt: string) => (
                <button
                    key={opt}
                    onClick={() => onChange(opt)}
                    className={`flex-1 py-1 text-xs font-bold rounded uppercase transition-all ${current === opt ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    {opt}
                </button>
            ))}
        </div>
    </div>
);

const InputCard = ({ label, value, onChange }: any) => (
    <div className="bg-surface-dark border border-white/5 rounded-xl p-3 flex flex-col justify-center">
        <span className="text-[10px] text-slate-500 uppercase font-bold mb-1">{label}</span>
        <input 
            type="number" 
            value={value} 
            onChange={onChange}
            className="w-full bg-transparent border-none text-white font-bold text-xl p-0 focus:ring-0" 
        />
    </div>
);

const MacroBox = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div className="bg-surface-dark border border-white/5 rounded-xl p-3 flex flex-col items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${color} mb-1`}></div>
        <span className="text-xl font-bold text-white">{value}g</span>
        <span className="text-[10px] text-slate-500 uppercase font-bold">{label}</span>
    </div>
);

const MacroBar = ({ label, current, target, color, statusColor }: { label: string, current: number, target: number, color: string, statusColor: string }) => {
    const pct = Math.min(100, (current / target) * 100);
    const status = pct > 100 ? 'Exceeded' : pct > 90 ? 'Near Limit' : 'On Track';
    
    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
                <span className="text-white text-base font-bold">{label}</span>
                <span className="text-slate-400 text-sm font-medium"><span className={pct > 100 ? 'text-red-500' : 'text-white'}>{current}g</span> / {target}g</span>
            </div>
            <div className="h-3 w-full bg-surface-dark rounded-full overflow-hidden">
                <div className={`h-full ${pct > 100 ? 'bg-red-500' : color} rounded-full shadow-[0_0_12px_rgba(255,255,255,0.1)] relative transition-all duration-500`} style={{ width: `${pct}%` }}>
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20"></div>
                </div>
            </div>
            <p className={`${pct > 100 ? 'text-red-500' : statusColor} text-xs font-bold uppercase tracking-wide text-right`}>{status}</p>
        </div>
    );
};

const MealCard = ({ title, items, icon, onClick }: { title: string, items: FoodItem[], icon: string, onClick: () => void }) => {
    const totalCals = items.reduce((sum, item) => sum + item.calories, 0);
    const description = items.length > 0 
        ? items.map(i => i.name).join(', ') 
        : "Not logged yet";
    
    const isEmpty = items.length === 0;

    if (isEmpty) {
        return (
            <button onClick={onClick} className="flex items-center justify-between p-4 bg-transparent border border-dashed border-slate-700 rounded-xl group active:bg-surface-dark/50 transition-colors w-full text-left">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-surface-dark flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">{icon}</span>
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-slate-300 font-bold text-base">{title}</span>
                        <span className="text-slate-500 text-xs">{description}</span>
                    </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-surface-dark flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-black transition-colors">
                    <span className="material-symbols-outlined text-sm font-bold">add</span>
                </div>
            </button>
        );
    }

    return (
        <div onClick={onClick} className="flex items-center justify-between p-4 bg-surface-dark rounded-xl active:scale-[0.98] transition-transform cursor-pointer">
            <div className="flex items-center gap-4 overflow-hidden">
                <div className="w-12 h-12 rounded-lg bg-background-dark flex items-center justify-center text-primary border border-white/5 shrink-0">
                    <span className="material-symbols-outlined">{icon}</span>
                </div>
                <div className="flex flex-col overflow-hidden">
                    <span className="text-white font-bold text-base">{title}</span>
                    <span className="text-slate-400 text-xs truncate">{description}</span>
                </div>
            </div>
            <div className="text-right shrink-0 ml-2">
                <span className="text-white font-bold block">{totalCals}</span>
                <span className="text-xs text-slate-500 font-medium uppercase">kcal</span>
            </div>
        </div>
    );
};

export default Dashboard;