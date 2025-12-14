import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import { ActivityLevel, Gender, Goal } from '../types';

const Onboarding: React.FC = () => {
  const { profile, setProfile, targets } = useAppContext();
  const navigate = useNavigate();

  const [localProfile, setLocalProfile] = useState(profile);

  // Sync changes to global context immediately for "live" calculation effect
  useEffect(() => {
    setProfile(localProfile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localProfile]);

  const update = (field: string, value: any) => {
    setLocalProfile(prev => ({ ...prev, [field]: value }));
  };

  const activityLabels = ["Sedentary", "Light", "Moderate", "Active", "Athlete"];

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark overflow-y-auto">
      {/* Header */}
      <header className="flex items-center p-5 pb-2 justify-between sticky top-0 z-10 bg-background-dark/95 backdrop-blur-md">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer text-white">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </div>
        <h1 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10">Setup Your Macros</h1>
      </header>

      <main className="flex-1 flex flex-col px-5 pt-4 pb-28 gap-6">
        <div>
          <h2 className="text-white tracking-tight text-3xl font-bold leading-tight">Profile & Goals</h2>
          <p className="text-[#92c9a4] text-sm font-normal leading-normal pt-1">Instant calculation based on your inputs.</p>
        </div>

        {/* Gender */}
        <div className="flex h-12 w-full items-center justify-center rounded-xl bg-surface-darker p-1">
          {(['Male', 'Female'] as Gender[]).map((g) => (
            <label key={g} className={`group relative flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 transition-all ${localProfile.gender === g ? 'bg-background-dark shadow-sm ring-1 ring-white/10' : ''}`}>
              <span className={`z-10 text-sm font-semibold tracking-wide ${localProfile.gender === g ? 'text-primary' : 'text-[#92c9a4]'}`}>{g}</span>
              <input 
                type="radio" 
                className="sr-only" 
                name="gender" 
                value={g} 
                checked={localProfile.gender === g}
                onChange={() => update('gender', g)}
              />
            </label>
          ))}
        </div>

        {/* Goal */}
        <div className="flex h-12 w-full items-center justify-center rounded-xl bg-surface-darker p-1">
          {(['Cut', 'Maintain', 'Bulk'] as Goal[]).map((g) => (
            <label key={g} className={`group relative flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 transition-all ${localProfile.goal === g ? 'bg-background-dark shadow-sm ring-1 ring-white/10' : ''}`}>
              <span className={`z-10 text-sm font-semibold tracking-wide ${localProfile.goal === g ? 'text-primary' : 'text-[#92c9a4]'}`}>{g}</span>
              <input 
                type="radio" 
                className="sr-only" 
                name="goal" 
                value={g} 
                checked={localProfile.goal === g}
                onChange={() => update('goal', g)}
              />
            </label>
          ))}
        </div>

        {/* Numeric Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-darker rounded-2xl p-4 flex flex-col justify-between group focus-within:ring-2 focus-within:ring-primary/50 transition-all">
            <label className="text-[#92c9a4] text-xs font-medium uppercase tracking-wider mb-1">Age</label>
            <div className="flex items-baseline gap-1">
              <input 
                type="number" 
                value={localProfile.age} 
                onChange={(e) => update('age', parseInt(e.target.value) || 0)}
                className="w-full bg-transparent border-none text-white text-3xl font-bold p-0 focus:ring-0 placeholder-white/20" 
              />
              <span className="text-white/40 text-sm font-medium">yrs</span>
            </div>
          </div>

          <div className="bg-surface-darker rounded-2xl p-4 flex flex-col justify-between group focus-within:ring-2 focus-within:ring-primary/50 transition-all">
            <label className="text-[#92c9a4] text-xs font-medium uppercase tracking-wider mb-1">Weight</label>
            <div className="flex items-baseline gap-1">
              <input 
                 type="number" 
                 value={localProfile.weight} 
                 onChange={(e) => update('weight', parseInt(e.target.value) || 0)}
                 className="w-full bg-transparent border-none text-white text-3xl font-bold p-0 focus:ring-0 placeholder-white/20" 
              />
              <span className="text-white/40 text-sm font-medium">lbs</span>
            </div>
          </div>

          <div className="col-span-2 bg-surface-darker rounded-2xl p-4 flex items-center justify-between group focus-within:ring-2 focus-within:ring-primary/50 transition-all">
            <div className="flex flex-col">
              <label className="text-[#92c9a4] text-xs font-medium uppercase tracking-wider mb-1">Height</label>
              <div className="flex items-baseline gap-2">
                <input 
                   type="number" 
                   value={localProfile.heightFt} 
                   onChange={(e) => update('heightFt', parseInt(e.target.value) || 0)}
                   className="w-12 bg-transparent border-none text-white text-3xl font-bold p-0 focus:ring-0 placeholder-white/20 text-center" 
                />
                <span className="text-white/40 text-sm font-medium mr-2">ft</span>
                <input 
                   type="number" 
                   value={localProfile.heightIn} 
                   onChange={(e) => update('heightIn', parseInt(e.target.value) || 0)}
                   className="w-12 bg-transparent border-none text-white text-3xl font-bold p-0 focus:ring-0 placeholder-white/20 text-center" 
                />
                <span className="text-white/40 text-sm font-medium">in</span>
              </div>
            </div>
            <div className="h-10 w-px bg-white/10 mx-4"></div>
            <div className="flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl opacity-80">height</span>
            </div>
          </div>
        </div>

        {/* Activity Slider */}
        <div className="bg-surface-darker rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <label className="text-[#92c9a4] text-xs font-medium uppercase tracking-wider">Activity Level</label>
            <span className="text-white font-semibold text-sm bg-white/10 px-2 py-0.5 rounded text-right transition-all w-24 flex justify-center">{activityLabels[localProfile.activityLevel - 1]}</span>
          </div>
          <div className="relative w-full h-8 flex items-center">
            <input 
              type="range" 
              min="1" 
              max="5" 
              step="1" 
              value={localProfile.activityLevel} 
              onChange={(e) => update('activityLevel', parseInt(e.target.value) as ActivityLevel)}
              className="z-20 w-full bg-transparent" 
            />
            <div className="absolute w-full flex justify-between px-1 pointer-events-none top-1/2 -translate-y-1/2 opacity-30">
              <div className="w-1 h-3 bg-white rounded-full"></div>
              <div className="w-1 h-2 bg-white rounded-full"></div>
              <div className="w-1 h-2 bg-white rounded-full"></div>
              <div className="w-1 h-2 bg-white rounded-full"></div>
              <div className="w-1 h-3 bg-white rounded-full"></div>
            </div>
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-white/40 font-medium uppercase tracking-wide">
            <span>Sedentary</span>
            <span>Athlete</span>
          </div>
        </div>

        {/* Live Results */}
        <div className="mt-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface-dark to-surface-darker border border-white/5 p-6 shadow-2xl">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-white/60 text-sm font-medium">Daily Target</p>
                    <div className="flex items-center gap-1 text-[#92c9a4] text-xs bg-primary/10 px-2 py-1 rounded-md border border-primary/20">
                        <span className="material-symbols-outlined text-sm">local_fire_department</span>
                        <span>TDEE: {targets.calories + (localProfile.goal === 'Cut' ? 500 : localProfile.goal === 'Bulk' ? -500 : 0)}</span>
                    </div>
                </div>
                <div className="flex items-baseline gap-2 mb-6">
                    <h3 className="text-5xl font-extrabold text-white tracking-tight">{targets.calories.toLocaleString()}</h3>
                    <span className="text-xl text-primary font-bold">kcal</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <MacroCard label="Protein" value={targets.protein} color="bg-blue-400" />
                    <MacroCard label="Fat" value={targets.fat} color="bg-yellow-400" />
                    <MacroCard label="Carbs" value={targets.carbs} color="bg-primary" />
                </div>
            </div>
        </div>

      </main>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 w-full p-5 bg-gradient-to-t from-background-dark via-background-dark to-transparent z-50 flex justify-center pointer-events-none max-w-md mx-auto">
        <button 
          onClick={() => navigate('/dashboard')}
          className="pointer-events-auto w-full bg-primary hover:bg-[#0fd650] active:scale-[0.98] transition-all text-background-dark font-bold text-lg h-14 rounded-2xl shadow-[0_0_20px_rgba(19,236,91,0.3)] flex items-center justify-center gap-2 group"
        >
          <span>Continue to Dashboard</span>
          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

const MacroCard = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/5 border border-white/5">
        <span className="text-xs text-white/50 font-medium">{label}</span>
        <span className="text-xl font-bold text-white">{value}<span className="text-sm font-normal text-white/40 ml-0.5">g</span></span>
        <div className="w-full h-1 bg-white/10 rounded-full mt-1">
            <div className={`w-1/2 h-full rounded-full ${color}`}></div>
        </div>
    </div>
);

export default Onboarding;
