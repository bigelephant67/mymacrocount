import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppState, UserProfile, Macros, FoodItem } from './types';
import { calculateTDEE, generateId } from './utils';
import Onboarding from './screens/Onboarding';
import Dashboard from './screens/Dashboard';
import Timeline from './screens/Timeline';
import QuickAdd from './screens/QuickAdd';

// Context
const AppContext = createContext<AppState | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};

// Initial Data
const DEFAULT_PROFILE: UserProfile = {
  gender: 'Male',
  goal: 'Cut',
  age: 28,
  weight: 175,
  heightFt: 5,
  heightIn: 10,
  activityLevel: 3,
};

const INITIAL_LOG: FoodItem[] = [
  {
    id: '1',
    name: 'Oatmeal & Berries',
    weight: 350,
    calories: 280,
    protein: 8,
    fat: 4,
    carbs: 45,
    mealType: 'Breakfast',
    timestamp: '08:00',
    state: 'Cooked'
  },
  {
    id: '2',
    name: 'Grilled Chicken Breast',
    weight: 200,
    calories: 330,
    protein: 62,
    fat: 6,
    carbs: 0,
    mealType: 'Lunch',
    timestamp: '12:30',
    state: 'Cooked'
  },
];

const App: React.FC = () => {
  // Load from local storage or use defaults
  const [profile, setProfileState] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('mc_profile');
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  });
  
  const [targets, setTargets] = useState<Macros>(() => {
    const saved = localStorage.getItem('mc_targets');
    return saved ? JSON.parse(saved) : calculateTDEE(DEFAULT_PROFILE);
  });

  const [log, setLog] = useState<FoodItem[]>(() => {
    const saved = localStorage.getItem('mc_log');
    return saved ? JSON.parse(saved) : INITIAL_LOG;
  });

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('mc_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('mc_targets', JSON.stringify(targets));
  }, [targets]);

  useEffect(() => {
    localStorage.setItem('mc_log', JSON.stringify(log));
  }, [log]);

  const setProfile = (newProfile: UserProfile) => {
    setProfileState(newProfile);
    recalculateTargets(newProfile);
  };

  const recalculateTargets = (p: UserProfile) => {
    setTargets(calculateTDEE(p));
  };

  const addFood = (item: Omit<FoodItem, 'id'>) => {
    const newItem = { ...item, id: generateId() };
    setLog(prev => [...prev, newItem].sort((a, b) => a.timestamp.localeCompare(b.timestamp)));
  };

  const removeFood = (id: string) => {
    setLog(prev => prev.filter(item => item.id !== id));
  };

  return (
    <AppContext.Provider value={{ profile, targets, log, setProfile, addFood, removeFood, recalculateTargets }}>
      <HashRouter>
        <div className="bg-background-dark min-h-screen text-white font-display mx-auto max-w-md shadow-2xl overflow-hidden relative">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/quick-add" element={<QuickAdd />} />
          </Routes>
        </div>
      </HashRouter>
    </AppContext.Provider>
  );
};

export default App;