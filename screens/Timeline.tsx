import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import { FoodItem } from '../types';

const Timeline: React.FC = () => {
  const { log, removeFood, targets } = useAppContext();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  
  const totalCals = log.reduce((sum, item) => sum + item.calories, 0);
  const totalProtein = log.reduce((sum, item) => sum + item.protein, 0);

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark relative pb-32">
       {/* Sticky Header */}
       <header className="sticky top-0 z-50 bg-background-dark/95 backdrop-blur-md border-b border-white/5 pt-safe-top">
            <div className="flex items-center justify-between p-4 h-16">
                <button onClick={() => navigate('/dashboard')} className="flex items-center justify-center size-10 rounded-full hover:bg-white/5 active:bg-white/10 transition-colors text-white">
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>arrow_back</span>
                </button>
                <h1 className="text-lg font-bold tracking-tight text-white">Today</h1>
                <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className={`font-semibold text-sm px-3 py-1.5 rounded-lg transition-all ${isEditing ? 'bg-primary text-background-dark' : 'text-primary hover:bg-white/5'}`}
                >
                    {isEditing ? 'Done' : 'Edit'}
                </button>
            </div>
            {/* Daily Summary Stats */}
            <div className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-3">
                    <HeaderStat 
                        label="Calories" 
                        value={totalCals} 
                        target={targets.calories} 
                        icon="local_fire_department" 
                        colorClass="bg-primary"
                        textClass="text-white"
                        suffix=""
                    />
                    <HeaderStat 
                        label="Protein" 
                        value={totalProtein} 
                        target={targets.protein} 
                        icon="fitness_center" 
                        colorClass="bg-primary"
                        textClass="text-primary"
                        suffix="g"
                    />
                </div>
            </div>
       </header>

       <main className="relative px-4 pb-32 pt-6">
          {/* Timeline Line Background */}
          {log.length > 0 && (
             <div className="absolute left-[34px] top-4 bottom-32 w-px bg-gradient-to-b from-transparent via-surface-border to-transparent"></div>
          )}

          {log.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-20 text-slate-500">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">no_food</span>
                <p>No meals logged today.</p>
            </div>
          ) : (
            log.map((item, index) => (
                <TimelineItem 
                    key={item.id} 
                    item={item} 
                    isLast={index === log.length - 1} 
                    onDelete={() => removeFood(item.id)}
                    isEditing={isEditing}
                />
            ))
          )}

          {log.length > 0 && !isEditing && (
              <div className="flex justify-center mt-8 opacity-40">
                <div className="flex items-center gap-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>swipe_left</span>
                        <span>Delete</span>
                    </div>
                    <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                    <div className="flex items-center gap-1">
                        <span>Duplicate</span>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>swipe_right</span>
                    </div>
                </div>
            </div>
          )}
       </main>

       {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6 z-50">
            <button 
                onClick={() => navigate('/quick-add')}
                className="bg-primary hover:bg-[#0fd650] active:scale-95 text-background-dark rounded-full size-14 shadow-[0_0_20px_rgba(19,236,91,0.3)] flex items-center justify-center transition-all duration-200"
            >
                <span className="material-symbols-outlined" style={{fontSize: '32px', fontWeight: 600 }}>add</span>
            </button>
        </div>

        {/* Bottom Gradient */}
        <div className="fixed bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background-dark to-transparent pointer-events-none z-40 max-w-md mx-auto"></div>
    </div>
  );
};

const HeaderStat = ({ label, value, target, icon, colorClass, textClass, suffix }: any) => {
    const pct = Math.min(100, (value/target)*100);
    return (
        <div className="bg-surface-dark border border-surface-border rounded-xl p-3 flex flex-col justify-between h-24 relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '48px' }}>{icon}</span>
            </div>
            <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">{label}</span>
            <div>
                <div className="flex items-end gap-1 mb-1">
                    <span className={`text-2xl font-bold ${textClass} tabular-nums leading-none`}>{value.toLocaleString()}</span>
                    <span className="text-xs text-gray-500 font-medium mb-0.5">{suffix} / {target.toLocaleString()}{suffix}</span>
                </div>
                <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                    <div className={`${colorClass} h-full rounded-full`} style={{ width: `${pct}%` }}></div>
                </div>
            </div>
        </div>
    );
};

interface TimelineItemProps {
    item: FoodItem;
    isLast: boolean;
    onDelete: () => void;
    isEditing: boolean;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ item, isLast, onDelete, isEditing }) => {
    const [swiped, setSwiped] = useState(false);
    
    useEffect(() => {
        if (!isEditing) {
            setSwiped(false);
        }
    }, [isEditing]);
    
    // Icon based on meal
    const icon = {
        'Breakfast': 'grain',
        'Lunch': 'restaurant',
        'Dinner': 'set_meal',
        'Snack': 'water_drop'
    }[item.mealType] || 'restaurant';

    const isRevealed = swiped || isEditing;

    return (
        <div className="relative flex gap-4 mb-6 group">
            {/* Time Column */}
            <div className="flex flex-col items-center w-10 shrink-0 pt-1 z-10">
                <div className={`size-3 ${item.mealType === 'Breakfast' ? 'bg-primary' : 'bg-surface-border'} rounded-full ring-4 ring-background-dark mb-2`}></div>
                <span className="text-xs font-medium text-gray-400 tabular-nums writing-vertical">{item.timestamp}</span>
            </div>
            
            {/* Card Area */}
            <div className="flex-1 relative h-full rounded-xl overflow-hidden">
                {/* Delete Background */}
                <div className="absolute inset-0 bg-delete rounded-xl flex items-center justify-end px-6 cursor-pointer" onClick={onDelete}>
                    <div className="flex items-center gap-1 text-white animate-pulse font-bold">
                        <span className="material-symbols-outlined">delete</span>
                        {isEditing && <span>Delete</span>}
                    </div>
                </div>
                
                {/* Main Card Content */}
                <div 
                    onClick={() => !isEditing && setSwiped(!swiped)}
                    className={`relative bg-surface-dark border border-surface-border rounded-xl p-4 transition-transform duration-300 ease-out cursor-pointer ${isRevealed ? '-translate-x-24 rounded-r-none border-r-0 shadow-xl' : ''}`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>{icon}</span>
                            <h3 className="text-base font-bold text-white line-clamp-1">{item.name}</h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <span className="px-2 py-0.5 rounded bg-white/5 text-gray-300 font-medium border border-white/5">{item.weight}g</span>
                        <span className="px-2 py-0.5 rounded bg-white/5 text-gray-300 font-medium border border-white/5 tabular-nums">{item.calories} kcal</span>
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold border border-primary/20 tabular-nums">{item.protein}g P</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Timeline;